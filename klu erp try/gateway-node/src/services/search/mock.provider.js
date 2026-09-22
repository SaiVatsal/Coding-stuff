/**
 * Mock Data Generator & Fallback Provider for Eyefind Search
 * Produces ultra-realistic, immersive GTA 6 Vice City / Leonida search results
 * when external search APIs are offline, unreachable, or rate-limited.
 */

const { sanitizeText, sanitizeUrl } = require('../../utils/sanitizer');

const MOCK_DATABASE = [
  // Tech & Corporate
  {
    keywords: ['apple', 'iphone', 'fruit', 'tech', 'phone', 'macbook'],
    results: [
      {
        title: 'Fruit Computers Unveils iFruit 16 with No Ports and Mandatory Retina Tracking',
        snippet: 'Fruit Computers CEO announces the new iFruit 16 will cost $2,499 and requires a continuous biometric subscription to unlock the lock screen.',
        source_url: 'https://eyefind.info/fruit-computers/ifruit16',
        thumbnail_url: 'http://127.0.0.1:8080/images/fruit_phone.jpg',
      },
      {
        title: 'LifeInvader Data Breach Exposes 400 Million Passwords to Russian Hackers',
        snippet: 'LifeInvader assures users that privacy is an illusion anyway and offers everyone a complimentary digital badge.',
        source_url: 'https://lifeinvader.com/security/update',
        thumbnail_url: 'http://127.0.0.1:8080/images/lifeinvader.jpg',
      },
    ],
  },
  // Automotive & Supercars
  {
    keywords: ['car', 'cars', 'tesla', 'ferrari', 'grotti', 'pegassi', 'coil', 'supercar'],
    results: [
      {
        title: 'Coil Cyclone II Spontaneously Accelerates Into Swimming Pools Across Vice Beach',
        snippet: 'Coil Electric issues firmware update claiming aggressive pool navigation is an unadvertised amphibious safety feature.',
        source_url: 'https://eyefind.info/autos/coil-cyclone',
        thumbnail_url: 'http://127.0.0.1:8080/images/coil_car.jpg',
      },
      {
        title: 'Grotti Furia Sold Out in 12 Seconds to Corrupt South American Politicians',
        snippet: 'The new $3.8M Grotti Furia comes equipped with bullet-resistant tinted glass and custom champagne cooler.',
        source_url: 'https://legendarymotorsport.net/grotti/furia',
        thumbnail_url: 'http://127.0.0.1:8080/images/grotti.jpg',
      },
    ],
  },
  // Stocks & Finance
  {
    keywords: ['stocks', 'market', 'bawsaq', 'finance', 'crypto', 'bitcoin', 'bitbull', 'money'],
    results: [
      {
        title: 'BAWSAQ Daily: BitBull Surges 400% After Influencer Bleet, Plummets 95% 10 Minutes Later',
        snippet: 'Day traders in Vice City financial district report severe mood swings while Fleeca Bank freezes withdrawals.',
        source_url: 'https://bawsaq.com/market/bitbull-analysis',
        thumbnail_url: 'http://127.0.0.1:8080/images/bawsaq_chart.jpg',
      },
      {
        title: 'Fleeca Bank Introduces $45 Fee for Checking Your Account Balance',
        snippet: 'Fleeca executives defend the fee as a "motivational surcharge" to encourage customers to earn more cash.',
        source_url: 'https://fleecabank.net/fees/update',
        thumbnail_url: 'http://127.0.0.1:8080/images/fleeca.jpg',
      },
    ],
  },
  // Crime & Vice City News
  {
    keywords: ['crime', 'police', 'vcpd', 'heist', 'robbery', 'drugs', 'gator', 'wetlands', 'alligator'],
    results: [
      {
        title: 'Leonida Man Arrested After Attempting to Rob Ammu-Nation with Live Alligator',
        snippet: 'The suspect claimed the reptile was an emotional support weapon and demanded 50 boxes of 12-gauge shotgun shells.',
        source_url: 'https://weazelnews.com/leonida-man-alligator-robbery',
        thumbnail_url: 'http://127.0.0.1:8080/images/gator_crime.jpg',
      },
      {
        title: 'VCPD Speed Boat Fleet Expanded Following High-Speed Contraband Chase in Starfish Island',
        snippet: 'Police Chief promises more sirens, more strobe lights, and zero reduction in marine smuggling.',
        source_url: 'https://vcpd.gov.lc/press/speedboat-expansion',
        thumbnail_url: 'http://127.0.0.1:8080/images/vcpd_boat.jpg',
      },
    ],
  },
  // Weapons & Defense
  {
    keywords: ['gun', 'guns', 'weapon', 'weapons', 'ammu-nation', 'defense'],
    results: [
      {
        title: 'Ammu-Nation Annual Spring Clearance: Buy One Rocket Launcher, Get 500 Rounds of 9mm Free',
        snippet: 'Protect your front lawn from invasive iguanas and federal inspectors with heavy artillery discounts.',
        source_url: 'https://ammu-nation.net/promotions/spring-sale',
        thumbnail_url: 'http://127.0.0.1:8080/images/ammunation.jpg',
      },
    ],
  },
];

