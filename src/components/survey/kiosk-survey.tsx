"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { SurveyForm } from "@/components/survey/survey-form"
import { messages } from "@/lib/messages"
import {
  MessageSquare,
  LogOut,
  Lightbulb,
  ArrowRight,
  User,
} from "lucide-react"
import { Confetti } from "@/components/survey/confetti"
import {
  DENTAL_TIPS,
  VISIT_TYPES,
  TREATMENT_TYPES,
  CHIEF_COMPLAINTS,
  AGE_GROUPS,
  GENDERS,
  STAFF_ROLE_LABELS,
} from "@/lib/constants"
import type { SurveyPageData, SurveyTemplateInfo, PatientAttributes, KioskStaffInfo } from "@/types/survey"

interface KioskSurveyProps {
  clinicName: string
  clinicSlug: string
  templates: SurveyTemplateInfo[]
  initialTodayCount: number
  staff: KioskStaffInfo[]
}

type KioskState = "setup" | "survey" | "thanks"

function resolveTemplate(
  templates: SurveyTemplateInfo[],
  visitType: string,
  treatmentType: string
): SurveyTemplateInfo | undefined {
  if (visitType === "first_visit") {
    return templates.find((t) => t.name === "初診") ?? templates[0]
  }
  if (treatmentType === "checkup") {
    return templates.find((t) => t.name === "定期検診") ?? templates[0]
  }
  return templates.find((t) => t.name === "治療中") ?? templates[0]
}

