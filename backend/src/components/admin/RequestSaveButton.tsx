'use client'
import { SaveButton, useAuth } from '@payloadcms/ui'
import { isAdminUser } from '../../utils/access'
export const RequestSaveButton = () => isAdminUser(useAuth().user) ? <SaveButton /> : null
