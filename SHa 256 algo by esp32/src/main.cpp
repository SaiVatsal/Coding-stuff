// ===========================================================================
// miniMiner — Application Entry Point
// main.cpp
// ===========================================================================
// Boot sequence:
//   1. Init hardware (display, buttons, LED)
//   2. Load config (NVS → SD card → AP mode fallback)
//   3. Connect WiFi
//   4. Sync NTP time
//   5. Connect to Stratum pool
//   6. Start mining engine
//   7. Enter main loop (Stratum, display, buttons, API fetches)
// ===========================================================================

#include <Arduino.h>
#include <WiFi.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

#include "hal/board_config.h"
#include "config/config_manager.h"
#include "config/web_portal.h"
#include "mining/miner.h"
#include "stratum/stratum.h"
#include "display/display_manager.h"
#include "network/api_client.h"

// ---------------------------------------------------------------------------
// Button handling
// ---------------------------------------------------------------------------

static unsigned long s_lastBtnPress = 0;

static void handleButtons() {
    unsigned long now = millis();
    if (now - s_lastBtnPress < BTN_DEBOUNCE_MS) return;

    #if BTN_PAGE >= 0
    if (digitalRead(BTN_PAGE) == LOW) {
        s_lastBtnPress = now;
        display::nextPage();
    }
    #endif

    #if BTN_ACTION >= 0
    if (digitalRead(BTN_ACTION) == LOW) {
        s_lastBtnPress = now;
        // Action button: toggle display brightness
        static uint8_t brightIdx = 2;
        const uint8_t levels[] = { 50, 120, 200, 255 };
        brightIdx = (brightIdx + 1) % 4;
        display::setBrightness(levels[brightIdx]);
    }
    #endif
}

// ---------------------------------------------------------------------------
// WiFi connection
// ---------------------------------------------------------------------------

static WiFiUDP     s_ntpUdp;
static NTPClient   s_ntpClient(s_ntpUdp, "pool.ntp.org", 0, NTP_SYNC_MS);

static bool connectWifi(const char* ssid, const char* password, int timeoutMs = 15000) {
    Serial.printf("[WIFI] Connecting to '%s'...\n", ssid);
    display::showMessage("Connecting WiFi", ssid);

    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < (unsigned long)timeoutMs) {
        delay(250);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[WIFI] Connected! IP: %s  RSSI: %d dBm\n",
                      WiFi.localIP().toString().c_str(), WiFi.RSSI());
        display::showMessage("WiFi Connected", WiFi.localIP().toString());
        delay(800);
        return true;
    }

    Serial.println("[WIFI] Connection failed!");
    return false;
}

// ---------------------------------------------------------------------------
// LED indicator (for headless boards)
// ---------------------------------------------------------------------------

#if LED_PIN >= 0
static unsigned long s_lastLedToggle = 0;
static bool          s_ledState = false;

static void updateLed() {
    unsigned long now = millis();
    unsigned long interval;

    switch (stratum::getState()) {
        case StratumState::MINING:    interval = 2000; break;  // slow blink = mining
        case StratumState::CONNECTING:
        case StratumState::SUBSCRIBING:
        case StratumState::AUTHORIZING:
                                      interval = 250;  break;  // fast blink = connecting
        default:                      interval = 500;  break;  // medium blink = error
    }

    if (now - s_lastLedToggle > interval) {
        s_lastLedToggle = now;
        s_ledState = !s_ledState;
        digitalWrite(LED_PIN, s_ledState ? HIGH : LOW);
    }
}
#else
static void updateLed() {}
#endif

// ---------------------------------------------------------------------------
// Arduino entry points
// ---------------------------------------------------------------------------

