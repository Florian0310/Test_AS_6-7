export type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

export const createInMemoryRateLimiter = (config: { windowMs: number; maxRequests: number }) => {
  const windowMs = Number.isFinite(config.windowMs) ? Math.max(1, Math.floor(config.windowMs)) : 600000
  const maxRequests = Number.isFinite(config.maxRequests) ? Math.max(1, Math.floor(config.maxRequests)) : 8
  const entries = new Map<string, { count: number; resetAt: number }>()

  const consume = (key: string): RateLimitResult => {
    const normalizedKey = key || 'anonymous'
    const now = Date.now()
    for (const [entryKey, value] of entries) {
      if (value.resetAt <= now) entries.delete(entryKey)
    }
    // A flood of unique keys must not exhaust process memory or reset active limits.
    if (!entries.has(normalizedKey) && entries.size >= 10000) {
      return { allowed: false, remaining: 0, resetAt: now + windowMs }
    }

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
