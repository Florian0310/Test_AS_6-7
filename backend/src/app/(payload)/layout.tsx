import type { ReactNode } from 'react'
import '@payloadcms/next/css'

type Props = {
  children: ReactNode
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}
