type RateLimitEntry = {
  count: number
  resetAt: number
}

/** 用途別のレート制限プリセット */
export const RATE_LIMIT_PRESETS = {
  /** 新規登録: 1時間に5回 */
  register: { windowMs: 3_600_000, maxRequests: 5 },
  /** メール認証再送: 1時間に3回 */
  resendVerification: { windowMs: 3_600_000, maxRequests: 3 },
  /** ログイン失敗: 15分に10回 */
  loginFailed: { windowMs: 900_000, maxRequests: 10 },
  /** アンケート提出: 1分に30回（同一IP） */
  surveySubmit: { windowMs: 60_000, maxRequests: 30 },
} as const

type RateLimitPreset = keyof typeof RATE_LIMIT_PRESETS

const rateLimitMap = new Map<string, RateLimitEntry>()

/** エントリ数上限 — 超過時に期限切れエントリを掃除 */
const MAX_ENTRIES = 10_000

/** 定期クリーンアップ間隔 (5分) */
const CLEANUP_INTERVAL_MS = 300_000
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS && rateLimitMap.size < MAX_ENTRIES) return
  lastCleanup = now
  rateLimitMap.forEach((val, key) => {
    if (val.resetAt < now) rateLimitMap.delete(key)
  })
}

/**
 * レート制限チェック（用途別プリセット対応）
 *
 * @param identifier - 一意な識別子（例: `register:${ip}`）
 * @param preset - 用途プリセット名。省略時は環境変数 or デフォルト値
 */
export function checkRateLimit(
  identifier: string,
  preset?: RateLimitPreset,
): { allowed: boolean; remaining: number } {
  const now = Date.now()

  // プリセットが指定されていれば使用、なければ環境変数→フォールバック
  const windowMs = preset
    ? RATE_LIMIT_PRESETS[preset].windowMs
    : Number(process.env.RATE_LIMIT_WINDOW_MS) || 3_600_000
  const maxRequests = preset
    ? RATE_LIMIT_PRESETS[preset].maxRequests
    : Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 10

  // 定期クリーンアップ
  cleanupExpired()

  const entry = rateLimitMap.get(identifier)

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count }
}
