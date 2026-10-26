import type { CollectionConfig } from 'payload'
import { isAdmin, isAdminUser, isAuthenticatedOrActiveFilter } from '../utils/access'
import { slugFieldHook } from '../utils/slug'
import { englishFields } from '../utils/catalogLocale'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Kategorie',
    plural: 'Kategorien',
  },
  access: {
    read: isAuthenticatedOrActiveFilter,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  admin: {
    useAsTitle: 'name',
    group: 'Inhalte',
    hidden: ({user}) => !isAdminUser(user),
    defaultColumns: ['name', 'slug', 'sortOrder', 'isActive', 'updatedAt'],
  },
  fields: [
    englishFields('English category content'),
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [slugFieldHook('name')],
      },
    },
    {
      name: 'description',
      label: 'Beschreibung',
      type: 'textarea',
    },
    {
      name: 'sortOrder',
      label: 'Sortierung',
      type: 'number',
      defaultValue: 100,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'isActive',
      label: 'Aktiv',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
