// ===========================================================================
// miniMiner — UI Theme Constants
// ui_theme.h
// ===========================================================================
// All visual constants live here. Change the look of the entire UI by
// editing just this file.
// ===========================================================================

#pragma once

#include <cstdint>

namespace theme {

// ---------------------------------------------------------------------------
// Color palette (RGB565 format for TFT_eSPI)
// ---------------------------------------------------------------------------
// RGB565 conversion: ((r & 0xF8) << 8) | ((g & 0xFC) << 3) | (b >> 3)

constexpr uint16_t BG_PRIMARY    = 0x0001;  // #0a0a0f — deep space black
constexpr uint16_t BG_CARD       = 0x0883;  // #14141f — card background
constexpr uint16_t BG_ELEVATED   = 0x10C4;  // #1e1e2e — elevated surface

constexpr uint16_t AMBER         = 0xFC80;  // #f7931a — Bitcoin orange/amber
constexpr uint16_t AMBER_DIM     = 0x8340;  // #804a10 — dimmed amber
constexpr uint16_t AMBER_GLOW    = 0xFDE0;  // #ffaa33 — highlight amber

constexpr uint16_t TEXT_PRIMARY  = 0xE73C;  // #e0e0e8 — bright text
constexpr uint16_t TEXT_SECONDARY= 0x4228;  // #8888a0 — muted text
constexpr uint16_t TEXT_DIM      = 0x2945;  // #555568 — very dim text

constexpr uint16_t GREEN         = 0x2E8A;  // #22c55e — connected/accepted
constexpr uint16_t RED           = 0xE8E4;  // #ef4444 — error/rejected
constexpr uint16_t YELLOW        = 0xEDE0;  // #eab308 — warning/syncing
constexpr uint16_t BLUE          = 0x3C3F;  // #3b82f6 — info accent

constexpr uint16_t SEPARATOR     = 0x0001;  // same as BG_PRIMARY (subtle line)

// ---------------------------------------------------------------------------
// Layout metrics (pixels)
// ---------------------------------------------------------------------------

// Margins and padding
constexpr int MARGIN_X       = 8;    // horizontal margin
constexpr int MARGIN_Y       = 4;    // vertical margin
constexpr int PADDING        = 6;    // inner card padding
constexpr int CARD_RADIUS    = 8;    // rounded corner radius

// Header
constexpr int HEADER_HEIGHT  = 28;   // top bar height
constexpr int HEADER_Y       = 2;    // vertical offset

// Status dot
constexpr int DOT_RADIUS     = 4;
constexpr int DOT_X          = 6;    // from right edge
constexpr int DOT_Y          = 14;   // vertical center

// Stat rows
constexpr int ROW_HEIGHT     = 22;   // height per stat row
constexpr int ROW_LABEL_X    = 12;   // label x offset inside card
constexpr int ROW_VALUE_X    = -12;  // value x offset from right edge (negative = right-aligned)

// Big number (hashrate display)
constexpr int BIG_NUMBER_Y   = 48;   // y position for large hashrate
constexpr int BIG_UNIT_Y     = 78;   // y position for unit label

// Page indicator dots
constexpr int PAGE_DOT_Y     = -8;   // from bottom edge (negative = from bottom)
constexpr int PAGE_DOT_R     = 3;    // radius
constexpr int PAGE_DOT_GAP   = 12;   // spacing between dots

// ---------------------------------------------------------------------------
// Animation timing (milliseconds)
// ---------------------------------------------------------------------------

constexpr int FADE_DURATION    = 300;  // page transition fade
constexpr int PULSE_PERIOD     = 2000; // mining pulse animation period
constexpr int VALUE_SMOOTH_MS  = 500;  // number smoothing duration

// ---------------------------------------------------------------------------
// Font sizes (TFT_eSPI font IDs)
// ---------------------------------------------------------------------------

constexpr int FONT_TINY        = 1;    // 8px — labels, hints
constexpr int FONT_SMALL       = 2;    // 16px — stat labels
constexpr int FONT_MEDIUM      = 4;    // 26px — stat values
constexpr int FONT_LARGE       = 6;    // 36px — big numbers
constexpr int FONT_HUGE        = 7;    // 48px segment — hashrate (7-seg style)

// ---------------------------------------------------------------------------
// Display pages
// ---------------------------------------------------------------------------

constexpr int PAGE_MINING      = 0;
constexpr int PAGE_NETWORK     = 1;
constexpr int PAGE_DEVICE      = 2;
constexpr int PAGE_COUNT       = 3;

} // namespace theme
