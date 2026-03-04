"use client"

import { useState, useEffect, useCallback } from "react"
import { Mail, RotateCcw, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import {
  DEFAULT_VERIFICATION_TEMPLATE,
  DEFAULT_WELCOME_TEMPLATE,
  type VerificationEmailTemplate,
  type WelcomeEmailTemplate,
  type EmailTemplateStep,
} from "@/lib/email-templates"

type Tab = "verification" | "welcome"

export function EmailTemplateManager() {
  const [verification, setVerification] = useState<VerificationEmailTemplate>(DEFAULT_VERIFICATION_TEMPLATE)
  const [welcome, setWelcome] = useState<WelcomeEmailTemplate>(DEFAULT_WELCOME_TEMPLATE)
  const [isCustom, setIsCustom] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeTab, setActiveTab] = useState<Tab>("verification")
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(""), 3000)
    return () => clearTimeout(timer)
  }, [success])

  const fetchTemplates = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/email-templates")
      if (!res.ok) throw new Error()
      const data = await res.json()
      setVerification(data.verification)
      setWelcome(data.welcome)
      setIsCustom(data.isCustom ?? false)
    } catch {
      setError(messages.emailTemplates.loadFailed)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  async function handleSave() {
    setIsSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verification, welcome }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error || messages.emailTemplates.saveFailed)
        return
      }
      const data = await res.json()
      setVerification(data.verification)
      setWelcome(data.welcome)
      setIsCustom(data.isCustom)
      setSuccess(messages.emailTemplates.saveSuccess)
    } catch {
      setError(messages.emailTemplates.saveFailed)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleReset() {
    if (!confirm(messages.emailTemplates.resetConfirm)) return
    setIsSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToDefaults: true }),
      })
      if (!res.ok) {
        setError(messages.emailTemplates.saveFailed)
        return
      }
      const data = await res.json()
      setVerification(data.verification)
      setWelcome(data.welcome)
      setIsCustom(data.isCustom)
      setSuccess(messages.emailTemplates.saveSuccess)
    } catch {
      setError(messages.emailTemplates.saveFailed)
    } finally {
      setIsSaving(false)
    }
  }

  function updateWelcomeStep(index: number, field: keyof EmailTemplateStep, value: string) {
    const steps = [...(welcome.steps ?? DEFAULT_WELCOME_TEMPLATE.steps!)]
    steps[index] = { ...steps[index], [field]: value }
    setWelcome({ ...welcome, steps })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          {messages.common.loading}
        </CardContent>
      </Card>
    )
  }

  const currentTemplate = activeTab === "verification" ? verification : welcome

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
            <Mail className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{messages.emailTemplates.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{messages.emailTemplates.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${isCustom ? "bg-sky-100 text-sky-700" : "bg-gray-100 text-gray-600"}`}>
              {isCustom ? messages.emailTemplates.usingCustom : messages.emailTemplates.usingDefaults}
            </span>
            {isCustom && (
              <Button size="sm" variant="outline" onClick={handleReset} disabled={isSaving}>
                <RotateCcw className="mr-1 h-3 w-3" />
                {messages.emailTemplates.resetToDefaults}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {success && <p className="text-sm text-green-600">{success}</p>}

        {/* Tab switcher */}
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            onClick={() => { setActiveTab("verification"); setShowPreview(false) }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "verification" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {messages.emailTemplates.verificationEmail}
          </button>
          <button
            onClick={() => { setActiveTab("welcome"); setShowPreview(false) }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === "welcome" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {messages.emailTemplates.welcomeEmail}
          </button>
        </div>

        <p className="text-xs text-muted-foreground">{messages.emailTemplates.variableHint}</p>

        {/* Preview toggle */}
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? <EyeOff className="mr-1 h-3 w-3" /> : <Eye className="mr-1 h-3 w-3" />}
            {messages.emailTemplates.preview}
          </Button>
        </div>

        {showPreview ? (
          <EmailPreview
            template={currentTemplate}
            type={activeTab}
          />
        ) : (
          <>
            {/* Form fields */}
            <div className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="subject" className="text-xs">{messages.emailTemplates.subjectLabel}</Label>
                <Input
                  id="subject"
                  value={currentTemplate.subject}
                  onChange={(e) => {
                    if (activeTab === "verification") {
                      setVerification({ ...verification, subject: e.target.value })
                    } else {
                      setWelcome({ ...welcome, subject: e.target.value })
                    }
                  }}
                  disabled={isSaving}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="greeting" className="text-xs">{messages.emailTemplates.greetingLabel}</Label>
                <textarea
                  id="greeting"
                  value={currentTemplate.greeting}
                  onChange={(e) => {
                    if (activeTab === "verification") {
                      setVerification({ ...verification, greeting: e.target.value })
                    } else {
                      setWelcome({ ...welcome, greeting: e.target.value })
                    }
                  }}
                  placeholder={messages.emailTemplates.greetingPlaceholder}
                  disabled={isSaving}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="body" className="text-xs">{messages.emailTemplates.bodyLabel}</Label>
                <textarea
                  id="body"
                  value={currentTemplate.body}
                  onChange={(e) => {
                    if (activeTab === "verification") {
                      setVerification({ ...verification, body: e.target.value })
                    } else {
                      setWelcome({ ...welcome, body: e.target.value })
                    }
                  }}
                  placeholder={messages.emailTemplates.bodyPlaceholder}
                  disabled={isSaving}
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Welcome email steps */}
              {activeTab === "welcome" && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium">{messages.emailTemplates.stepsTitle}</p>
                    <p className="text-[11px] text-muted-foreground">{messages.emailTemplates.stepsDesc}</p>
                  </div>
                  {(welcome.steps ?? DEFAULT_WELCOME_TEMPLATE.steps!).map((step, i) => (
                    <div key={i} className="rounded-lg border bg-muted/30 p-3 space-y-2">
                      <p className="text-xs font-medium text-sky-700">Step {i + 1}</p>
                      <div className="space-y-1">
                        <Label className="text-[11px]">{messages.emailTemplates.stepDescLabel}</Label>
                        <Input
                          value={step.title}
                          onChange={(e) => updateWelcomeStep(i, "title", e.target.value)}
                          disabled={isSaving}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">{messages.emailTemplates.bodyLabel}</Label>
                        <Input
                          value={step.description}
                          onChange={(e) => updateWelcomeStep(i, "description", e.target.value)}
                          disabled={isSaving}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="note" className="text-xs">{messages.emailTemplates.noteLabel}</Label>
                <textarea
                  id="note"
                  value={currentTemplate.note}
                  onChange={(e) => {
                    if (activeTab === "verification") {
                      setVerification({ ...verification, note: e.target.value })
                    } else {
                      setWelcome({ ...welcome, note: e.target.value })
                    }
                  }}
                  placeholder={messages.emailTemplates.notePlaceholder}
                  disabled={isSaving}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? messages.common.loading : messages.common.save}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function EmailPreview({
  template,
  type,
}: {
  template: VerificationEmailTemplate | WelcomeEmailTemplate
  type: Tab
}) {
  const sampleClinicName = "サンプル歯科クリニック"

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{messages.emailTemplates.previewDesc}</p>
      <div className="rounded-lg border bg-white p-4">
        {/* Email preview */}
        <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", color: "#334155" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 style={{ color: "#0f172a", fontSize: 20 }}>MIERU Clinic</h1>
          </div>

          <p style={{ fontSize: 14 }}>{sampleClinicName} 様</p>
          <p style={{ fontSize: 14 }}>{template.greeting}</p>

          {template.body && <p style={{ fontSize: 14 }}>{template.body}</p>}

          {type === "verification" && (
            <>
              <div style={{ textAlign: "center", margin: "24px 0" }}>
                <span style={{
                  display: "inline-block",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  padding: "10px 28px",
                  borderRadius: 6,
                  fontWeight: "bold",
                  fontSize: 14,
                }}>
                  メールアドレスを確認する
                </span>
              </div>
              <p style={{ color: "#64748b", fontSize: 13 }}>このリンクの有効期限は24時間です。</p>
            </>
          )}

          {type === "welcome" && (
            <>
              <h2 style={{ fontSize: 15, color: "#0f172a", marginTop: 20 }}>最初にやること 3ステップ</h2>
              <div style={{ margin: "12px 0" }}>
                {((template as WelcomeEmailTemplate).steps ?? DEFAULT_WELCOME_TEMPLATE.steps!).map((step, i) => (
                  <div key={i} style={{
                    padding: 10,
                    background: "#f0f9ff",
                    borderBottom: i < 2 ? "1px solid #e0f2fe" : "none",
                    borderRadius: i === 0 ? "8px 8px 0 0" : i === 2 ? "0 0 8px 8px" : 0,
                    fontSize: 13,
                  }}>
                    <strong style={{ color: "#0369a1" }}>Step {i + 1}.</strong> {step.title}
                    <br />
                    <span style={{ color: "#64748b", fontSize: 12 }}>{step.description}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", margin: "20px 0" }}>
                <span style={{
                  display: "inline-block",
                  backgroundColor: "#0f172a",
                  color: "#ffffff",
                  padding: "10px 28px",
                  borderRadius: 6,
                  fontWeight: "bold",
                  fontSize: 14,
                }}>
                  ダッシュボードにログイン
                </span>
              </div>
            </>
          )}

          {template.note && (
            <p style={{ color: "#94a3b8", fontSize: 12 }}>{template.note}</p>
          )}

          <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "24px 0" }} />
          <p style={{ color: "#94a3b8", fontSize: 11, textAlign: "center" }}>
            MIERU Clinic — 患者体験の見える化
          </p>
        </div>
      </div>
    </div>
  )
}
