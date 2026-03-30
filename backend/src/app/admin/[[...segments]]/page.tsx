import type { Metadata } from 'next'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import config from '../../../../payload.config'
import { importMap } from '../importMap'

type PageArgs = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const dynamic = 'force-dynamic'

export const generateMetadata = ({ params, searchParams }: PageArgs): Promise<Metadata> =>
  generatePageMetadata({
    config: Promise.resolve(config),
    params,
    searchParams,
  })

const Page = ({ params, searchParams }: PageArgs) =>
  RootPage({
    config: Promise.resolve(config),
    importMap,
    params,
    searchParams,
  })

export default Page
