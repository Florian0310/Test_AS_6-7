import type { PayloadRequest } from 'payload'
import { createInMemoryRateLimiter } from './rateLimit'

export class PublicHttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
export const header = (req: PayloadRequest, key: string): string => {
  const headers = req.headers as Headers | Record<string, string> | undefined
  return headers && 'get' in headers && typeof headers.get === 'function'
    ? headers.get(key) || '' : String((headers as Record<string,string> | undefined)?.[key] || '')
}
export const clientKey = (req: PayloadRequest): string => {
  // Enable only when the edge proxy overwrites this header and direct backend access is blocked.
  if (process.env.TRUST_PROXY_HEADERS !== 'true') return 'shared'
  return header(req, 'x-real-ip').slice(0, 80) || 'shared'
}
const limiters = {
  request: createInMemoryRateLimiter({windowMs:600000,maxRequests:8}),
  pricing: createInMemoryRateLimiter({windowMs:60000,maxRequests:120}),
  contact: createInMemoryRateLimiter({windowMs:Number(process.env.CONTACT_RATE_LIMIT_WINDOW_MS || 600000),maxRequests:Number(process.env.CONTACT_RATE_LIMIT_MAX || 8)}),
}
export const guardPublicPost = (req: PayloadRequest, kind: keyof typeof limiters) => {
  const origin = header(req,'origin')
  const allowed = [process.env.FRONTEND_PUBLIC_URL, process.env.PAYLOAD_PUBLIC_SERVER_URL,
    ...(process.env.FRONTEND_ALLOWED_ORIGINS || '').split(','),
    ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:8000','http://127.0.0.1:8000','http://localhost:3001'])]
    .filter(Boolean).map(value => String(value).trim().replace(/\/$/,''))
  if (origin && !allowed.includes(origin)) throw new PublicHttpError(403,'Origin is not allowed.')
  const result = limiters[kind].consume(clientKey(req))
  if (!result.allowed) throw new PublicHttpError(429,'Too many requests. Please try again later.')
}
export const parsePublicBody = async <T = Record<string, unknown>>(req: PayloadRequest): Promise<T> => {
  if (Number(header(req,'content-length')) > 16384) throw new PublicHttpError(413,'Request is too large.')
  if (typeof req.text === 'function') {
    if (!/^application\/json(?:\s*;|$)/i.test(header(req,'content-type'))) throw new PublicHttpError(415,'JSON is required.')
    // Stream with a bound so chunked bodies cannot bypass the size limit.
    let raw = ''
    if (req.body && typeof req.body.getReader === 'function') {
      const reader = req.body.getReader(); const decoder = new TextDecoder(); let size = 0
      while (true) {
        const {done,value} = await reader.read(); if (done) break
        size += value.byteLength
        if (size > 16384) {await reader.cancel(); throw new PublicHttpError(413,'Request is too large.')}
        raw += decoder.decode(value,{stream:true})
      }
      raw += decoder.decode()
    } else raw = await req.text()
    try {return JSON.parse(raw) as T} catch {throw new PublicHttpError(400,'Invalid JSON.')}
  }
  try {
    return (typeof req.json === 'function' ? await req.json() : (req as unknown as {data?: unknown}).data || {}) as T
  } catch {throw new PublicHttpError(400,'Invalid JSON.')}
}
