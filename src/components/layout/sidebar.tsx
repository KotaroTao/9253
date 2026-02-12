"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Settings,
  LogOut,
  Shield,
  Heart,
  BarChart3,
  ClipboardPen,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"
import { APP_NAME } from "@/lib/constants"

interface SidebarProps {
  role: string
}

const navItems = [
  { href: "/dashboard", label: messages.nav.dashboard, icon: LayoutDashboard },
  { href: "/dashboard/staff", label: messages.nav.staff, icon: Users },
  { href: "/dashboard/surveys", label: messages.nav.surveys, icon: ClipboardList },
  { href: "/dashboard/staff-survey", label: messages.nav.staffSurvey, icon: Heart },
  { href: "/dashboard/tally", label: messages.nav.tally, icon: ClipboardPen },
  { href: "/dashboard/metrics", label: messages.nav.monthlyMetrics, icon: BarChart3 },
  { href: "/dashboard/settings", label: messages.nav.settings, icon: Settings },
]

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold text-primary">
          {APP_NAME}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
        {role === "system_admin" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname.startsWith("/admin")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Shield className="h-4 w-4" />
            {messages.nav.systemAdmin}
          </Link>
        )}
      </nav>
      <div className="border-t p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          {messages.common.logout}
        </button>
      </div>
    </aside>
  )
}
