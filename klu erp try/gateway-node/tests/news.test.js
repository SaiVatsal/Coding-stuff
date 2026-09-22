/**
 * Tests for Trending Vice City News Service
 */

const test = require('node:test');
const assert = require('node:assert');
const { getTrendingNews } = require('../src/services/news/news.service');

test('News Service - returns satirical Vice City breaking stories', async () => {
  const trending = await getTrendingNews(true);

  assert.ok(trending.headline_ticker);
  assert.ok(Array.isArray(trending.articles));
  assert.ok(trending.articles.length > 0);
  assert.ok(typeof trending.count === 'number');
  assert.ok(typeof trending.timestamp === 'string');

  trending.articles.forEach(article => {
    assert.ok(typeof article.id === 'string');
    assert.ok(typeof article.title === 'string');
    assert.ok(typeof article.snippet === 'string');
    assert.ok(typeof article.source_url === 'string');
    assert.ok(typeof article.thumbnail_url === 'string');
    assert.ok(typeof article.satirical_author === 'string');
    assert.ok(typeof article.market_impact === 'number');
    assert.ok(article.market_impact >= -1.0 && article.market_impact <= 1.0);
    assert.ok(typeof article.audio_url === 'string');
    assert.ok(typeof article.category === 'string');
    assert.ok(typeof article.location === 'string');
  });
});
