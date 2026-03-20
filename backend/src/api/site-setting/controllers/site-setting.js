const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::site-setting.site-setting', ({ strapi }) => ({
  async find(ctx) {
    const data = await strapi.entityService.findMany('api::site-setting.site-setting', {
      populate: {
        heroImage: {
          fields: ['url', 'alternativeText'],
        },
        legal: true,
      },
      publicationState: 'live',
    });

    return this.transformResponse(data || {});
  },
}));

