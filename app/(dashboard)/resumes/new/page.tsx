import { ResumeUpload } from '@/components/resume/ResumeUpload'

export default function NewResumePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Upload Resume</h1>
        <p className="text-muted-foreground mt-1">
          Upload your resume to get started with AI-powered analysis
        </p>
      </div>
      <ResumeUpload />
    </div>
  )
}
