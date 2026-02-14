"use client"

import { useRouter } from "next/navigation"
import { Shield, Lock } from "lucide-react"
import { messages } from "@/lib/messages"

export function AdminFooter() {
  const router = useRouter()

  async function handleLock() {
    await fetch("/api/admin-mode", { method: "DELETE" })
    router.refresh()
  }

  return (
    <footer className="flex items-center justify-between border-t bg-card px-4 py-2">
      <div className="flex items-center gap-2 text-sm text-primary">
        <Shield className="h-4 w-4" />
        <span className="font-medium">{messages.adminMode.active}</span>
      </div>
      <button
        onClick={handleLock}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Lock className="h-3.5 w-3.5" />
        {messages.adminMode.lock}
      </button>
    </footer>
  )
}
