"use client"

import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  clinicName?: string
  onMenuToggle?: () => void
}

export function DashboardHeader({
  clinicName,
  onMenuToggle,
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
    </header>
  )
}
