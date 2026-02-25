"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { messages } from "@/lib/messages"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"

type Status = "loading" | "success" | "expired" | "error"

export function VerifyEmailClient() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [status, setStatus] = useState<Status>(token ? "loading" : "error")

  useEffect(() => {
    if (!token) return

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        if (res.ok) {
          setStatus("success")
        } else {
          const data = await res.json()
          if (data.error === messages.auth.verifyEmailExpired) {
            setStatus("expired")
          } else {
            setStatus("error")
          }
        }
      } catch {
        setStatus("error")
      }
    }

    verify()
  }, [token])

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{messages.common.loading}</p>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
        <h2 className="text-lg font-semibold">{messages.auth.verifyEmailSuccess}</h2>
        <p className="text-sm text-muted-foreground">{messages.auth.verifyEmailSuccessDesc}</p>
        <Button asChild className="mt-4">
          <Link href="/dashboard">{messages.auth.goToDashboard}</Link>
        </Button>
      </div>
    )
  }

  if (status === "expired") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <XCircle className="h-12 w-12 text-amber-500" />
        <h2 className="text-lg font-semibold">{messages.auth.verifyEmailExpired}</h2>
        <p className="text-sm text-muted-foreground">{messages.auth.verifyEmailExpiredDesc}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/dashboard">{messages.auth.goToDashboard}</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-8 text-center">
      <XCircle className="h-12 w-12 text-red-500" />
      <h2 className="text-lg font-semibold">{messages.auth.verifyEmailInvalid}</h2>
      <Button asChild variant="outline" className="mt-4">
        <Link href="/dashboard">{messages.auth.goToDashboard}</Link>
      </Button>
    </div>
  )
}
