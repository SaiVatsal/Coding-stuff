/**
 * Tests for BAWSAQ Stocks Service & Ticker Mapping
 */

const test = require('node:test');
const assert = require('node:assert');
const {
  BAWSAQ_TICKER_MAP,
  getTickerByRealSymbol,
  getTickerByBawsaqSymbol,
} = require('../src/services/stocks/ticker.map');
const {
  getBawsaqMarket,
  getStockByTicker,
} = require('../src/services/stocks/bawsaq.service');

test('BAWSAQ Ticker Map - correctly maps real tickers to GTA lore equivalents', () => {
  const fruit = getTickerByBawsaqSymbol('FRUT');
  assert.ok(fruit);
  assert.strictEqual(fruit.company_name, 'Fruit Computers');
  assert.strictEqual(fruit.real_ticker, 'AAPL');

  const coil = getTickerByRealSymbol('TSLA');
  assert.ok(coil);
  assert.strictEqual(coil.ticker, 'COIL');
  assert.strictEqual(coil.company_name, 'Coil Auto');

  const life = getTickerByRealSymbol('META');
  assert.ok(life);
  assert.strictEqual(life.ticker, 'LIFE');
  assert.strictEqual(life.company_name, 'LifeInvader Network');
});

test('BAWSAQ Stock Service - returns full market listings matching UE5 FBAWSAQStockData', async () => {
  const market = await getBawsaqMarket(true);

  assert.ok(market.exchange === 'BAWSAQ & LCN');
  assert.ok(Array.isArray(market.stocks));
  assert.ok(market.stocks.length >= 10);
  assert.ok(typeof market.timestamp === 'string');

  market.stocks.forEach(stock => {
    assert.ok(typeof stock.ticker === 'string');
    assert.ok(typeof stock.company_name === 'string');
    assert.ok(typeof stock.real_ticker === 'string');
    assert.ok(typeof stock.price === 'number' && stock.price > 0);
    assert.ok(typeof stock.change_percent === 'number');
    assert.ok(typeof stock.description === 'string');
    assert.ok(typeof stock.sector === 'string');
  });
});

test('BAWSAQ Stock Service - retrieves individual stock ticker by BAWSAQ or Real symbol', async () => {
  const frut = await getStockByTicker('FRUT');
  assert.ok(frut);
  assert.strictEqual(frut.ticker, 'FRUT');
  assert.strictEqual(frut.company_name, 'Fruit Computers');

  const coil = await getStockByTicker('TSLA');
  assert.ok(coil);
  assert.strictEqual(coil.ticker, 'COIL');

  const unknown = await getStockByTicker('NONEXISTENT_XYZ');
  assert.strictEqual(unknown, null);
});
