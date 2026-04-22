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
    <div className="min-h-screen">
      <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} />
      <main className={cn("pt-2 transition-all duration-300", isSidebarOpen ? "lg:pl-64" : "lg:pl-[72px]")}>
        <div className="container py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
