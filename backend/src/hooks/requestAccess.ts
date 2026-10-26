import { APIError, type CollectionBeforeOperationHook } from 'payload'
import { isAdminUser, isCMSUser } from '../utils/access'

// Check the original operation data before Payload silently discards protected fields.
export const restrictRequestUpdate: CollectionBeforeOperationHook<'requests'> = ({args,operation,overrideAccess,req}) => {
  if (overrideAccess || isAdminUser(req.user) || operation !== 'update' || !isCMSUser(req.user)) return args
  if (!('data' in args) || !args.data || Object.keys(args.data).some(key => key !== 'status') || args.data.status !== 'accepted') {
    throw new APIError('Benutzer dürfen Anfragen ausschließlich annehmen.',403)
  }
  return args
}
