"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  children: React.ReactNode
  role: string
  userName: string
  clinicName?: string
  clinicSlug?: string
  isAdminMode?: boolean
  hasAdminPassword?: boolean
}

export function DashboardShell({
  children,
  role,
  userName,
  clinicName,
  clinicSlug,
  isAdminMode = false,
  hasAdminPassword = false,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Staff mode: no sidebar/header, bottom nav only
  if (!isAdminMode) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 bg-muted/40 p-4 pb-20">
          {children}
        </main>
        <BottomNav
          clinicSlug={clinicSlug}
          isAdminMode={isAdminMode}
          hasAdminPassword={hasAdminPassword}
        />
      </div>
    )
  }

  // Admin mode: full sidebar + header layout
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          role={role}
          isAdminMode={isAdminMode}
          hasAdminPassword={hasAdminPassword}
        />
      </div>
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          userName={userName}
          clinicName={clinicName}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
