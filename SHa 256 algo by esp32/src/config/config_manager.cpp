// ===========================================================================
// miniMiner — Configuration Manager Implementation
// config_manager.cpp
// ===========================================================================

#include "config_manager.h"
#include "../hal/board_config.h"

#include <Preferences.h>
#include <ArduinoJson.h>
#include <FS.h>
#include <SD.h>

namespace config {

static Preferences  s_prefs;
static MinerConfig  s_config;
static const char*  NVS_NAMESPACE = "miniMiner";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

static void applyDefaults(MinerConfig& cfg) {
    memset(&cfg, 0, sizeof(MinerConfig));
    strncpy(cfg.poolUrl, DEFAULT_POOL_URL, sizeof(cfg.poolUrl) - 1);
    cfg.poolPort = DEFAULT_POOL_PORT;
    strncpy(cfg.workerName, DEFAULT_WORKER_NAME, sizeof(cfg.workerName) - 1);
    strncpy(cfg.poolPassword, "x", sizeof(cfg.poolPassword) - 1);
    cfg.brightness = 200;
    cfg.timezoneOffset = 0;
    cfg.configured = false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

void init() {
    applyDefaults(s_config);
}

bool load() {
    s_prefs.begin(NVS_NAMESPACE, true);  // read-only

    bool exists = s_prefs.getBool("configured", false);
    if (!exists) {
        s_prefs.end();
        Serial.println("[CONFIG] No saved config found — using defaults");
        return false;
    }

    // Read each field
    s_prefs.getString("wifiSsid",     s_config.wifiSsid,     sizeof(s_config.wifiSsid));
    s_prefs.getString("wifiPass",     s_config.wifiPassword,  sizeof(s_config.wifiPassword));
    s_prefs.getString("btcAddr",      s_config.btcAddress,    sizeof(s_config.btcAddress));
    s_prefs.getString("poolUrl",      s_config.poolUrl,       sizeof(s_config.poolUrl));
    s_config.poolPort = s_prefs.getUShort("poolPort", DEFAULT_POOL_PORT);
    s_prefs.getString("workerName",   s_config.workerName,    sizeof(s_config.workerName));
    s_prefs.getString("poolPass",     s_config.poolPassword,  sizeof(s_config.poolPassword));
    s_config.brightness     = s_prefs.getUChar("brightness", 200);
    s_config.timezoneOffset = s_prefs.getChar("tzOffset", 0);
    s_config.configured     = true;

    s_prefs.end();

    Serial.printf("[CONFIG] Loaded: SSID=%s, Pool=%s:%d, Worker=%s\n",
                  s_config.wifiSsid, s_config.poolUrl, s_config.poolPort,
                  s_config.workerName);
    return true;
}

void save(const MinerConfig& cfg) {
    memcpy(&s_config, &cfg, sizeof(MinerConfig));
    s_config.configured = true;

    s_prefs.begin(NVS_NAMESPACE, false);  // read-write
    s_prefs.putString("wifiSsid",   s_config.wifiSsid);
    s_prefs.putString("wifiPass",   s_config.wifiPassword);
    s_prefs.putString("btcAddr",    s_config.btcAddress);
    s_prefs.putString("poolUrl",    s_config.poolUrl);
    s_prefs.putUShort("poolPort",   s_config.poolPort);
    s_prefs.putString("workerName", s_config.workerName);
    s_prefs.putString("poolPass",   s_config.poolPassword);
    s_prefs.putUChar("brightness",  s_config.brightness);
    s_prefs.putChar("tzOffset",     s_config.timezoneOffset);
    s_prefs.putBool("configured",   true);
    s_prefs.end();

    Serial.println("[CONFIG] Configuration saved to NVS");
}

bool loadFromSD() {
    // Try to mount SD card
    if (!SD.begin()) {
        Serial.println("[CONFIG] No SD card detected");
        return false;
    }

    File file = SD.open("/config.json", "r");
    if (!file) {
        Serial.println("[CONFIG] No /config.json on SD card");
        SD.end();
        return false;
    }

    StaticJsonDocument<1024> doc;
    DeserializationError err = deserializeJson(doc, file);
    file.close();
    SD.end();

    if (err) {
        Serial.printf("[CONFIG] SD config parse error: %s\n", err.c_str());
        return false;
    }

    // Parse fields (with defaults)
    if (doc.containsKey("wifi_ssid"))
        strncpy(s_config.wifiSsid, doc["wifi_ssid"], sizeof(s_config.wifiSsid) - 1);
    if (doc.containsKey("wifi_password"))
        strncpy(s_config.wifiPassword, doc["wifi_password"], sizeof(s_config.wifiPassword) - 1);
    if (doc.containsKey("btc_address"))
        strncpy(s_config.btcAddress, doc["btc_address"], sizeof(s_config.btcAddress) - 1);
    if (doc.containsKey("pool_url"))
        strncpy(s_config.poolUrl, doc["pool_url"], sizeof(s_config.poolUrl) - 1);
    if (doc.containsKey("pool_port"))
        s_config.poolPort = doc["pool_port"];
    if (doc.containsKey("worker_name"))
        strncpy(s_config.workerName, doc["worker_name"], sizeof(s_config.workerName) - 1);
    if (doc.containsKey("brightness"))
        s_config.brightness = doc["brightness"];
    if (doc.containsKey("timezone_offset"))
        s_config.timezoneOffset = doc["timezone_offset"];

    s_config.configured = true;
    Serial.println("[CONFIG] Config loaded from SD card");

    // Also save to NVS for future boots without the SD card
    save(s_config);
    return true;
}

const MinerConfig& get() {
    return s_config;
}

MinerConfig& getMutable() {
    return s_config;
}

void resetToDefaults() {
    s_prefs.begin(NVS_NAMESPACE, false);
    s_prefs.clear();
    s_prefs.end();
    applyDefaults(s_config);
    Serial.println("[CONFIG] Reset to factory defaults");
}

bool hasWifiConfig() {
    return strlen(s_config.wifiSsid) > 0;
}

bool hasBtcAddress() {
    return strlen(s_config.btcAddress) > 0;
}

} // namespace config
