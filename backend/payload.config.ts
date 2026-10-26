import 'dotenv/config'

import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdirSync } from 'node:fs'
import { buildConfig } from 'payload'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'

import { Users } from './src/collections/Users'
import { Media } from './src/collections/Media'
import { Categories } from './src/collections/Categories'
import { Products } from './src/collections/Products'
import { Requests } from './src/collections/Requests'
import { RentalSettings } from './src/globals/RentalSettings'
import { SiteSettings } from './src/globals/SiteSettings'
import { ContactSettings } from './src/globals/ContactSettings'
import { LegalSettings } from './src/globals/LegalSettings'
import { publicEndpoints } from './src/endpoints/publicEndpoints'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const dataDir = path.resolve(dirname, 'data')
mkdirSync(dataDir, { recursive: true })

const databaseURL = process.env.DATABASE_URI || 'file:./data/payload.sqlite'
const frontendURL = process.env.FRONTEND_PUBLIC_URL || 'http://localhost:8000'
const adminEmail = process.env.PAYLOAD_ADMIN_EMAIL
const adminPassword = process.env.PAYLOAD_ADMIN_PASSWORD
const production = process.env.NODE_ENV === 'production'
const secret = process.env.PAYLOAD_SECRET || ''
if (!secret || (production && (secret.length < 32 || /change-me|example|development/i.test(secret)))) {
  throw new Error('PAYLOAD_SECRET must be a strong, unique secret (at least 32 characters in production).')
}

const normalizedEnvOrigins = (process.env.FRONTEND_ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const devOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://localhost:8000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:8000',
]

const allowedFrontendOrigins = Array.from(
  new Set([frontendURL, ...(production ? [] : devOrigins), ...normalizedEnvOrigins].filter(origin => origin && origin !== 'null')),
)

export default buildConfig({
  secret,
  upload: { limits: { fileSize: 8 * 1024 * 1024 }, requestSizeLimit: 10 * 1024 * 1024 },
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3001',
  sharp,
  editor: lexicalEditor(),
  db: sqliteAdapter({
    push: process.env.NODE_ENV !== 'production',
    client: {
      url: databaseURL,
    },
  }),
  collections: [Users, Media, Categories, Products, Requests],
  globals: [RentalSettings, SiteSettings, ContactSettings, LegalSettings],
  endpoints: publicEndpoints,
  routes: {
    api: '/api',
    admin: '/admin',
  },
  cors: allowedFrontendOrigins,
  csrf: allowedFrontendOrigins,
  admin: {
    user: Users.slug,
    components: {
      graphics: {
        Logo: './components/admin/BrandLogo#BrandLogo',
        Icon: './components/admin/BrandIcon#BrandIcon',
      },
      beforeDashboard: ['./components/admin/DashboardIntro#DashboardIntro'],
      afterDashboard: ['./components/admin/DashboardStats#DashboardStats'],
    },
    importMap: {
      baseDir: path.resolve(dirname, 'src'),
    },
    meta: {
      titleSuffix: ' | Alles Saniert',
    },
  },
  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },
  onInit: async (payload) => {
    // Bootstrap is an explicit one-time operation. Never create a known default account.
    if (process.env.BOOTSTRAP_ADMIN !== 'true') {
      if (production) {
        const users = await payload.find({collection:'users',limit:1,depth:0,overrideAccess:true})
        if (!users.docs.length) throw new Error('Initialize the administrator explicitly before serving production traffic.')
      }
      return
    }
    if (!adminEmail || !adminPassword || adminPassword.length < 16 || /changeme|password|example/i.test(adminPassword)) {
      throw new Error('Admin bootstrap requires an explicit email and a strong password of at least 16 characters.')
    }
    const existing = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: adminEmail,
        },
      },
      limit: 1,
      overrideAccess: true,
    })

    if (!existing.docs.length) {
      await payload.create({
        collection: 'users',
        overrideAccess: true,
        data: {
          email: adminEmail,
          password: adminPassword,
          name: 'Admin',
        },
      })
      payload.logger.info(`Admin-Benutzer erstellt: ${adminEmail}`)
    }

  },
})