// Pill selector component for rapid tap selection
function PillSelector({
  label,
  options,
  value,
  onChange,
  columns = 4,
}: {
  label: string
  options: readonly { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  columns?: number
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-muted-foreground">{label}</p>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(value === opt.value ? "" : opt.value)}
            className={`rounded-xl border-2 px-2 py-3 text-sm font-bold transition-all active:scale-95 ${
              value === opt.value
                ? "border-primary bg-primary text-primary-foreground shadow-sm"
                : "border-muted bg-card text-foreground hover:border-primary/30"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function KioskSurvey({
  clinicName,
  clinicSlug,
  templates,
  initialTodayCount,
  staff,
}: KioskSurveyProps) {
  const router = useRouter()
  const [state, setState] = useState<KioskState>("setup")
  const [todayCount, setTodayCount] = useState(initialTodayCount)
  const [formKey, setFormKey] = useState(0)
  const [showExitConfirm, setShowExitConfirm] = useState(false)
  const [randomTip, setRandomTip] = useState(
    () => DENTAL_TIPS[Math.floor(Math.random() * DENTAL_TIPS.length)]
  )
  const [showConfetti, setShowConfetti] = useState(false)

  // Staff setup state
  const [selectedStaffId, setSelectedStaffId] = useState("")
  const [visitType, setVisitType] = useState("")
  const [treatmentType, setTreatmentType] = useState("")
  const [chiefComplaint, setChiefComplaint] = useState("")
  const [ageGroup, setAgeGroup] = useState("")
  const [gender, setGender] = useState("")
  const [selectedData, setSelectedData] = useState<SurveyPageData | null>(null)
  const [patientAttrs, setPatientAttrs] = useState<PatientAttributes | null>(null)

  // Device UUID: generate and persist in localStorage
  const [deviceUuid, setDeviceUuid] = useState<string | undefined>(undefined)
  const [isAuthorizedDevice, setIsAuthorizedDevice] = useState(false)

  useEffect(() => {
    let uuid = localStorage.getItem("mieru-device-uuid")
    if (!uuid) {
      uuid = crypto.randomUUID()
      localStorage.setItem("mieru-device-uuid", uuid)
    }
    setDeviceUuid(uuid)

    // Check if this device is authorized
    fetch(`/api/devices/check?uuid=${encodeURIComponent(uuid)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.isAuthorized) setIsAuthorizedDevice(true)
      })
      .catch(() => {
        // Device check is non-critical; default to unauthorized
      })
  }, [])

  // Authorized devices require staff selection
  const canProceed =
    visitType !== "" &&
    treatmentType !== "" &&
    (!isAuthorizedDevice || selectedStaffId !== "")

  const resetToSetup = useCallback(() => {
    setFormKey((k) => k + 1)
    setState("setup")
    setShowConfetti(false)
    // Keep selectedStaffId across patients (same staff hands tablet)
    setVisitType("")
    setTreatmentType("")
    setChiefComplaint("")
    setAgeGroup("")
    setGender("")
    setSelectedData(null)
    setPatientAttrs(null)
  }, [])

  const handleSurveyComplete = useCallback(() => {
    setTodayCount((c) => c + 1)
    setRandomTip(DENTAL_TIPS[Math.floor(Math.random() * DENTAL_TIPS.length)])
    setShowConfetti(true)
    setState("thanks")
  }, [])

  const handleStartSurvey = useCallback(() => {
    if (!canProceed) return
    const template = resolveTemplate(templates, visitType, treatmentType)
    if (!template) return

    setSelectedData({
      clinicName,
      clinicSlug,
      templateId: template.id,
      templateName: template.name,
      questions: template.questions,
    })
    setPatientAttrs({
      visitType: visitType as PatientAttributes["visitType"],
      treatmentType: treatmentType as PatientAttributes["treatmentType"],
      chiefComplaint,
      ageGroup,
      gender,
    })
    setState("survey")
  }, [canProceed, templates, visitType, treatmentType, chiefComplaint, ageGroup, gender, clinicName, clinicSlug])

  const handleExit = useCallback(() => {
    router.push("/dashboard")
  }, [router])

  // Staff setup screen - optimized for quick taps during busy hours
  if (state === "setup") {
    return (
      <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
        <div className="flex-1 overflow-y-auto px-4 pb-28 pt-6">
          <div className="mx-auto max-w-lg space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold">{messages.patientSetup.title}</h1>
                <p className="text-xs text-muted-foreground">{clinicName}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-xs text-muted-foreground">
                <MessageSquare className="h-3 w-3" />
                {todayCount}{messages.common.countSuffix}
              </div>
            </div>

            {/* Staff selector */}
            {staff.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-muted-foreground">
                  {messages.patientSetup.staffSelect}
                  {isAuthorizedDevice && (
                    <span className="ml-1 text-destructive">*</span>
                  )}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {staff.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedStaffId(selectedStaffId === s.id ? "" : s.id)}
                      className={`flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 transition-all active:scale-95 ${
                        selectedStaffId === s.id
                          ? "border-primary bg-primary text-primary-foreground shadow-sm"
                          : "border-muted bg-card text-foreground hover:border-primary/30"
                      }`}
                    >
                      <User className="h-4 w-4" />
                      <span className="text-sm font-bold">{s.name}</span>
                      <span className={`text-[10px] ${selectedStaffId === s.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {STAFF_ROLE_LABELS[s.role] ?? s.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Visit type */}
            <PillSelector
              label={messages.patientSetup.visitType}
              options={VISIT_TYPES}
              value={visitType}
              onChange={setVisitType}
              columns={2}
            />

            {/* Treatment type */}
            <PillSelector
              label={messages.patientSetup.treatmentType}
              options={TREATMENT_TYPES}
              value={treatmentType}
              onChange={setTreatmentType}
              columns={3}
            />

            {/* Chief complaint */}
            <PillSelector
              label={messages.patientSetup.chiefComplaint}
              options={CHIEF_COMPLAINTS}
              value={chiefComplaint}
              onChange={setChiefComplaint}
              columns={4}
            />

            {/* Age group */}
            <PillSelector
              label={messages.patientSetup.ageGroup}
              options={AGE_GROUPS}
              value={ageGroup}
              onChange={setAgeGroup}
              columns={5}
            />

            {/* Gender */}
            <PillSelector
              label={messages.patientSetup.gender}
              options={GENDERS}
              value={gender}
              onChange={setGender}
              columns={3}
            />
          </div>
        </div>

        {/* Fixed bottom action */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-card p-4 safe-area-pb">
          <div className="mx-auto max-w-lg">
            <Button
              className="h-14 w-full text-lg shadow-lg"
              onClick={handleStartSurvey}
              disabled={!canProceed}
            >
              {messages.patientSetup.handToPatient}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {!canProceed && (
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {isAuthorizedDevice && !selectedStaffId
                  ? messages.patientSetup.staffRequiredHint
                  : messages.patientSetup.requiredHint}
              </p>
            )}
          </div>
        </div>

        {/* Exit button */}
        <div className="fixed bottom-4 right-4" style={{ bottom: "5rem" }}>
          {showExitConfirm ? (
            <div className="flex items-center gap-2 rounded-lg border bg-card p-3 shadow-lg">
              <p className="text-sm">{messages.kiosk.exitConfirm}</p>
              <Button size="sm" variant="outline" onClick={() => setShowExitConfirm(false)}>
                {messages.common.cancel}
              </Button>
              <Button size="sm" onClick={handleExit}>
                {messages.kiosk.exitKiosk}
              </Button>
            </div>
          ) : (
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground/15 transition-colors hover:bg-muted hover:text-muted-foreground"
              onClick={() => setShowExitConfirm(true)}
              aria-label={messages.kiosk.exitKiosk}
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Thanks screen - patient closes the tab when done
  if (state === "thanks") {
    return (
      <>
        {showConfetti && <Confetti />}
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50/60 to-white px-4">
          <div className="w-full max-w-sm space-y-6 text-center">
            <div className="text-5xl">🎉</div>
            <h1 className="text-2xl font-bold">{messages.survey.thankYou}</h1>

            <div className="rounded-xl bg-blue-50 p-4 text-left">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <Lightbulb className="h-3.5 w-3.5" />
                {messages.survey.tipLabel}
              </p>
              <p className="text-sm text-blue-800">{randomTip}</p>
            </div>

            <p className="text-sm text-muted-foreground">{messages.survey.closeMessage}</p>
          </div>
        </div>
      </>
    )
  }

  // Survey - patient answering
  if (!selectedData) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md">
        <SurveyForm
          key={formKey}
          data={selectedData}
          onComplete={handleSurveyComplete}
          patientAttributes={patientAttrs ?? undefined}
          staffId={selectedStaffId || undefined}
          deviceUuid={deviceUuid}
          kioskMode
        />
      </div>
    </div>
  )
}
