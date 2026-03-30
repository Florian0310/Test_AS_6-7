import 'dotenv/config'

import { getPayload } from 'payload'
import config from '../../payload.config'
import { defaultCategories } from './defaultCategories'
import { defaultProducts } from './defaultProducts'

const runSeed = async () => {
  const payload = await getPayload({ config })

  for (const category of defaultCategories) {
    const existing = await payload.find({
      collection: 'categories',
      limit: 1,
      where: {
        slug: {
          equals: category.slug,
        },
      },
      overrideAccess: true,
    })

    if (!existing.docs.length) {
      await payload.create({
        collection: 'categories',
        overrideAccess: true,
        data: {
          name: category.name,
          slug: category.slug,
          sortOrder: category.sortOrder,
          isActive: true,
        },
      })
      payload.logger.info(`Kategorie angelegt: ${category.name}`)
    }
  }

  const categories = await payload.find({
    collection: 'categories',
    limit: 500,
    overrideAccess: true,
  })

  const categoryMap = new Map(categories.docs.map((category: any) => [category.slug, category.id]))

  for (const product of defaultProducts) {
    const existing = await payload.find({
      collection: 'products',
      limit: 1,
      where: {
        articleNumber: {
          equals: product.articleNumber,
        },
      },
      overrideAccess: true,
    })

    if (existing.docs.length) {
      continue
    }

    const categoryId = categoryMap.get(product.categorySlug)
    if (!categoryId) {
      payload.logger.warn(`Kategorie fuer Produkt nicht gefunden: ${product.title}`)
      continue
    }

    await payload.create({
      collection: 'products',
      overrideAccess: true,
      data: {
        articleNumber: product.articleNumber,
        title: product.title,
        slug: product.slug,
        category: categoryId,
        shortDescription: product.shortDescription,
        availabilityStatus: product.availabilityStatus,
        isActive: true,
        pricing: product.pricing,
      },
    })

    payload.logger.info(`Produkt angelegt: ${product.title}`)
  }

  payload.logger.info('Seed erfolgreich abgeschlossen.')
  process.exit(0)
}

runSeed().catch((error) => {
  console.error('Seed fehlgeschlagen:', error)
  process.exit(1)
})
