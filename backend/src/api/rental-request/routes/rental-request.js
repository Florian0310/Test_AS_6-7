const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::rental-request.rental-request', {
  config: {
    create: {
      auth: false,
    },
  },
});

