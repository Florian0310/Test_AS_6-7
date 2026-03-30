import type { Access } from 'payload'

export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

export const isAuthenticatedOrActiveFilter: Access = ({ req }) => {
  if (req.user) {
    return true
  }

  return {
    isActive: {
      equals: true,
    },
  }
}