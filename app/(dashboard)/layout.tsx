'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { cn } from '@/lib/utils/cn'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="min-h-screen bg-[#080C14]">
      {/* Ambient background glow — consistent with landing page */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-brand-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-[30%] w-[500px] h-[400px] bg-violet-600/4 rounded-full blur-[120px]" />
      </div>

      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} />
      <main className={cn("pt-2 transition-all duration-300 relative z-10", isSidebarOpen ? "lg:pl-64" : "lg:pl-[72px]")}>
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  )
}

