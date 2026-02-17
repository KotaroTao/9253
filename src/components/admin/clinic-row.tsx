"use client"

import { useState } from "react"
import { LogIn, Loader2 } from "lucide-react"

interface ClinicRowProps {
  clinicId: string
  clinicName: string
  children: React.ReactNode
}

export function ClinicRow({ clinicId, clinicName, children }: ClinicRowProps) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/operator-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clinicId }),
      })
      if (res.ok) {
        window.open("/dashboard", "_blank")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleClick()
        }
      }}
      className="group cursor-pointer rounded-lg border p-4 transition-colors hover:border-violet-200 hover:bg-violet-50/30"
    >
      {children}
      {/* Login overlay indicator */}
      <div className="mt-2 flex items-center justify-end opacity-0 transition-opacity group-hover:opacity-100">
        {loading ? (
          <span className="flex items-center gap-1.5 text-xs text-violet-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            ログイン中...
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-violet-500">
            <LogIn className="h-3 w-3" />
            クリックでダッシュボードを開く
          </span>
        )}
      </div>
    </div>
  )
}