class MockSearchProvider {
  constructor() {
    this.name = 'mock';
  }

  /**
   * Generate realistic search results based on query keywords
   * @param {string} query - user query
   * @param {number} maxResults - max items
   * @returns {Promise<Array>} Mock results
   */
  async search(query, maxResults = 8) {
    const q = (query || '').toLowerCase();
    const matched = [];

    // Find direct category matches
    for (const entry of MOCK_DATABASE) {
      if (entry.keywords.some((kw) => q.includes(kw))) {
        matched.push(...entry.results);
      }
    }

    // If query didn't match specific keyword or needed more items, generate dynamic synthetic results
    if (matched.length < maxResults) {
      const synthetic = this._generateSyntheticResults(query, maxResults - matched.length);
      matched.push(...synthetic);
    }

    return matched.slice(0, maxResults);
  }

  _generateSyntheticResults(query, count) {
    const cleanQuery = sanitizeText(query || 'Vice City');
    const results = [];

    const templates = [
      {
        titleTemplate: (q) => `${q}: How Corporate Monopolies in Leonida Are Dominating the Industry`,
        snippetTemplate: (q) => `Recent market investigations into ${q} reveal unprecedented profits, zero tax liabilities, and widespread lobbying across Vice City council.`,
        path: 'market-analysis',
      },
      {
        titleTemplate: (q) => `Weazel News Investigation: Is ${q} Secretly Run by FIB Informants?`,
        snippetTemplate: (q) => `Leaked memos suggest ${q} operations in Port Gellhorn may be front organizations for clandestine government operations.`,
        path: 'investigation',
      },
      {
        titleTemplate: (q) => `Bleeter Users Launch Viral Boycott Against ${q} That Lasts Exactly 3 Hours`,
        snippetTemplate: (q) => `Hashtag trends surge across Leonida before users become distracted by new video of water scooter chase on Ocean Drive.`,
        path: 'social-trends',
      },
      {
        titleTemplate: (q) => `Dynasty 8 Real Estate Reports Record Demand for Luxury Properties Near ${q}`,
        snippetTemplate: (q) => `Penthouses overlooking Vice Beach continue to surge in value despite recurring helicopter dogfights overhead.`,
        path: 'real-estate',
      },
    ];

    for (let i = 0; i < count; i++) {
      const tmpl = templates[i % templates.length];
      results.push({
        title: tmpl.titleTemplate(cleanQuery),
        snippet: tmpl.snippetTemplate(cleanQuery),
        source_url: `https://eyefind.info/search/${encodeURIComponent(cleanQuery.toLowerCase())}/${tmpl.path}`,
        thumbnail_url: `http://127.0.0.1:8080/images/eyefind_${(i % 4) + 1}.jpg`,
      });
    }

    return results;
  }
}

const mockSearchProvider = new MockSearchProvider();

function generateMockResults(query, mode = 'satire', limit = 8) {
  const q = (query || '').toLowerCase();
  const matched = [];

  for (const entry of MOCK_DATABASE) {
    if (entry.keywords.some((kw) => q.includes(kw))) {
      matched.push(...entry.results);
    }
  }

  if (matched.length < limit) {
    const synthetic = mockSearchProvider._generateSyntheticResults(query, limit - matched.length);
    matched.push(...synthetic);
  }

  return matched.slice(0, limit).map((item, idx) => ({
    title: item.title,
    snippet: item.snippet,
    source_url: item.source_url,
    thumbnail_url: item.thumbnail_url,
    satirical_author: 'Weazel News Desk',
    market_impact: idx % 2 === 0 ? 0.25 : -0.15,
  }));
}

mockSearchProvider.generateMockResults = generateMockResults;

module.exports = mockSearchProvider;
module.exports.generateMockResults = generateMockResults;
