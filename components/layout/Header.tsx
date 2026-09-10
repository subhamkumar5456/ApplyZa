'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  FileText,
  LogOut,
  Settings,
  User,
  Menu,
} from 'lucide-react'

interface HeaderProps {
  onToggleSidebar?: () => void
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glassmorphism backdrop — matches landing page header */}
      <div className="absolute inset-0 bg-[#080C14]/80 backdrop-blur-xl border-b border-white/5" />

      <div className="container relative flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-6">
          {onToggleSidebar && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleSidebar}
              className="shrink-0 text-white/50 hover:text-white hover:bg-white/5"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle Sidebar</span>
            </Button>
          )}
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 shadow-lg shadow-brand-600/30 group-hover:shadow-brand-500/50 transition-shadow">
              <span className="text-white font-black text-base leading-none">A</span>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent hidden sm:inline-block">
              Applyza
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-5">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/resumes"
              className="text-sm font-medium text-white/50 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <FileText className="h-3.5 w-3.5" />
              Resumes
            </Link>
            <Link
              href="/dashboard/cover-letters"
              className="text-sm font-medium text-white/50 hover:text-white transition-colors"
            >
              Cover Letters
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-white/40 hover:text-white hover:bg-white/5"
          >
            <Link href="/settings">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="text-white/40 hover:text-white hover:bg-white/5"
          >
            <Link href="/settings">
              <User className="h-4 w-4" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-white/40 hover:text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="sr-only">Sign out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
