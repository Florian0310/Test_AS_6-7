module.exports = {
  toDate(value) {
    if (!value) return null;

    let date = null;

    if (value instanceof Date) {
      date = new Date(value);
    } else if (typeof value === 'string') {
      const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/;

      if (dateOnlyPattern.test(value)) {
        const [year, month, day] = value.split('-').map((segment) => Number(segment));
        date = new Date(year, month - 1, day);
      } else {
        date = new Date(value);
      }
    } else {
      date = new Date(value);
    }

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    date.setHours(0, 0, 0, 0);
    return date;
  },

  isDateRangeValid(startDate, endDate) {
    return startDate instanceof Date && endDate instanceof Date && startDate.getTime() <= endDate.getTime();
  },

  calculateRentalDays(startDate, endDate) {
    const dayMs = 24 * 60 * 60 * 1000;
    return Math.floor((endDate.getTime() - startDate.getTime()) / dayMs) + 1;
  },
};
