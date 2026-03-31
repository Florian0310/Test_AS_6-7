import type { GlobalConfig } from 'payload'

const resolveFrontendURL = () =>
  (
    process.env.FRONTEND_PREVIEW_URL ||
    process.env.FRONTEND_PUBLIC_URL ||
    'http://localhost:3000'
  ).replace(/\/$/, '')

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Website-Einstellungen',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    preview: () => `${resolveFrontendURL()}/`,
    livePreview: {
      url: ({ locale }) => {
        const localeKey = String(locale || '').toLowerCase()
        return localeKey.startsWith('en')
          ? `${resolveFrontendURL()}/en/`
          : `${resolveFrontendURL()}/`
      },
    },
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
          defaultValue: 'Schr\u00f6der - Alles Saniert | Werkzeugverleih und Forstarbeiten',
        },
        {
          name: 'metaDescriptionDe',
          label: 'Meta Description (DE)',
          type: 'textarea',
          defaultValue:
            'Werkzeugverleih und Dienstleistungen von Schr\u00f6der - Alles Saniert in Pernitz. Professionelle Maschinen, faire Tarife und Anfrage-Checkout ohne Online-Zahlung.',
        },
        {
          name: 'metaTitleEn',
          label: 'Meta Title (EN)',
          type: 'text',
          defaultValue: 'Schr\u00f6der - Alles Saniert | Tool Rental and Forestry Services',
        },
        {
          name: 'metaDescriptionEn',
          label: 'Meta Description (EN)',
          type: 'textarea',
          defaultValue:
            'Tool rental and services by Schr\u00f6der - Alles Saniert in Pernitz, Austria. Professional equipment, transparent rates and request-based checkout.',
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
    {
      name: 'catalog',
      label: 'Sortiment / Katalog',
      type: 'group',
      fields: [
        {
          name: 'headlineDe',
          label: '\u00dcberschrift Sortiment (DE)',
          type: 'text',
          defaultValue: 'Werkzeuge & Maschinen',
        },
        {
          name: 'headlineEn',
          label: 'Headline Catalog (EN)',
          type: 'text',
          defaultValue: 'Tools & Machines',
        },
        {
          name: 'introDe',
          label: 'Einleitung Sortiment (DE)',
          type: 'textarea',
          defaultValue: 'Alle Inhalte werden aus Payload CMS geladen. Sie k\u00f6nnen direkt nach Kategorien und Begriffen filtern.',
        },
        {
          name: 'introEn',
          label: 'Intro Catalog (EN)',
          type: 'textarea',
          defaultValue: 'All content is loaded from Payload CMS. You can filter by category and search terms directly.',
        },
        {
          name: 'searchPlaceholderDe',
          label: 'Suchfeld Placeholder (DE)',
          type: 'text',
          defaultValue: 'Werkzeug suchen...',
        },
        {
          name: 'searchPlaceholderEn',
          label: 'Search Placeholder (EN)',
          type: 'text',
          defaultValue: 'Search tools...',
        },
        {
          name: 'categoriesTitleDe',
          label: 'Titel Kategorien (DE)',
          type: 'text',
          defaultValue: 'Kategorien',
        },
        {
          name: 'categoriesTitleEn',
          label: 'Title Categories (EN)',
          type: 'text',
          defaultValue: 'Categories',
        },
        {
          name: 'productsTitleDe',
          label: 'Titel Produktliste (DE)',
          type: 'text',
          defaultValue: 'Produkte',
        },
        {
          name: 'productsTitleEn',
          label: 'Title Product List (EN)',
          type: 'text',
          defaultValue: 'Products',
        },
      ],
    },
  ],
}
