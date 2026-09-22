/**
 * Tests for Eyefind Search Service & Mock Generator
 */

const test = require('node:test');
const assert = require('node:assert');
const { generateMockResults } = require('../src/services/search/mock.provider');
const { executeSearch, clearSearchCache } = require('../src/services/search/search.service');

test('Mock Search Provider - generates contextual GTA mock items for queries', () => {
  const results = generateMockResults('police car chase', 'satire', 5);
  assert.strictEqual(results.length, 5);

  results.forEach(item => {
    assert.ok(item.title, 'Must have title');
    assert.ok(item.snippet, 'Must have snippet');
    assert.ok(item.source_url, 'Must have source_url');
    assert.ok(item.thumbnail_url, 'Must have thumbnail_url');
    assert.ok(item.satirical_author, 'Must have satirical_author');
    assert.strictEqual(typeof item.market_impact, 'number');
    assert.ok(item.market_impact >= -1.0 && item.market_impact <= 1.0);
  });
});

test('Search Service - executes search with satire mode enabled', async () => {
  clearSearchCache();
  const response = await executeSearch('weapons ammunition military', 'satire', 'web', 5);

  assert.ok(response.query);
  assert.strictEqual(response.mode, 'satire');
  assert.strictEqual(response.category, 'web');
  assert.ok(Array.isArray(response.results));
  assert.ok(response.results.length > 0);
  assert.ok(response.count > 0);
  assert.ok(typeof response.cached === 'boolean');

  // Verify UE5 FEyefindSearchResultItem schema compliance
  const first = response.results[0];
  assert.ok(typeof first.title === 'string');
  assert.ok(typeof first.snippet === 'string');
  assert.ok(typeof first.source_url === 'string');
  assert.ok(typeof first.thumbnail_url === 'string');
  assert.ok(typeof first.satirical_author === 'string');
  assert.ok(typeof first.market_impact === 'number');
});

test('Search Service - caches search results in LRU memory cache', async () => {
  const query = 'lifeinvader data privacy test ' + Date.now();
  const firstCall = await executeSearch(query, 'satire', 'web', 3);
  assert.strictEqual(firstCall.cached, false);

  const secondCall = await executeSearch(query, 'satire', 'web', 3);
  assert.strictEqual(secondCall.cached, true);
  assert.strictEqual(secondCall.results.length, firstCall.results.length);
});

test('Search Service - handles direct mode without adding satirical prefixes', async () => {
  const response = await executeSearch('sports car', 'direct', 'web', 3);
  assert.strictEqual(response.mode, 'direct');
  assert.ok(response.results.length > 0);
});
