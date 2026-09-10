'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/lib/hooks/use-toast'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import { updateResumeTitle, deleteResume } from '../../actions'

export default function EditResumePage() {
  const [title, setTitle] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const supabase = createClient()
  const resumeId = params.id as string

  useEffect(() => {
    async function loadResume() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: resume } = await supabase
        .from('resumes')
        .select('title')
        .eq('id', resumeId)
        .eq('user_id', session.user.id)
        .single()

      if (resume) {
        setTitle(resume.title)
      } else {
        toast({ title: 'Resume not found', variant: 'destructive' })
        router.push('/resumes')
      }
      setIsLoading(false)
    }

    loadResume()
  }, [resumeId, supabase, router, toast])

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' })
      return
    }

    setIsSaving(true)
    const result = await updateResumeTitle(resumeId, title.trim())

    if (result.error) {
      toast({ title: 'Update failed', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Resume updated!' })
      router.push(`/resumes/${resumeId}`)
    }
    setIsSaving(false)
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    const result = await deleteResume(resumeId)

    if (result.error) {
      toast({ title: 'Delete failed', description: result.error, variant: 'destructive' })
      setIsDeleting(false)
    } else {
      toast({ title: 'Resume deleted' })
      router.push('/resumes')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner text="Loading resume..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/resumes/${resumeId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Edit Resume</h1>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Resume Details</CardTitle>
          <CardDescription>Update your resume information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Resume Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Software Engineer Resume 2024"
              disabled={isSaving}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-md shadow-brand-600/20 transition-all"
            >
              {isSaving ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
              ) : (
                <><Save className="mr-2 h-4 w-4" /> Save Changes</>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</>
              ) : (
                <><Trash2 className="mr-2 h-4 w-4" /> Delete Resume</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
