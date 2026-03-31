import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Website-Einstellungen',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'siteName',
      label: 'Website-Name',
      type: 'text',
      required: true,
      defaultValue: 'Alles Saniert',
    },
    {
      name: 'websiteUrl',
      label: 'Website-URL',
      type: 'text',
      required: true,
      defaultValue: 'https://www.allessaniert.at',
    },
    {
      name: 'defaultLocale',
      label: 'Standardsprache',
      type: 'select',
      required: true,
      defaultValue: 'de',
      options: [
        { label: 'Deutsch', value: 'de' },
        { label: 'Englisch', value: 'en' },
      ],
    },
    {
      name: 'seo',
      label: 'SEO-Standards',
      type: 'group',
      fields: [
        {
          name: 'metaTitleDe',
          label: 'Meta Title (DE)',
          type: 'text',
          defaultValue: 'Schröder - Alles Saniert | Werkzeugverleih und Forstarbeiten',
        },
        {
          name: 'metaDescriptionDe',
          label: 'Meta Description (DE)',
          type: 'textarea',
          defaultValue:
            'Werkzeugverleih und Dienstleistungen von Schröder - Alles Saniert in Pernitz. Professionelle Maschinen, faire Tarife und Anfrage-Checkout ohne Online-Zahlung.',
        },
        {
          name: 'metaTitleEn',
          label: 'Meta Title (EN)',
          type: 'text',
          defaultValue: 'Schröder - Alles Saniert | Tool Rental and Forestry Services',
        },
        {
          name: 'metaDescriptionEn',
          label: 'Meta Description (EN)',
          type: 'textarea',
          defaultValue:
            'Tool rental and services by Schröder - Alles Saniert in Pernitz, Austria. Professional equipment, transparent rates and request-based checkout.',
        },
        {
          name: 'robotsPolicy',
          label: 'Robots-Richtlinie',
          type: 'select',
          defaultValue: 'index_follow',
          options: [
            { label: 'index, follow', value: 'index_follow' },
            { label: 'noindex, nofollow', value: 'noindex_nofollow' },
          ],
        },
      ],
    },
    {
      name: 'tracking',
      label: 'Tracking (nur mit Consent verwenden)',
      type: 'group',
      fields: [
        {
          name: 'gtmId',
          label: 'Google Tag Manager ID',
          type: 'text',
        },
        {
          name: 'ga4MeasurementId',
          label: 'Google Analytics 4 Measurement ID',
          type: 'text',
        },
      ],
    },
    {
      name: 'homepage',
      label: 'Startseite',
      type: 'group',
      fields: [
        {
          name: 'popularSectionTitleDe',
          label: 'Titel Beliebte Produkte (DE)',
          type: 'text',
          defaultValue: 'Beliebte Produkte',
        },
        {
          name: 'popularSectionSubtitleDe',
          label: 'Untertitel Beliebte Produkte (DE)',
          type: 'text',
          defaultValue: 'Die Favoriten unserer Kunden diese Woche.',
        },
        {
          name: 'popularSectionTitleEn',
          label: 'Title Popular Products (EN)',
          type: 'text',
          defaultValue: 'Popular Products',
        },
        {
          name: 'popularSectionSubtitleEn',
          label: 'Subtitle Popular Products (EN)',
          type: 'text',
          defaultValue: 'Top picks from our customers this week.',
        },
        {
          name: 'popularProducts',
          label: 'Beliebte Produkte (Auswahl)',
          type: 'relationship',
          relationTo: 'products',
          hasMany: true,
          admin: {
            description:
              'Diese Produkte werden auf der Startseite als "Beliebte Produkte" angezeigt. Reihenfolge bleibt erhalten.',
          },
        },
      ],
    },
  ],
}
