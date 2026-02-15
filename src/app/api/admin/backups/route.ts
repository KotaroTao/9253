import { exec } from "child_process"
import { readdir, readFile, stat } from "fs/promises"
import { join } from "path"
import { requireRole, isAuthError } from "@/lib/auth-helpers"
import { successResponse, errorResponse } from "@/lib/api-helpers"

const BACKUP_DIR = process.env.BACKUP_DIR || "/root/backups"
const BACKUP_SCRIPT = process.env.BACKUP_SCRIPT || "/root/backup_mieru.sh"
const BACKUP_LOG = join(BACKUP_DIR, "backup.log")

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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function parseLogLine(line: string): LogEntry | null {
  const match = line.match(
    /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (INFO|WARNING|ERROR): (.+)$/
  )
  if (!match) return null
  return {
    timestamp: match[1],
    level: match[2] as LogEntry["level"],
    message: match[3],
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/**
 * GET /api/admin/backups
 * バックアップ状況・ファイル一覧・ログを取得
 */
export async function GET() {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  try {
    const scriptExists = await fileExists(BACKUP_SCRIPT)
    const dirExists = await fileExists(BACKUP_DIR)

    // バックアップファイル一覧
    const files: BackupFile[] = []
    if (dirExists) {
      const entries = await readdir(BACKUP_DIR).catch(() => [])
      for (const entry of entries) {
        if (!entry.endsWith(".tar.gz")) continue
        try {
          const filePath = join(BACKUP_DIR, entry)
          const fileStat = await stat(filePath)
          files.push({
            name: entry,
            size: fileStat.size,
            sizeHR: formatBytes(fileStat.size),
            createdAt: fileStat.mtime.toISOString(),
          })
        } catch {
          // skip unreadable files
        }
      }
      files.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    }

    // ログ取得（最新50行）
    const logs: LogEntry[] = []
    if (await fileExists(BACKUP_LOG)) {
      try {
        const logContent = await readFile(BACKUP_LOG, "utf-8")
        const lines = logContent.trim().split("\n")
        const recentLines = lines.slice(-50)
        for (const line of recentLines) {
          const entry = parseLogLine(line)
          if (entry) logs.push(entry)
        }
        logs.reverse()
      } catch {
        // log unreadable
      }
    }

    // 最終バックアップ情報をログから取得
    let lastBackup: { timestamp: string; dbSize: string; uploadsSize: string } | null = null
    if (logs.length > 0) {
      // logs are reversed (newest first), find the most recent OK line
      for (const entry of logs) {
        const okMatch = entry.message.match(
          /^OK: Backup completed \(DB: (.+), Uploads: (.+)\)$/
        )
        if (okMatch) {
          lastBackup = {
            timestamp: entry.timestamp,
            dbSize: okMatch[1],
            uploadsSize: okMatch[2],
          }
          break
        }
      }
    }

    // ディスク空き容量
    let diskFree: string | null = null
    try {
      const dfOutput = await new Promise<string>((resolve, reject) => {
        exec(`df -h ${BACKUP_DIR} 2>/dev/null | tail -1 | awk '{print $4}'`, (err, stdout) => {
          if (err) reject(err)
          else resolve(stdout.trim())
        })
      })
      if (dfOutput) diskFree = dfOutput
    } catch {
      // unable to get disk info
    }

    return successResponse({
      configured: scriptExists,
      backupDir: BACKUP_DIR,
      scriptPath: BACKUP_SCRIPT,
      files,
      logs,
      lastBackup,
      diskFree,
    })
  } catch {
    return errorResponse("バックアップ情報の取得に失敗しました", 500)
  }
}

/**
 * POST /api/admin/backups
 * 手動バックアップを実行
 */
export async function POST() {
  const authResult = await requireRole("system_admin")
  if (isAuthError(authResult)) return authResult

  const scriptExists = await fileExists(BACKUP_SCRIPT)
  if (!scriptExists) {
    return errorResponse(
      "バックアップスクリプトが見つかりません: " + BACKUP_SCRIPT,
      404
    )
  }

  try {
    const result = await new Promise<{ stdout: string; stderr: string }>(
      (resolve, reject) => {
        exec(
          BACKUP_SCRIPT,
          { timeout: 5 * 60 * 1000 },
          (err, stdout, stderr) => {
            if (err) reject(err)
            else resolve({ stdout, stderr })
          }
        )
      }
    )

    return successResponse({
      success: true,
      output: result.stdout || "",
    })
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "バックアップの実行に失敗しました"
    return errorResponse(message, 500)
  }
}
