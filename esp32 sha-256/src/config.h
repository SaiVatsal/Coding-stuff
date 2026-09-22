/**
 * config.h - Hardware pin mappings and configuration constants
 *            for the LILYGO T-Display S3 (ESP32-S3R8) Bitcoin Solo Miner.
 *
 * Hardware reference:
 *   - ESP32-S3R8 (16MB Flash, 8MB OPI PSRAM)
 *   - ST7789 1.9" 320x170 8-bit parallel RGB display
 *   - microSD slot (ONLY on the SD Shield variant)
 *   - Buttons: BOOT (GPIO0) + User (GPIO14)
 *
 * IMPORTANT: GPIO15 (BUS_POWER) MUST be set HIGH before initializing any
 * peripheral (display, SD card, I2C). It is the first thing main.cpp does.
 */
#pragma once

#include <Arduino.h>

// ---------------------------------------------------------------------------
// Board identity
// ---------------------------------------------------------------------------
#define BOARD_NAME "LILYGO T-Display S3"
#define FW_VERSION "1.0.0"

// ---------------------------------------------------------------------------
// Power control - MUST be HIGH before any peripheral init
// ---------------------------------------------------------------------------
#define PIN_BUS_POWER 15

// ---------------------------------------------------------------------------
// Display - ST7789 8-bit parallel (T-Display S3)
// ---------------------------------------------------------------------------
#define PIN_LCD_BL     8
#define PIN_LCD_RST    7
#define PIN_LCD_DC     6
#define PIN_LCD_CS     5
#define PIN_LCD_TE     9
#define PIN_LCD_D0     39
#define PIN_LCD_D1     40
#define PIN_LCD_D2     41
#define PIN_LCD_D3     42
#define PIN_LCD_D4     45
#define PIN_LCD_D5     46
#define PIN_LCD_D6     47
#define PIN_LCD_D7     48
#define LCD_WIDTH      320
#define LCD_HEIGHT     170
#define LCD_BL_PWM_CH  0
#define LCD_BL_FREQ    5000
#define LCD_BL_RES     8

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------
#define PIN_BTN_BOOT    0
#define PIN_BTN_USER    14
#define BTN_DEBOUNCE_MS 50

// ---------------------------------------------------------------------------
// microSD card (SD Shield variant only)
// ---------------------------------------------------------------------------
#define PIN_SD_CMD  11
#define PIN_SD_CLK  12
#define PIN_SD_D0   13
#define SD_SPI_FREQ 4000000  // 4 MHz

// ---------------------------------------------------------------------------
// I2C (for future sensors / RTC)
// ---------------------------------------------------------------------------
#define PIN_I2C_SDA 17
#define PIN_I2C_SCL 18
#define I2C_FREQ    400000

// ---------------------------------------------------------------------------
// Battery ADC (single-cell LiPo sense divider)
// ---------------------------------------------------------------------------
#define PIN_BATT_ADC 4
#define BATT_DIV_R1  100000.0f  // 100k
#define BATT_DIV_R2  100000.0f  // 100k
#define BATT_FULL_MV 4200
#define BATT_EMPTY_MV 3200

// ---------------------------------------------------------------------------
// Default pool configuration (solo.ckpool.org)
// ---------------------------------------------------------------------------
#define DEFAULT_POOL_HOST    "solo.ckpool.org"
#define DEFAULT_POOL_PORT    3333
#define DEFAULT_POOL_USER    "bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"  // REPLACE with your BTC address
#define DEFAULT_POOL_PASS    "x"
#define DEFAULT_MIN_DIFF     10000.0

// ---------------------------------------------------------------------------
// Stratum / mining constants
// ---------------------------------------------------------------------------
#define STRATUM_BUFFER_SIZE     4096
#define STRATUM_MAX_LINE        2048
#define STRATUM_CONNECT_TIMEOUT 10000   // ms
#define STRATUM_RECV_TIMEOUT    60000   // ms
#define EXTRANONCE2_SIZE        8       // bytes
#define MAX_MERKLE_BRANCHES     32
#define MAX_JOB_AGE_MS          60000   // discard stale jobs after 60s

// ---------------------------------------------------------------------------
// Mining task
// ---------------------------------------------------------------------------
#define MINING_TASK_STACK    16384
#define MINING_TASK_CORE     1
#define MINING_TASK_PRIO     2
#define HASHRATE_WINDOW_MS   60000   // 60s rolling window
#define STATS_TASK_STACK     4096
#define STATS_TASK_PRIO      1

// ---------------------------------------------------------------------------
// WiFi / web config
// ---------------------------------------------------------------------------
#define WIFI_CONNECT_TIMEOUT_MS 15000
#define WIFI_RECONNECT_MS       5000
#define WIFI_AP_SSID            "ESP32-Miner-Setup"
#define WIFI_AP_PASS            "minersetup"   // min 8 chars
#define WIFI_AP_CHANNEL         1
#define WIFI_AP_MAX_CONN        4
#define WEB_SERVER_PORT         80
#define WEB_POST_MAX_LEN        4096

// ---------------------------------------------------------------------------
// NVS keys
// ---------------------------------------------------------------------------
#define NVS_NAMESPACE      "miner"
#define NVS_KEY_WIFI_SSID  "ssid"
#define NVS_KEY_WIFI_PASS  "wpass"
#define NVS_KEY_POOL_HOST  "phost"
#define NVS_KEY_POOL_PORT  "pport"
#define NVS_KEY_POOL_USER  "puser"
#define NVS_KEY_POOL_PASS  "ppass"

// ---------------------------------------------------------------------------
// Display UI
// ---------------------------------------------------------------------------
#define UI_UPDATE_MS        1000
#define UI_TASK_STACK       8192
#define UI_TASK_PRIO        1
#define UI_TASK_CORE        0
#define UI_SCROLL_LINES     8
#define UI_SCROLL_LEN       40

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------
#define LOG_SERIAL_BAUD  115200
#define LOG_TAG         "MINER"
