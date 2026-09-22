// ===========================================================================
// miniMiner — SHA-256 Midstate Optimization
// sha256_midstate.h
// ===========================================================================
// The block header is 80 bytes. SHA-256 processes data in 64-byte blocks.
// Since the first 64 bytes of the header (version, prevhash, partial merkle)
// stay constant while we iterate nonces, we can precompute the "midstate"
// (the SHA-256 internal state after processing the first 64 bytes) and only
// hash the remaining 16 bytes (partial merkle + ntime + nbits + nonce) per
// iteration. This roughly doubles mining speed.
// ===========================================================================

#pragma once

#include <cstdint>
#include <cstring>
#include "mbedtls/sha256.h"

struct Sha256Midstate {
    mbedtls_sha256_context ctx;    // frozen state after first 64 bytes
    uint8_t tail[16];              // bytes 64..79 of the header (pre-nonce)
    bool valid;

    Sha256Midstate() : valid(false) {
        mbedtls_sha256_init(&ctx);
    }

    ~Sha256Midstate() {
        mbedtls_sha256_free(&ctx);
    }

    /// Precompute the midstate from a full 80-byte block header.
    /// After calling this, you can use `hashWithNonce()` to quickly
    /// hash with different nonce values.
    void precompute(const uint8_t* header80) {
        // Process the first 64 bytes to get the midstate
        mbedtls_sha256_init(&ctx);
        mbedtls_sha256_starts(&ctx, 0);
        mbedtls_sha256_update(&ctx, header80, 64);

        // Save the remaining 16 bytes (we'll overwrite the last 4 with nonce)
        memcpy(tail, header80 + 64, 16);
        valid = true;
    }

    /// Hash the block header with a specific nonce value.
    /// Uses the precomputed midstate for speed.
    /// Writes the double-SHA256 result to `hash` (32 bytes).
    inline void hashWithNonce(uint32_t nonce, uint8_t* hash) const {
        // Clone the midstate context
        mbedtls_sha256_context work;
        mbedtls_sha256_init(&work);
        mbedtls_sha256_clone(&work, &ctx);

        // Build the tail with this nonce
        uint8_t finalBlock[16];
        memcpy(finalBlock, tail, 12);                  // merkle[28..31] + ntime + nbits
        memcpy(finalBlock + 12, &nonce, 4);            // nonce (little-endian)

        // Finish the first SHA-256
        mbedtls_sha256_update(&work, finalBlock, 16);
        uint8_t firstHash[32];
        mbedtls_sha256_finish(&work, firstHash);
        mbedtls_sha256_free(&work);

        // Second SHA-256
        mbedtls_sha256_init(&work);
        mbedtls_sha256_starts(&work, 0);
        mbedtls_sha256_update(&work, firstHash, 32);
        mbedtls_sha256_finish(&work, hash);
        mbedtls_sha256_free(&work);
    }
};
