"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { messages } from "@/lib/messages"

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <LogOut className="h-3.5 w-3.5" />
      {messages.common.logout}
    </button>
  )
}
