"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { messages } from "@/lib/messages"
import type { StaffSurveySummary, StaffSurveyResult } from "@/types"

interface StaffSurveyManagementProps {
  initialSurveys: StaffSurveySummary[]
  activeSurvey: (StaffSurveySummary & { id: string }) | null
}

export function StaffSurveyManagement({
  initialSurveys,
  activeSurvey: initialActive,
}: StaffSurveyManagementProps) {
  const [surveys, setSurveys] = useState(initialSurveys)
  const [activeSurvey, setActiveSurvey] = useState(initialActive)
  const [title, setTitle] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)
  const [selectedResult, setSelectedResult] = useState<StaffSurveyResult | null>(null)

  const surveyUrl = activeSurvey
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/es/${activeSurvey.id}`
    : ""

  async function handleCreate() {
    if (!title.trim()) return
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/staff-surveys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || messages.common.error)
        setLoading(false)
        return
      }

      const newSurvey = await res.json()
      const summary: StaffSurveySummary = {
        ...newSurvey,
        responseCount: 0,
        overallScore: null,
      }
      setActiveSurvey(summary)
      setSurveys((prev) => [summary, ...prev])
      setTitle("")
    } catch {
      setError(messages.common.error)
    } finally {
      setLoading(false)
    }
  }

  async function handleClose() {
    if (!activeSurvey || !confirm(messages.staffSurvey.confirmClose)) return
    setLoading(true)

    try {
      const res = await fetch("/api/staff-surveys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId: activeSurvey.id, action: "close" }),
      })

      if (res.ok) {
        setActiveSurvey(null)
        setSurveys((prev) =>
          prev.map((s) =>
            s.id === activeSurvey.id ? { ...s, status: "closed" } : s
          )
        )
      }
    } catch {
      setError(messages.common.error)
    } finally {
      setLoading(false)
    }
  }

  async function handleViewResults(surveyId: string) {
    try {
      const res = await fetch("/api/staff-surveys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ surveyId, action: "results" }),
      })

      if (res.ok) {
        const result: StaffSurveyResult = await res.json()
        setSelectedResult(result)
      }
    } catch {
      setError(messages.common.error)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(surveyUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Active survey or create new */}
      {activeSurvey ? (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              {messages.staffSurvey.active}: {activeSurvey.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">
                {messages.staffSurvey.surveyUrl}
              </Label>
              <div className="mt-1 flex gap-2">
                <Input value={surveyUrl} readOnly className="text-xs" />
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? messages.staffSurvey.copied : messages.staffSurvey.copyUrl}
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                このURLをLINEグループ等でスタッフに共有してください
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">
                {messages.staffSurvey.responseCount}: {activeSurvey.responseCount}件
              </p>
              <Button variant="destructive" size="sm" onClick={handleClose} disabled={loading}>
                {messages.staffSurvey.closeSurvey}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{messages.staffSurvey.startSurvey}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="survey-title">{messages.staffSurvey.surveyTitle}</Label>
              <Input
                id="survey-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`${new Date().getFullYear()}年${new Date().getMonth() + 1}月 従業員満足度調査`}
              />
            </div>
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Button onClick={handleCreate} disabled={loading || !title.trim()}>
              {messages.staffSurvey.startSurvey}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results modal */}
      {selectedResult && (
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {messages.staffSurvey.results}: {selectedResult.title}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)}>
              {messages.common.close}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{messages.staffSurvey.responseCount}</p>
                <p className="text-lg font-bold">{selectedResult.responseCount}件</p>
              </div>
              {selectedResult.overallScore != null && (
                <div>
                  <p className="text-xs text-muted-foreground">{messages.staffSurvey.overallScore}</p>
                  <p className="text-lg font-bold text-green-600">
                    {selectedResult.overallScore.toFixed(1)} / 5.0
                  </p>
                </div>
              )}
            </div>
            {selectedResult.categoryScores.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{messages.staffSurvey.categoryLabel}</p>
                {selectedResult.categoryScores.map((cs) => (
                  <div key={cs.category} className="flex items-center gap-3">
                    <span className="w-24 text-xs">{cs.label}</span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${cs.score >= 3.0 ? "bg-green-500" : "bg-orange-500"}`}
                          style={{ width: `${(cs.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs font-medium">{cs.score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {messages.staffSurvey.minResponsesNote}
              </p>
            )}
            {selectedResult.freeTexts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{messages.staffSurvey.freeTextLabel}</p>
                {selectedResult.freeTexts.map((text, i) => (
                  <div key={i} className="rounded-md border bg-muted/30 p-2 text-xs">
                    {text}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Survey history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{messages.staffSurvey.surveyList}</CardTitle>
        </CardHeader>
        <CardContent>
          {surveys.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {messages.staffSurvey.noSurveys}
            </p>
          ) : (
            <div className="space-y-2">
              {surveys.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.startsAt).toLocaleDateString("ja-JP")}
                      {s.endsAt && ` 〜 ${new Date(s.endsAt).toLocaleDateString("ja-JP")}`}
                      {" · "}
                      {s.responseCount}件
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        s.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {s.status === "active"
                        ? messages.staffSurvey.active
                        : messages.staffSurvey.closed}
                    </span>
                    {s.status === "closed" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewResults(s.id)}
                      >
                        {messages.staffSurvey.results}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
