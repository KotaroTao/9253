"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TurnstileWidget } from "@/components/auth/turnstile-widget"
import { messages } from "@/lib/messages"

export function RegisterForm() {
  const router = useRouter()
  const [clinicName, setClinicName] = useState("")
  const [adminName, setAdminName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (password !== passwordConfirm) {
      setError(messages.auth.passwordMismatch)
      return
    }
    if (!termsAgreed) {
      setError(messages.auth.termsRequired)
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicName,
          adminName,
          email,
          password,
          passwordConfirm,
          termsAgreed,
          turnstileToken,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || messages.auth.registerError)
        return
      }

      // 登録成功 → 自動ログイン
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        // ログイン失敗時はログインページへ誘導
        router.push("/login")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError(messages.auth.registerError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="clinicName">{messages.auth.clinicName}</Label>
        <Input
          id="clinicName"
          type="text"
          placeholder={messages.auth.clinicNamePlaceholder}
          value={clinicName}
          onChange={(e) => setClinicName(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="organization"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminName">{messages.auth.adminName}</Label>
        <Input
          id="adminName"
          type="text"
          placeholder={messages.auth.adminNamePlaceholder}
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{messages.auth.email}</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={isLoading}
          autoComplete="email"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{messages.auth.password}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isLoading}
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passwordConfirm">{messages.auth.passwordConfirm}</Label>
        <Input
          id="passwordConfirm"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          required
          disabled={isLoading}
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className="flex items-start space-x-2">
        <input
          type="checkbox"
          id="terms"
          checked={termsAgreed}
          onChange={(e) => setTermsAgreed(e.target.checked)}
          disabled={isLoading}
          className="mt-1 h-4 w-4 rounded border-gray-300"
        />
        <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
          {messages.auth.termsAgree}
        </Label>
      </div>
      <TurnstileWidget onVerify={setTurnstileToken} />
      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? messages.common.loading : messages.auth.registerButton}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {messages.auth.haveAccount}{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          {messages.auth.login}
        </Link>
      </p>
    </form>
  )
}
