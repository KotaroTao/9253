"use client"

import { useEffect } from "react"
import { messages } from "@/lib/messages"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Dashboard error:", error)
    }
  }, [error])

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-4">
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">
          {messages.common.error}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          ページの読み込み中にエラーが発生しました。しばらくしてから再度お試しください。
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          再試行
        </button>
      </div>
    </div>
  )
}
