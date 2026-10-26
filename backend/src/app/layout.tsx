import type { ReactNode } from 'react'
import '@payloadcms/next/css'
import './payload-fallback.css'
import './admin.css'
import config from '../../payload.config'
import { RootLayout as PayloadRootLayout } from '@payloadcms/next/layouts'

import { importMap } from './admin/importMap'
import { serverFunction } from './serverFunction'

type Props = {
  readonly children: ReactNode
}

export default function RootLayout({ children }: Props) {
  return PayloadRootLayout({
    children,
    config: Promise.resolve(config),
    importMap,
    serverFunction,
  })
}
