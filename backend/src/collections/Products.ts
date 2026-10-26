import type { CollectionConfig } from 'payload'
import { isAuthenticated, isAuthenticatedOrActiveFilter } from '../utils/access'
import { slugFieldHook } from '../utils/slug'
import { englishFields } from '../utils/catalogLocale'

const resolveFrontendURL = () =>
  (
    process.env.FRONTEND_PREVIEW_URL ||
    process.env.FRONTEND_PUBLIC_URL ||
    'http://localhost:8000'
  ).replace(/\/$/, '')

const toProductPreviewURL = (rawSlug: unknown) => {
  const slug = String(rawSlug || '').trim()
  if (!slug) return null
  return `${resolveFrontendURL()}/sortiment/produkt-hilti-sf-6-a22.html?slug=${encodeURIComponent(slug)}`
}

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Produkt',
    plural: 'Produkte',
  },
  access: {
    read: isAuthenticatedOrActiveFilter,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Inhalte',
    defaultColumns: ['articleNumber', 'title', 'category', 'isActive', 'availabilityStatus', 'updatedAt'],
    preview: (doc) => toProductPreviewURL(doc?.slug),
    livePreview: {
      url: ({ data }) => toProductPreviewURL(data?.slug),
    },
  },
  fields: [
    englishFields('English product content'),
    {
      name: 'title',
      label: 'Titel',
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
        beforeValidate: [slugFieldHook('title')],
      },
    },
    {
      name: 'articleNumber',
      label: 'Artikelnummer',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      label: 'Kategorie',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'shortDescription',
      label: 'Kurzbeschreibung',
      type: 'textarea',
      required: true,
    },
    {
      name: 'longDescription',
      label: 'Langbeschreibung',
      type: 'richText',
    },
    {
      name: 'images',
      label: 'Produktbilder',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
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
    {
      name: 'availabilityStatus',
      label: 'Ver\u00fcgbarkeitsstatus',
      type: 'select',
      required: true,
      defaultValue: 'available',
      options: [
        {
          label: 'Ver\u00fcgbar',
          value: 'available',
        },
        {
          label: 'Begrenzt verf\u00fcgbar',
          value: 'limited',
        },
        {
          label: 'Aktuell nicht verf\u00fcgbar',
          value: 'unavailable',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'pricing',
      label: 'Preise und Tarife',
      type: 'group',
      fields: [
        {
          name: 'dailyPrice',
          label: 'Tarif I - Tagespreis (EUR)',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'threeDayPrice',
          label: 'Tarif II - 3-Tages-Preis (EUR)',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'weeklyPrice',
          label: 'Tarif III - Wochenpreis / 7 Tage (EUR)',
          type: 'number',
          required: true,
          min: 0,
        },
        {
          name: 'minimumRentalDays',
          label: 'Mindestmietdauer (Tage)',
          type: 'number',
          min: 1,
          defaultValue: 1,
        },
        {
          name: 'deposit',
          label: 'Kaution (EUR)',
          type: 'number',
          min: 0,
        },
        {
          name: 'cleaningFee',
          label: 'Reinigungsgeb\u00fchr (EUR)',
          type: 'number',
          min: 0,
        },
        {
          name: 'insuranceRequired',
          label: 'Ger\u00e4teversicherung verpflichtend',
          type: 'checkbox',
          defaultValue: true,
        },
        {
          name: 'insuranceRateOverride',
          label: 'Versicherungssatz Override (z. B. 0.10 f\u00fcr 10%)',
          type: 'number',
          min: 0,
          max: 1,
          admin: {
            description: 'Optional. Wenn leer, wird der globale Versicherungssatz verwendet.',
          },
        },
        {
          name: 'priceNote',
          label: 'Preisnotiz',
          type: 'textarea',
        },
        {
          name: 'consumableCostNote',
          label: 'Hinweis zu Treibstoff / Verschlei\u00df',
          type: 'textarea',
          defaultValue: 'Preise exklusive Treibstoff und Verschlei\u00dfkosten.',
        },
      ],
    },
    {
      name: 'specifications',
      label: 'Technische Daten',
      type: 'array',
      fields: [
        {
          name: 'key',
          label: 'Bezeichnung',
          type: 'text',
          required: true,
        },
        {
          name: 'value',
          label: 'Wert',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'seo',
      label: 'SEO (optional)',
      type: 'group',
      fields: [
        {
          name: 'metaTitle',
          label: 'Meta Title',
          type: 'text',
        },
        {
          name: 'metaDescription',
          label: 'Meta Description',
          type: 'textarea',
        },
      ],
    },
  ],
}
