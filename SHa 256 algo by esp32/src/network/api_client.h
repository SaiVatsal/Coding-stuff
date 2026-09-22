// ===========================================================================
// miniMiner — Network API Client
// api_client.h
// ===========================================================================

#pragma once

#include <Arduino.h>

namespace apiclient {

/// Initialize the API client.
void init();

/// Fetch latest Bitcoin network stats (block height, price, difficulty).
/// Call this periodically (every 5 minutes). Non-blocking — runs async.
void fetchNetworkStats();

/// Check if a fetch is currently in progress.
bool isFetching();

} // namespace apiclient
