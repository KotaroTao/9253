"use client"

import { Menu, Eye, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"

interface DashboardHeaderProps {
  clinicName?: string
  isAdminMode?: boolean
  canToggleView?: boolean
  onMenuToggle?: () => void
  onToggleView?: () => void
}

export function DashboardHeader({
  clinicName,
  isAdminMode = false,
  canToggleView = false,
  onMenuToggle,
  onToggleView,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        {clinicName && (
          <span className="text-sm text-muted-foreground">{clinicName}</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {canToggleView && onToggleView && (
          <button
            onClick={onToggleView}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {isAdminMode ? (
              <>
                <Eye className="h-3.5 w-3.5" />
                {messages.dashboard.switchToStaffView}
              </>
            ) : (
              <>
                <Shield className="h-3.5 w-3.5" />
                {messages.dashboard.switchToAdminView}
              </>
            )}
          </button>
        )}
      </div>
    </header>
  )
}
