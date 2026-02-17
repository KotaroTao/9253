"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Sidebar } from "@/components/layout/sidebar"
import { DashboardHeader } from "@/components/layout/dashboard-header"
import { BottomNav } from "@/components/layout/bottom-nav"
import { cn } from "@/lib/utils"
import { Shield, X, ChevronDown, ArrowLeftRight, Search, LogOut, Eye } from "lucide-react"
import { signOut } from "next-auth/react"
import { messages } from "@/lib/messages"

interface DashboardShellProps {
  children: React.ReactNode
  role: string
  userName: string
  clinicName?: string
  clinicSlug?: string
  isAdminMode?: boolean
  isOperatorMode?: boolean
  operatorClinicId?: string
  allClinics?: Array<{ id: string; name: string }>
}

export function DashboardShell({
  children,
  role,
  userName,
  clinicName,
  clinicSlug,
  isAdminMode = false,
  isOperatorMode = false,
  operatorClinicId,
  allClinics = [],
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [switcherSearch, setSwitcherSearch] = useState("")
  const [switching, setSwitching] = useState(false)
  const router = useRouter()

  const filteredClinics = useMemo(() => {
    if (!switcherSearch) return allClinics
    const q = switcherSearch.toLowerCase()
    return allClinics.filter((c) => c.name.toLowerCase().includes(q))
  }, [allClinics, switcherSearch])

  const canToggleView = (role === "clinic_admin" || role === "system_admin") && !isOperatorMode

  async function handleToggleView() {
    if (isAdminMode) {
      // 管理者ビュー → スタッフビューに切替
      await fetch("/api/admin-mode", { method: "POST" })
    } else {
      // スタッフビュー → 管理者ビューに戻す
      await fetch("/api/admin-mode", { method: "DELETE" })
    }
    router.refresh()
  }

  async function handleExitOperatorMode() {
    await fetch("/api/admin/operator-login", { method: "DELETE" })
    window.close()
    setTimeout(() => {
      router.push("/admin")
      router.refresh()
    }, 200)
  }

  async function handleSwitchClinic(clinicId: string) {
    if (clinicId === operatorClinicId) {
      setSwitcherOpen(false)
      return
    }
    setSwitching(true)
    try {
      const res = await fetch("/api/admin/operator-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      })
      if (res.ok) {
        setSwitcherOpen(false)
        router.push("/dashboard")
        router.refresh()
      }
    } finally {
      setSwitching(false)
    }
  }

  const operatorBanner = isOperatorMode && (
    <div className="bg-violet-600 text-white">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium shrink-0">運営モード</span>
          {clinicName && (
            <span className="truncate text-sm text-violet-200">— {clinicName}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {allClinics.length > 1 && (
            <button
              onClick={() => {
                setSwitcherOpen(!switcherOpen)
                if (switcherOpen) setSwitcherSearch("")
              }}
              className="flex items-center gap-1 rounded-md bg-violet-500 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-400"
            >
              <ArrowLeftRight className="h-3 w-3" />
              <span className="hidden sm:inline">切替</span>
              <ChevronDown className={cn("h-3 w-3 transition-transform", switcherOpen && "rotate-180")} />
            </button>
          )}
          <button
            onClick={handleExitOperatorMode}
            className="flex items-center gap-1 rounded-md bg-violet-500 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-400"
          >
            <X className="h-3 w-3" />
            終了
          </button>
        </div>
      </div>
      {switcherOpen && allClinics.length > 1 && (
        <div className="border-t border-violet-500/50 bg-violet-700 px-4 py-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wider text-violet-300">
              クリニック切替
            </span>
            <span className="text-[10px] text-violet-400">
              {filteredClinics.length}/{allClinics.length}件
            </span>
          </div>
          {allClinics.length >= 5 && (
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-violet-400" />
              <input
                type="text"
                value={switcherSearch}
                onChange={(e) => setSwitcherSearch(e.target.value)}
                placeholder="クリニック名で検索..."
                autoFocus
                className="w-full rounded-md border border-violet-500/50 bg-violet-800 py-1.5 pl-7 pr-3 text-xs text-white placeholder-violet-400 outline-none focus:border-violet-400"
              />
            </div>
          )}
          <div className="grid gap-1 sm:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-y-auto">
            {filteredClinics.length === 0 ? (
              <p className="col-span-full py-2 text-center text-xs text-violet-400">
                一致するクリニックがありません
              </p>
            ) : (
              filteredClinics.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSwitchClinic(c.id)}
                  disabled={switching}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-left text-xs transition-colors disabled:opacity-50",
                    c.id === operatorClinicId
                      ? "bg-violet-500 font-medium text-white"
                      : "text-violet-200 hover:bg-violet-600 hover:text-white"
                  )}
                >
                  {c.name}
                </button>
              ))
            )}
          </div>
        </div>
      )}
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
          isAdminMode={false}
          canToggleView={canToggleView}
          onToggleView={handleToggleView}
        />
      </div>
    )
  }

  // Admin mode: full sidebar + header layout
  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 transition-transform lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <Sidebar
          role={role}
          isAdminMode={true}
          isOperatorMode={isOperatorMode}
          canToggleView={canToggleView}
          onToggleView={handleToggleView}
        />
      </div>
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
        <footer className="flex items-center justify-between border-t bg-card px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-primary">
            <Shield className="h-4 w-4" />
            <span className="font-medium">{messages.dashboard.adminViewLabel}</span>
          </div>
          <div className="flex items-center gap-1">
            {canToggleView && (
              <button
                onClick={handleToggleView}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Eye className="h-3.5 w-3.5" />
                {messages.dashboard.switchToStaffView}
              </button>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              {messages.common.logout}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
