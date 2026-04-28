import { createServerSupabaseClient, createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    
    // Setup serviceClient for admin privileges on storage delete if needed
    const serviceClient = createServiceRoleClient()

    // 1. Get the resume record first to ensure it belongs to the user and to get the file path
    const { data: resume, error: fetchError } = await supabase
      .from('resumes')
      .select('id, file_url, user_id')
      .eq('id', id)
      .eq('user_id', user.id) // Ensure we only delete matching user's resume
      .single()

    if (fetchError || !resume) {
      return NextResponse.json({ error: 'Resume not found' }, { status: 404 })
    }

    // 2. Delete file from Storage if the file URL points to our standard bucket
    if (resume.file_url) {
      try {
        const url = new URL(resume.file_url)
        const pathParts = url.pathname.split('/storage/v1/object/public/resumes/')
        if (pathParts.length >= 2) {
          const storagePath = decodeURIComponent(pathParts[1])
          const { error: storageError } = await serviceClient.storage
            .from('resumes')
            .remove([storagePath])
            
          if (storageError) {
            logger.error('resumes/delete', 'Failed to delete from storage', storageError)
          }
        }
      } catch (e) {
        logger.error('resumes/delete', 'Storage path parse error', e)
      }
    }

    // 3. Delete from database (which should also cascade to jobs/analyses due to postgres relations)
    // We use standard client as we have RLS, but serviceClient can be used for guarantees
    const { error: deleteError } = await serviceClient
      .from('resumes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      logger.error('resumes/delete', 'Database delete error', deleteError)
      return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Resume deleted' })
    
  } catch (error) {
    logger.error('resumes/delete', 'Failed to process delete request', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
