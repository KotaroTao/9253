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
  Smartphone,
  Target,
  PieChart,
  FileBarChart,
  ExternalLink,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"
import { APP_NAME } from "@/lib/constants"

interface SidebarProps {
  role: string
  isOperatorMode?: boolean
  clinicSlug?: string
}

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  external?: boolean
}

const analyticsItems: NavItem[] = [
  { href: "/dashboard/analytics", label: messages.nav.analytics, icon: PieChart },
  { href: "/dashboard/actions", label: messages.improvementActions.title, icon: Target },
  { href: "/dashboard/surveys", label: messages.nav.surveys, icon: ClipboardList },
  { href: "/dashboard/metrics", label: messages.nav.monthlyMetrics, icon: FileBarChart },
]

const adminItems: NavItem[] = [
  { href: "/dashboard/staff", label: messages.nav.staff, icon: Users },
  { href: "/dashboard/settings", label: messages.nav.settings, icon: Settings },
]

function NavSection({ label, items, pathname }: { label: string; items: NavItem[]; pathname: string }) {
  return (
    <div>
      <p className="mb-1 px-3 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
        {label}
      </p>
      {items.map((item) => {
        if (item.external) {
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
              <ExternalLink className="ml-auto h-3 w-3 opacity-50" />
            </a>
          )
        }

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
    </div>
  )
}

export function Sidebar({ role, isOperatorMode = false, clinicSlug }: SidebarProps) {
  const pathname = usePathname()
  const isAdmin = role === "clinic_admin" || role === "system_admin"

  const kioskUrl = clinicSlug ? `/kiosk/${encodeURIComponent(clinicSlug)}` : null

  const dailyItems: NavItem[] = [
    { href: "/dashboard", label: messages.nav.dashboard, icon: LayoutDashboard },
    ...(kioskUrl
      ? [{ href: kioskUrl, label: messages.nav.surveyStart, icon: Smartphone, external: true }]
      : []),
  ]

  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-card">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="text-lg font-bold text-primary">
          {APP_NAME}
        </Link>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        <NavSection label={messages.nav.sectionDaily} items={dailyItems} pathname={pathname} />
        {isAdmin && (
          <>
            <NavSection label={messages.nav.sectionAnalytics} items={analyticsItems} pathname={pathname} />
            <NavSection label={messages.nav.sectionAdmin} items={adminItems} pathname={pathname} />
          </>
        )}
        {role === "system_admin" && (
          <div className="pt-2">
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
          </div>
        )}
      </nav>
      <div className="space-y-1 border-t p-2">
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
