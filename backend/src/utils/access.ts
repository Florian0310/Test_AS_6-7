import type { Access, FieldAccess } from 'payload'

const roleOf = (user: unknown): unknown => user && typeof user === 'object' && 'role' in user ? user.role : undefined
export const isAdminUser = (user: unknown): boolean => roleOf(user) === 'admin'
export const isCMSUser = (user: unknown): boolean => isAdminUser(user) || roleOf(user) === 'user'
export const isAdmin: Access = ({ req }) => isAdminUser(req.user)
export const adminFieldAccess: FieldAccess = ({ req }) => isAdminUser(req.user)
export const isAuthenticated: Access = ({ req }) => isCMSUser(req.user)
export const adminOrSelf: Access = ({ req }) => isAdminUser(req.user) || (isCMSUser(req.user) ? {id: {equals: req.user!.id}} : false)

export const isAuthenticatedOrActiveFilter: Access = ({ req }) => {
  if (isCMSUser(req.user)) {
    return true
  }

  return {
    isActive: {
      equals: true,
    },
  }
}
