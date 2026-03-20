const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::category.category', ({ strapi }) => ({
  async find(ctx) {
    const categories = await strapi.entityService.findMany('api::category.category', {
      filters: {
        publishedAt: {
          $notNull: true,
        },
      },
      fields: ['name', 'slug'],
      sort: ['name:asc'],
      populate: {
        tools: {
          fields: ['id'],
          filters: {
            isActive: true,
            publishedAt: {
              $notNull: true,
            },
          },
        },
      },
    });

    const payload = categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      toolCount: Array.isArray(category.tools) ? category.tools.length : 0,
    }));

    return this.transformResponse(payload);
  },
}));

