import type { CollectionConfig } from 'payload'
import { isAdmin, isAuthenticated } from '../utils/access'

const fallbackAltFromFilename = (raw: string) =>
  raw
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

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
    delete: isAdmin,
  },
  upload: {
    staticDir: process.env.MEDIA_DIR || 'media',
    imageSizes: [
      {
        name: 'thumb',
        width: 320,
        height: 320,
        crop: 'center',
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
      {
        name: 'card',
        width: 800,
        height: 600,
        crop: 'center',
        withoutEnlargement: true,
        formatOptions: { format: 'webp', options: { quality: 80 } },
      },
    ],
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
  admin: {
    useAsTitle: 'alt',
    group: 'Inhalte',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  hooks: {
    beforeValidate: [
      ({ data, req }) => {
        const nextData = { ...(data || {}) }
        const currentAlt = String(nextData.alt || '').trim()

        if (currentAlt) {
          nextData.alt = currentAlt
          return nextData
        }

        const filenameFromPayload = String(nextData.filename || '').trim()
        const filenameFromUpload = String(req?.file?.name || '').trim()
        const fallback = fallbackAltFromFilename(filenameFromPayload || filenameFromUpload)

        nextData.alt = fallback || 'Bild'
        return nextData
      },
    ],
  },
  fields: [
    {
      name: 'alt',
      label: 'Alternativtext',
      type: 'text',
      required: false,
    },
    {
      name: 'caption',
      label: 'Bildunterschrift',
      type: 'textarea',
    },
  ],
}
