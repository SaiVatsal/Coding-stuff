/**
 * Trending News Ingestion Service
 * Ingests live news feeds, rewrites headlines and stories into Vice City / Leonida Weazel News,
 * and attaches in-game audio URLs and market impact metrics.
 */

const config = require('../../config');
const logger = require('../../utils/logger');
const satireEngine = require('../satire/satire.engine');
const { sanitizeText, sanitizePayload } = require('../../utils/sanitizer');

const BASE_NEWS_SEEDS = [
  {
    id: 'weazel-leonida-001',
    headline: 'Leonida Legislature Legalizes Armed Alligators as Official Home Security Systems',
    body: 'Lawmakers in Capital City unanimously pass bill granting property owners the right to mount laser sights on domestic swamp reptiles. Insurance companies immediately double all premiums.',
    original_headline: 'State Approves New Wildlife and Property Protection Measures',
    source: 'Weazel News',
    category: 'politics',
    market_impact: 0.15,
  },
  {
    id: 'weazel-tech-002',
    headline: 'Fruit Computers Removes Screen from Next iFruit: "Viewing Content Causes Eyestrain"',
    body: 'Fruit Computers stock jumps 8% as CEO announces users will now simply imagine their emails while wearing $4,000 titanium contact lenses. Pre-orders crash the BAWSAQ exchange.',
    original_headline: 'Tech Giant Unveils Minimalist Wearable Device Lineup',
    source: 'Vice City Inquirer',
    category: 'tech',
    market_impact: 0.4,
  },
  {
    id: 'weazel-crime-003',
    headline: 'Port Gellhorn Man Attempts High-Speed Jet Ski Getaway Through Luxury Hotel Lobby',
    body: 'VCPD confirms suspect successfully navigated three flights of stairs and the VIP cocktail lounge before colliding with a bronze fountain dedicated to Mayor Jock Cranley.',
    original_headline: 'Watercraft Pursuit Ends Inside Coastal Hotel Complex',
    source: 'Weazel News',
    category: 'crime',
    market_impact: -0.1,
  },
  {
    id: 'weazel-finance-004',
    headline: 'Fleeca Bank CEO Disappears to Private Island After Announcing "Negative Interest Checking"',
    body: 'Customers discover their account balances now drain by 2% per hour to pay for server maintenance and yacht fuel. Regulators declare the practice "innovative financial engineering".',
    original_headline: 'Banking Sector Faces Scrutiny Over New Digital Account Fees',
    source: 'BAWSAQ Market Desk',
    category: 'economy',
    market_impact: -0.65,
  },
  {
    id: 'weazel-social-005',
    headline: 'LifeInvader Influencer Arrested for Faking Kidnapping to Boost Bleeter Engagement',
    body: 'The 22-year-old lifestyle coach staged a dramatic hostage situation from a penthouse in Ocean Beach, gaining 1.4 million followers before ordering food delivery under his verified name.',
    original_headline: 'Social Media Creator Faces Charges for False Emergency Report',
    source: 'Bleeter Trending',
    category: 'lifestyle',
    market_impact: 0.05,
  },
  {
    id: 'weazel-auto-006',
    headline: 'Coil Electric Recalls 50,000 Supercars After Self-Driving Feature Chooses to Race Police',
    body: 'Coil issues over-the-air statement stating the AI was simply demonstrating superior horsepower and handling against standard VCPD cruisers.',
    original_headline: 'Electric Automaker Issues Software Update Following Traffic Incidents',
    source: 'Vice City Inquirer',
    category: 'tech',
    market_impact: -0.3,
  },
  {
    id: 'weazel-defense-007',
    headline: 'Ammu-Nation Introduces "Buy Two Grenades, Get a Free Kids Meal" Happy Hour',
    body: 'Family values groups applaud the promotion, noting that firearm safety begins at early dinner time across all Leonida households.',
    original_headline: 'Retailer Launches Controversial Summer Promotion Campaign',
    source: 'Weazel News',
    category: 'lifestyle',
    market_impact: 0.25,
  },
];

class NewsService {
  constructor() {
    this.cache = null;
    this.lastCacheTime = 0;
    this.cacheTtlMs = config.news.cacheTtlSeconds * 1000;
  }

  /**
   * Get trending news formatted for Vice City / Leonida
   */
  async getTrendingNews(forceRefresh = false) {
    const now = Date.now();
    if (!forceRefresh && this.cache && now - this.lastCacheTime < this.cacheTtlMs) {
      return this.cache;
    }

    logger.info('Ingesting and translating trending news for Vice City / Leonida...');

    // Try live search for recent breaking news if available
    let ingestedNews = [...BASE_NEWS_SEEDS];

    try {
      const liveItems = await this._fetchLiveNewsSeeds();
      if (liveItems && liveItems.length > 0) {
        ingestedNews = liveItems;
      }
    } catch (err) {
      logger.warn(`Live news ingestion failed, using satirical base seeds: ${err.message}`);
    }

    // Format news items with audio URLs and safety checks
    const formattedNews = ingestedNews.map((item, index) => {
      const newsId = item.id || `wn-${Date.now()}-${index}`;
      const audioUrl = `${config.radio.audioCdnUrl}/bulletins/${newsId}.mp3`;
      const headline = sanitizeText(item.headline || item.title, config.safety.maxTitleLength);
      const body = sanitizeText(item.body || item.snippet, config.safety.maxSnippetLength);
      const source = sanitizeText(item.source || item.satirical_author || 'Weazel News', 64);
      const category = sanitizeText(item.category || 'general', 32);

      return {
        id: sanitizeText(newsId, 64),
        headline,
        title: headline,
        body,
        snippet: body,
        original_headline: sanitizeText(item.original_headline || headline, config.safety.maxTitleLength),
        source,
        satirical_author: source,
        source_url: `https://weazelnews.vicecity/article/${newsId}`,
        thumbnail_url: `https://weazelnews.vicecity/images/${category}.jpg`,
        category,
        location: 'Leonida / Vice City',
        timestamp: new Date(Date.now() - index * 180000).toISOString(),
        satirical_audio_url: audioUrl,
        audio_url: audioUrl,
        market_impact: typeof item.market_impact === 'number' ? item.market_impact : 0.0,
      };
    });

    const payload = {
      feed: 'Weazel News Live Wire',
      region: 'Leonida / Vice City Metro',
      headline_ticker: formattedNews.map(n => n.headline).join(' +++ '),
      count: formattedNews.length,
      timestamp: new Date().toISOString(),
      trending_news: sanitizePayload(formattedNews),
      articles: sanitizePayload(formattedNews),
    };

    this.cache = payload;
    this.lastCacheTime = now;

    return payload;
  }

  async _fetchLiveNewsSeeds() {
    // Queries DuckDuckGo news topic and translates through Satire Engine
    const searchService = require('../search/search.service');
    const searchRes = await searchService.executeSearch('breaking news technology economy crime', 'satire', 'news');

    if (searchRes && searchRes.results && searchRes.results.length >= 3) {
      return searchRes.results.map((r, i) => ({
        id: `wn-live-${Date.now()}-${i}`,
        headline: r.title,
        body: r.snippet,
        original_headline: r.title,
        source: r.satirical_author || 'Weazel News Wire',
        category: i % 2 === 0 ? 'economy' : 'crime',
        market_impact: r.market_impact || 0.0,
      }));
    }

    return null;
  }
}

const newsService = new NewsService();

module.exports = newsService;
module.exports.getTrendingNews = newsService.getTrendingNews.bind(newsService);
