"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { AdminFooter } from "@/components/layout/admin-footer"
import { cn } from "@/lib/utils"
import { Shield, X } from "lucide-react"

interface DashboardShellProps {
  children: React.ReactNode
  role: string
  userName: string
  clinicName?: string
  clinicSlug?: string
  isAdminMode?: boolean
  hasAdminPassword?: boolean
  isOperatorMode?: boolean
}

export function DashboardShell({
  children,
  role,
  userName,
  clinicName,
  clinicSlug,
  isAdminMode = false,
  hasAdminPassword = false,
  isOperatorMode = false,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  async function handleExitOperatorMode() {
    await fetch("/api/admin/operator-login", { method: "DELETE" })
    window.close()
    // フォールバック: ウィンドウが閉じない場合は管理画面に戻る
    setTimeout(() => {
      router.push("/admin")
      router.refresh()
    }, 200)
  }

  const operatorBanner = isOperatorMode && (
    <div className="flex items-center justify-between bg-violet-600 px-4 py-2 text-white">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4" />
        <span className="text-sm font-medium">
          運営モード
        </span>
        {clinicName && (
          <span className="text-sm text-violet-200">— {clinicName}</span>
        )}
        <span className="hidden text-xs text-violet-300 sm:inline">全ての操作が可能です</span>
      </div>
      <button
        onClick={handleExitOperatorMode}
        className="flex items-center gap-1 rounded-md bg-violet-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-400"
      >
        <X className="h-3 w-3" />
        終了
      </button>
    </div>
  )

  // Staff mode: no sidebar/header, bottom nav only
  if (!isAdminMode) {
    return (
      <div className="flex min-h-screen flex-col">
        {operatorBanner}
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
        {operatorBanner}
        <DashboardHeader
          userName={userName}
          clinicName={clinicName}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-muted/40 p-4 lg:p-6">
          {children}
        </main>
        <AdminFooter />
      </div>
    </div>
  )
}
