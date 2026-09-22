// ===========================================================================
// miniMiner — Bitcoin Utility Functions
// bitcoin_utils.cpp
// ===========================================================================

#include "bitcoin_utils.h"
#include "mbedtls/sha256.h"
#include <cmath>

namespace btc {

// ---------------------------------------------------------------------------
// Hex encoding / decoding
// ---------------------------------------------------------------------------

String toHex(const uint8_t* data, size_t len) {
    static const char hexChars[] = "0123456789abcdef";
    String result;
    result.reserve(len * 2);
    for (size_t i = 0; i < len; i++) {
        result += hexChars[(data[i] >> 4) & 0x0F];
        result += hexChars[data[i] & 0x0F];
    }
    return result;
}

size_t fromHex(const String& hex, uint8_t* out, size_t maxLen) {
    size_t hexLen = hex.length();
    size_t byteLen = hexLen / 2;
    if (byteLen > maxLen) byteLen = maxLen;

    for (size_t i = 0; i < byteLen; i++) {
        char hi = hex.charAt(i * 2);
        char lo = hex.charAt(i * 2 + 1);

        auto nibble = [](char c) -> uint8_t {
            if (c >= '0' && c <= '9') return c - '0';
            if (c >= 'a' && c <= 'f') return c - 'a' + 10;
            if (c >= 'A' && c <= 'F') return c - 'A' + 10;
            return 0;
        };

        out[i] = (nibble(hi) << 4) | nibble(lo);
    }
    return byteLen;
}

// ---------------------------------------------------------------------------
// Byte manipulation
// ---------------------------------------------------------------------------

void reverseBytes(uint8_t* data, size_t len) {
    for (size_t i = 0; i < len / 2; i++) {
        uint8_t tmp = data[i];
        data[i] = data[len - 1 - i];
        data[len - 1 - i] = tmp;
    }
}

void reverseCopy(uint8_t* dst, const uint8_t* src, size_t len) {
    for (size_t i = 0; i < len; i++) {
        dst[i] = src[len - 1 - i];
    }
}

uint32_t swapEndian32(uint32_t val) {
    return ((val & 0xFF000000) >> 24) |
           ((val & 0x00FF0000) >> 8)  |
           ((val & 0x0000FF00) << 8)  |
           ((val & 0x000000FF) << 24);
}

// ---------------------------------------------------------------------------
// SHA-256 helpers (using mbedtls for hardware acceleration)
// ---------------------------------------------------------------------------

void sha256(const uint8_t* data, size_t len, uint8_t* hash) {
    mbedtls_sha256_context ctx;
    mbedtls_sha256_init(&ctx);
    mbedtls_sha256_starts(&ctx, 0);  // 0 = SHA-256 (not SHA-224)
    mbedtls_sha256_update(&ctx, data, len);
    mbedtls_sha256_finish(&ctx, hash);
    mbedtls_sha256_free(&ctx);
}

void sha256d(const uint8_t* data, size_t len, uint8_t* hash) {
    uint8_t firstHash[32];
    sha256(data, len, firstHash);
    sha256(firstHash, 32, hash);
}

// ---------------------------------------------------------------------------
// Merkle root computation
// ---------------------------------------------------------------------------

void computeMerkleRoot(const uint8_t* coinbaseHash,
                       const uint8_t branches[][32],
                       size_t branchCount,
                       uint8_t* merkleRoot) {
    // Start with the coinbase hash
    uint8_t current[32];
    memcpy(current, coinbaseHash, 32);

    // Concatenate with each branch and double-hash
    uint8_t concat[64];
    for (size_t i = 0; i < branchCount; i++) {
        memcpy(concat, current, 32);
        memcpy(concat + 32, branches[i], 32);
        sha256d(concat, 64, current);
    }

    memcpy(merkleRoot, current, 32);
}

// ---------------------------------------------------------------------------
// Block header construction
// ---------------------------------------------------------------------------

void buildBlockHeader(uint8_t*       header80,
                      uint32_t       version,
                      const uint8_t* prevHash,
                      const uint8_t* merkleRoot,
                      uint32_t       ntime,
                      uint32_t       nbits,
                      uint32_t       nonce) {
    // Version — 4 bytes, little-endian
    memcpy(header80, &version, 4);

    // Previous block hash — 32 bytes (already in internal byte order)
    memcpy(header80 + 4, prevHash, 32);

    // Merkle root — 32 bytes
    memcpy(header80 + 36, merkleRoot, 32);

    // Timestamp — 4 bytes, little-endian
    memcpy(header80 + 68, &ntime, 4);

    // Difficulty target (nBits) — 4 bytes, little-endian
    memcpy(header80 + 72, &nbits, 4);

    // Nonce — 4 bytes, little-endian
    memcpy(header80 + 76, &nonce, 4);
}

// ---------------------------------------------------------------------------
// Difficulty / target conversion
// ---------------------------------------------------------------------------

// Bitcoin difficulty 1 target
static const double DIFF1_TARGET = 
    26959535291011309493156476344723991336010898738574164086137773096960.0;

void difficultyToTarget(double difficulty, uint8_t* target32) {
    // Compute target = DIFF1_TARGET / difficulty
    // For simplicity, we use the compact representation approach
    memset(target32, 0, 32);

    if (difficulty <= 0) {
        memset(target32, 0xFF, 32);
        return;
    }

    // Pool difficulty 1 target in hex:
    // 00000000FFFF0000000000000000000000000000000000000000000000000000
    // We scale this by 1/difficulty

    // For pool mining, difficulty is usually small (< 1M)
    // We use a simplified calculation suitable for ESP32
    double target = 0xFFFF0000ULL / difficulty;
    uint64_t targetInt = (uint64_t)target;

    // Place the target value at the correct position (bytes 28-31, big-endian)
    // This is a simplification for low difficulties typical of ESP32 solo mining
    target32[28] = (targetInt >> 24) & 0xFF;
    target32[29] = (targetInt >> 16) & 0xFF;
    target32[30] = (targetInt >> 8)  & 0xFF;
    target32[31] = targetInt & 0xFF;

    // For very low difficulties, fill higher bytes
    if (difficulty < 1.0) {
        double fullTarget = 0xFFFF * (1.0 / difficulty);
        uint32_t high = (uint32_t)(fullTarget);
        target32[24] = (high >> 24) & 0xFF;
        target32[25] = (high >> 16) & 0xFF;
        target32[26] = (high >> 8)  & 0xFF;
        target32[27] = high & 0xFF;
    }
}

bool hashMeetsTarget(const uint8_t* hash, const uint8_t* target) {
    // Compare 32 bytes big-endian: hash <= target means valid
    // But Bitcoin hashes are in little-endian, so we compare from byte 31 down
    for (int i = 0; i < 32; i++) {
        if (hash[i] < target[i]) return true;
        if (hash[i] > target[i]) return false;
    }
    return true; // equal
}

double hashToDifficulty(const uint8_t* hash) {
    // Find the first non-zero byte (big-endian)
    // The more leading zeros, the higher the difficulty
    double val = 0;
    for (int i = 0; i < 32; i++) {
        val = val * 256.0 + hash[i];
    }
    if (val == 0) return DIFF1_TARGET;
    return DIFF1_TARGET / val;
}

// ---------------------------------------------------------------------------
// Coinbase transaction assembly
// ---------------------------------------------------------------------------

size_t buildCoinbase(uint8_t*       coinbaseTx,
                     size_t         maxLen,
                     const uint8_t* coinbase1, size_t cb1Len,
                     const uint8_t* extraNonce1, size_t en1Len,
                     const uint8_t* extraNonce2, size_t en2Len,
                     const uint8_t* coinbase2, size_t cb2Len) {
    size_t totalLen = cb1Len + en1Len + en2Len + cb2Len;
    if (totalLen > maxLen) return 0;

    size_t pos = 0;
    memcpy(coinbaseTx + pos, coinbase1, cb1Len);    pos += cb1Len;
    memcpy(coinbaseTx + pos, extraNonce1, en1Len);  pos += en1Len;
    memcpy(coinbaseTx + pos, extraNonce2, en2Len);  pos += en2Len;
    memcpy(coinbaseTx + pos, coinbase2, cb2Len);    pos += cb2Len;

    return pos;
}

// ---------------------------------------------------------------------------
// Human-readable formatting
// ---------------------------------------------------------------------------

String formatHashrate(double hashesPerSecond) {
    const char* suffixes[] = { "H/s", "kH/s", "MH/s", "GH/s", "TH/s" };
    int idx = 0;
    double val = hashesPerSecond;

    while (val >= 1000.0 && idx < 4) {
        val /= 1000.0;
        idx++;
    }

    char buf[32];
    if (val < 10.0) {
        snprintf(buf, sizeof(buf), "%.2f %s", val, suffixes[idx]);
    } else if (val < 100.0) {
        snprintf(buf, sizeof(buf), "%.1f %s", val, suffixes[idx]);
    } else {
        snprintf(buf, sizeof(buf), "%.0f %s", val, suffixes[idx]);
    }
    return String(buf);
}

String formatUptime(unsigned long seconds) {
    unsigned long d = seconds / 86400;
    unsigned long h = (seconds % 86400) / 3600;
    unsigned long m = (seconds % 3600) / 60;
    unsigned long s = seconds % 60;

    char buf[32];
    if (d > 0) {
        snprintf(buf, sizeof(buf), "%lud %luh %lum", d, h, m);
    } else if (h > 0) {
        snprintf(buf, sizeof(buf), "%luh %lum %lus", h, m, s);
    } else {
        snprintf(buf, sizeof(buf), "%lum %lus", m, s);
    }
    return String(buf);
}

String formatNumber(uint64_t number) {
    String raw = String((unsigned long)number);
    String result;
    int len = raw.length();
    for (int i = 0; i < len; i++) {
        if (i > 0 && (len - i) % 3 == 0) result += ',';
        result += raw.charAt(i);
    }
    return result;
}

String formatDifficulty(double difficulty) {
    char buf[32];
    if (difficulty >= 1e15) {
        snprintf(buf, sizeof(buf), "%.2f P", difficulty / 1e15);
    } else if (difficulty >= 1e12) {
        snprintf(buf, sizeof(buf), "%.2f T", difficulty / 1e12);
    } else if (difficulty >= 1e9) {
        snprintf(buf, sizeof(buf), "%.2f G", difficulty / 1e9);
    } else if (difficulty >= 1e6) {
        snprintf(buf, sizeof(buf), "%.2f M", difficulty / 1e6);
    } else if (difficulty >= 1e3) {
        snprintf(buf, sizeof(buf), "%.2f k", difficulty / 1e3);
    } else {
        snprintf(buf, sizeof(buf), "%.4f", difficulty);
    }
    return String(buf);
}

} // namespace btc
