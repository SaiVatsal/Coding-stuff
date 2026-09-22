// ===========================================================================
// miniMiner — Mining Engine
// miner.h
// ===========================================================================

#pragma once

#include <Arduino.h>
#include <freertos/FreeRTOS.h>
#include <freertos/queue.h>
#include <cstdint>

// ---------------------------------------------------------------------------
// Data structures shared between Stratum client and miner
// ---------------------------------------------------------------------------

/// A mining job received from the Stratum pool.
struct MiningJob {
    char     jobId[64];              // pool-assigned job identifier
    uint8_t  prevHash[32];           // previous block hash
    uint8_t  merkleRoot[32];         // computed merkle root
    uint32_t version;                // block version
    uint32_t nbits;                  // difficulty target (compact)
    uint32_t ntime;                  // block timestamp
    double   poolDifficulty;         // pool-assigned difficulty
    uint8_t  target[32];             // 256-bit target derived from difficulty
    bool     cleanJobs;              // if true, discard previous work
};

/// Result of finding a valid share.
struct MiningResult {
    char     jobId[64];
    uint32_t nonce;
    uint32_t ntime;
    char     extraNonce2[32];        // hex string
    double   difficulty;             // achieved difficulty
};

/// Live statistics from the mining engine.
struct MiningStats {
    double        hashrate;          // hashes per second (rolling average)
    uint64_t      totalHashes;       // total hashes computed since boot
    uint32_t      sharesAccepted;    // shares accepted by pool
    uint32_t      sharesRejected;    // shares rejected by pool
    double        bestDifficulty;    // best difficulty ever achieved
    unsigned long uptimeSeconds;     // seconds since mining started
    bool          isMining;          // currently hashing?
    uint32_t      templates;         // number of job templates received
};

// ---------------------------------------------------------------------------
// Miner API
// ---------------------------------------------------------------------------

namespace miner {

/// Initialize the mining engine. Call once from setup().
void init();

/// Start the mining task (spawns on appropriate core).
void start();

/// Stop the mining task gracefully.
void stop();

/// Submit a new job for the miner to work on.
/// This is called by the Stratum client when a mining.notify arrives.
void submitJob(const MiningJob& job);

/// Get the current mining statistics (thread-safe snapshot).
MiningStats getStats();

/// Record a share acceptance from the pool.
void recordShareAccepted();

/// Record a share rejection from the pool.
void recordShareRejected();

/// Get the queue handle for receiving mining results.
/// The Stratum client reads from this queue to submit shares.
QueueHandle_t getResultQueue();

/// Set the extranonce2 value for the current mining session.
void setExtraNonce2(const char* hexValue);

} // namespace miner
