const { createCoreController } = require('@strapi/strapi').factories;

const formatTool = (tool) => {
  const imageList = Array.isArray(tool.images)
    ? tool.images.map((image) => ({
        id: image.id,
        url: image.url,
        alternativeText: image.alternativeText || tool.name,
      }))
    : [];

  return {
    id: tool.id,
    documentId: tool.documentId,
    name: tool.name,
    slug: tool.slug,
    shortDescription: tool.shortDescription,
    description: tool.description,
    dailyPrice: tool.dailyPrice,
    deposit: tool.deposit,
    quantityTotal: tool.quantityTotal,
    quantityAvailable: tool.quantityAvailable,
    location: tool.location,
    tags: tool.tags || [],
    isActive: tool.isActive,
    category: tool.category
      ? {
          id: tool.category.id,
          name: tool.category.name,
          slug: tool.category.slug,
        }
      : null,
    images: imageList,
    seo: tool.seo || null,
  };
};

module.exports = createCoreController('api::tool.tool', ({ strapi }) => ({
  async find(ctx) {
    const categorySlug = typeof ctx.query.category === 'string' ? ctx.query.category.trim() : '';
    const searchValue = typeof ctx.query.search === 'string' ? ctx.query.search.trim() : '';

    const filters = {
      isActive: true,
      publishedAt: {
        $notNull: true,
      },
    };

    if (categorySlug) {
      filters.category = {
        slug: categorySlug,
      };
    }

    if (searchValue) {
      filters.$or = [
        { name: { $containsi: searchValue } },
        { shortDescription: { $containsi: searchValue } },
      ];
    }

    const tools = await strapi.entityService.findMany('api::tool.tool', {
      filters,
      sort: ['name:asc'],
      populate: {
        images: {
          fields: ['url', 'alternativeText'],
        },
        category: {
          fields: ['name', 'slug'],
        },
        seo: {
          populate: {
            ogImage: {
              fields: ['url', 'alternativeText'],
            },
          },
        },
      },
    });

    const availabilityService = strapi.service('api::rental-request.availability');
    const today = new Date();

    const data = await Promise.all(
      tools.map(async (tool) => {
        const available = await availabilityService.getAvailabilityForTool(tool.id, today, today);
        return {
          ...formatTool(tool),
          calculatedAvailability: available,
        };
      })
    );

    return this.transformResponse(data);
  },

  async findOne(ctx) {
    const toolId = Number(ctx.params.id);

    if (!Number.isFinite(toolId) || toolId <= 0) {
      return ctx.badRequest('Ungueltige Werkzeug-ID.');
    }

    const tool = await strapi.entityService.findOne('api::tool.tool', toolId, {
      populate: {
        images: {
          fields: ['url', 'alternativeText'],
        },
        category: {
          fields: ['name', 'slug'],
        },
        seo: {
          populate: {
            ogImage: {
              fields: ['url', 'alternativeText'],
            },
          },
        },
      },
    });

    if (!tool || !tool.isActive || !tool.publishedAt) {
      return ctx.notFound('Werkzeug nicht gefunden oder nicht aktiv.');
    }

    const availabilityService = strapi.service('api::rental-request.availability');
    const today = new Date();
    const available = await availabilityService.getAvailabilityForTool(tool.id, today, today);

    return this.transformResponse({
      ...formatTool(tool),
      calculatedAvailability: available,
    });
  },

  async findBySlug(ctx) {
    const { slug } = ctx.params;

    if (!slug) {
      return ctx.badRequest('Slug fehlt.');
    }

    const tools = await strapi.entityService.findMany('api::tool.tool', {
      filters: {
        slug,
        isActive: true,
        publishedAt: {
          $notNull: true,
        },
      },
      populate: {
        images: {
          fields: ['url', 'alternativeText'],
        },
        category: {
          fields: ['name', 'slug'],
        },
        seo: {
          populate: {
            ogImage: {
              fields: ['url', 'alternativeText'],
            },
          },
        },
      },
      limit: 1,
    });

    const tool = tools[0];

    if (!tool) {
      return ctx.notFound('Werkzeug nicht gefunden oder nicht aktiv.');
    }

    const availabilityService = strapi.service('api::rental-request.availability');
    const today = new Date();
    const available = await availabilityService.getAvailabilityForTool(tool.id, today, today);

    return this.transformResponse({
      ...formatTool(tool),
      calculatedAvailability: available,
    });
  },

  async checkAvailability(ctx) {
    const toolId = Number(ctx.params.id);
    const startDate = ctx.query.startDate;
    const endDate = ctx.query.endDate;
    const requestedQuantity = Number(ctx.query.quantity || 1);

    if (!Number.isFinite(toolId) || toolId <= 0) {
      return ctx.badRequest('Ungueltige Werkzeug-ID.');
    }

    if (!startDate || !endDate) {
      return ctx.badRequest('startDate und endDate sind erforderlich.');
    }

    if (!Number.isFinite(requestedQuantity) || requestedQuantity <= 0) {
      return ctx.badRequest('quantity muss groesser 0 sein.');
    }

    try {
      const availabilityService = strapi.service('api::rental-request.availability');
      const availableQuantity = await availabilityService.getAvailabilityForTool(toolId, startDate, endDate);

      return this.transformResponse({
        toolId,
        startDate,
        endDate,
        requestedQuantity,
        availableQuantity,
        isAvailable: requestedQuantity <= availableQuantity,
      });
    } catch (error) {
      return ctx.badRequest(error.message || 'Verfuegbarkeit konnte nicht berechnet werden.');
    }
  },
}));

