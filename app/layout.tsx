import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Applyza — Beat the ATS. Land More Interviews.',
  description: 'Upload your resume, paste the job description, and get an instant ATS compatibility score, keyword gap analysis, and AI-powered bullet point rewrites. Free to start.',
  keywords: ['resume optimizer', 'ATS checker', 'resume ATS score', 'job description keyword match', 'AI resume rewriter', 'beat ATS', 'career', 'job search'],
  openGraph: {
    title: 'Applyza — Beat the ATS. Land More Interviews.',
    description: 'AI-powered resume optimizer. Get your ATS score, fix keyword gaps, and rewrite weak bullet points in seconds.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
