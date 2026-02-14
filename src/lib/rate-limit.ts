type RateLimitEntry = {
  count: number
  resetAt: number
}

type RateLimitOptions = {
  windowMs: number
  maxRequests: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 86400000 // 24h
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 3

function cleanupExpired(now: number) {
  if (rateLimitMap.size > 10000) {
    rateLimitMap.forEach((val, key) => {
      if (val.resetAt < now) rateLimitMap.delete(key)
    })
  }
}

export function checkRateLimit(
  identifier: string,
  options?: RateLimitOptions
): {
  allowed: boolean
  remaining: number
} {
  const windowMs = options?.windowMs ?? WINDOW_MS
  const maxRequests = options?.maxRequests ?? MAX_REQUESTS
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  cleanupExpired(now)

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
