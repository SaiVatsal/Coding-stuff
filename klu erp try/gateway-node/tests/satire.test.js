/**
 * Tests for Satire Transformation Engine & Lore Dictionary
 */

const test = require('node:test');
const assert = require('node:assert');
const { translateLore, LORE_DICTIONARY } = require('../src/services/satire/lore.dictionary');
const {
  transformWithHeuristics,
  calculateMarketImpact,
  transformContent,
} = require('../src/services/satire/satire.engine');

test('Lore Dictionary - accurately translates real-world entities to GTA Vice City lore', () => {
  const input = 'Florida police and FBI agents raided Apple headquarters in Miami while Tesla stocks rose.';
  const output = translateLore(input);

  assert.ok(output.includes('Leonida'), 'Florida -> Leonida');
  assert.ok(output.includes('FIB'), 'FBI -> FIB');
  assert.ok(output.includes('Fruit Computers') || output.includes('Fruit'), 'Apple -> Fruit');
  assert.ok(output.includes('Vice City'), 'Miami -> Vice City');
  assert.ok(output.includes('Coil'), 'Tesla -> Coil');
});

test('Lore Dictionary - translates media, politicians, and social networks', () => {
  const input = 'CNN and Fox News reported on Twitter that Donald Trump posted on Instagram.';
  const output = translateLore(input);

  assert.ok(output.includes('Weazel News') || output.includes('Public Liberty Online'));
  assert.ok(output.includes('Bleeter'));
  assert.ok(output.includes('Snapmatic'));
  assert.ok(output.includes('Donald Love') || output.includes('Jock Cranley'));
});

test('Satire Engine - heuristic transformation generates satirical headlines and authors', () => {
  const result = transformWithHeuristics({
    title: 'Elon Musk announces new Tesla autopilot update in Florida',
    snippet: 'The tech CEO claims new autonomous features will prevent traffic delays across the state.',
    category: 'tech',
  });

  assert.ok(result.title);
  assert.ok(result.snippet);
  assert.ok(result.satirical_author);
  assert.ok(typeof result.market_impact === 'number');
  assert.ok(result.market_impact >= -1.0 && result.market_impact <= 1.0);
  assert.ok(result.title.includes('Coil') || result.snippet.includes('Coil') || result.title.includes('Leonida') || result.snippet.includes('Leonida'));
});

test('Satire Engine - market impact calculation produces valid floats between -1.0 and 1.0', () => {
  const positive = calculateMarketImpact('Record profits, massive breakthrough surge, stock jumps 25%');
  assert.ok(positive > 0, `Expected positive impact, got ${positive}`);
  assert.ok(positive <= 1.0);

  const negative = calculateMarketImpact('Catastrophic fraud bankruptcy disaster, CEO arrested in investigation crash');
  assert.ok(negative < 0, `Expected negative impact, got ${negative}`);
  assert.ok(negative >= -1.0);

  const neutral = calculateMarketImpact('Regular quarterly meeting scheduled for Tuesday afternoon.');
  assert.ok(Math.abs(neutral) <= 0.3, `Expected near-neutral impact, got ${neutral}`);
});

test('Satire Engine - transformContent orchestrates fallback without external LLM keys', async () => {
  const transformed = await transformContent({
    title: 'SpaceX launches rocket from Florida space coast',
    snippet: 'NASA and SpaceX partnered for the latest orbital satellite launch.',
    category: 'news',
  });

  assert.ok(transformed.title);
  assert.ok(transformed.snippet);
  assert.ok(transformed.satirical_author);
  assert.strictEqual(typeof transformed.market_impact, 'number');
});
