// ===========================================================================
// miniMiner — Bitcoin Utility Functions
// bitcoin_utils.h
// ===========================================================================

#pragma once

#include <Arduino.h>
#include <cstdint>
#include <cstring>

namespace btc {

// ---------------------------------------------------------------------------
// Hex encoding / decoding
// ---------------------------------------------------------------------------

/// Convert a byte array to a lowercase hex string.
String toHex(const uint8_t* data, size_t len);

/// Decode a hex string into a byte array. Returns number of bytes written.
size_t fromHex(const String& hex, uint8_t* out, size_t maxLen);

// ---------------------------------------------------------------------------
// Byte manipulation
// ---------------------------------------------------------------------------

/// Reverse a byte array in-place (for Bitcoin's little-endian shenanigans).
void reverseBytes(uint8_t* data, size_t len);

/// Copy `len` bytes from `src` to `dst`, reversing byte order.
void reverseCopy(uint8_t* dst, const uint8_t* src, size_t len);

/// Swap endianness of a 32-bit value.
uint32_t swapEndian32(uint32_t val);

// ---------------------------------------------------------------------------
// SHA-256 helpers
// ---------------------------------------------------------------------------

/// Compute single SHA-256 hash.
void sha256(const uint8_t* data, size_t len, uint8_t* hash);

/// Compute double SHA-256 hash (SHA-256 of SHA-256).
void sha256d(const uint8_t* data, size_t len, uint8_t* hash);

// ---------------------------------------------------------------------------
// Merkle root
// ---------------------------------------------------------------------------

/// Compute the Merkle root from a coinbase hash and the merkle branch list.
/// `coinbaseHash` is 32 bytes (the double-SHA256 of the coinbase transaction).
/// `branches` is an array of 32-byte hashes (hex-decoded merkle branch entries).
/// `branchCount` is the number of entries in the branch.
/// Result is written to `merkleRoot` (32 bytes).
void computeMerkleRoot(const uint8_t* coinbaseHash,
                       const uint8_t branches[][32],
                       size_t branchCount,
                       uint8_t* merkleRoot);

// ---------------------------------------------------------------------------
// Block header construction
// ---------------------------------------------------------------------------

/// Build the 80-byte block header from its components.
/// All inputs are in their raw (not reversed) form as received from Stratum.
/// The function handles byte-order swapping internally.
void buildBlockHeader(uint8_t*       header80,
                      uint32_t       version,
                      const uint8_t* prevHash,      // 32 bytes
                      const uint8_t* merkleRoot,     // 32 bytes
                      uint32_t       ntime,
                      uint32_t       nbits,
                      uint32_t       nonce);

// ---------------------------------------------------------------------------
// Difficulty / target
// ---------------------------------------------------------------------------

/// Convert pool difficulty to a 256-bit target (32 bytes, big-endian).
void difficultyToTarget(double difficulty, uint8_t* target32);

/// Check if a hash meets a given target (hash <= target).
/// Both `hash` and `target` are 32 bytes in big-endian order.
bool hashMeetsTarget(const uint8_t* hash, const uint8_t* target);

/// Calculate the difficulty of a given hash (how "good" it is).
double hashToDifficulty(const uint8_t* hash);

// ---------------------------------------------------------------------------
// Coinbase transaction
// ---------------------------------------------------------------------------

/// Assemble the raw coinbase transaction from Stratum components.
/// Returns the total length of the assembled transaction.
size_t buildCoinbase(uint8_t*       coinbaseTx,
                     size_t         maxLen,
                     const uint8_t* coinbase1, size_t cb1Len,
                     const uint8_t* extraNonce1, size_t en1Len,
                     const uint8_t* extraNonce2, size_t en2Len,
                     const uint8_t* coinbase2, size_t cb2Len);

// ---------------------------------------------------------------------------
// Human-readable formatting
// ---------------------------------------------------------------------------

/// Format a hashrate value with appropriate SI suffix (H/s, kH/s, MH/s, etc.).
String formatHashrate(double hashesPerSecond);

/// Format an uptime duration (seconds) as "Xd Xh Xm Xs".
String formatUptime(unsigned long seconds);

/// Format a large number with comma separators (e.g., "1,234,567").
String formatNumber(uint64_t number);

/// Format difficulty with appropriate precision.
String formatDifficulty(double difficulty);

} // namespace btc
