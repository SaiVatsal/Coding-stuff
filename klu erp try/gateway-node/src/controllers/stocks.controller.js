/**
 * BAWSAQ Stocks Controller
 * Handles GET /api/v1/stocks/bawsaq and GET /api/v1/stocks/bawsaq/:ticker
 */

const bawsaqService = require('../services/stocks/bawsaq.service');

async function handleGetBawsaqMarket(req, res, next) {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const market = await bawsaqService.getBawsaqMarket(forceRefresh);
    return res.status(200).json(market);
  } catch (err) {
    return next(err);
  }
}

async function handleGetBawsaqTicker(req, res, next) {
  try {
    const ticker = req.params.ticker;
    const stock = await bawsaqService.getStockByTicker(ticker);

    if (!stock) {
      return res.status(404).json({
        error: 'Ticker Not Found',
        message: `Stock ticker '${ticker}' is not listed on the BAWSAQ or LCN exchange.`,
        status: 404,
      });
    }

    return res.status(200).json(stock);
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  handleGetBawsaqMarket,
  handleGetBawsaqTicker,
};
