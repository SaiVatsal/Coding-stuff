// ===========================================================================
// miniMiner — Hardware Abstraction Layer
// board_config.h — Compile-time board detection and pin mapping
// ===========================================================================
// Every hardware-specific constant lives HERE. The rest of the codebase
// uses only the abstract defines (HAS_DISPLAY, DUAL_CORE, etc.).
// ===========================================================================

#pragma once

// ---- Firmware identity ----
#ifndef MINI_MINER_VERSION
  #define MINI_MINER_VERSION "1.0.0"
#endif
#define MINI_MINER_NAME    "miniMiner"
#define MINI_MINER_AP_NAME "miniMiner-Setup"
#define MINI_MINER_AP_PASS "mine1234"

// ===========================================================================
// Board: LILYGO T-Display S3  (ESP32-S3, 1.9" ST7789 170×320)
// ===========================================================================
#if defined(BOARD_LILYGO_T_DISPLAY_S3)

  #define BOARD_NAME          "LILYGO T-Display S3"
  #define HAS_DISPLAY         1
  #define DISPLAY_WIDTH       320
  #define DISPLAY_HEIGHT      170
  #define DISPLAY_ROTATION    1          // landscape
  #define BACKLIGHT_PIN       38
  #define BACKLIGHT_ON_VALUE  HIGH
  #define BTN_PAGE            0          // GPIO 0 — cycle display pages
  #define BTN_ACTION          14         // GPIO 14 — secondary action
  #define HAS_PSRAM           1
  #define DUAL_CORE           1
  #define LED_PIN             -1         // no onboard LED

// ===========================================================================
// Board: LILYGO T-Display  (ESP32, 1.14" ST7789 135×240)
// ===========================================================================
#elif defined(BOARD_LILYGO_T_DISPLAY)

  #define BOARD_NAME          "LILYGO T-Display"
  #define HAS_DISPLAY         1
  #define DISPLAY_WIDTH       240
  #define DISPLAY_HEIGHT      135
  #define DISPLAY_ROTATION    1
  #define BACKLIGHT_PIN       4
  #define BACKLIGHT_ON_VALUE  HIGH
  #define BTN_PAGE            0
  #define BTN_ACTION          35
  #define HAS_PSRAM           0
  #define DUAL_CORE           1
  #define LED_PIN             -1

// ===========================================================================
// Board: M5Stack StickC Plus  (ESP32-PICO, 1.14" ST7789 135×240)
// ===========================================================================
#elif defined(BOARD_M5STICK_C_PLUS)

  #define BOARD_NAME          "M5StickC Plus"
  #define HAS_DISPLAY         1
  #define DISPLAY_WIDTH       240
  #define DISPLAY_HEIGHT      135
  #define DISPLAY_ROTATION    1
  #define BACKLIGHT_PIN       -1         // managed by AXP192
  #define BACKLIGHT_ON_VALUE  HIGH
  #define BTN_PAGE            37         // M5 button A
  #define BTN_ACTION          39         // M5 button B
  #define HAS_PSRAM           0
  #define DUAL_CORE           1
  #define LED_PIN             10

// ===========================================================================
// Board: ESP32-WROOM-32 DevKit  (no display)
// ===========================================================================
#elif defined(BOARD_ESP32_DEVKIT)

  #define BOARD_NAME          "ESP32 DevKit"
  #define HAS_DISPLAY         0
  #define DISPLAY_WIDTH       0
  #define DISPLAY_HEIGHT      0
  #define DISPLAY_ROTATION    0
  #define BACKLIGHT_PIN       -1
  #define BACKLIGHT_ON_VALUE  HIGH
  #define BTN_PAGE            0          // BOOT button
  #define BTN_ACTION          -1
  #define HAS_PSRAM           0
  #define DUAL_CORE           1
  #define LED_PIN             2

// ===========================================================================
// Board: ESP32-S3 DevKitC  (no display)
// ===========================================================================
#elif defined(BOARD_ESP32_S3_DEVKITC)

  #define BOARD_NAME          "ESP32-S3 DevKitC"
  #define HAS_DISPLAY         0
  #define DISPLAY_WIDTH       0
  #define DISPLAY_HEIGHT      0
  #define DISPLAY_ROTATION    0
  #define BACKLIGHT_PIN       -1
  #define BACKLIGHT_ON_VALUE  HIGH
  #define BTN_PAGE            0
  #define BTN_ACTION          -1
  #define HAS_PSRAM           1
  #define DUAL_CORE           1
  #define LED_PIN             48         // onboard RGB (WS2812)

// ===========================================================================
// Board: ESP32-S2 Mini  (single-core LX7, no display)
// ===========================================================================
#elif defined(BOARD_ESP32_S2_MINI)

  #define BOARD_NAME          "ESP32-S2 Mini"
  #define HAS_DISPLAY         0
  #define DISPLAY_WIDTH       0
  #define DISPLAY_HEIGHT      0
  #define DISPLAY_ROTATION    0
  #define BACKLIGHT_PIN       -1
  #define BACKLIGHT_ON_VALUE  HIGH
  #define BTN_PAGE            0
  #define BTN_ACTION          -1
  #define HAS_PSRAM           0
  #define DUAL_CORE           0          // single-core
  #define LED_PIN             15

// ===========================================================================
// Board: ESP32-C3 SuperMini  (RISC-V single-core, no display)
// ===========================================================================
#elif defined(BOARD_ESP32_C3_SUPERMINI)

  #define BOARD_NAME          "ESP32-C3 SuperMini"
  #define HAS_DISPLAY         0
  #define DISPLAY_WIDTH       0
  #define DISPLAY_HEIGHT      0
  #define DISPLAY_ROTATION    0
  #define BACKLIGHT_PIN       -1
  #define BACKLIGHT_ON_VALUE  HIGH
  #define BTN_PAGE            9          // BOOT button
  #define BTN_ACTION          -1
  #define HAS_PSRAM           0
  #define DUAL_CORE           0          // single-core RISC-V
  #define LED_PIN             8

// ===========================================================================
// Fallback — unknown board
// ===========================================================================
#else
  #error "No board defined! Add -DBOARD_xxx=1 to your build flags."
#endif

// ===========================================================================
// Derived constants
// ===========================================================================

// Core assignments for dual-core boards
#if DUAL_CORE
  #define CORE_MINING   1    // mining loop runs on Core 1
  #define CORE_SYSTEM   0    // WiFi/Stratum/display on Core 0
#else
  #define CORE_MINING   0    // single-core: everything on Core 0
  #define CORE_SYSTEM   0
#endif

// Mining task stack size (larger for display-equipped boards)
#if HAS_DISPLAY
  #define MINING_STACK_SIZE   8192
#else
  #define MINING_STACK_SIZE   6144
#endif

// Stratum task stack size
#define STRATUM_STACK_SIZE    8192

// Display update interval (ms)
#define DISPLAY_UPDATE_MS     1000

// Network stats fetch interval (ms)
#define NETWORK_STATS_MS      300000   // 5 minutes

// NTP sync interval (ms)
#define NTP_SYNC_MS           3600000  // 1 hour

// Default pool
#define DEFAULT_POOL_URL      "public-pool.io"
#define DEFAULT_POOL_PORT     21496
#define DEFAULT_WORKER_NAME   "miniMiner"

// Button debounce
#define BTN_DEBOUNCE_MS       200
