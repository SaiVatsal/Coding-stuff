/**
 * Real-World to BAWSAQ Stock Market Mapping Dictionary
 * Maps real-world equity/crypto tickers to their GTA satire counterparts.
 */

const BAWSAQ_TICKERS = [
  {
    ticker: 'FRUT',
    company_name: 'Fruit Computers',
    real_ticker: 'AAPL',
    sector: 'Technology & Surveillance',
    base_price: 185.5,
    volatility: 1.2,
    description: 'Fruit Computers announces mandatory proprietary dongles for all future charging stations in Vice City.',
  },
  {
    ticker: 'COIL',
    company_name: 'Coil Auto',
    real_ticker: 'TSLA',
    sector: 'Automotive & Space Hype',
    base_price: 245.8,
    volatility: 2.8,
    description: 'Coil Auto promises fully autonomous stunt driving capability by Q4 of next decade.',
  },
  {
    ticker: 'BTBL',
    company_name: 'BitBull Digital Currency',
    real_ticker: 'BTC',
    sector: 'Crypto Speculation',
    base_price: 64200.0,
    volatility: 4.5,
    description: 'BitBull mining rigs in Leonida wetlands consume more electricity than the entire city of San Fierro.',
  },
  {
    ticker: 'LIFE',
    company_name: 'LifeInvader Network',
    real_ticker: 'META',
    sector: 'Social Media & Surveillance',
    base_price: 495.2,
    volatility: 1.9,
    description: 'LifeInvader rolls out algorithm guaranteed to maximize user rage and impulse online shopping.',
  },
  {
    ticker: 'GOPO',
    company_name: 'GoPostal Delivery Services',
    real_ticker: 'AMZN',
    sector: 'Logistics & Exploitation',
    base_price: 178.4,
    volatility: 1.4,
    description: 'GoPostal guarantees 30-minute drone delivery or your package is delivered through your front window.',
  },
  {
    ticker: 'EYE',
    company_name: 'Eyefind Global Search',
    real_ticker: 'GOOGL',
    sector: 'Search Engine & AI Monopolies',
    base_price: 165.7,
    volatility: 1.1,
    description: 'Eyefind AI search summary suggests Vice City drivers ignore red lights to improve citywide traffic flow.',
  },
  {
    ticker: 'BILG',
    company_name: 'Bilgeco Digital Graphics',
    real_ticker: 'NVDA',
    sector: 'Semiconductors & AI Overlords',
    base_price: 118.9,
    volatility: 3.2,
    description: 'Bilgeco GPUs now cost more than a 3-bedroom bungalow in Port Gellhorn due to crypto-AI fever.',
  },
  {
    ticker: 'MFLOP',
    company_name: 'MicroFlop Software Systems',
    real_ticker: 'MSFT',
    sector: 'Enterprise Software & Blue Screens',
    base_price: 425.6,
    volatility: 0.9,
    description: 'MicroFlop updates in-game operating system, instantly corrupting all saved flight simulator data.',
  },
  {
    ticker: 'RICH',
    company_name: 'Richards Majestic Productions',
    real_ticker: 'DIS',
    sector: 'Entertainment & Sequel Fatigue',
    base_price: 92.3,
    volatility: 1.6,
    description: 'Richards Majestic greenlights 14 consecutive superhero reboots featuring aging Vinewood actors.',
  },
  {
    ticker: 'WEZL',
    company_name: 'Weazel Broadcasting Corporation',
    real_ticker: 'NFLX',
    sector: 'Broadcasting & Clickbait',
    base_price: 615.0,
    volatility: 2.1,
    description: 'Weazel News viewership spikes 600% following live coverage of helicopter chase on Ocean Drive.',
  },
  {
    ticker: 'RON',
    company_name: 'RON Oil & Petroleum',
    real_ticker: 'XOM',
    sector: 'Energy & Environmental Destruction',
    base_price: 112.5,
    volatility: 1.3,
    description: 'RON Oil discovers vast petroleum reserves directly beneath protected Leonida coral reefs.',
  },
  {
    ticker: 'BURG',
    company_name: 'Burger Shot Holdings',
    real_ticker: 'MCD',
    sector: 'Fast Food & Questionable Meat',
    base_price: 285.4,
    volatility: 0.8,
    description: 'Burger Shot introduces the "Triple Bleeder" burger featuring 4,000 calories and waiver of liability.',
  },
  {
    ticker: 'FLEE',
    company_name: 'Fleeca Financial Group',
    real_ticker: 'JPM',
    sector: 'Banking & Predatory Loans',
    base_price: 198.2,
    volatility: 1.0,
    description: 'Fleeca Bank posts record quarterly profits by increasing ATM withdrawal fees to $25.',
  },
  {
    ticker: 'AMMU',
    company_name: 'Ammu-Nation Global Defense',
    real_ticker: 'LMT',
    sector: 'Defense & Small Arms',
    base_price: 480.0,
    volatility: 1.7,
    description: 'Ammu-Nation announces record pre-orders for military-grade surface-to-air missiles for home defense.',
  },
  {
    ticker: 'CABX',
    company_name: 'Downtown Cab Co. Technologies',
    real_ticker: 'UBER',
    sector: 'Rideshare & Traffic Gridlock',
    base_price: 72.1,
    volatility: 2.3,
    description: 'Downtown Cab Co. implements surge pricing during high-speed police pursuits across Vice Beach.',
  },
];

function getTickerByBawsaqSymbol(ticker) {
  if (!ticker) return null;
  const upper = ticker.toUpperCase().trim();
  return BAWSAQ_TICKERS.find((t) => t.ticker === upper) || null;
}

function getTickerByRealSymbol(symbol) {
  if (!symbol) return null;
  const upper = symbol.toUpperCase().trim();
  return BAWSAQ_TICKERS.find((t) => t.real_ticker === upper) || null;
}

module.exports = {
  BAWSAQ_TICKERS,
  BAWSAQ_TICKER_MAP: BAWSAQ_TICKERS,
  getTickerByBawsaqSymbol,
  getTickerByRealSymbol,
};
