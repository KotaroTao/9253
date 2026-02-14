"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import {
  LayoutDashboard,
  LogOut,
} from "lucide-react"
import { signOut } from "next-auth/react"
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

  const navItems = [
    {
      href: "/dashboard",
      label: messages.nav.dashboard,
      icon: LayoutDashboard,
      isActive: pathname === "/dashboard",
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card safe-area-pb">
      <div className="flex items-stretch">
        {navItems.map((item) => (
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
        ))}
        <div className="flex flex-1 items-center justify-center">
          <AdminUnlockDialog isAdminMode={isAdminMode} hasAdminPassword={hasAdminPassword} compact />
        </div>
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
