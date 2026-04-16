import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

export async function POST(request: NextRequest) {
  // Step 1: Auth check — use getUser() for secure server-side auth verification
  let user
  try {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      console.error('[Upload] Auth error:', error)
      return NextResponse.json(
        { error: 'Authentication failed', step: 'auth', ...(isDev && { detail: error.message }) },
        { status: 401 }
      )
    }
    user = data.user
  } catch (err) {
    console.error('[Upload] Failed to initialise Supabase client:', err)
    return NextResponse.json(
      { error: 'Server configuration error', step: 'client-init' },
      { status: 500 }
    )
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role client for all privileged operations (storage + DB)
  // so that Row-Level Security policies do not block server-side inserts.
  const serviceClient = createServiceRoleClient()

  // Step 2: Parse form data
  let file: File
  let title: string
  try {
    const formData = await request.formData()
    const rawFile = formData.get('file')
    const rawTitle = formData.get('title')

    if (!rawFile || !(rawFile instanceof File)) {
      return NextResponse.json({ error: 'A file is required', step: 'parse-form' }, { status: 400 })
    }
    if (!rawTitle || typeof rawTitle !== 'string' || rawTitle.trim() === '') {
      return NextResponse.json({ error: 'A title is required', step: 'parse-form' }, { status: 400 })
    }

    file = rawFile
    title = rawTitle.trim()
  } catch (err) {
    console.error('[Upload] Failed to parse form data:', err)
    return NextResponse.json(
      { error: 'Failed to parse request body', step: 'parse-form' },
      { status: 400 }
    )
  }

  // Step 3: Validate file
  const validTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ]
  if (!validTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only PDF and DOCX files are accepted', step: 'validate-file' },
      { status: 400 }
    )
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json(
      { error: 'File size must be less than 10MB', step: 'validate-file' },
      { status: 400 }
    )
  }

  // Step 4: Upload to Supabase Storage
  const fileExt = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
  const filePath = `${user.id}/${fileName}`

  console.log('[Upload] Uploading to storage bucket "resumes", path:', filePath)

  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await serviceClient.storage
    .from('resumes')
    .upload(filePath, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[Upload] Storage upload error:', uploadError)
    return NextResponse.json(
      {
        error: 'Failed to upload file to storage',
        step: 'storage-upload',
        ...(isDev && { detail: uploadError.message }),
      },
      { status: 500 }
    )
  }

  console.log('[Upload] Storage upload successful')

  // Step 5: Get public URL
  const { data: { publicUrl } } = serviceClient.storage
    .from('resumes')
    .getPublicUrl(filePath)

  // Step 6: Insert resume record
  console.log('[Upload] Inserting resume record for user:', user.id)

  const { data: resume, error: dbError } = await serviceClient
    .from('resumes')
    .insert({
      user_id: user.id,
      title,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      status: 'uploaded',
    })
    .select('id')
    .single()

  if (dbError || !resume) {
    console.error('[Upload] Database insert error (resumes):', dbError)
    // Roll back the storage upload to avoid orphan files
    await serviceClient.storage.from('resumes').remove([filePath])
    return NextResponse.json(
      {
        error: 'Failed to save resume record',
        step: 'db-insert-resume',
        ...(isDev && { detail: dbError?.message }),
      },
      { status: 500 }
    )
  }

  console.log('[Upload] Resume record created, id:', resume.id)

  // Step 7: Create parse job (non-fatal if it fails)
  const { error: jobError } = await serviceClient
    .from('jobs')
    .insert({
      user_id: user.id,
      type: 'parse_resume',
      status: 'pending',
      payload: {
        resume_id: resume.id,
        file_url: publicUrl,
        file_type: file.type,
      },
    })

  if (jobError) {
    console.error('[Upload] Job creation error (non-fatal):', jobError)
  } else {
    console.log('[Upload] Parse job queued for resume:', resume.id)
  }

  return NextResponse.json({ id: resume.id, message: 'Resume uploaded successfully' })
}
