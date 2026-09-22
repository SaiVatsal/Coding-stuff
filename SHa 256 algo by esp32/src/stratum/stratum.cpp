// ===========================================================================
// miniMiner — Stratum V1 Protocol Client Implementation
// stratum.cpp
// ===========================================================================

#include "stratum.h"
#include "../mining/miner.h"
#include "../utils/bitcoin_utils.h"
#include "../hal/board_config.h"

#include <WiFiClient.h>
#include <ArduinoJson.h>

namespace stratum {

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

static WiFiClient    s_client;
static StratumState  s_state            = StratumState::DISCONNECTED;
static String        s_poolUrl;
static uint16_t      s_poolPort         = DEFAULT_POOL_PORT;
static String        s_walletAddress;
static String        s_workerName       = DEFAULT_WORKER_NAME;
static String        s_password         = "x";

// Stratum session data
static String        s_extraNonce1;
static int           s_extraNonce2Size  = 4;
static uint32_t      s_extraNonce2Counter = 0;
static int           s_messageId        = 1;
static double        s_poolDifficulty   = 1.0;

// Reconnect backoff
static unsigned long s_lastReconnectAttempt = 0;
static unsigned long s_reconnectDelay       = 1000;    // start at 1s
static const unsigned long RECONNECT_MAX    = 60000;   // max 60s

// Network stats (populated by api_client)
static NetworkStats  s_networkStats = { 0, 0, 0, 0, 0, false };

// Buffer for incoming data
static String        s_rxBuffer;

// Merkle branches storage
static const int     MAX_MERKLE_BRANCHES = 16;
static uint8_t       s_merkleBranches[MAX_MERKLE_BRANCHES][32];
static int           s_merkleBranchCount = 0;

// Coinbase components
static uint8_t       s_coinbase1[256];
static size_t        s_coinbase1Len = 0;
static uint8_t       s_coinbase2[256];
static size_t        s_coinbase2Len = 0;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

static void sendMessage(const String& msg) {
    if (!s_client.connected()) return;
    s_client.print(msg + "\n");
    Serial.printf("[STRATUM] TX: %s\n", msg.c_str());
}

static String buildSubscribe() {
    StaticJsonDocument<256> doc;
    doc["id"] = s_messageId++;
    doc["method"] = "mining.subscribe";
    JsonArray params = doc.createNestedArray("params");
    params.add(MINI_MINER_NAME "/" MINI_MINER_VERSION);
    String out;
    serializeJson(doc, out);
    return out;
}

static String buildAuthorize() {
    StaticJsonDocument<256> doc;
    doc["id"] = s_messageId++;
    doc["method"] = "mining.authorize";
    JsonArray params = doc.createNestedArray("params");
    // Username format: walletAddress.workerName
    String user = s_walletAddress;
    if (s_workerName.length() > 0) {
        user += "." + s_workerName;
    }
    params.add(user);
    params.add(s_password);
    String out;
    serializeJson(doc, out);
    return out;
}

static String buildSubmit(const MiningResult& result) {
    StaticJsonDocument<512> doc;
    doc["id"] = s_messageId++;
    doc["method"] = "mining.submit";
    JsonArray params = doc.createNestedArray("params");

    String user = s_walletAddress;
    if (s_workerName.length() > 0) {
        user += "." + s_workerName;
    }
    params.add(user);
    params.add(result.jobId);
    params.add(result.extraNonce2);

    // ntime as hex string
    char ntimeHex[9];
    snprintf(ntimeHex, sizeof(ntimeHex), "%08x", result.ntime);
    params.add(ntimeHex);

    // nonce as hex string
    char nonceHex[9];
    snprintf(nonceHex, sizeof(nonceHex), "%08x", result.nonce);
    params.add(nonceHex);

    String out;
    serializeJson(doc, out);
    return out;
}

/// Generate the next extraNonce2 value as a hex string.
static String nextExtraNonce2() {
    s_extraNonce2Counter++;
    char buf[17];
    // Pad to the required length (extraNonce2Size * 2 hex chars)
    snprintf(buf, sizeof(buf), "%0*x", s_extraNonce2Size * 2, s_extraNonce2Counter);
    return String(buf);
}

/// Process a mining.notify message — parse the job and dispatch to the miner.
static void handleNotify(JsonArray& params) {
    if (params.size() < 9) {
        Serial.println("[STRATUM] Invalid mining.notify params");
        return;
    }

    const char* jobId     = params[0];
    const char* prevHash  = params[1];
    const char* coinbase1 = params[2];
    const char* coinbase2 = params[3];
    JsonArray   branches  = params[4];
    const char* version   = params[5];
    const char* nbits     = params[6];
    const char* ntime     = params[7];
    bool        cleanJobs = params[8];

    // Parse coinbase parts
    s_coinbase1Len = btc::fromHex(String(coinbase1), s_coinbase1, sizeof(s_coinbase1));
    s_coinbase2Len = btc::fromHex(String(coinbase2), s_coinbase2, sizeof(s_coinbase2));

    // Parse merkle branches
    s_merkleBranchCount = min((int)branches.size(), MAX_MERKLE_BRANCHES);
    for (int i = 0; i < s_merkleBranchCount; i++) {
        btc::fromHex(String((const char*)branches[i]), s_merkleBranches[i], 32);
    }

    // Generate extraNonce2
    String en2Hex = nextExtraNonce2();
    uint8_t en2Bytes[8];
    size_t en2Len = btc::fromHex(en2Hex, en2Bytes, sizeof(en2Bytes));

    // Build coinbase transaction
    uint8_t en1Bytes[8];
    size_t en1Len = btc::fromHex(s_extraNonce1, en1Bytes, sizeof(en1Bytes));

    uint8_t coinbaseTx[512];
    size_t cbLen = btc::buildCoinbase(coinbaseTx, sizeof(coinbaseTx),
                                       s_coinbase1, s_coinbase1Len,
                                       en1Bytes, en1Len,
                                       en2Bytes, en2Len,
                                       s_coinbase2, s_coinbase2Len);

    // Hash the coinbase transaction
    uint8_t coinbaseHash[32];
    btc::sha256d(coinbaseTx, cbLen, coinbaseHash);

    // Compute the Merkle root
    uint8_t merkleRoot[32];
    btc::computeMerkleRoot(coinbaseHash, s_merkleBranches,
                           s_merkleBranchCount, merkleRoot);

    // Build the mining job
    MiningJob job;
    memset(&job, 0, sizeof(job));
    strncpy(job.jobId, jobId, sizeof(job.jobId) - 1);

    // Parse prevhash — Stratum sends it in a weird 8-segment reversed format
    uint8_t rawPrevHash[32];
    btc::fromHex(String(prevHash), rawPrevHash, 32);
    // Reverse each 4-byte word
    for (int i = 0; i < 8; i++) {
        btc::reverseBytes(rawPrevHash + i * 4, 4);
    }
    memcpy(job.prevHash, rawPrevHash, 32);

    memcpy(job.merkleRoot, merkleRoot, 32);

    // Parse version, nbits, ntime as little-endian uint32
    uint8_t versionBytes[4];
    btc::fromHex(String(version), versionBytes, 4);
    memcpy(&job.version, versionBytes, 4);

    uint8_t nbitsBytes[4];
    btc::fromHex(String(nbits), nbitsBytes, 4);
    memcpy(&job.nbits, nbitsBytes, 4);

    uint8_t ntimeBytes[4];
    btc::fromHex(String(ntime), ntimeBytes, 4);
    memcpy(&job.ntime, ntimeBytes, 4);

    job.poolDifficulty = s_poolDifficulty;
    job.cleanJobs = cleanJobs;

    // Compute target from pool difficulty
    btc::difficultyToTarget(s_poolDifficulty, job.target);

    // Set extraNonce2 on the miner
    miner::setExtraNonce2(en2Hex.c_str());

    // Dispatch to the mining engine
    miner::submitJob(job);
}

/// Process a received JSON-RPC message.
static void processMessage(const String& line) {
    Serial.printf("[STRATUM] RX: %s\n", line.c_str());

    StaticJsonDocument<2048> doc;
    DeserializationError err = deserializeJson(doc, line);
    if (err) {
        Serial.printf("[STRATUM] JSON parse error: %s\n", err.c_str());
        return;
    }

    // Check if it's a notification (no "id" or id is null)
    if (doc.containsKey("method")) {
        String method = doc["method"].as<String>();

        if (method == "mining.notify") {
            JsonArray params = doc["params"];
            handleNotify(params);
        }
        else if (method == "mining.set_difficulty") {
            JsonArray params = doc["params"];
            if (params.size() > 0) {
                s_poolDifficulty = params[0].as<double>();
                Serial.printf("[STRATUM] Pool difficulty set to: %.4f\n", s_poolDifficulty);
            }
        }
        else if (method == "client.reconnect") {
            Serial.println("[STRATUM] Pool requested reconnect");
            reconnect();
        }
        return;
    }

    // It's a response to one of our requests
    int id = doc["id"] | 0;
    bool hasError = !doc["error"].isNull();

    if (s_state == StratumState::SUBSCRIBING) {
        // Response to mining.subscribe
        if (hasError) {
            Serial.println("[STRATUM] Subscribe failed!");
            s_state = StratumState::ERROR;
            return;
        }

        JsonArray result = doc["result"];
        if (result.size() >= 3) {
            s_extraNonce1 = result[1].as<String>();
            s_extraNonce2Size = result[2].as<int>();
        } else if (result.size() >= 2) {
            // Some pools return [subscriptions, extraNonce1, extraNonce2Size]
            s_extraNonce1 = result[1].as<String>();
            s_extraNonce2Size = 4;
        }

        Serial.printf("[STRATUM] Subscribed. extraNonce1=%s, extraNonce2Size=%d\n",
                       s_extraNonce1.c_str(), s_extraNonce2Size);

        // Now authorize
        s_state = StratumState::AUTHORIZING;
        sendMessage(buildAuthorize());
    }
    else if (s_state == StratumState::AUTHORIZING) {
        // Response to mining.authorize
        bool authorized = doc["result"] | false;
        if (!authorized || hasError) {
            Serial.println("[STRATUM] Authorization FAILED! Check wallet address.");
            s_state = StratumState::ERROR;
            return;
        }

        Serial.println("[STRATUM] Authorized successfully!");
        s_state = StratumState::MINING;
        s_reconnectDelay = 1000;  // reset backoff on successful connection
    }
    else if (s_state == StratumState::MINING) {
        // Response to mining.submit
        bool accepted = doc["result"] | false;
        if (accepted) {
            Serial.println("[STRATUM] Share ACCEPTED!");
            miner::recordShareAccepted();
        } else {
            String reason = "unknown";
            if (doc.containsKey("error") && !doc["error"].isNull()) {
                JsonArray errArr = doc["error"];
                if (errArr.size() >= 2) {
                    reason = errArr[1].as<String>();
                }
            }
            Serial.printf("[STRATUM] Share REJECTED: %s\n", reason.c_str());
            miner::recordShareRejected();
        }
    }
}

// ---------------------------------------------------------------------------
// Connection management
// ---------------------------------------------------------------------------

static void attemptConnect() {
    unsigned long now = millis();
    if (now - s_lastReconnectAttempt < s_reconnectDelay) return;
    s_lastReconnectAttempt = now;

    Serial.printf("[STRATUM] Connecting to %s:%d...\n", s_poolUrl.c_str(), s_poolPort);
    s_state = StratumState::CONNECTING;

    if (s_client.connect(s_poolUrl.c_str(), s_poolPort, 10000)) {
        Serial.println("[STRATUM] TCP connected!");
        s_state = StratumState::SUBSCRIBING;
        s_rxBuffer = "";
        sendMessage(buildSubscribe());
    } else {
        Serial.println("[STRATUM] Connection failed");
        s_state = StratumState::DISCONNECTED;
        // Exponential backoff
        s_reconnectDelay = min(s_reconnectDelay * 2, RECONNECT_MAX);
        Serial.printf("[STRATUM] Retry in %lu ms\n", s_reconnectDelay);
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

void init() {
    s_state = StratumState::DISCONNECTED;
    s_messageId = 1;
    s_extraNonce2Counter = 0;
    s_reconnectDelay = 1000;
    s_rxBuffer.reserve(4096);
}

void configure(const String& poolUrl, uint16_t poolPort,
               const String& walletAddress, const String& workerName,
               const String& password) {
    s_poolUrl        = poolUrl;
    s_poolPort       = poolPort;
    s_walletAddress  = walletAddress;
    s_workerName     = workerName;
    s_password       = password;
}

void loop() {
    // Handle connection
    if (s_state == StratumState::DISCONNECTED || s_state == StratumState::ERROR) {
        attemptConnect();
        return;
    }

    // Check if still connected
    if (!s_client.connected()) {
        Serial.println("[STRATUM] Disconnected from pool");
        s_client.stop();
        s_state = StratumState::DISCONNECTED;
        return;
    }

    // Read incoming data
    while (s_client.available()) {
        char c = s_client.read();
        if (c == '\n') {
            if (s_rxBuffer.length() > 0) {
                processMessage(s_rxBuffer);
                s_rxBuffer = "";
            }
        } else {
            s_rxBuffer += c;
            // Safety: prevent buffer overflow from malformed data
            if (s_rxBuffer.length() > 8192) {
                Serial.println("[STRATUM] RX buffer overflow, clearing");
                s_rxBuffer = "";
            }
        }
    }

    // Submit mining results to the pool
    if (s_state == StratumState::MINING) {
        MiningResult result;
        QueueHandle_t resultQ = miner::getResultQueue();
        while (xQueueReceive(resultQ, &result, 0) == pdTRUE) {
            sendMessage(buildSubmit(result));
        }
    }
}

StratumState getState() {
    return s_state;
}

String getStatusString() {
    switch (s_state) {
        case StratumState::DISCONNECTED: return "Disconnected";
        case StratumState::CONNECTING:   return "Connecting...";
        case StratumState::SUBSCRIBING:  return "Subscribing...";
        case StratumState::AUTHORIZING:  return "Authorizing...";
        case StratumState::MINING:       return "Mining";
        case StratumState::ERROR:        return "Error";
        default:                         return "Unknown";
    }
}

bool isReady() {
    return s_state == StratumState::MINING;
}

String getPoolUrl() {
    return s_poolUrl + ":" + String(s_poolPort);
}

NetworkStats getNetworkStats() {
    return s_networkStats;
}

void setNetworkStats(const NetworkStats& stats) {
    s_networkStats = stats;
}

void reconnect() {
    s_client.stop();
    s_state = StratumState::DISCONNECTED;
    s_reconnectDelay = 1000;
    s_messageId = 1;
}

void disconnect() {
    s_client.stop();
    s_state = StratumState::DISCONNECTED;
}

} // namespace stratum
