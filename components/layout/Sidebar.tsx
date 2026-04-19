'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  BarChart3,
  FileText,
  Home,
  Settings,
  Upload,
  Sparkles,
  Code,
} from 'lucide-react'

const sidebarLinks = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: 'My Resumes',
    href: '/resumes',
    icon: FileText,
  },
  {
    title: 'Upload New',
    href: '/resumes/new',
    icon: Upload,
  },
  {
    title: 'LaTeX Compiler',
    href: '/latex-compiler',
    icon: Code,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16">
      <div className="flex flex-1 flex-col overflow-y-auto border-r bg-background px-4 py-6">
        <nav className="flex flex-1 flex-col gap-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent',
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <link.icon className={cn('h-4 w-4', isActive && 'text-violet-600')} />
                {link.title}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto">
          <div className="rounded-lg border bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <span className="text-sm font-semibold">Pro Tip</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Upload your resume and paste a job description to get AI-powered matching insights.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
