export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

export const createInMemoryRateLimiter = (config: { windowMs: number; maxRequests: number }) => {
  const windowMs = Math.max(1, Math.floor(config.windowMs))
  const maxRequests = Math.max(1, Math.floor(config.maxRequests))
  const entries = new Map<string, { count: number; resetAt: number }>()

  const consume = (key: string): RateLimitResult => {
    const normalizedKey = key || 'anonymous'
    const now = Date.now()

    const current = entries.get(normalizedKey)

    if (!current || current.resetAt <= now) {
      const resetAt = now + windowMs
      entries.set(normalizedKey, { count: 1, resetAt })
      return {
        allowed: true,
        remaining: Math.max(maxRequests - 1, 0),
        resetAt,
      }
    }

    current.count += 1
    const allowed = current.count <= maxRequests

    return {
      allowed,
      remaining: allowed ? Math.max(maxRequests - current.count, 0) : 0,
      resetAt: current.resetAt,
    }
  }

  return {
    consume,
  }
}
