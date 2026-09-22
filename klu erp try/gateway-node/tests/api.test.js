/**
 * Integration Tests for Eyefind REST API Endpoints
 */

const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { app } = require('../src/server');

let testServer;
let baseUrl;

test.before((t, done) => {
  testServer = http.createServer(app);
  testServer.listen(0, '127.0.0.1', () => {
    const port = testServer.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

test.after((t, done) => {
  if (testServer) {
    testServer.close(done);
  } else {
    done();
  }
});

async function apiFetch(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, options);
  const data = await res.json();
  return { status: res.status, headers: res.headers, data };
}

test('API Integration - GET /health returns service status and region', async () => {
  const res = await apiFetch('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.status, 'HEALTHY');
  assert.strictEqual(res.data.region, 'Leonida / Vice City');
});

test('API Integration - GET / returns gateway overview', async () => {
  const res = await apiFetch('/');
  assert.strictEqual(res.status, 200);
  assert.ok(res.data.endpoints);
  assert.ok(res.data.endpoints.search);
});

test('API Integration - GET /api/v1/search executes search query', async () => {
  const res = await apiFetch('/api/v1/search?q=weapons&mode=satire&category=web&limit=3');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.query, 'weapons');
  assert.strictEqual(res.data.mode, 'satire');
  assert.ok(Array.isArray(res.data.results));
  assert.ok(res.data.results.length > 0);

  const first = res.data.results[0];
  assert.ok(first.title);
  assert.ok(first.snippet);
  assert.ok(first.source_url);
  assert.ok(typeof first.market_impact === 'number');
});

test('API Integration - GET /api/v1/search handles empty query gracefully with empty array', async () => {
  const res = await apiFetch('/api/v1/search?q=');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.count, 0);
  assert.deepStrictEqual(res.data.results, []);
});

test('API Integration - GET /api/v1/stocks/bawsaq returns stock exchange data', async () => {
  const res = await apiFetch('/api/v1/stocks/bawsaq');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.data.stocks));
  assert.ok(res.data.stocks.length >= 10);
});

test('API Integration - GET /api/v1/stocks/bawsaq/:ticker returns single ticker', async () => {
  const res = await apiFetch('/api/v1/stocks/bawsaq/FRUT');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.ticker, 'FRUT');
  assert.strictEqual(res.data.company_name, 'Fruit Computers');
});

test('API Integration - GET /api/v1/stocks/bawsaq/UNKNOWN returns 404', async () => {
  const res = await apiFetch('/api/v1/stocks/bawsaq/UNKNOWN_ABC');
  assert.strictEqual(res.status, 404);
});

test('API Integration - GET /api/v1/news/trending returns Vice City breaking news', async () => {
  const res = await apiFetch('/api/v1/news/trending');
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.data.articles));
  assert.ok(res.data.articles.length > 0);
});

test('API Integration - POST /api/v1/radio/broadcast triggers a radio bulletin', async () => {
  const res = await apiFetch('/api/v1/radio/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      headline: 'Tanker collision on Ocean Beach',
      script: 'Weazel News bulletin: Multiple explosions reported along Ocean Drive.',
      station_id: 'weazel-news-247',
      audio_url: '/audio/bulletins/weazel_tanker.mp3',
    }),
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.data.success, true);
  assert.strictEqual(res.data.packet.headline, 'Tanker collision on Ocean Beach');
});