void setup() {
    Serial.begin(115200);
    delay(200);

    Serial.println();
    Serial.println("========================================");
    Serial.println("  miniMiner v" MINI_MINER_VERSION);
    Serial.println("  " BOARD_NAME);
    Serial.println("  ESP32 Bitcoin Solo Miner");
    Serial.println("========================================");
    Serial.println();

    // Init button pins
    #if BTN_PAGE >= 0
        pinMode(BTN_PAGE, INPUT_PULLUP);
    #endif
    #if BTN_ACTION >= 0
        pinMode(BTN_ACTION, INPUT_PULLUP);
    #endif

    // Init LED
    #if LED_PIN >= 0
        pinMode(LED_PIN, OUTPUT);
        digitalWrite(LED_PIN, LOW);
    #endif

    // Init subsystems
    display::init();
    config::init();
    miner::init();
    stratum::init();
    webportal::init();
    apiclient::init();

    // --- Load configuration ---
    bool configLoaded = config::load();

    // Try SD card if no NVS config
    if (!configLoaded) {
        display::showMessage("Checking SD card...");
        configLoaded = config::loadFromSD();
    }

    // If still no config → start AP mode for setup
    if (!configLoaded || !config::hasWifiConfig()) {
        Serial.println("[MAIN] No config found — starting AP setup mode");
        display::showMessage("Setup Mode", "Connect to miniMiner-Setup");
        webportal::startAPMode();

        // Stay in AP mode loop until config is saved (device reboots after save)
        while (true) {
            webportal::loop();
            handleButtons();
            delay(10);
        }
        // Never reaches here — save handler calls ESP.restart()
    }

    // --- Connect to WiFi ---
    const MinerConfig& cfg = config::get();
    bool wifiOk = connectWifi(cfg.wifiSsid, cfg.wifiPassword);

    if (!wifiOk) {
        // WiFi failed — fall back to AP mode
        Serial.println("[MAIN] WiFi failed — falling back to AP setup");
        display::showMessage("WiFi Failed", "Starting setup portal");
        delay(1500);
        webportal::startAPMode();
        while (true) {
            webportal::loop();
            handleButtons();
            delay(10);
        }
    }

    // --- Sync NTP time ---
    display::showMessage("Syncing time...");
    s_ntpClient.begin();
    s_ntpClient.setTimeOffset(cfg.timezoneOffset * 3600);
    s_ntpClient.update();
    Serial.printf("[NTP] Time: %s\n", s_ntpClient.getFormattedTime().c_str());

    // --- Start web dashboard (STA mode) ---
    webportal::startSTAMode();

    // --- Connect to Stratum pool ---
    display::showMessage("Connecting to pool", String(cfg.poolUrl) + ":" + String(cfg.poolPort));

    if (!config::hasBtcAddress()) {
        Serial.println("[MAIN] WARNING: No BTC address set! Visit the web dashboard to configure.");
        display::showMessage("No BTC Address!", "Visit " + WiFi.localIP().toString());
        delay(3000);
    }

    stratum::configure(cfg.poolUrl, cfg.poolPort,
                       cfg.btcAddress, cfg.workerName, cfg.poolPassword);

    // --- Start mining engine ---
    miner::start();

    // --- Fetch initial network stats ---
    apiclient::fetchNetworkStats();

    Serial.println("[MAIN] Boot complete — mining started!");
    Serial.printf("[MAIN] Dashboard: http://%s/\n", WiFi.localIP().toString().c_str());
}

void loop() {
    // Stratum protocol handling (connect, receive jobs, submit shares)
    stratum::loop();

    // Web server (dashboard + settings)
    webportal::loop();

    // Display update (if equipped)
    display::update();

    // Button handling
    handleButtons();

    // LED status indicator (headless boards)
    updateLed();

    // Periodic network stats fetch
    apiclient::fetchNetworkStats();

    // NTP sync
    s_ntpClient.update();

    // WiFi reconnection
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("[WIFI] Connection lost — reconnecting...");
        display::showMessage("WiFi reconnecting...");
        const MinerConfig& cfg = config::get();
        WiFi.reconnect();
        unsigned long start = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) {
            delay(250);
        }
        if (WiFi.status() != WL_CONNECTED) {
            Serial.println("[WIFI] Reconnect failed, will retry next loop");
        }
    }

    // Small delay to prevent watchdog issues on single-core boards
    delay(10);
}
