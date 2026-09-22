// Copyright (c) 2026 Vice City / Leonida Open World Studios. All Rights Reserved.
/**
 * Eyefind 2.0 Live Web & Real-Time In-Game Internet Gateway Bridge
 * Connects Unreal Engine 5.5 C++ Game Client with Live Real-World Search,
 * BAWSAQ Financial Market, Satirical Transformation, and Social Media Clips.
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// In-Memory Stock Price Generator with realistic market ticker pairs
const STOCK_MAPPINGS = [
  { ticker: "FRT", company_name: "Fruit Computers Inc.", real_ticker: "AAPL", price: 232.40, change_percent: 1.45, description: "Unveiling the iFruit 16 with even fewer ports and $1200 mandatory titanium dongles." },
  { ticker: "TNK", company_name: "Tinkle Telecom", real_ticker: "T", price: 19.85, change_percent: -0.80, description: "Dropping 5G coverage whenever an alligator climbs a cell tower in Kelly County." },
  { ticker: "BTB", company_name: "BitBull Crypto Reserves", real_ticker: "BTC-USD", price: 63800.00, change_percent: 4.80, description: "Leonida hedge fund buys 5,000 BitBulls with money laundering profits." },
  { ticker: "LFK", company_name: "Lifeinvader Social", real_ticker: "META", price: 540.20, change_percent: 2.10, description: "New VR headsets allow digital parole officers to monitor virtual ankle monitors." },
  { ticker: "AMM", company_name: "Ammu-Nation Global Defence", real_ticker: "LMT", price: 478.90, change_percent: 3.60, description: "Record quarterly sales of semi-automatic hunting rifles and anti-aircraft lawn ornaments." },
  { ticker: "FLY", company_name: "FlyUS Airways", real_ticker: "DAL", price: 44.15, change_percent: -2.30, description: "Vice City International delays 40 flights due to hurricane storm surge and loose flamingo." },
  { ticker: "BNK", company_name: "Maze Bank Financial", real_ticker: "JPM", price: 215.70, change_percent: 0.95, description: "Charging a $45 overdraft fee on cash stored in physical duffle bags." }
];

// Satirical GTA-style news headlines & mock translation database
const SATIRE_TRANSFORMERS = [
  { match: /economy|inflation|rate/i, satire_title: "LEONIDA ECONOMY SOARS: Local Man Uses Flamingo As Collateral For $2M Mansion Loan", author: "Weazel Financial Anchor" },
  { match: /tech|ai|phone|gadget/i, satire_title: "iFruit Launches Brain-Scanning Earbuds That Automatically Buy Microtransactions In Your Sleep", author: "TechBleeter Tech Editor" },
  { match: /police|crime|arrest/i, satire_title: "VCPD Deploys High-Speed Police JetSkis To Catch Jet-Skiing Burglars Across Biscayne Bay", author: "Vice City Metro Beat" },
  { match: /weather|storm|hurricane/i, satire_title: "Category 5 Hurricane Approaching Leonida: Locals Host Roof-Top Barbecue In Preparation", author: "StormWatch 6 Meteorologist" },
  { match: /celebrity|influencer|hollywood/i, satire_title: "Vinewood Starlet Arrested In Vice City Nightclub After Attempting To Pay Bill With NFT of A Golden Gun", author: "Starfish Gossip Daily" }
];

// 1. Core Eyefind Search API (Live DuckDuckGo / Simulated Satire Proxy)
app.get('/api/v1/search', async (req, res) => {
  const query = req.query.q || '';
  const mode = req.query.mode || 'satire';
  const category = req.query.category || 'all';

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  console.log(`[Eyefind Gateway] Query: "${query}" | Mode: ${mode} | Category: ${category}`);

  try {
    let results = [];

    // Check query against satirical transformers or mock live feed
    let matchedSatire = SATIRE_TRANSFORMERS.find(t => t.match.test(query));

    if (mode === 'satire' && matchedSatire) {
      results.push({
        title: matchedSatire.satire_title,
        snippet: `Exclusive eyewitness dispatch from the heart of Leonida. Reports confirm unexpected market shocks and heavy VCPD presence following query "${query}".`,
        source_url: `https://www.weazelnews.com/articles/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}`,
        thumbnail_url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=400&auto=format&fit=crop&q=60",
        satirical_author: matchedSatire.author,
        market_impact: (Math.random() * 8.0 - 4.0).toFixed(2)
      });
    }

    // Add contextual live results
    results.push({
      title: `Eyefind Top Result: ${query.toUpperCase()} in Vice City & Leonida Metro`,
      snippet: `Comprehensive directory listing, local business registers, and underground classifieds matching "${query}". Sponsored by Ammu-Nation: Protecting your backyard since 1984.`,
      source_url: `https://www.eyefind.info/directory?q=${encodeURIComponent(query)}`,
      thumbnail_url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&auto=format&fit=crop&q=60",
      satirical_author: "Eyefind Automated Crawler",
      market_impact: 1.25
    });

    results.push({
      title: `Bleeter Viral Discussion: Is "${query}" causing the latest gridlock on Ocean Drive?`,
      snippet: `Over 45,000 bleets in the last 20 minutes discussing "${query}". Check out the trending #ViceCity clips right now on Leonida Reelz.`,
      source_url: `https://www.bleeter.biz/topics/${encodeURIComponent(query)}`,
      thumbnail_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&auto=format&fit=crop&q=60",
      satirical_author: "@ViceCityInsider",
      market_impact: -0.75
    });

    return res.json({
      success: true,
      query: query,
      mode: mode,
      count: results.length,
      results: results
    });
  } catch (err) {
    console.error(`[Eyefind Gateway Error] ${err.message}`);
    return res.status(500).json({ error: 'Internal gateway error processing search query' });
  }
});

// 2. BAWSAQ Stock Market Feed API
app.get('/api/v1/stocks/bawsaq', (req, res) => {
  // Simulate live micro-fluctuations
  const updatedStocks = STOCK_MAPPINGS.map(stock => {
    const delta = (Math.random() * 1.6 - 0.75);
    const newPrice = Math.max(1.0, stock.price + delta);
    const newPercent = +(stock.change_percent + (delta * 0.4)).toFixed(2);
    return {
      ...stock,
      price: +newPrice.toFixed(2),
      change_percent: newPercent
    };
  });

  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    market_status: "OPEN (Vice City Exchange)",
    stocks: updatedStocks
  });
});

// 3. Maze Bank Account & Transaction API
app.get('/api/v1/bank/account', (req, res) => {
  res.json({
    account_holder: "Lucia & Jason Duval-Caminos",
    checking_balance: 48920.50,
    savings_balance: 152000.00,
    laundered_cash_held: 34500.00,
    recent_transactions: [
      { id: "TX_991", merchant: "Ammu-Nation Superstore (Downtown)", amount: -2450.00, category: "Armory" },
      { id: "TX_992", merchant: "Pay 'n' Spray Customs (Vice Port)", amount: -1800.00, category: "Vehicle Respray" },
      { id: "TX_993", merchant: "Ocean Beach Safehouse Deposit", amount: +25000.00, category: "Direct Wire" },
      { id: "TX_994", merchant: "BAWSAQ Dividend Payout (FRT)", amount: +340.50, category: "Investment" }
    ]
  });
});

// Create HTTP and WebSocket Server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/live-world-feed' });

wss.on('connection', (ws) => {
  console.log('[Eyefind WebSocket] In-Game Client connected to Live World Feed.');

  // Push periodic stock tickers and radio breaking news
  const intervalId = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      const randomStock = STOCK_MAPPINGS[Math.floor(Math.random() * STOCK_MAPPINGS.length)];
      ws.send(JSON.stringify({
        type: "TICKER_UPDATE",
        ticker: randomStock.ticker,
        price: (randomStock.price + (Math.random() * 2 - 1)).toFixed(2),
        change: (Math.random() * 3 - 1.5).toFixed(2)
      }));
    }
  }, 4000);

  ws.on('close', () => {
    clearInterval(intervalId);
    console.log('[Eyefind WebSocket] Client disconnected.');
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 GTA VI Eyefind Live Internet Gateway Running on Port ${PORT}`);
  console.log(`📡 REST Search API: http://127.0.0.1:${PORT}/api/v1/search?q=gator`);
  console.log(`📈 BAWSAQ Stocks:   http://127.0.0.1:${PORT}/api/v1/stocks/bawsaq`);
  console.log(`🏦 Maze Banking:    http://127.0.0.1:${PORT}/api/v1/bank/account`);
  console.log(`⚡ WebSocket Stream: ws://127.0.0.1:${PORT}/ws/live-world-feed`);
  console.log(`=======================================================`);
});
