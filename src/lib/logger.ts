/**
 * 構造化ロガー — Cloud Run / Cloud Logging 対応
 *
 * Cloud Run 上では JSON 形式でログを出力すると Cloud Logging が
 * 自動的に severity・メッセージ・メタデータを認識する。
 * ローカル開発では見やすいテキスト形式にフォールバック。
 */

const isProduction = process.env.NODE_ENV === "production"

type LogLevel = "INFO" | "WARNING" | "ERROR"

interface LogEntry {
  severity: LogLevel
  message: string
  /** コンポーネント / モジュール名 */
  component?: string
  [key: string]: unknown
}

function emit(entry: LogEntry) {
  if (isProduction) {
    // Cloud Logging JSON 形式
    const out = JSON.stringify({
      severity: entry.severity,
      message: entry.message,
      ...Object.fromEntries(
        Object.entries(entry).filter(([k]) => k !== "severity" && k !== "message")
      ),
      timestamp: new Date().toISOString(),
    })
    if (entry.severity === "ERROR") {
      process.stderr.write(out + "\n")
    } else {
      process.stdout.write(out + "\n")
    }
  } else {
    // 開発: 読みやすいテキスト
    const prefix = entry.component ? `[${entry.component}]` : ""
    const extra = Object.entries(entry)
      .filter(([k]) => !["severity", "message", "component"].includes(k))
    const extraStr = extra.length > 0 ? ` ${JSON.stringify(Object.fromEntries(extra))}` : ""

    if (entry.severity === "ERROR") {
      console.error(`${prefix} ${entry.message}${extraStr}`)
    } else if (entry.severity === "WARNING") {
      console.warn(`${prefix} ${entry.message}${extraStr}`)
    } else {
      console.info(`${prefix} ${entry.message}${extraStr}`)
    }
  }
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    emit({ severity: "INFO", message, ...meta })
  },
  warn(message: string, meta?: Record<string, unknown>) {
    emit({ severity: "WARNING", message, ...meta })
  },
  error(message: string, meta?: Record<string, unknown>) {
    emit({ severity: "ERROR", message, ...meta })
  },
}
