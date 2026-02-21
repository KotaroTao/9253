"use client"

import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Menu, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": messages.nav.dashboard,
  "/dashboard/analytics": messages.nav.analytics,
  "/dashboard/actions": messages.improvementActions.title,
  "/dashboard/staff": messages.nav.staff,
  "/dashboard/settings": messages.settings.title,
  "/dashboard/metrics": messages.nav.monthlyMetrics,
  "/dashboard/metrics/input": messages.nav.metricsInput,
  "/dashboard/test": messages.testSurvey.title,
}

interface DashboardHeaderProps {
  clinicName?: string
  onMenuToggle?: () => void
}

export function DashboardHeader({
  clinicName,
  onMenuToggle,
}: DashboardHeaderProps) {
  const pathname = usePathname()
  const pageTitle = PAGE_TITLES[pathname] ?? ""

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {pageTitle && (
          <h1 className="truncate text-base font-semibold">{pageTitle}</h1>
        )}
        {clinicName && (
          <span className="hidden truncate text-sm text-muted-foreground sm:inline">
            — {clinicName}
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div id="header-actions" className="flex items-center" />
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={messages.common.logout}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
