"use client"

import { useEffect } from "react"
import { messages } from "@/lib/messages"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("Global error:", error)
    }
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4">
      <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-destructive">
          {messages.errorPage.title}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {messages.errorPage.description}
        </p>
        <button
          onClick={reset}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {messages.errorPage.retry}
        </button>
      </div>
    </div>
  )
}
