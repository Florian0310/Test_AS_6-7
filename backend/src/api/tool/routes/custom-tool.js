module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/tools/slug/:slug',
      handler: 'tool.findBySlug',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/tools/:id/availability',
      handler: 'tool.checkAvailability',
      config: {
        auth: false,
      },
    },
  ],
};
