"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { messages } from "@/lib/messages"
import type { MonthlyMetrics } from "@/types"

interface MonthlyMetricsFormProps {
  initialMetrics: MonthlyMetrics[]
}

export function MonthlyMetricsForm({ initialMetrics }: MonthlyMetricsFormProps) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [metrics, setMetrics] = useState(initialMetrics)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")

  // Find existing data for selected month
  const existing = metrics.find((m) => m.year === year && m.month === month)

  const [newPatients, setNewPatients] = useState<string>(
    existing?.newPatientCount?.toString() ?? ""
  )
  const [maintenanceTransitions, setMaintenanceTransitions] = useState<string>(
    existing?.maintenanceTransitionCount?.toString() ?? ""
  )
  const [selfPayProposals, setSelfPayProposals] = useState<string>(
    existing?.selfPayProposalCount?.toString() ?? ""
  )
  const [selfPayConversions, setSelfPayConversions] = useState<string>(
    existing?.selfPayConversionCount?.toString() ?? ""
  )

  function handleMonthChange(newYear: number, newMonth: number) {
    setYear(newYear)
    setMonth(newMonth)
    const e = metrics.find((m) => m.year === newYear && m.month === newMonth)
    setNewPatients(e?.newPatientCount?.toString() ?? "")
    setMaintenanceTransitions(e?.maintenanceTransitionCount?.toString() ?? "")
    setSelfPayProposals(e?.selfPayProposalCount?.toString() ?? "")
    setSelfPayConversions(e?.selfPayConversionCount?.toString() ?? "")
    setSuccess(false)
    setError("")
  }

  // Calculate rates
  const maintenanceRate =
    newPatients && maintenanceTransitions && parseInt(newPatients) > 0
      ? ((parseInt(maintenanceTransitions) / parseInt(newPatients)) * 100).toFixed(1)
      : null

  const selfPayRate =
    selfPayProposals && selfPayConversions && parseInt(selfPayProposals) > 0
      ? ((parseInt(selfPayConversions) / parseInt(selfPayProposals)) * 100).toFixed(1)
      : null

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccess(false)

    try {
      const res = await fetch("/api/monthly-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          month,
          newPatientCount: newPatients ? parseInt(newPatients) : null,
          maintenanceTransitionCount: maintenanceTransitions
            ? parseInt(maintenanceTransitions)
            : null,
          selfPayProposalCount: selfPayProposals ? parseInt(selfPayProposals) : null,
          selfPayConversionCount: selfPayConversions
            ? parseInt(selfPayConversions)
            : null,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        setError(body.error || messages.common.error)
        setSaving(false)
        return
      }

      setSuccess(true)
      // Refresh metrics list
      const listRes = await fetch("/api/monthly-metrics")
      if (listRes.ok) {
        setMetrics(await listRes.json())
      }
    } catch {
      setError(messages.common.error)
    } finally {
      setSaving(false)
    }
  }

  // Generate month options (last 12 months)
  const monthOptions: { year: number; month: number; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthOptions.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1,
      label: `${d.getFullYear()}年${d.getMonth() + 1}月`,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{messages.monthlyMetrics.title}</CardTitle>
          <p className="text-xs text-muted-foreground">{messages.monthlyMetrics.inputHint}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Month selector */}
          <div>
            <Label>{messages.monthlyMetrics.yearMonth}</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {monthOptions.slice(0, 6).map((opt) => (
                <Button
                  key={`${opt.year}-${opt.month}`}
                  variant={year === opt.year && month === opt.month ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleMonthChange(opt.year, opt.month)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Maintenance transition */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-medium">{messages.dashboard.maintenanceRate}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="new-patients" className="text-xs">
                  {messages.monthlyMetrics.newPatientCount}
                </Label>
                <Input
                  id="new-patients"
                  type="number"
                  min={0}
                  value={newPatients}
                  onChange={(e) => setNewPatients(e.target.value)}
                  placeholder="例: 45"
                />
              </div>
              <div>
                <Label htmlFor="maintenance" className="text-xs">
                  {messages.monthlyMetrics.maintenanceTransitionCount}
                </Label>
                <Input
                  id="maintenance"
                  type="number"
                  min={0}
                  value={maintenanceTransitions}
                  onChange={(e) => setMaintenanceTransitions(e.target.value)}
                  placeholder="例: 28"
                />
              </div>
            </div>
            {maintenanceRate && (
              <p className="text-sm">
                → {messages.monthlyMetrics.maintenanceRate}:{" "}
                <span className="font-bold text-orange-600">{maintenanceRate}%</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({messages.monthlyMetrics.autoCalc})
                </span>
              </p>
            )}
          </div>

          {/* Self-pay conversion */}
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="text-sm font-medium">{messages.dashboard.selfPayRate}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="self-pay-proposals" className="text-xs">
                  {messages.monthlyMetrics.selfPayProposalCount}
                </Label>
                <Input
                  id="self-pay-proposals"
                  type="number"
                  min={0}
                  value={selfPayProposals}
                  onChange={(e) => setSelfPayProposals(e.target.value)}
                  placeholder="例: 20"
                />
              </div>
              <div>
                <Label htmlFor="self-pay-conversions" className="text-xs">
                  {messages.monthlyMetrics.selfPayConversionCount}
                </Label>
                <Input
                  id="self-pay-conversions"
                  type="number"
                  min={0}
                  value={selfPayConversions}
                  onChange={(e) => setSelfPayConversions(e.target.value)}
                  placeholder="例: 12"
                />
              </div>
            </div>
            {selfPayRate && (
              <p className="text-sm">
                → {messages.monthlyMetrics.selfPayRate}:{" "}
                <span className="font-bold text-purple-600">{selfPayRate}%</span>
                <span className="ml-1 text-xs text-muted-foreground">
                  ({messages.monthlyMetrics.autoCalc})
                </span>
              </p>
            )}
          </div>

          {/* Save button */}
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
              {messages.monthlyMetrics.saveSuccess}
            </div>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {messages.common.save}
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      {metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">入力済みデータ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2">{messages.monthlyMetrics.yearMonth}</th>
                    <th className="pb-2 text-right">{messages.monthlyMetrics.newPatientCount}</th>
                    <th className="pb-2 text-right">{messages.monthlyMetrics.maintenanceRate}</th>
                    <th className="pb-2 text-right">{messages.monthlyMetrics.selfPayProposalCount}</th>
                    <th className="pb-2 text-right">{messages.monthlyMetrics.selfPayRate}</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => (
                    <tr
                      key={`${m.year}-${m.month}`}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/50"
                      onClick={() => handleMonthChange(m.year, m.month)}
                    >
                      <td className="py-2">{m.year}年{m.month}月</td>
                      <td className="py-2 text-right">{m.newPatientCount ?? "-"}</td>
                      <td className="py-2 text-right">
                        {m.maintenanceRate != null ? `${m.maintenanceRate}%` : "-"}
                      </td>
                      <td className="py-2 text-right">{m.selfPayProposalCount ?? "-"}</td>
                      <td className="py-2 text-right">
                        {m.selfPayRate != null ? `${m.selfPayRate}%` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
