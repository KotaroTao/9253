"use client"

import { useState } from "react"
import { LogIn, Loader2 } from "lucide-react"

interface OperatorLoginButtonProps {
  clinicId: string
}

export function OperatorLoginButton({ clinicId }: OperatorLoginButtonProps) {
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
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 transition-colors hover:bg-violet-100 hover:border-violet-300 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <LogIn className="h-3.5 w-3.5" />
      )}
      ログイン
    </button>
  )
}
