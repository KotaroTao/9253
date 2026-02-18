"use client"

import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": messages.nav.dashboard,
  "/dashboard/analytics": messages.nav.analytics,
  "/dashboard/actions": messages.improvementActions.title,
  "/dashboard/surveys": messages.nav.surveys,
  "/dashboard/staff": messages.nav.staff,
  "/dashboard/settings": messages.settings.title,
  "/dashboard/metrics": messages.nav.monthlyMetrics,
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
      <div id="header-actions" className="flex shrink-0 items-center" />
    </header>
  )
}
