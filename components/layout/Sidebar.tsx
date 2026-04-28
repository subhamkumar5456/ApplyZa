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
    title: 'Cover Letters',
    href: '/dashboard/cover-letters',
    icon: FileText,
    badge: 'New',
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

interface SidebarProps {
  isOpen?: boolean
}

export function Sidebar({ isOpen = true }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className={cn(
      "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:pt-16 transition-all duration-300 z-40",
      isOpen ? "lg:w-64" : "lg:w-[72px]"
    )}>
      <div className={cn(
        "flex flex-1 flex-col overflow-y-auto overflow-x-hidden border-r bg-background transition-all duration-300",
        isOpen ? "px-4 py-6" : "px-2 py-6 items-center"
      )}>
        <nav className="flex flex-col gap-1 w-full">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all hover:bg-accent group',
                  isOpen ? "px-3" : "px-0 justify-center w-12 h-12 mx-auto",
                  isActive
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                title={!isOpen ? link.title : undefined}
              >
                <link.icon className={cn('h-5 w-5 shrink-0', isActive && 'text-violet-600')} />
                {isOpen && (
                  <>
                    <span className="whitespace-nowrap">{link.title}</span>
                    {link.badge && (
                      <span className="ml-auto flex h-5 items-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white">
                        {link.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>
        
        <div className="mt-auto w-full">
          {isOpen ? (
            <div className="rounded-lg border bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50 p-4 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-violet-600" />
                <span className="text-sm font-semibold whitespace-nowrap">Pro Tip</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Upload your resume and paste a job description to get AI-powered matching insights.
              </p>
            </div>
          ) : (
            <div className="flex justify-center animate-in fade-in duration-300">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/50 dark:to-indigo-950/50" title="Pro Tip: Upload a resume to get AI insights">
                <Sparkles className="h-4 w-4 text-violet-600" />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
