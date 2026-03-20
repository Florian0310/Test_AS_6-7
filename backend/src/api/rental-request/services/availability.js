const utils = require('../utils/availability-utils');

module.exports = ({ strapi }) => ({
  async getTool(toolId) {
    if (!Number.isFinite(Number(toolId)) || Number(toolId) <= 0) {
      throw new Error('Ungueltige Werkzeug-ID.');
    }

    const tool = await strapi.entityService.findOne('api::tool.tool', Number(toolId), {
      fields: ['id', 'name', 'slug', 'isActive', 'dailyPrice', 'quantityTotal', 'quantityAvailable'],
    });

    if (!tool) {
      throw new Error('Werkzeug wurde nicht gefunden.');
    }

    if (!tool.isActive) {
      throw new Error('Werkzeug ist derzeit nicht aktiv.');
    }

    return tool;
  },

  async getBlockedQuantity(toolId, startDateInput, endDateInput, statuses = ['confirmed']) {
    const startDate = utils.toDate(startDateInput);
    const endDate = utils.toDate(endDateInput);

    if (!utils.isDateRangeValid(startDate, endDate)) {
      throw new Error('Ungueltiger Zeitraum. endDate muss groesser oder gleich startDate sein.');
    }

    const startDateIso = startDate.toISOString().slice(0, 10);
    const endDateIso = endDate.toISOString().slice(0, 10);

    const reservations = await strapi.entityService.findMany('api::rental-request.rental-request', {
      filters: {
        tool: Number(toolId),
        status: {
          $in: statuses,
        },
        startDate: {
          $lte: endDateIso,
        },
        endDate: {
          $gte: startDateIso,
        },
      },
      fields: ['quantity'],
      limit: 1000,
    });

    return reservations.reduce((sum, reservation) => sum + Number(reservation.quantity || 0), 0);
  },

  async getAvailabilityForTool(toolId, startDateInput, endDateInput) {
    const tool = await strapi.service('api::rental-request.availability').getTool(toolId);
    const blocked = await strapi
      .service('api::rental-request.availability')
      .getBlockedQuantity(tool.id, startDateInput, endDateInput, ['confirmed']);

    return Math.max(Number(tool.quantityTotal || 0) - blocked, 0);
  },

  async validateRequestPayload({ toolId, startDateInput, endDateInput, quantityInput }) {
    const quantity = Number(quantityInput);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error('Menge muss eine Zahl groesser als 0 sein.');
    }

    const startDate = utils.toDate(startDateInput);
    const endDate = utils.toDate(endDateInput);

    if (!utils.isDateRangeValid(startDate, endDate)) {
      throw new Error('endDate muss groesser oder gleich startDate sein.');
    }

    const tool = await strapi.service('api::rental-request.availability').getTool(toolId);
    const available = await strapi
      .service('api::rental-request.availability')
      .getAvailabilityForTool(tool.id, startDate, endDate);

    if (quantity > available) {
      throw new Error(`Nur ${available} Stueck im gewaehlten Zeitraum verfuegbar.`);
    }

    const rentalDays = utils.calculateRentalDays(startDate, endDate);
    const totalPrice = Number(tool.dailyPrice || 0) * quantity * rentalDays;

    return {
      tool,
      quantity,
      startDate,
      endDate,
      rentalDays,
      totalPrice,
      available,
    };
  },
});

