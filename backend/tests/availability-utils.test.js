const test = require('node:test');
const assert = require('node:assert/strict');
const utils = require('../src/api/rental-request/utils/availability-utils');

test('toDate und Zeitraumvalidierung funktionieren', () => {
  const start = utils.toDate('2026-02-01');
  const end = utils.toDate('2026-02-03');

  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 1);
  assert.equal(start.getDate(), 1);

  assert.equal(end.getFullYear(), 2026);
  assert.equal(end.getMonth(), 1);
  assert.equal(end.getDate(), 3);

  assert.equal(utils.isDateRangeValid(start, end), true);
  assert.equal(utils.calculateRentalDays(start, end), 3);
});

test('ungueltige Datumswerte werden erkannt', () => {
  const start = utils.toDate('2026-02-05');
  const end = utils.toDate('2026-02-03');

  assert.equal(utils.isDateRangeValid(start, end), false);
  assert.equal(utils.toDate('kein-datum'), null);
});
