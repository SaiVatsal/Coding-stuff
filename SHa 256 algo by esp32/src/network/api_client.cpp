// ===========================================================================
// miniMiner — Network API Client Implementation
// api_client.cpp
// ===========================================================================
// Fetches Bitcoin network stats from public APIs:
//   - mempool.space: block height, difficulty, hashrate
//   - CoinGecko: BTC/USD price
// ===========================================================================

#include "api_client.h"
#include "../stratum/stratum.h"
#include "../hal/board_config.h"

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

namespace apiclient {

static bool          s_fetching = false;
static unsigned long s_lastFetch = 0;

// ---------------------------------------------------------------------------
// API endpoints
// ---------------------------------------------------------------------------

static const char* MEMPOOL_TIP_URL    = "https://mempool.space/api/blocks/tip/height";
static const char* MEMPOOL_DIFF_URL   = "https://mempool.space/api/v1/mining/hashrate/1d";
static const char* COINGECKO_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd";

// ---------------------------------------------------------------------------
// Fetch helpers
// ---------------------------------------------------------------------------

static bool httpGet(const char* url, String& response) {
    HTTPClient http;
    http.begin(url);
    http.setTimeout(10000);
    http.addHeader("User-Agent", "miniMiner/" MINI_MINER_VERSION);

    int code = http.GET();
    if (code == HTTP_CODE_OK) {
        response = http.getString();
        http.end();
        return true;
    }

    Serial.printf("[API] HTTP %d from %s\n", code, url);
    http.end();
    return false;
}

/// Fetch block height from mempool.space
static uint64_t fetchBlockHeight() {
    String resp;
    if (httpGet(MEMPOOL_TIP_URL, resp)) {
        return resp.toInt();
    }
    return 0;
}

/// Fetch hashrate and difficulty from mempool.space
static void fetchHashrateAndDifficulty(double& hashrate, double& difficulty) {
    String resp;
    if (!httpGet(MEMPOOL_DIFF_URL, resp)) return;

    StaticJsonDocument<2048> doc;
    if (deserializeJson(doc, resp)) return;

    // mempool.space returns: { hashrates: [...], difficulty: [...], currentHashrate, currentDifficulty }
    if (doc.containsKey("currentHashrate")) {
        hashrate = doc["currentHashrate"].as<double>() / 1e18;  // convert to EH/s
    }
    if (doc.containsKey("currentDifficulty")) {
        difficulty = doc["currentDifficulty"].as<double>();
    }
}

/// Fetch BTC price from CoinGecko
static double fetchBtcPrice() {
    String resp;
    if (!httpGet(COINGECKO_PRICE_URL, resp)) return 0;

    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, resp)) return 0;

    return doc["bitcoin"]["usd"].as<double>();
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

void init() {
    s_lastFetch = 0;
    s_fetching = false;
}

void fetchNetworkStats() {
    if (WiFi.status() != WL_CONNECTED) return;

    unsigned long now = millis();
    if (now - s_lastFetch < NETWORK_STATS_MS && s_lastFetch > 0) return;
    s_lastFetch = now;

    s_fetching = true;
    Serial.println("[API] Fetching network stats...");

    NetworkStats stats = stratum::getNetworkStats();

    // Block height
    uint64_t height = fetchBlockHeight();
    if (height > 0) {
        stats.blockHeight = height;
        Serial.printf("[API] Block height: %llu\n", (unsigned long long)height);
    }

    // Hashrate and difficulty
    double hashrate = 0, difficulty = 0;
    fetchHashrateAndDifficulty(hashrate, difficulty);
    if (hashrate > 0) {
        stats.networkHashrate = hashrate;
        Serial.printf("[API] Network hashrate: %.2f EH/s\n", hashrate);
    }
    if (difficulty > 0) {
        stats.networkDifficulty = difficulty;
        Serial.printf("[API] Network difficulty: %.2f T\n", difficulty / 1e12);
    }

    // BTC price
    double price = fetchBtcPrice();
    if (price > 0) {
        stats.btcPriceUsd = price;
        Serial.printf("[API] BTC price: $%.0f\n", price);
    }

    // Halving calculation
    stats.halvingBlock = ((stats.blockHeight / 210000) + 1) * 210000;

    stats.valid = (stats.blockHeight > 0);
    stratum::setNetworkStats(stats);

    s_fetching = false;
    Serial.println("[API] Network stats updated");
}

bool isFetching() {
    return s_fetching;
}

} // namespace apiclient
