// ===========================================================================
// miniMiner — Display Manager
// display_manager.h
// ===========================================================================

#pragma once

#include <Arduino.h>
#include "../hal/board_config.h"

#if HAS_DISPLAY

namespace display {

/// Initialize the display hardware and draw the boot splash.
void init();

/// Update the display with latest stats. Call from the main loop.
/// Handles page rendering, animations, and value smoothing.
void update();

/// Advance to the next display page.
void nextPage();

/// Set the display brightness (0–255).
void setBrightness(uint8_t brightness);

/// Show a temporary status message overlay (e.g., "Connecting to WiFi...").
void showMessage(const String& line1, const String& line2 = "");

/// Get the current page index.
int getCurrentPage();

} // namespace display

#else

// Stub implementations for headless boards — zero overhead
namespace display {
    inline void init() {}
    inline void update() {}
    inline void nextPage() {}
    inline void setBrightness(uint8_t) {}
    inline void showMessage(const String&, const String& = "") {}
    inline int getCurrentPage() { return 0; }
}

#endif
