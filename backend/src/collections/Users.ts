import type { CollectionConfig } from 'payload'
import { adminFieldAccess, adminOrSelf, isAdmin, isAdminUser, isCMSUser } from '../utils/access'
import { protectRoleAssignment, protectLastAdminChange, protectLastAdminDelete } from '../hooks/userAccess'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    maxLoginAttempts: 5,
    lockTime: 15 * 60 * 1000,
    tokenExpiration: 2 * 60 * 60,
    cookies: { secure: process.env.NODE_ENV === 'production', sameSite: 'Lax' },
  },
  access: {
    read: adminOrSelf,
    create: isAdmin,
    update: adminOrSelf,
    delete: isAdmin,
    admin: ({ req }) => isCMSUser(req.user),
  },
  hooks: {beforeOperation:[protectRoleAssignment],beforeChange:[protectLastAdminChange],beforeDelete:[protectLastAdminDelete]},
  labels: {
    singular: 'Benutzer',
    plural: 'Benutzer',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role', 'updatedAt'],
    group: 'Administration',
    hidden: ({user}) => !isAdminUser(user),
  },
  fields: [
    {
      name: 'role',
      label: 'Rolle',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [{label:'Administrator (Admin)',value:'admin'},{label:'Benutzer (User)',value:'user'}],
      access: {create:adminFieldAccess,update:adminFieldAccess},
      admin: {position:'sidebar',description:'Admins verwalten das gesamte CMS. User bearbeiten Produkte und nehmen Anfragen an.'},
    },
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
  ],
}
