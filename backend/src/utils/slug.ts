import slugify from 'slugify'
import type { FieldHook } from 'payload'

export const createSlug = (value: string): string =>
  slugify(value || '', {
    lower: true,
    strict: true,
    trim: true,
    locale: 'de',
  })

export const slugFieldHook = (sourceField: string): FieldHook => ({ value, data }) => {
  const explicitValue = typeof value === 'string' ? value.trim() : ''

  if (explicitValue) {
    return createSlug(explicitValue)
  }

  const sourceValue = typeof data?.[sourceField] === 'string' ? data[sourceField].trim() : ''
  return sourceValue ? createSlug(sourceValue) : explicitValue
}