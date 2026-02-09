"use client"

import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <h2 className="text-lg font-semibold">{messages.common.error}</h2>
      <p className="text-sm text-muted-foreground">
        データの読み込み中にエラーが発生しました。
      </p>
      <Button variant="outline" onClick={reset}>
        {messages.common.retry}
      </Button>
    </div>
  )
}
