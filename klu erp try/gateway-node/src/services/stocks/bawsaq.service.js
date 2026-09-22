/**
 * BAWSAQ In-Game Stock Exchange Service
 * Aggregates live stock and crypto data (Yahoo Finance / CoinGecko API)
 * and translates real-world companies into GTA lore equivalents with satirical commentary.
 * Strictly adheres to Unreal Engine 5.5 `FBAWSAQStockData` struct layout.
 */

const config = require('../../config');
const logger = require('../../utils/logger');
const { BAWSAQ_TICKERS } = require('./ticker.map');
const { sanitizeText } = require('../../utils/sanitizer');

class BawsaqService {
  constructor() {
    this.cache = null;
    this.lastCacheTime = 0;
    this.cacheTtlMs = config.stocks.cacheTtlSeconds * 1000;
  }

  /**
   * Fetch complete BAWSAQ stock market listings
   * @param {boolean} forceRefresh - Ignore cache and pull live
   * @returns {Promise<Object>} BAWSAQ market packet
   */
  async getBawsaqMarket(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cache && now - this.lastCacheTime < this.cacheTtlMs) {
      return this.cache;
    }

    logger.info('Updating BAWSAQ stock indices from live market data...');

    const stockPromises = BAWSAQ_TICKERS.map((def) => this._fetchStockData(def));
    const stocks = await Promise.all(stockPromises);

    const payload = {
      exchange: 'BAWSAQ & LCN',
      timestamp: new Date().toISOString(),
      count: stocks.length,
      stocks,
    };

    this.cache = payload;
    this.lastCacheTime = now;

    return payload;
  }

  /**
   * Get single stock ticker by BAWSAQ symbol or real symbol
   */
  async getStockByTicker(ticker) {
    if (!ticker) return null;
    const upper = ticker.toUpperCase().trim();

    const market = await this.getBawsaqMarket();
    const stock = market.stocks.find(
      (s) => s.ticker === upper || s.real_ticker === upper
    );

    return stock || null;
  }

  /**
   * Fetch single stock with real-world price fallback + simulated micro-fluctuation
   */
  async _fetchStockData(def) {
    let currentPrice = def.base_price;
    let changePercent = 0.0;

    // Try fetching live Yahoo Finance Quote
    const liveData = await this._queryYahooFinance(def.real_ticker);

    if (liveData && liveData.price > 0) {
      currentPrice = liveData.price;
      changePercent = liveData.changePercent;
    } else {
      // Fallback to high-fidelity simulated volatility
      const simulated = this._generateSimulatedFluctuation(def);
      currentPrice = simulated.price;
      changePercent = simulated.changePercent;
    }

    // Dynamic satirical description based on market movement
    let description = def.description;
    if (changePercent > 3.0) {
      description = `${def.company_name} shares rocket ${changePercent.toFixed(1)}% as CEO announces massive layoffs and record executive yacht bonuses.`;
    } else if (changePercent < -3.0) {
      description = `${def.company_name} plummets ${Math.abs(changePercent).toFixed(1)}% amid FIB raid on headquarters in Downtown Vice City.`;
    }

    return {
      ticker: sanitizeText(def.ticker, 8),
      company_name: sanitizeText(def.company_name, 64),
      real_ticker: sanitizeText(def.real_ticker, 8),
      price: parseFloat(currentPrice.toFixed(2)),
      change_percent: parseFloat(changePercent.toFixed(2)),
      description: sanitizeText(description, config.safety.maxSnippetLength),
      sector: sanitizeText(def.sector || 'General', 64),
    };
  }

  /**
   * Lightweight query to public Yahoo Finance quote endpoint
   */
  async _queryYahooFinance(realTicker) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(realTicker)}?interval=1d&range=1d`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        signal: AbortSignal.timeout(2500),
      });

      if (!res.ok) return null;

      const data = await res.json();
      const meta = data.chart?.result?.[0]?.meta;
      if (meta && meta.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.previousClose || meta.chartPreviousClose || price;
        const changePercent = prevClose !== 0 ? ((price - prevClose) / prevClose) * 100 : 0.0;

        return { price, changePercent };
      }
    } catch {
      // Ignore network timeout and use simulated dynamics
    }
    return null;
  }

  /**
   * Generates realistic deterministic time-based micro-fluctuations
   */
  _generateSimulatedFluctuation(def) {
    const now = Date.now() / 1000;
    const timeStep = Math.floor(now / 30); // updates every 30s
    const seed = this._hashString(def.ticker + '_' + timeStep);

    // Sine wave + pseudo-random noise
    const noise = ((seed % 1000) - 500) / 500.0; // -1.0 to 1.0
    const wave = Math.sin(now / 120.0 + (seed % 10));

    const totalDeltaPct = (noise * 0.7 + wave * 0.3) * def.volatility * config.stocks.volatilityMultiplier;
    const currentPrice = Math.max(1.0, def.base_price * (1.0 + totalDeltaPct / 100.0));

    return {
      price: currentPrice,
      changePercent: totalDeltaPct,
    };
  }

  _hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}

const bawsaqService = new BawsaqService();

module.exports = bawsaqService;
module.exports.getBawsaqMarket = bawsaqService.getBawsaqMarket.bind(bawsaqService);
module.exports.getStockByTicker = bawsaqService.getStockByTicker.bind(bawsaqService);
