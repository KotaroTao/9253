"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Smartphone,
  ClipboardPen,
  Lock,
  Unlock,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"
import { AdminUnlockDialog } from "@/components/layout/admin-unlock-dialog"

interface BottomNavProps {
  clinicSlug?: string
  isAdminMode?: boolean
  hasAdminPassword?: boolean
}

export function BottomNav({ clinicSlug, isAdminMode = false, hasAdminPassword = false }: BottomNavProps) {
  const pathname = usePathname()

  const kioskUrl = clinicSlug ? `/kiosk/${encodeURIComponent(clinicSlug)}` : "/dashboard/survey-start"

  const navItems = [
    {
      href: "/dashboard",
      label: messages.nav.dashboard,
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
    {
      href: kioskUrl,
      label: messages.nav.surveyStart,
      icon: Smartphone,
      isActive: false,
      external: true,
    },
    {
      href: "/dashboard/tally",
      label: messages.nav.tally,
      icon: ClipboardPen,
      isActive: pathname.startsWith("/dashboard/tally"),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card safe-area-pb">
      <div className="flex items-stretch">
        {navItems.map((item) =>
          item.external ? (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors active:bg-muted"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </a>
          ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors active:bg-muted",
                item.isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        )}
        <div className="flex flex-1 items-center justify-center">
          <AdminUnlockDialog isAdminMode={isAdminMode} hasAdminPassword={hasAdminPassword} compact />
        </div>
      </div>
    </nav>
  )
}
