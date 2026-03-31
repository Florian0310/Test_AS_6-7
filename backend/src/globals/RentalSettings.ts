import type { GlobalConfig } from 'payload'

export const RentalSettings: GlobalConfig = {
  slug: 'rental-settings',
  label: 'Vermietungs-Einstellungen',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'companyName',
      label: 'Firmenname',
      type: 'text',
      defaultValue: 'Alles Saniert',
    },
    {
      name: 'heroHeadline',
      label: 'Hero-Headline (Startseite)',
      type: 'text',
    },
    {
      name: 'heroText',
      label: 'Hero-Text (Startseite)',
      type: 'textarea',
    },
    {
      name: 'defaultInsuranceRate',
      label: 'Standard-Versicherungssatz (z. B. 0.10 für 10%)',
      type: 'number',
      required: true,
      defaultValue: 0.1,
      min: 0,
      max: 1,
    },
    {
      name: 'insuranceMandatory',
      label: 'Geräteversicherung standardmäßig verpflichtend',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'requestNotificationEmail',
      label: 'Empfänger für Anfragen',
      type: 'email',
      required: true,
      defaultValue: 'office@allessaniert.at',
    },
    {
      name: 'priceDisclaimer',
      label: 'Preis-Hinweis',
      type: 'textarea',
      defaultValue:
        'Geräteversicherung ist verpflichtend (10% der Miete). Preise exklusive Treibstoff und Verschleißkosten.',
    },
  ],
}
