import { APIError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type CollectionBeforeOperationHook } from 'payload'
import type { User } from '../payload-types'
import { isAdminUser } from '../utils/access'

export const protectRoleAssignment: CollectionBeforeOperationHook<'users'> = ({args, operation, overrideAccess, req}) => {
  if (overrideAccess || isAdminUser(req.user) || !['create','update'].includes(operation)) return args
  if ('data' in args && args.data && 'role' in args.data && args.data.role !== req.user?.role) {
    throw new APIError('Nur Administratoren dürfen Rollen zuweisen.', 403)
  }
  return args
}

async function requireAnotherAdmin(req: Parameters<CollectionBeforeDeleteHook>[0]['req']) {
  const result = await req.payload.count({collection:'users',where:{role:{equals:'admin'}},req,overrideAccess:true})
  if (result.totalDocs <= 1) throw new APIError('Mindestens ein Administratorkonto muss erhalten bleiben.', 403)
}
export const protectLastAdminChange: CollectionBeforeChangeHook<User> = async ({data,originalDoc,req}) => {
  if (originalDoc?.role === 'admin' && data.role && data.role !== 'admin') await requireAnotherAdmin(req)
  return data
}
export const protectLastAdminDelete: CollectionBeforeDeleteHook = async ({id,req}) => {
  const user = await req.payload.findByID({collection:'users',id,depth:0,req,overrideAccess:true})
  if (user.role === 'admin') await requireAnotherAdmin(req)
}
