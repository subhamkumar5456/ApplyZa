import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string

    if (!file || !title) {
      return NextResponse.json({ message: 'File and title are required' }, { status: 400 })
    }

    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ message: 'Only PDF and DOCX files are accepted' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ message: 'File size must be less than 10MB' }, { status: 400 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `${session.user.id}/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ message: 'Failed to upload file' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath)

    const { data: resume, error: dbError } = await supabase
      .from('resumes')
      .insert({
        user_id: session.user.id,
        title,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        status: 'uploaded',
      })
      .select('id')
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      await supabase.storage.from('resumes').remove([filePath])
      return NextResponse.json({ message: 'Failed to save resume' }, { status: 500 })
    }

    const { error: jobError } = await supabase
      .from('jobs')
      .insert({
        user_id: session.user.id,
        type: 'parse_resume',
        status: 'pending',
        payload: {
          resume_id: resume.id,
          file_url: publicUrl,
          file_type: file.type,
        },
      })

    if (jobError) {
      console.error('Job creation error:', jobError)
    }

    return NextResponse.json({ id: resume.id, message: 'Resume uploaded successfully' })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
