'use server'

import type { ServerFunctionClient } from 'payload'

import config from '../../payload.config'
import { handleServerFunctions } from '@payloadcms/next/layouts'

import { importMap } from './admin/importMap'

export const serverFunction: ServerFunctionClient = async (args) =>
  handleServerFunctions({
    ...args,
    config: Promise.resolve(config),
    importMap,
  })
