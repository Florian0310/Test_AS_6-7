import type { GlobalConfig } from 'payload'

export const ContactSettings: GlobalConfig = {
  slug: 'contact-settings',
  label: 'Kontakt-Einstellungen',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'legalCompanyName',
      label: 'Rechtlicher Name',
      type: 'text',
      required: true,
      defaultValue: 'Schroeder - Alles Saniert (Gesellschaft nach buergerlichem Recht)',
    },
    {
      name: 'brandName',
      label: 'Markenname',
      type: 'text',
      required: true,
      defaultValue: 'Alles Saniert',
    },
    {
      name: 'street',
      label: 'Strasse und Hausnummer',
      type: 'text',
      required: true,
      defaultValue: 'Fotzebenweg 3',
    },
    {
      name: 'postalCode',
      label: 'Postleitzahl',
      type: 'text',
      required: true,
      defaultValue: '2763',
    },
    {
      name: 'city',
      label: 'Ort',
      type: 'text',
      required: true,
      defaultValue: 'Pernitz',
    },
    {
      name: 'country',
      label: 'Land',
      type: 'text',
      required: true,
      defaultValue: 'Oesterreich',
    },
    {
      name: 'phone',
      label: 'Telefon',
      type: 'text',
      required: true,
      defaultValue: '+43 650 3021328',
    },
    {
      name: 'email',
      label: 'Kontakt-E-Mail',
      type: 'email',
      required: true,
      defaultValue: 'office@allessaniert.at',
    },
    {
      name: 'inquiryRecipientEmail',
      label: 'Empfaenger fuer Kontaktformulare',
      type: 'email',
      required: true,
      defaultValue: 'office@allessaniert.at',
    },
    {
      name: 'serviceDescriptionDe',
      label: 'Leistungsbeschreibung (DE)',
      type: 'textarea',
      defaultValue: 'Werkzeugverleih sowie Dienstleistungen inklusive Forstarbeiten.',
    },
    {
      name: 'serviceDescriptionEn',
      label: 'Service Description (EN)',
      type: 'textarea',
      defaultValue: 'Tool rental and service work including forestry support.',
    },
  ],
}
