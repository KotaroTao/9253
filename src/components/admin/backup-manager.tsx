"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { messages } from "@/lib/messages"
import {
  HardDrive,
  Clock,
  FileArchive,
  ScrollText,
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
} from "lucide-react"

interface BackupFile {
  name: string
  size: number
  sizeHR: string
  createdAt: string
}

interface LogEntry {
  timestamp: string
  level: "INFO" | "WARNING" | "ERROR"
  message: string
}

interface BackupData {
  configured: boolean
  backupDir: string
  scriptPath: string
  files: BackupFile[]
  logs: LogEntry[]
  lastBackup: {
    timestamp: string
    dbSize: string
    uploadsSize: string
  } | null
  diskFree: string | null
}

const m = messages.backup

export function BackupManager() {
  const [data, setData] = useState<BackupData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const fetchData = useCallback(async () => {
    try {
      setError("")
      const res = await fetch("/api/admin/backups")
      if (!res.ok) throw new Error()
      const json = await res.json()
      setData(json)
    } catch {
      setError(m.loadFailed)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(""), 5000)
    return () => clearTimeout(timer)
  }, [success])

  const handleRunBackup = async () => {
    if (!confirm(m.runConfirm)) return

    setIsRunning(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/admin/backups", { method: "POST" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error || m.runFailed)
      }
      setSuccess(m.runSuccess)
      await fetchData()
    } catch (err) {
      setError(err instanceof Error ? err.message : m.runFailed)
    } finally {
      setIsRunning(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          {messages.common.loading}
        </span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
        {error || m.loadFailed}
      </div>
    )
  }

  // バックアップ未設定
  if (!data.configured) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <HardDrive className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-medium">{m.notConfigured}</h3>
          <p className="text-sm text-muted-foreground">{m.notConfiguredDesc}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* フィードバック */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 className="mr-1.5 inline-block h-4 w-4" />
          {success}
        </div>
      )}

      {/* ステータスカード + 手動実行 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 最終バックアップ */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              {m.lastBackup}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lastBackup ? (
              <div>
                <p className="text-lg font-bold">
                  {formatTimestamp(data.lastBackup.timestamp)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.dbSize}: {data.lastBackup.dbSize} / {m.uploadsSize}:{" "}
                  {data.lastBackup.uploadsSize}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">−</p>
            )}
          </CardContent>
        </Card>

        {/* 次回予定 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              {m.nextScheduled}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{m.everyday3am}</p>
            <p className="mt-1 text-xs text-muted-foreground">crontab</p>
          </CardContent>
        </Card>

        {/* ディスク容量 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <HardDrive className="h-4 w-4" />
              {m.diskFree}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{data.diskFree || "−"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {m.retention}: 7{m.retentionDays}
            </p>
          </CardContent>
        </Card>

        {/* 手動実行ボタン */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Play className="h-4 w-4" />
              {m.runManual}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 items-end">
            <button
              onClick={handleRunBackup}
              disabled={isRunning}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {m.running}
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  {m.runManual}
                </>
              )}
            </button>
          </CardContent>
        </Card>
      </div>

      {/* 設定情報 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Info className="h-4 w-4" />
              設定情報
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <div>
              <p className="text-muted-foreground">{m.scriptPath}</p>
              <p className="font-mono text-xs">{data.scriptPath}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{m.backupDir}</p>
              <p className="font-mono text-xs">{data.backupDir}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{m.retention}</p>
              <p className="font-mono text-xs">7{m.retentionDays}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* バックアップファイル一覧 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileArchive className="h-4 w-4" />
              {m.backupFiles}
            </CardTitle>
            <button
              onClick={fetchData}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
              title="更新"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {data.files.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {m.noFiles}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 pr-4">{m.fileName}</th>
                    <th className="pb-2 pr-4">{m.fileSize}</th>
                    <th className="pb-2">{m.fileDate}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.files.map((file) => (
                    <tr key={file.name} className="border-b last:border-0">
                      <td className="py-2.5 pr-4 font-mono text-xs">
                        {file.name}
                      </td>
                      <td className="py-2.5 pr-4 text-muted-foreground">
                        {file.sizeHR}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {formatISODate(file.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ログ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="h-4 w-4" />
            {m.recentLogs}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.logs.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {m.noLogs}
            </p>
          ) : (
            <div className="max-h-96 space-y-1 overflow-y-auto">
              {data.logs.map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded px-2 py-1.5 font-mono text-xs ${
                    entry.level === "ERROR"
                      ? "bg-red-50 text-red-700"
                      : entry.level === "WARNING"
                        ? "bg-amber-50 text-amber-700"
                        : "text-muted-foreground"
                  }`}
                >
                  <span className="mt-0.5 shrink-0">
                    {entry.level === "ERROR" ? (
                      <XCircle className="h-3 w-3" />
                    ) : entry.level === "WARNING" ? (
                      <AlertTriangle className="h-3 w-3" />
                    ) : (
                      <Info className="h-3 w-3" />
                    )}
                  </span>
                  <span className="shrink-0">{entry.timestamp}</span>
                  <span className="break-all">{entry.message}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatTimestamp(ts: string): string {
  // "2025-01-01 03:00:30" → "01/01 03:00"
  const match = ts.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/)
  if (!match) return ts
  return `${match[2]}/${match[3]} ${match[4]}:${match[5]}`
}

function formatISODate(iso: string): string {
  try {
    const d = new Date(iso)
    const month = String(d.getMonth() + 1).padStart(2, "0")
    const day = String(d.getDate()).padStart(2, "0")
    const hour = String(d.getHours()).padStart(2, "0")
    const min = String(d.getMinutes()).padStart(2, "0")
    return `${month}/${day} ${hour}:${min}`
  } catch {
    return iso
  }
}
