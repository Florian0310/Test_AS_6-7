import { withPayload } from '@payloadcms/next/withPayload'
import { fileURLToPath } from 'node:url'

const frontendOrigin = new URL(process.env.FRONTEND_PREVIEW_URL || process.env.FRONTEND_PUBLIC_URL || 'http://localhost:8000').origin

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: fileURLToPath(new URL('.', import.meta.url)),
  outputFileTracingIncludes: { '/*': ['./node_modules/@img/sharp-*/**/*', './node_modules/@libsql/**/*'] },
  outputFileTracingExcludes: { '/*': ['./.env', './.env.*', './data/**/*', './media/**/*'] },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          ...(process.env.NODE_ENV === 'production' ? [{key: 'Strict-Transport-Security', value: 'max-age=31536000'}] : []),
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === 'production' ? '' : " 'unsafe-eval'") + "; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'" + (process.env.NODE_ENV === 'production' ? '' : ' ws://localhost:3001') + "; frame-src 'self' " + frontendOrigin + "; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default withPayload(nextConfig)
