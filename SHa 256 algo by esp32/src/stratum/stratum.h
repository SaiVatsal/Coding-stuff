// ===========================================================================
// miniMiner — Stratum V1 Protocol Client
// stratum.h
// ===========================================================================

#pragma once

#include <Arduino.h>
#include <WiFiClient.h>
#include <cstdint>

/// Connection state of the Stratum client.
enum class StratumState {
    DISCONNECTED,
    CONNECTING,
    SUBSCRIBING,
    AUTHORIZING,
    MINING,
    ERROR
};

/// Network statistics fetched from external APIs.
struct NetworkStats {
    double   btcPriceUsd;
    double   networkHashrate;       // in EH/s
    uint64_t blockHeight;
    double   networkDifficulty;
    uint32_t halvingBlock;          // next halving block number
    bool     valid;                  // has data been fetched at least once?
};

namespace stratum {

/// Initialize the Stratum client. Call once during setup().
void init();

/// Set pool connection parameters.
void configure(const String& poolUrl, uint16_t poolPort,
               const String& walletAddress, const String& workerName,
               const String& password = "x");

/// Main loop — call this repeatedly from the system loop.
/// Handles connection, subscription, authorization, job dispatch,
/// and share submission. Non-blocking.
void loop();

/// Get the current connection state.
StratumState getState();

/// Get a human-readable status string.
String getStatusString();

/// Check if connected and authorized (ready to mine).
bool isReady();

/// Get the pool URL we're connected to.
String getPoolUrl();

/// Get the network stats (populated by the API client).
NetworkStats getNetworkStats();

/// Update network stats (called by the API client).
void setNetworkStats(const NetworkStats& stats);

/// Force a reconnect (e.g., after config change).
void reconnect();

/// Disconnect from the pool.
void disconnect();

} // namespace stratum
