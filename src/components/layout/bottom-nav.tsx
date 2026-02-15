"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Smartphone,
  BarChart3,
  ClipboardList,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"

interface BottomNavProps {
  clinicSlug?: string
  isAdminMode?: boolean
  hasAdminPassword?: boolean
}

export function BottomNav({ clinicSlug, isAdminMode = false }: BottomNavProps) {
  const pathname = usePathname()

  const kioskUrl = clinicSlug ? `/kiosk/${encodeURIComponent(clinicSlug)}` : "/dashboard/survey-start"

  const navItems = [
    {
      href: "/dashboard",
      label: messages.nav.dashboard,
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
      show: true,
    },
    {
      href: kioskUrl,
      label: messages.nav.surveyStart,
      icon: Smartphone,
      isActive: false,
      show: !isAdminMode,
      external: true,
    },
    {
      href: "/dashboard/surveys",
      label: messages.nav.surveys,
      icon: ClipboardList,
      isActive: pathname.startsWith("/dashboard/surveys"),
      show: isAdminMode,
    },
    {
      href: "/dashboard/metrics",
      label: messages.nav.monthlyMetrics,
      icon: BarChart3,
      isActive: pathname.startsWith("/dashboard/metrics"),
      show: isAdminMode,
    },
  ]

  const visibleItems = navItems.filter((item) => item.show)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card safe-area-pb">
      <div className="flex items-stretch">
        {visibleItems.map((item) => {
          const className = cn(
            "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 transition-colors active:bg-muted",
            item.isActive
              ? "text-primary"
              : "text-muted-foreground"
          )
          if (item.external) {
            return (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </a>
            )
          }
          return (
            <Link
              key={item.href}
              href={item.href}
              className={className}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors active:bg-muted"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium">{messages.common.logout}</span>
        </button>
      </div>
    </nav>
  )
}
