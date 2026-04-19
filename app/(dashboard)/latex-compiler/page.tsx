import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import LatexCompilerClient from '@/app/(dashboard)/latex-compiler/LatexCompilerClient'
// Import changed to absolute alias to break cache
export const metadata = {
  title: 'LaTeX Compiler | ApplyZa',
}

export default async function LatexCompilerPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">LaTeX Compiler</h1>
        <p className="text-muted-foreground mt-2">
          Create and compile professional LaTeX resumes
        </p>
      </div>

      <LatexCompilerClient />
    </div>
  )
}
