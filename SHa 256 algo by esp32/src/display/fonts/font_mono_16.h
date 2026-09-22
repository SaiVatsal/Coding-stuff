// ===========================================================================
// miniMiner — Custom Monospaced Font (16px)
// font_mono_16.h
// ===========================================================================
// This file provides a clean monospaced font for the display.
// TFT_eSPI's built-in Font 2 (16px) is used as the base monospaced font.
// For custom fonts, use the TFT_eSPI font converter tool:
//   https://github.com/Bodmer/TFT_eSPI/tree/master/Tools
//
// To generate a custom font:
//   1. Download a clean monospaced TTF (e.g., JetBrains Mono, IBM Plex Mono)
//   2. Use the Processing sketch in TFT_eSPI/Tools/Create_Smooth_Font
//   3. Export as .h header and replace this file
//
// For now, miniMiner uses TFT_eSPI's built-in fonts which are clean and
// readable. The theme references font IDs 1, 2, 4, 6, 7 — all built-in.
// ===========================================================================

#pragma once

// Font configuration notes:
// FONT_TINY   = 1  →  8px  (built-in GLCD)
// FONT_SMALL  = 2  →  16px (built-in proportional)
// FONT_MEDIUM = 4  →  26px (built-in proportional)
// FONT_LARGE  = 6  →  36px (built-in numeric + symbols)
// FONT_HUGE   = 7  →  48px (built-in 7-segment style)
//
// These are enabled via build flags in platformio.ini:
//   -DLOAD_GLCD=1 -DLOAD_FONT2=1 -DLOAD_FONT4=1
//   -DLOAD_FONT6=1 -DLOAD_FONT7=1 -DLOAD_GFXFF=1

// If you want to add a custom smooth font, uncomment and modify:
// #include "NotoSansMono_Regular_16.h"
// #define CUSTOM_MONO_FONT NotoSansMono_Regular_16
