const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::rental-request.rental-request', ({ strapi }) => ({
  async create(ctx) {
    const input = ctx.request.body?.data || {};

    const toolId = Number(input.tool);
    const quantity = Number(input.quantity);
    const startDate = input.startDate;
    const endDate = input.endDate;

    if (!toolId || !input.customerName || !input.customerEmail || !startDate || !endDate || !quantity) {
      return ctx.badRequest('Bitte alle Pflichtfelder ausfuellen.');
    }

    let validation;

    try {
      validation = await strapi.service('api::rental-request.availability').validateRequestPayload({
        toolId,
        startDateInput: startDate,
        endDateInput: endDate,
        quantityInput: quantity,
      });
    } catch (error) {
      return ctx.badRequest(error.message || 'Anfrage konnte nicht geprueft werden.');
    }

    const cleanName = String(input.customerName).trim();
    const cleanEmail = String(input.customerEmail).trim().toLowerCase();
    const cleanPhone = input.customerPhone ? String(input.customerPhone).trim() : null;
    const cleanNotes = input.notes ? String(input.notes).trim() : null;

    const created = await strapi.entityService.create('api::rental-request.rental-request', {
      data: {
        tool: validation.tool.id,
        customerName: cleanName,
        customerEmail: cleanEmail,
        customerPhone: cleanPhone,
        startDate,
        endDate,
        quantity: validation.quantity,
        status: 'pending',
        notes: cleanNotes,
        totalPrice: validation.totalPrice,
      },
      populate: {
        tool: {
          fields: ['id', 'name', 'slug'],
        },
      },
    });

    ctx.status = 201;

    return this.transformResponse(
      {
        id: created.id,
        customerName: created.customerName,
        customerEmail: created.customerEmail,
        customerPhone: created.customerPhone,
        startDate: created.startDate,
        endDate: created.endDate,
        quantity: created.quantity,
        status: created.status,
        totalPrice: created.totalPrice,
        tool: created.tool,
      },
      {
        meta: {
          message: 'Anfrage erfolgreich erstellt.',
        },
      }
    );
  },
}));

