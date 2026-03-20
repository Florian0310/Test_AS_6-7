const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::tool.tool', {
  config: {
    find: {
      auth: false,
    },
    findOne: {
      auth: false,
    },
  },
});

