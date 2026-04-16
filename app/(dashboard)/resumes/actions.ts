'use server'

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteResume(resumeId: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { data: resume } = await supabase
    .from('resumes')
    .select('file_url')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single()

  if (!resume) {
    return { error: 'Resume not found' }
  }

  await supabase
    .from('analyses')
    .delete()
    .eq('resume_id', resumeId)
    .eq('user_id', user.id)

  const { error } = await supabase
    .from('resumes')
    .delete()
    .eq('id', resumeId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  if (resume.file_url) {
    const filePath = resume.file_url.split('/').pop()
    if (filePath) {
      await supabase.storage.from('resumes').remove([`${user.id}/${filePath}`])
    }
  }

  revalidatePath('/resumes')
  return { success: true }
}

export async function updateResumeTitle(resumeId: string, title: string) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('resumes')
    .update({ title, updated_at: new Date().toISOString() })
    .eq('id', resumeId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/resumes/${resumeId}`)
  revalidatePath('/resumes')
  return { success: true }
}
