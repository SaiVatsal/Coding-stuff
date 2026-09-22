// ===========================================================================
// miniMiner — Configuration Manager
// config_manager.h
// ===========================================================================

#pragma once

#include <Arduino.h>

/// All user-configurable settings, persisted in NVS.
struct MinerConfig {
    char     wifiSsid[64];
    char     wifiPassword[64];
    char     btcAddress[64];
    char     poolUrl[128];
    uint16_t poolPort;
    char     workerName[32];
    char     poolPassword[16];
    uint8_t  brightness;             // 0–255
    int8_t   timezoneOffset;         // hours from UTC
    bool     configured;             // has user completed setup?
};

namespace config {

/// Initialize the config system (NVS). Call once in setup().
void init();

/// Load settings from NVS into the active config struct.
/// Returns true if a valid config was found, false if fresh device.
bool load();

/// Save the current config to NVS.
void save(const MinerConfig& cfg);

/// Try to load config from SD card (/config.json).
/// Returns true if file was found and parsed successfully.
bool loadFromSD();

/// Get a read-only reference to the active configuration.
const MinerConfig& get();

/// Get a mutable reference (for the web portal to modify).
MinerConfig& getMutable();

/// Reset all settings to factory defaults.
void resetToDefaults();

/// Check if WiFi credentials are configured.
bool hasWifiConfig();

/// Check if a BTC address has been entered.
bool hasBtcAddress();

} // namespace config
