import type { CollectionConfig } from 'payload'
import { isAuthenticated, isAuthenticatedOrActiveFilter } from '../utils/access'
import { slugFieldHook } from '../utils/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Kategorie',
    plural: 'Kategorien',
  },
  access: {
    read: isAuthenticatedOrActiveFilter,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'sortOrder', 'isActive', 'updatedAt'],
  },
  fields: [
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