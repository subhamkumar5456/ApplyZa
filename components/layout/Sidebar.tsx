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
        "flex flex-1 flex-col overflow-y-auto overflow-x-hidden border-r border-white/5 bg-[#080C14] transition-all duration-300",
        isOpen ? "px-3 py-5" : "px-2 py-5 items-center"
      )}>
        <nav className="flex flex-col gap-0.5 w-full">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium transition-all duration-150 group relative',
                  isOpen ? "px-3" : "px-0 justify-center w-12 h-12 mx-auto",
                  isActive
                    ? 'bg-brand-500/10 border border-brand-500/20 text-brand-400'
                    : 'text-white/40 hover:text-white hover:bg-white/5 border border-transparent'
                )}
                title={!isOpen ? link.title : undefined}
              >
                {/* Active left bar indicator */}
                {isActive && isOpen && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-full -ml-3" />
                )}
                <link.icon className={cn(
                  'h-4.5 w-4.5 shrink-0',
                  isActive ? 'text-brand-400' : 'text-white/40 group-hover:text-white/70'
                )} />
                {isOpen && (
                  <>
                    <span className="whitespace-nowrap">{link.title}</span>
                    {link.badge && (
                      <span className="ml-auto flex h-5 items-center rounded-full bg-brand-600/30 border border-brand-500/30 px-1.5 text-[10px] font-bold text-brand-400">
                        {link.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Pro tip card at bottom */}
        <div className="mt-auto w-full pt-4">
          {isOpen ? (
            <div className="rounded-xl border border-brand-500/15 bg-brand-500/5 p-4 animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                <span className="text-xs font-semibold text-white/70 whitespace-nowrap">Quick Tip</span>
              </div>
              <p className="text-xs text-white/40 leading-relaxed">
                Paste the full job description for the most accurate ATS score and keyword analysis.
              </p>
            </div>
          ) : (
            <div className="flex justify-center animate-in fade-in duration-300">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-500/20 bg-brand-500/10"
                title="Tip: Paste the full job description for better results"
              >
                <Sparkles className="h-4 w-4 text-brand-400" />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
