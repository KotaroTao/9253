"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  EyeOff,
  FileText,
} from "lucide-react"

interface AIStatus {
  configured: boolean
  connected: boolean
  model: string
  error: string | null
  latestReport: {
    generatedAt: string
    triggerType: string
  } | null
  totalReports: number
}

const m = messages.admin.aiStatus

export function AIStatusCard() {
  const [status, setStatus] = useState<AIStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [apiKey, setApiKey] = useState("")
  const [saving, setSaving] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ai-status")
      if (res.ok) {
        setStatus(await res.json())
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  async function handleCheck() {
    setChecking(true)
    setFeedback(null)
    await fetchStatus()
    setChecking(false)
  }

  async function handleSaveKey() {
    if (!apiKey.trim()) return
    setSaving(true)
    setFeedback(null)
    try {
      const res = await fetch("/api/admin/ai-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      })
      const data = await res.json()
      if (res.ok) {
        setFeedback({ type: "success", text: data.message || m.keyUpdated })
        setApiKey("")
        setShowKeyInput(false)
        await fetchStatus()
      } else {
        setFeedback({ type: "error", text: data.error || m.invalidKey })
      }
    } catch {
      setFeedback({ type: "error", text: m.checkFailed })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50/80 to-white">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
        </CardContent>
      </Card>
    )
  }

  const isOk = status?.configured && status?.connected
  const isWarning = status?.configured && !status?.connected
  const isNotConfigured = !status?.configured

  return (
    <Card className={
      isOk
        ? "border-purple-200 bg-gradient-to-r from-purple-50/80 to-white"
        : isWarning
          ? "border-red-200 bg-gradient-to-r from-red-50/80 to-white"
          : "border-amber-200 bg-gradient-to-r from-amber-50/80 to-white"
    }>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              isOk ? "bg-purple-100 text-purple-600" : isWarning ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"
            }`}>
              <Brain className="h-4 w-4" />
            </div>
            {m.title}
          </CardTitle>
          <button
            type="button"
            onClick={handleCheck}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {checking ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            {checking ? m.checking : m.checkConnection}
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 接続状態 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{m.statusLabel}</span>
          <div className="flex items-center gap-1.5">
            {isOk ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-medium text-emerald-700">{m.connected}</span>
              </>
            ) : isWarning ? (
              <>
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs font-medium text-red-700">{m.disconnected}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-medium text-amber-700">{m.notConfigured}</span>
              </>
            )}
          </div>
        </div>

        {/* エラー詳細 */}
        {status?.error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-2">
            <p className="text-xs text-red-700 break-all">{status.error}</p>
          </div>
        )}

        {/* モデル */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{m.model}</span>
          <span className="text-xs font-mono">{status?.model ?? "-"}</span>
        </div>

        {/* レポート統計 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{m.totalReports}</span>
          <span className="flex items-center gap-1 text-xs">
            <FileText className="h-3 w-3 text-muted-foreground" />
            {status?.totalReports ?? 0}
          </span>
        </div>

        {status?.latestReport && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{m.latestReport}</span>
            <span className="text-xs">
              {new Date(status.latestReport.generatedAt).toLocaleDateString("ja-JP")}
              <span className="ml-1 text-muted-foreground">
                ({status.latestReport.triggerType})
              </span>
            </span>
          </div>
        )}

        {/* APIキー設定フォーム（未設定 or エラー時に表示可能） */}
        {(isNotConfigured || isWarning) && (
          <div className="border-t pt-3">
            {!showKeyInput ? (
              <button
                type="button"
                onClick={() => setShowKeyInput(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-medium text-white hover:bg-purple-700 transition-colors"
              >
                <Brain className="h-3.5 w-3.5" />
                {m.apiKeyLabel}を設定
              </button>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-medium">{m.apiKeyLabel}</label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={m.apiKeyPlaceholder}
                    className="w-full rounded-md border px-3 py-1.5 pr-8 text-xs font-mono focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground">{m.apiKeyHint}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleSaveKey}
                    disabled={saving || !apiKey.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {saving && <Loader2 className="h-3 w-3 animate-spin" />}
                    {saving ? m.saving : m.saveKey}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowKeyInput(false); setApiKey(""); setFeedback(null) }}
                    className="rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* フィードバック */}
        {feedback && (
          <div className={`rounded-md p-2 text-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {feedback.text}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
