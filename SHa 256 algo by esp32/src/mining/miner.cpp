// ===========================================================================
// miniMiner — Mining Engine Implementation
// miner.cpp
// ===========================================================================

#include "miner.h"
#include "sha256_midstate.h"
#include "../hal/board_config.h"
#include "../utils/bitcoin_utils.h"

#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>
#include <esp_timer.h>

namespace miner {

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------

static TaskHandle_t      s_miningTask    = nullptr;
static QueueHandle_t     s_jobQueue      = nullptr;   // incoming jobs
static QueueHandle_t     s_resultQueue   = nullptr;   // outgoing results
static volatile bool     s_running       = false;
static volatile bool     s_hasJob        = false;

// Current job (only written by the mining task after dequeue)
static MiningJob         s_currentJob;
static char              s_extraNonce2[32] = "0000000000000000";

// Statistics (updated atomically from the mining task)
static volatile double        s_hashrate        = 0;
static volatile uint64_t      s_totalHashes     = 0;
static volatile uint32_t      s_sharesAccepted  = 0;
static volatile uint32_t      s_sharesRejected  = 0;
static volatile double        s_bestDifficulty  = 0;
static volatile unsigned long s_startTime       = 0;
static volatile bool          s_isMining        = false;
static volatile uint32_t      s_templates       = 0;

// Hashrate measurement
static const int HASHRATE_WINDOW_MS = 10000;  // 10-second rolling window
static volatile uint64_t s_windowHashes = 0;
static volatile int64_t  s_windowStart  = 0;

// ---------------------------------------------------------------------------
// Mining loop — the hot inner loop
// ---------------------------------------------------------------------------

static void miningTask(void* param) {
    Serial.println("[MINER] Mining task started");
    s_startTime = millis() / 1000;

    Sha256Midstate midstate;
    uint8_t header[80];
    uint8_t hash[32];

    while (s_running) {
        // Check for new jobs
        MiningJob newJob;
        if (xQueueReceive(s_jobQueue, &newJob, s_hasJob ? 0 : portMAX_DELAY) == pdTRUE) {
            memcpy(&s_currentJob, &newJob, sizeof(MiningJob));
            s_hasJob = true;
            s_templates++;

            // Build the block header with nonce=0, then precompute midstate
            btc::buildBlockHeader(header,
                                  s_currentJob.version,
                                  s_currentJob.prevHash,
                                  s_currentJob.merkleRoot,
                                  s_currentJob.ntime,
                                  s_currentJob.nbits,
                                  0);

            midstate.precompute(header);
            s_isMining = true;
            s_windowHashes = 0;
            s_windowStart = esp_timer_get_time();

            Serial.printf("[MINER] New job: %s  diff: %.4f\n",
                          s_currentJob.jobId, s_currentJob.poolDifficulty);
        }

        if (!s_hasJob) continue;

        // --- Inner mining loop ---
        // Process nonces in batches for better yield behavior
        const uint32_t BATCH_SIZE = 10000;
        uint32_t nonce = 0;

        while (s_running && s_hasJob) {
            uint32_t batchEnd = nonce + BATCH_SIZE;
            if (batchEnd < nonce) {
                // Nonce space exhausted — wait for new job
                Serial.println("[MINER] Nonce space exhausted, waiting for new job");
                s_hasJob = false;
                break;
            }

            for (uint32_t n = nonce; n < batchEnd && s_running; n++) {
                midstate.hashWithNonce(n, hash);
                s_totalHashes++;
                s_windowHashes++;

                // Check if hash meets pool target
                if (btc::hashMeetsTarget(hash, s_currentJob.target)) {
                    // Found a valid share!
                    double shareDiff = btc::hashToDifficulty(hash);

                    Serial.printf("[MINER] *** SHARE FOUND! nonce=%08x diff=%.4f ***\n",
                                  n, shareDiff);

                    // Track best difficulty
                    if (shareDiff > s_bestDifficulty) {
                        s_bestDifficulty = shareDiff;
                    }

                    // Submit result
                    MiningResult result;
                    strncpy(result.jobId, s_currentJob.jobId, sizeof(result.jobId) - 1);
                    result.nonce = n;
                    result.ntime = s_currentJob.ntime;
                    strncpy(result.extraNonce2, s_extraNonce2, sizeof(result.extraNonce2) - 1);
                    result.difficulty = shareDiff;

                    xQueueSend(s_resultQueue, &result, 0);
                }
            }

            nonce = batchEnd;

            // Update hashrate measurement
            int64_t now = esp_timer_get_time();
            int64_t elapsed = now - s_windowStart;
            if (elapsed > 0) {
                s_hashrate = (double)s_windowHashes / ((double)elapsed / 1000000.0);
            }
            // Reset window periodically
            if (elapsed > HASHRATE_WINDOW_MS * 1000LL) {
                s_windowHashes = 0;
                s_windowStart = now;
            }

            // Check for new job (non-blocking)
            MiningJob checkJob;
            if (xQueueReceive(s_jobQueue, &checkJob, 0) == pdTRUE) {
                memcpy(&s_currentJob, &checkJob, sizeof(MiningJob));
                s_templates++;

                btc::buildBlockHeader(header,
                                      s_currentJob.version,
                                      s_currentJob.prevHash,
                                      s_currentJob.merkleRoot,
                                      s_currentJob.ntime,
                                      s_currentJob.nbits,
                                      0);
                midstate.precompute(header);
                nonce = 0;
                s_windowHashes = 0;
                s_windowStart = esp_timer_get_time();
            }

            // Yield to other tasks
            #if !DUAL_CORE
                // Single-core boards must yield more aggressively
                taskYIELD();
            #else
                // Dual-core: brief yield every batch to feed the watchdog
                vTaskDelay(1);
            #endif
        }
    }

    s_isMining = false;
    Serial.println("[MINER] Mining task stopped");
    vTaskDelete(nullptr);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

void init() {
    s_jobQueue    = xQueueCreate(4, sizeof(MiningJob));
    s_resultQueue = xQueueCreate(8, sizeof(MiningResult));
    s_running     = false;
    s_hasJob      = false;
    s_totalHashes = 0;
    s_sharesAccepted = 0;
    s_sharesRejected = 0;
    s_bestDifficulty = 0;
    s_templates = 0;
}

void start() {
    if (s_miningTask != nullptr) return;  // already running

    s_running = true;
    s_startTime = millis() / 1000;

    #if DUAL_CORE
        xTaskCreatePinnedToCore(
            miningTask,
            "miniMiner",
            MINING_STACK_SIZE,
            nullptr,
            1,                      // priority
            &s_miningTask,
            CORE_MINING             // pin to Core 1
        );
    #else
        xTaskCreate(
            miningTask,
            "miniMiner",
            MINING_STACK_SIZE,
            nullptr,
            1,
            &s_miningTask
        );
    #endif

    Serial.println("[MINER] Mining engine started");
}

void stop() {
    s_running = false;
    // The task will self-delete when it sees s_running == false
    s_miningTask = nullptr;
}

void submitJob(const MiningJob& job) {
    // Overwrite any pending jobs — we always want the latest
    xQueueReset(s_jobQueue);
    xQueueSend(s_jobQueue, &job, portMAX_DELAY);
}

MiningStats getStats() {
    MiningStats stats;
    stats.hashrate        = s_hashrate;
    stats.totalHashes     = s_totalHashes;
    stats.sharesAccepted  = s_sharesAccepted;
    stats.sharesRejected  = s_sharesRejected;
    stats.bestDifficulty  = s_bestDifficulty;
    stats.uptimeSeconds   = (millis() / 1000) - s_startTime;
    stats.isMining        = s_isMining;
    stats.templates       = s_templates;
    return stats;
}

void recordShareAccepted() {
    s_sharesAccepted++;
}

void recordShareRejected() {
    s_sharesRejected++;
}

QueueHandle_t getResultQueue() {
    return s_resultQueue;
}

void setExtraNonce2(const char* hexValue) {
    strncpy(s_extraNonce2, hexValue, sizeof(s_extraNonce2) - 1);
}

} // namespace miner
