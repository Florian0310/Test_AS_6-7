import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalogState, catalogQuery, toggleCategory } from '../../frontend/lib/catalog-state.js';
import { counterpart, productPath } from '../../frontend/config/routes.js';

test('shared links retain the correct localized route and escape product slugs', () => {
  assert.equal(counterpart('/sortiment/', 'en'), '/en/catalog/');
  assert.equal(counterpart('/en/catalog/product.html', 'de'), '/sortiment/produkt-hilti-sf-6-a22.html');
  assert.equal(productPath('a&b', 'en'), '/en/catalog/product.html?slug=a%26b');
});
test('filter URLs round-trip category, unicode search, sort and page', () => {
  const state = {category:'bohren-stemmen',search:'Bohrer & Öl',sort:'price-desc',page:3};
  assert.deepEqual(readCatalogState(catalogQuery(state)),state);
  assert.equal(catalogQuery(readCatalogState('')), '');
});
test('malformed URL values cannot select arbitrary sort fields or invalid pages', () => {
  assert.deepEqual(readCatalogState('?sort=password&page=-3'),{category:'',search:'',sort:'name',page:1});
  assert.equal(readCatalogState('?page=2.9').page,2);
  assert.equal(readCatalogState('?page=Infinity').page,10000);
  assert.equal(readCatalogState('?search='+ 'x'.repeat(200)).search.length,120);
});
test('category selection toggles off, resets page and preserves the search', () => {
  const state = {category:'drill',search:'Hilti',sort:'price-asc',page:3};
  assert.deepEqual(toggleCategory(state,'drill'),{...state,category:'',page:1});
  assert.deepEqual(toggleCategory(state,'saw'),{...state,category:'saw',page:1});
  assert.equal(state.page,3);
});
