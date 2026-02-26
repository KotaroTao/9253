"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { messages } from "@/lib/messages"
import { CheckCircle2, ChevronRight, ChevronLeft, Stethoscope, Users, Lock, Check, Loader2, Sparkles, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ClinicType } from "@/types"

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const

const CLINIC_TYPE_OPTIONS: { value: ClinicType; label: string }[] = [
  { value: "general", label: messages.settings.clinicTypeGeneral },
  { value: "orthodontic", label: messages.settings.clinicTypeOrthodontic },
  { value: "pediatric", label: messages.settings.clinicTypePediatric },
  { value: "cosmetic", label: messages.settings.clinicTypeCosmetic },
  { value: "oral_surgery", label: messages.settings.clinicTypeOralSurgery },
]

const STAFF_ROLES = [
  { value: "dentist", label: "歯科医師" },
  { value: "hygienist", label: "歯科衛生士" },
  { value: "staff", label: "スタッフ" },
]

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [showFirstAction, setShowFirstAction] = useState(false)

  // Step 1: clinic info
  const [clinicType, setClinicType] = useState<ClinicType>("general")
  const [closedDays, setClosedDays] = useState<number[]>([0]) // Default: Sunday

  // Step 2: staff
  const [staffName, setStaffName] = useState("")
  const [staffRole, setStaffRole] = useState("dentist")
  const [staffList, setStaffList] = useState<Array<{ name: string; role: string }>>([])

  // Step 3: metrics PIN
  const [pin, setPin] = useState("")
  const [confirmPin, setConfirmPin] = useState("")
  const [pinError, setPinError] = useState<string | null>(null)
  const [pinSaved, setPinSaved] = useState(false)

  const steps = [
    { icon: Stethoscope, title: messages.onboarding.step1Title, desc: messages.onboarding.step1Desc },
    { icon: Users, title: messages.onboarding.step2Title, desc: messages.onboarding.step2Desc },
    { icon: Lock, title: messages.onboarding.step3Title, desc: messages.onboarding.step3Desc },
  ]

  function toggleClosedDay(day: number) {
    setClosedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function addStaff() {
    if (!staffName.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: staffName.trim(), role: staffRole }),
      })
      if (res.ok) {
        setStaffList((prev) => [...prev, { name: staffName.trim(), role: staffRole }])
        setStaffName("")
      }
    } finally {
      setSaving(false)
    }
  }

  async function saveClinicSettings() {
    setSaving(true)
    try {
      await fetch(`/api/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicType,
          regularClosedDays: closedDays,
        }),
      })
    } finally {
      setSaving(false)
    }
  }

  async function savePin() {
    setPinError(null)
    const PIN_RE = /^\d{4}$/
    if (!PIN_RE.test(pin)) {
      setPinError(messages.onboarding.step3PinInvalid)
      return
    }
    if (pin !== confirmPin) {
      setPinError(messages.onboarding.step3PinMismatch)
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/settings/metrics-pin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set", newPin: pin }),
      })
      if (res.ok) {
        setPinSaved(true)
      } else {
        const data = await res.json()
        setPinError(data.error || messages.common.error)
      }
    } catch {
      setPinError(messages.common.error)
    } finally {
      setSaving(false)
    }
  }

  async function completeOnboarding() {
    setSaving(true)
    try {
      // Mark onboarding as completed in clinic settings
      await fetch(`/api/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      })
      setShowFirstAction(true)
    } finally {
      setSaving(false)
    }
  }

  async function handleNext() {
    if (step === 0) {
      await saveClinicSettings()
    }
    if (step < steps.length - 1) {
      setStep(step + 1)
    }
  }

  if (showFirstAction) {
    return (
      <Card className="border-emerald-200 shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-3">
            <Sparkles className="h-6 w-6 text-emerald-600" />
          </div>
          <CardTitle className="text-xl">{messages.onboarding.firstActionTitle}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{messages.onboarding.firstActionDesc}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={() => {
              router.push("/dashboard/test")
              router.refresh()
            }}
          >
            <ClipboardCheck className="h-4 w-4 mr-2" />
            {messages.onboarding.firstActionTestButton}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => router.refresh()}
          >
            {messages.onboarding.firstActionSkip}
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-primary/20 shadow-lg">
      <CardHeader className="text-center pb-2">
        <CardTitle className="text-xl">{messages.onboarding.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{messages.onboarding.subtitle}</p>
      </CardHeader>
      <CardContent>
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={cn("h-0.5 w-8", i < step ? "bg-primary" : "bg-muted")} />
              )}
            </div>
          ))}
        </div>

        <div className="mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            {(() => {
              const Icon = steps[step].icon
              return <Icon className="h-4 w-4" />
            })()}
            {steps[step].title}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">{steps[step].desc}</p>
        </div>

        {/* Step 1: Clinic info */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm">{messages.onboarding.step1ClinicType}</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CLINIC_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setClinicType(opt.value)}
                    className={cn(
                      "rounded-lg border p-2.5 text-sm text-left transition-colors",
                      clinicType === opt.value
                        ? "border-primary bg-primary/5 font-medium"
                        : "border-muted hover:border-primary/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">{messages.onboarding.step1ClosedDays}</Label>
              <div className="flex gap-1.5 mt-2">
                {DAY_LABELS.map((label, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => toggleClosedDay(i)}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
                      closedDays.includes(i)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Staff */}
        {step === 1 && (
          <div className="space-y-4">
            {staffList.length > 0 && (
              <div className="space-y-1">
                {staffList.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground">
                      ({STAFF_ROLES.find((r) => r.value === s.role)?.label})
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                placeholder="名前"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="flex-1"
              />
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value)}
                className="rounded-md border px-2 text-sm"
              >
                {STAFF_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addStaff}
                disabled={!staffName.trim() || saving}
              >
                {messages.onboarding.step2AddStaff}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">{messages.onboarding.step2SkipNote}</p>
          </div>
        )}

        {/* Step 3: Metrics PIN */}
        {step === 2 && (
          <div className="space-y-4">
            {pinSaved ? (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3 text-sm text-green-700">
                <Check className="h-4 w-4 shrink-0" />
                {messages.onboarding.step3PinSet}
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium shrink-0">{messages.onboarding.step3PinLabel}</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(null) }}
                    placeholder={messages.onboarding.step3PinPlaceholder}
                    className="w-32 rounded-lg border bg-background px-3 py-2 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium shrink-0">{messages.onboarding.step3ConfirmLabel}</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={confirmPin}
                    onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(null) }}
                    placeholder={messages.onboarding.step3PinPlaceholder}
                    className="w-32 rounded-lg border bg-background px-3 py-2 text-center text-lg tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                {pinError && <p className="text-sm text-destructive">{pinError}</p>}
                <Button size="sm" onClick={savePin} disabled={saving}>
                  {saving && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                  {messages.metricsPin.setPinButton}
                </Button>
              </>
            )}
            <p className="text-xs text-muted-foreground">{messages.onboarding.step3PinNote}</p>
            {!pinSaved && (
              <p className="text-xs text-amber-600">{messages.onboarding.step3PinSkipNote}</p>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t">
          <div>
            {step > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                {messages.onboarding.prevStep}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step < steps.length - 1 ? (
              <>
                <Button variant="ghost" size="sm" onClick={() => setStep(step + 1)}>
                  {messages.onboarding.skipStep}
                </Button>
                <Button size="sm" onClick={handleNext} disabled={saving}>
                  {messages.onboarding.nextStep}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={completeOnboarding} disabled={saving}>
                {messages.onboarding.complete}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
