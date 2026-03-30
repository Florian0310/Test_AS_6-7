import type { CollectionConfig } from 'payload'
import { isAuthenticated } from '../utils/access'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: {
    singular: 'Medium',
    plural: 'Medien',
  },
  access: {
    read: () => true,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  upload: {
    staticDir: 'media',
    imageSizes: [
      {
        name: 'thumb',
        width: 320,
        height: 320,
        crop: 'center',
      },
      {
        name: 'card',
        width: 800,
        height: 600,
        crop: 'center',
      },
    ],
    mimeTypes: ['image/*'],
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  fields: [
    {
      name: 'alt',
      label: 'Alternativtext',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      label: 'Bildunterschrift',
      type: 'textarea',
    },
  ],
}