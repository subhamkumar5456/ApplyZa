import { Sparkles } from 'lucide-react'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-12">
        <div className="max-w-md space-y-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold">Applyza</span>
          </Link>
          <h1 className="text-3xl font-bold">
            AI-Powered Resume Optimization
          </h1>
          <p className="text-violet-100 text-lg leading-relaxed">
            Upload your resume, analyze it against job descriptions, and get AI-powered suggestions
            to improve your chances of landing interviews.
          </p>
          <div className="space-y-3 pt-4">
            {['ATS compatibility scoring', 'Keyword matching analysis', 'AI improvement suggestions'].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="text-sm text-violet-100">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  )
}
