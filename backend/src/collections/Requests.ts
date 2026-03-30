import type { CollectionConfig, FieldHook } from 'payload'
import { isAuthenticated } from '../utils/access'

const requestNumberHook: FieldHook = ({ value }) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  const now = new Date()
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, '0')}${String(now.getUTCDate()).padStart(2, '0')}${String(now.getUTCHours()).padStart(2, '0')}${String(now.getUTCMinutes()).padStart(2, '0')}${String(now.getUTCSeconds()).padStart(2, '0')}`

  return `ANF-${stamp}`
}

export const Requests: CollectionConfig = {
  slug: 'requests',
  labels: {
    singular: 'Anfrage',
    plural: 'Anfragen',
  },
  access: {
    read: isAuthenticated,
    create: isAuthenticated,
    update: isAuthenticated,
    delete: isAuthenticated,
  },
  admin: {
    useAsTitle: 'requestNumber',
    defaultColumns: ['requestNumber', 'status', 'customerName', 'customerEmail', 'createdAt'],
  },
  fields: [
    {
      name: 'requestNumber',
      label: 'Anfragenummer',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      hooks: {
        beforeValidate: [requestNumberHook],
      },
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [
        { label: 'Neu', value: 'new' },
        { label: 'In Bearbeitung', value: 'in_progress' },
        { label: 'Beantwortet', value: 'answered' },
        { label: 'Angenommen', value: 'accepted' },
        { label: 'Abgelehnt', value: 'rejected' },
        { label: 'Abgeschlossen', value: 'completed' },
      ],
    },
    {
      name: 'product',
      label: 'Produkt',
      type: 'relationship',
      relationTo: 'products',
      required: true,
    },
    {
      name: 'productSnapshot',
      label: 'Produkt-Snapshot',
      type: 'group',
      fields: [
        { name: 'title', label: 'Titel', type: 'text', required: true },
        { name: 'slug', label: 'Slug', type: 'text', required: true },
        { name: 'articleNumber', label: 'Artikelnummer', type: 'text', required: true },
        {
          name: 'prices',
          label: 'Preisstand zum Anfragezeitpunkt',
          type: 'group',
          fields: [
            { name: 'dailyPrice', label: 'Tagespreis', type: 'number', required: true },
            { name: 'threeDayPrice', label: '3-Tages-Preis', type: 'number', required: true },
            { name: 'weeklyPrice', label: 'Wochenpreis', type: 'number', required: true },
          ],
        },
      ],
    },
    { name: 'customerName', label: 'Name', type: 'text', required: true },
    { name: 'customerEmail', label: 'E-Mail', type: 'email', required: true },
    { name: 'customerPhone', label: 'Telefon', type: 'text' },
    { name: 'rentalStart', label: 'Mietbeginn', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'rentalEnd', label: 'Mietende', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
    { name: 'rentalDays', label: 'Miettage', type: 'number', min: 1 },
    {
      name: 'pricingSummary',
      label: 'Preiszusammenfassung',
      type: 'json',
      required: true,
    },
    {
      name: 'message',
      label: 'Nachricht',
      type: 'textarea',
    },
    {
      name: 'emailResult',
      label: 'E-Mail-Versand',
      type: 'json',
      admin: {
        readOnly: true,
      },
    },
  ],
}