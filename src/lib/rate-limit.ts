type RateLimitEntry = {
  count: number
  resetAt: number
}

const rateLimitMap = new Map<string, RateLimitEntry>()

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 86400000 // 24h
const MAX_REQUESTS = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 3

export function checkRateLimit(identifier: string): {
  allowed: boolean
  remaining: number
} {
  const now = Date.now()
  const entry = rateLimitMap.get(identifier)

  // Clean up expired entries when map grows large
  if (rateLimitMap.size > 10000) {
    rateLimitMap.forEach((val, key) => {
      if (val.resetAt < now) rateLimitMap.delete(key)
    })
  }

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: MAX_REQUESTS - 1 }
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: MAX_REQUESTS - entry.count }
}
