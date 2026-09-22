// ===========================================================================
// miniMiner — Display Manager Implementation
// display_manager.cpp
// ===========================================================================
// Hand-crafted display rendering with sprite-based double buffering.
// Three pages: Mining Dashboard, Network Stats, Device Info.
// ===========================================================================

#include "display_manager.h"

#if HAS_DISPLAY

#include "ui_theme.h"
#include "../mining/miner.h"
#include "../stratum/stratum.h"
#include "../utils/bitcoin_utils.h"
#include "../config/config_manager.h"

#include <TFT_eSPI.h>
#include <WiFi.h>
#include <cmath>

namespace display {

// ---------------------------------------------------------------------------
// Display objects
// ---------------------------------------------------------------------------

static TFT_eSPI    s_tft;
static TFT_eSprite s_sprite(&s_tft);        // full-screen sprite for flicker-free rendering
static int         s_currentPage = theme::PAGE_MINING;
static unsigned long s_lastUpdate = 0;
static bool        s_initialized = false;

// Smoothed values for animation
static double      s_smoothHashrate = 0;
static unsigned long s_pulseStart = 0;

// Screen dimensions (set at runtime based on board)
static int         s_width  = DISPLAY_WIDTH;
static int         s_height = DISPLAY_HEIGHT;

// ---------------------------------------------------------------------------
// Drawing primitives
// ---------------------------------------------------------------------------

/// Draw a rounded rectangle card background.
static void drawCard(int x, int y, int w, int h) {
    s_sprite.fillRoundRect(x, y, w, h, theme::CARD_RADIUS, theme::BG_CARD);
}

/// Draw a horizontal separator line.
static void drawSeparator(int y) {
    s_sprite.drawFastHLine(theme::MARGIN_X + 4, y,
                           s_width - 2 * theme::MARGIN_X - 8,
                           theme::BG_ELEVATED);
}

/// Draw a stat row: label on the left, value on the right.
static void drawStatRow(int y, const char* label, const String& value,
                        uint16_t valueColor = theme::TEXT_PRIMARY) {
    s_sprite.setTextColor(theme::TEXT_SECONDARY);
    s_sprite.setTextDatum(ML_DATUM);
    s_sprite.drawString(label, theme::ROW_LABEL_X, y + theme::ROW_HEIGHT / 2, theme::FONT_SMALL);

    s_sprite.setTextColor(valueColor);
    s_sprite.setTextDatum(MR_DATUM);
    s_sprite.drawString(value, s_width - theme::ROW_LABEL_X, y + theme::ROW_HEIGHT / 2, theme::FONT_SMALL);
}

/// Draw page indicator dots at the bottom.
static void drawPageIndicator() {
    int totalWidth = (theme::PAGE_COUNT - 1) * theme::PAGE_DOT_GAP;
    int startX = (s_width - totalWidth) / 2;
    int y = s_height + theme::PAGE_DOT_Y;

    for (int i = 0; i < theme::PAGE_COUNT; i++) {
        int x = startX + i * theme::PAGE_DOT_GAP;
        if (i == s_currentPage) {
            s_sprite.fillCircle(x, y, theme::PAGE_DOT_R, theme::AMBER);
        } else {
            s_sprite.fillCircle(x, y, theme::PAGE_DOT_R, theme::BG_ELEVATED);
        }
    }
}

/// Draw the common header bar.
static void drawHeader(const char* title) {
    // Background
    s_sprite.fillRect(0, 0, s_width, theme::HEADER_HEIGHT, theme::BG_PRIMARY);

    // miniMiner wordmark
    s_sprite.setTextColor(theme::AMBER);
    s_sprite.setTextDatum(ML_DATUM);
    s_sprite.drawString("miniMiner", theme::MARGIN_X + 2, theme::HEADER_Y + 12, theme::FONT_SMALL);

    // Page title (right side)
    s_sprite.setTextColor(theme::TEXT_SECONDARY);
    s_sprite.setTextDatum(MR_DATUM);
    s_sprite.drawString(title, s_width - theme::MARGIN_X - 16, theme::HEADER_Y + 12, theme::FONT_TINY);

    // Status dot
    StratumState state = stratum::getState();
    uint16_t dotColor;
    switch (state) {
        case StratumState::MINING:       dotColor = theme::GREEN;  break;
        case StratumState::CONNECTING:
        case StratumState::SUBSCRIBING:
        case StratumState::AUTHORIZING:  dotColor = theme::YELLOW; break;
        default:                         dotColor = theme::RED;    break;
    }
    s_sprite.fillCircle(s_width - theme::DOT_X, theme::DOT_Y, theme::DOT_RADIUS, dotColor);

    // Header separator
    s_sprite.drawFastHLine(0, theme::HEADER_HEIGHT - 1, s_width, theme::BG_ELEVATED);
}

/// Draw a hashrate arc gauge (simplified for ESP32 performance).
static void drawHashrateArc(int cx, int cy, int radius, double hashrate) {
    // Normalize hashrate to 0–1 range (0 to 100kH/s)
    double maxH = 100000.0;  // 100 kH/s full scale
    double ratio = constrain(hashrate / maxH, 0.0, 1.0);

    // Draw background arc
    int arcStart = 135;  // degrees
    int arcEnd   = 405;  // degrees (135 + 270 = full arc)
    int arcLen   = arcEnd - arcStart;

    // Background arc segments
    for (int a = 0; a < arcLen; a += 3) {
        float angle = (arcStart + a) * DEG_TO_RAD;
        int x = cx + cos(angle) * radius;
        int y = cy + sin(angle) * radius;
        s_sprite.drawPixel(x, y, theme::BG_ELEVATED);
    }

    // Active arc
    int activeEnd = arcStart + (int)(ratio * arcLen);
    for (int a = 0; a < (activeEnd - arcStart); a += 2) {
        float angle = (arcStart + a) * DEG_TO_RAD;
        int x = cx + cos(angle) * radius;
        int y = cy + sin(angle) * radius;
        // Gradient from amber to bright amber
        s_sprite.fillCircle(x, y, 1, theme::AMBER);
    }
}

// ---------------------------------------------------------------------------
// Page renderers
// ---------------------------------------------------------------------------

/// Page 0: Mining Dashboard
static void renderMiningPage() {
    MiningStats stats = miner::getStats();
    drawHeader("MINING");

    int contentY = theme::HEADER_HEIGHT + 2;

    // Hashrate big number with arc gauge
    int gaugeY = contentY + 4;
    int gaugeCX = s_width / 2;
    int gaugeCY = gaugeY + 38;
    int gaugeR = 30;

    // Only draw arc on larger displays
    if (s_height >= 170) {
        drawHashrateArc(gaugeCX, gaugeCY, gaugeR, s_smoothHashrate);
    }

    // Hashrate number
    String hrStr = btc::formatHashrate(s_smoothHashrate);
    s_sprite.setTextColor(theme::AMBER);
    s_sprite.setTextDatum(MC_DATUM);

    if (s_height >= 170) {
        s_sprite.drawString(hrStr, gaugeCX, gaugeCY, theme::FONT_MEDIUM);
    } else {
        s_sprite.drawString(hrStr, gaugeCX, contentY + 16, theme::FONT_MEDIUM);
    }

    // Mining pulse animation (subtle glow when actively mining)
    if (stats.isMining) {
        unsigned long elapsed = millis() - s_pulseStart;
        float pulse = (sin(elapsed * 2.0 * PI / theme::PULSE_PERIOD) + 1.0) / 2.0;
        uint8_t alpha = 20 + (uint8_t)(pulse * 40);
        // Draw a subtle dot under the hashrate
        uint16_t pulseColor = (pulse > 0.5) ? theme::AMBER : theme::AMBER_DIM;
        s_sprite.fillCircle(gaugeCX, gaugeCY + (s_height >= 170 ? gaugeR + 8 : 30), 2, pulseColor);
    }

    // Stats rows below the gauge
    int rowY = (s_height >= 170) ? gaugeCY + gaugeR + 14 : contentY + 38;

    drawCard(theme::MARGIN_X, rowY, s_width - 2 * theme::MARGIN_X, 5 * theme::ROW_HEIGHT + 4);
    rowY += 2;

    drawStatRow(rowY, "Accepted", String(stats.sharesAccepted), theme::GREEN);
    rowY += theme::ROW_HEIGHT;
    drawSeparator(rowY);

    drawStatRow(rowY, "Rejected", String(stats.sharesRejected),
                stats.sharesRejected > 0 ? theme::RED : theme::TEXT_PRIMARY);
    rowY += theme::ROW_HEIGHT;
    drawSeparator(rowY);

    drawStatRow(rowY, "Best Diff", btc::formatDifficulty(stats.bestDifficulty), theme::AMBER);
    rowY += theme::ROW_HEIGHT;
    drawSeparator(rowY);

    drawStatRow(rowY, "Templates", String(stats.templates));
    rowY += theme::ROW_HEIGHT;
    drawSeparator(rowY);

    drawStatRow(rowY, "Uptime", btc::formatUptime(stats.uptimeSeconds));
}

/// Page 1: Network Stats
static void renderNetworkPage() {
    NetworkStats ns = stratum::getNetworkStats();
    drawHeader("NETWORK");

    int contentY = theme::HEADER_HEIGHT + 4;

    // BTC Price big number
    if (ns.btcPriceUsd > 0) {
        char priceBuf[16];
        snprintf(priceBuf, sizeof(priceBuf), "$%s", btc::formatNumber((uint64_t)ns.btcPriceUsd).c_str());
        s_sprite.setTextColor(theme::AMBER);
        s_sprite.setTextDatum(MC_DATUM);
        s_sprite.drawString(priceBuf, s_width / 2, contentY + 18, theme::FONT_MEDIUM);

        s_sprite.setTextColor(theme::TEXT_SECONDARY);
        s_sprite.setTextDatum(MC_DATUM);
        s_sprite.drawString("BTC/USD", s_width / 2, contentY + 36, theme::FONT_TINY);
    } else {
        s_sprite.setTextColor(theme::TEXT_DIM);
        s_sprite.setTextDatum(MC_DATUM);
        s_sprite.drawString("Fetching...", s_width / 2, contentY + 24, theme::FONT_SMALL);
    }

    // Stats card
    int cardY = contentY + 50;
    drawCard(theme::MARGIN_X, cardY, s_width - 2 * theme::MARGIN_X, 4 * theme::ROW_HEIGHT + 4);
    cardY += 2;

    drawStatRow(cardY, "Block Height",
                ns.blockHeight > 0 ? btc::formatNumber(ns.blockHeight) : "...");
    cardY += theme::ROW_HEIGHT;
    drawSeparator(cardY);

    drawStatRow(cardY, "Net Hashrate",
                ns.networkHashrate > 0 ? String(ns.networkHashrate, 1) + " EH/s" : "...");
    cardY += theme::ROW_HEIGHT;
    drawSeparator(cardY);

    drawStatRow(cardY, "Difficulty",
                ns.networkDifficulty > 0 ? btc::formatDifficulty(ns.networkDifficulty) : "...");
    cardY += theme::ROW_HEIGHT;
    drawSeparator(cardY);

    // Next halving estimate
    if (ns.blockHeight > 0) {
        uint32_t nextHalving = ((ns.blockHeight / 210000) + 1) * 210000;
        uint32_t remaining = nextHalving - ns.blockHeight;
        drawStatRow(cardY, "Halving In", btc::formatNumber(remaining) + " blks", theme::YELLOW);
    } else {
        drawStatRow(cardY, "Halving In", "...");
    }
}

/// Page 2: Device Info
static void renderDevicePage() {
    MiningStats ms = miner::getStats();
    drawHeader("DEVICE");

    int contentY = theme::HEADER_HEIGHT + 4;

    // WiFi signal strength bar
    int rssi = WiFi.RSSI();
    int bars = 0;
    if (rssi > -50) bars = 4;
    else if (rssi > -60) bars = 3;
    else if (rssi > -70) bars = 2;
    else if (rssi > -80) bars = 1;

    int barX = s_width / 2 - 20;
    int barY = contentY + 8;
    for (int i = 0; i < 4; i++) {
        int h = 4 + i * 4;
        uint16_t color = (i < bars) ? theme::GREEN : theme::BG_ELEVATED;
        s_sprite.fillRect(barX + i * 12, barY + 16 - h, 8, h, color);
    }

    s_sprite.setTextColor(theme::TEXT_SECONDARY);
    s_sprite.setTextDatum(MC_DATUM);
    s_sprite.drawString(String(rssi) + " dBm", s_width / 2, barY + 26, theme::FONT_TINY);

    // Stats card
    int cardY = barY + 36;
    int availRows = (s_height - cardY - 16) / theme::ROW_HEIGHT;
    if (availRows > 6) availRows = 6;

    drawCard(theme::MARGIN_X, cardY, s_width - 2 * theme::MARGIN_X,
             availRows * theme::ROW_HEIGHT + 4);
    cardY += 2;

    drawStatRow(cardY, "Board", BOARD_NAME);
    cardY += theme::ROW_HEIGHT;
    drawSeparator(cardY);

    drawStatRow(cardY, "IP", WiFi.localIP().toString());
    cardY += theme::ROW_HEIGHT;
    if (--availRows <= 0) goto done;
    drawSeparator(cardY);

    drawStatRow(cardY, "Pool", stratum::getStatusString(),
                stratum::isReady() ? theme::GREEN : theme::YELLOW);
    cardY += theme::ROW_HEIGHT;
    if (--availRows <= 0) goto done;
    drawSeparator(cardY);

    {
        uint32_t freeKB = ESP.getFreeHeap() / 1024;
        drawStatRow(cardY, "Free Heap", String(freeKB) + " KB");
        cardY += theme::ROW_HEIGHT;
        if (--availRows <= 0) goto done;
        drawSeparator(cardY);
    }

    // Temperature
    #if defined(CONFIG_IDF_TARGET_ESP32S3) || defined(CONFIG_IDF_TARGET_ESP32C3)
    {
        float temp = temperatureRead();
        drawStatRow(cardY, "Chip Temp", String(temp, 1) + " C",
                    temp > 70 ? theme::RED : theme::TEXT_PRIMARY);
        cardY += theme::ROW_HEIGHT;
        if (--availRows <= 0) goto done;
        drawSeparator(cardY);
    }
    #endif

    drawStatRow(cardY, "Total Hashes", btc::formatNumber(ms.totalHashes));
    cardY += theme::ROW_HEIGHT;

done:
    // Firmware version at bottom
    s_sprite.setTextColor(theme::TEXT_DIM);
    s_sprite.setTextDatum(MC_DATUM);
    s_sprite.drawString("v" MINI_MINER_VERSION, s_width / 2, s_height - 18, theme::FONT_TINY);
}

// ---------------------------------------------------------------------------
// Boot splash screen
// ---------------------------------------------------------------------------

static void drawBootSplash() {
    s_tft.fillScreen(theme::BG_PRIMARY);

    int cx = s_width / 2;
    int cy = s_height / 2;

    // Pickaxe icon (drawn with lines)
    s_tft.setTextColor(theme::AMBER);
    s_tft.setTextDatum(MC_DATUM);
    s_tft.drawString("miniMiner", cx, cy - 10, theme::FONT_MEDIUM);

    s_tft.setTextColor(theme::TEXT_SECONDARY);
    s_tft.drawString("v" MINI_MINER_VERSION, cx, cy + 14, theme::FONT_SMALL);

    s_tft.setTextColor(theme::TEXT_DIM);
    s_tft.drawString("ESP32 Bitcoin Solo Miner", cx, cy + 34, theme::FONT_TINY);

    // Animated loading dots
    for (int i = 0; i < 3; i++) {
        s_tft.fillCircle(cx - 12 + i * 12, cy + 52, 3, theme::AMBER_DIM);
        delay(300);
        s_tft.fillCircle(cx - 12 + i * 12, cy + 52, 3, theme::AMBER);
    }

    delay(500);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

void init() {
    s_tft.init();
    s_tft.setRotation(DISPLAY_ROTATION);
    s_width  = s_tft.width();
    s_height = s_tft.height();

    // Enable backlight
    #if BACKLIGHT_PIN >= 0
        pinMode(BACKLIGHT_PIN, OUTPUT);
        analogWrite(BACKLIGHT_PIN, config::get().brightness);
    #endif

    // Create full-screen sprite for double buffering
    s_sprite.createSprite(s_width, s_height);
    s_sprite.setSwapBytes(true);

    s_pulseStart = millis();
    s_initialized = true;

    drawBootSplash();
    Serial.printf("[DISPLAY] Init: %dx%d, rotation=%d\n", s_width, s_height, DISPLAY_ROTATION);
}

void update() {
    if (!s_initialized) return;

    unsigned long now = millis();
    if (now - s_lastUpdate < DISPLAY_UPDATE_MS) return;
    s_lastUpdate = now;

    // Smooth hashrate value
    MiningStats stats = miner::getStats();
    double targetHR = stats.hashrate;
    double diff = targetHR - s_smoothHashrate;
    s_smoothHashrate += diff * 0.3;  // exponential smoothing
    if (abs(diff) < 1.0) s_smoothHashrate = targetHR;

    // Clear sprite
    s_sprite.fillSprite(theme::BG_PRIMARY);

    // Render current page
    switch (s_currentPage) {
        case theme::PAGE_MINING:  renderMiningPage();  break;
        case theme::PAGE_NETWORK: renderNetworkPage(); break;
        case theme::PAGE_DEVICE:  renderDevicePage();  break;
    }

    // Page indicator dots
    drawPageIndicator();

    // Push sprite to display
    s_sprite.pushSprite(0, 0);
}

void nextPage() {
    s_currentPage = (s_currentPage + 1) % theme::PAGE_COUNT;
    s_lastUpdate = 0;  // force immediate redraw
    Serial.printf("[DISPLAY] Page: %d\n", s_currentPage);
}

void setBrightness(uint8_t brightness) {
    #if BACKLIGHT_PIN >= 0
        analogWrite(BACKLIGHT_PIN, brightness);
    #endif
}

void showMessage(const String& line1, const String& line2) {
    if (!s_initialized) return;

    s_sprite.fillSprite(theme::BG_PRIMARY);

    int cx = s_width / 2;
    int cy = s_height / 2;

    s_sprite.setTextColor(theme::AMBER);
    s_sprite.setTextDatum(MC_DATUM);
    s_sprite.drawString(line1, cx, cy - 8, theme::FONT_SMALL);

    if (line2.length() > 0) {
        s_sprite.setTextColor(theme::TEXT_SECONDARY);
        s_sprite.drawString(line2, cx, cy + 12, theme::FONT_TINY);
    }

    s_sprite.pushSprite(0, 0);
}

int getCurrentPage() {
    return s_currentPage;
}

} // namespace display

#endif // HAS_DISPLAY
