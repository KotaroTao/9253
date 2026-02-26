"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Mail, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"

interface VerifyEmailPendingClientProps {
  email: string
}

export function VerifyEmailPendingClient({ email }: VerifyEmailPendingClientProps) {
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleResend() {
    setResending(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" })
      if (res.ok) {
        setResent(true)
      } else if (res.status === 429) {
        setError(messages.auth.verifyEmailRateLimited)
      } else {
        setError(messages.common.error)
      }
    } catch {
      setError(messages.common.error)
    } finally {
      setResending(false)
    }
  }

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <Mail className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="text-lg font-semibold">{messages.auth.verifyEmailPendingTitle}</h2>
      <p className="text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{email}</span>
        {messages.auth.verifyEmailPendingDesc}
      </p>
      <p className="text-xs text-muted-foreground">{messages.auth.checkSpamFolder}</p>

      {resent ? (
        <p className="text-sm text-emerald-600">{messages.auth.verifyEmailResent}</p>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleResend}
          disabled={resending}
        >
          {resending ? (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Mail className="mr-1.5 h-3.5 w-3.5" />
          )}
          {messages.auth.verifyEmailResend}
        </Button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="mt-4 border-t pt-4 w-full">
        <p className="text-xs text-muted-foreground mb-3">{messages.auth.verifyEmailPendingRelogin}</p>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          {messages.auth.logout}
        </Button>
      </div>
    </div>
  )
}
