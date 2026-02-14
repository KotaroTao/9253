"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { messages } from "@/lib/messages"
import { LoginForm } from "@/components/auth/login-form"

type LoginMode = "clinic" | "admin"

export function LoginTabs() {
  const [mode, setMode] = useState<LoginMode>("clinic")

  return (
    <div className="space-y-4">
      <div className="flex rounded-md border bg-muted p-1">
        <button
          type="button"
          onClick={() => setMode("clinic")}
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "clinic"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {messages.auth.clinicLogin}
        </button>
        <button
          type="button"
          onClick={() => setMode("admin")}
          className={cn(
            "flex-1 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
            mode === "admin"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {messages.auth.adminLogin}
        </button>
      </div>
      <LoginForm redirectTo={mode === "admin" ? "/admin" : "/dashboard"} />
    </div>
  )
}
