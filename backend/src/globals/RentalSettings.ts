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
      label: 'Standard-Versicherungssatz (z. B. 0.10 fuer 10%)',
      type: 'number',
      required: true,
      defaultValue: 0.1,
      min: 0,
      max: 1,
    },
    {
      name: 'insuranceMandatory',
      label: 'Geraeteversicherung standardmaessig verpflichtend',
      type: 'checkbox',
      defaultValue: true,
    },
    {
      name: 'requestNotificationEmail',
      label: 'Empfaenger fuer Anfragen',
      type: 'email',
      required: true,
      defaultValue: 'office@allessaniert.at',
    },
    {
      name: 'priceDisclaimer',
      label: 'Preis-Hinweis',
      type: 'textarea',
      defaultValue:
        'Geraeteversicherung ist verpflichtend (10% der Miete). Preise exklusive Treibstoff und Verschleisskosten.',
    },
  ],
}
