import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ResumeList } from '@/components/resume/ResumeList'
import { Plus } from 'lucide-react'

export default async function ResumesPage() {
  const supabase = createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  const { data: resumes } = await supabase
    .from('resumes')
    .select(`
      id,
      title,
      file_name,
      file_type,
      file_size,
      status,
      parsed_data,
      created_at,
      updated_at,
      analyses (
        id,
        ats_score,
        job_title,
        company_name,
        status,
        created_at
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Resumes</h1>
          <p className="text-muted-foreground mt-1">
            Manage and analyze your uploaded resumes
          </p>
        </div>
        <Button asChild className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
          <Link href="/resumes/new">
            <Plus className="mr-2 h-4 w-4" />
            Upload New
          </Link>
        </Button>
      </div>

      <ResumeList resumes={resumes || []} />
    </div>
  )
}
