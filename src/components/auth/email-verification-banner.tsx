"use client"

import { useState } from "react"
import { Mail, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"

export function EmailVerificationBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)

  if (dismissed) return null

  async function handleResend() {
    setResending(true)
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" })
      if (res.ok) {
        setResent(true)
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
      <div className="flex items-start gap-3">
        <Mail className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-800">
            {resent ? messages.auth.verifyEmailResent : messages.auth.verifyEmailBanner}
          </p>
          {!resent && (
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm text-amber-700 underline underline-offset-2 hover:text-amber-900 mt-1"
            >
              {resending ? messages.common.loading : messages.auth.verifyEmailResendLink}
            </button>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-amber-400 hover:text-amber-600 shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
