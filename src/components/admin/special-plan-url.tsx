"use client"

import { useState } from "react"
import { Copy, Check, Gift, BookOpen } from "lucide-react"
import { messages } from "@/lib/messages"

function CopyableUrlCard({
  icon: Icon,
  iconBg,
  borderColor,
  gradientFrom,
  title,
  description,
  path,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  borderColor: string
  gradientFrom: string
  title: string
  description: string
  path: string
}) {
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "https://mieru-clinic.com"
  const url = `${baseUrl}${path}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement("input")
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className={`rounded-lg border ${borderColor} bg-gradient-to-r ${gradientFrom} to-white p-4`}>
      <div className="flex items-start gap-3">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-muted px-2.5 py-1.5 text-xs text-foreground">
              {url}
            </code>
            <button
              onClick={handleCopy}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                copied
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" />
                  {messages.admin.specialPlanCopied}
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  {messages.admin.specialPlanCopyUrl}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function SpecialPlanUrl() {
  return (
    <CopyableUrlCard
      icon={Gift}
      iconBg="bg-emerald-100 text-emerald-600"
      borderColor="border-emerald-200"
      gradientFrom="from-emerald-50/80"
      title={messages.admin.specialPlanUrlTitle}
      description={messages.admin.specialPlanUrlDesc}
      path="/register/special"
    />
  )
}

export function GuideUrl() {
  return (
    <CopyableUrlCard
      icon={BookOpen}
      iconBg="bg-sky-100 text-sky-600"
      borderColor="border-sky-200"
      gradientFrom="from-sky-50/80"
      title={messages.admin.guideUrlTitle}
      description={messages.admin.guideUrlDesc}
      path="/guide"
    />
  )
}
