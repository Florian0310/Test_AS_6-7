const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::site-setting.site-setting', {
  config: {
    find: {
      auth: false,
    },
  },
});

