// ===========================================================================
// miniMiner — Web Portal
// web_portal.h
// ===========================================================================

#pragma once

#include <Arduino.h>

namespace webportal {

/// Initialize the web server. Call once during setup().
void init();

/// Start in AP mode (captive portal for initial setup).
void startAPMode();

/// Start in STA mode (dashboard accessible at device IP).
void startSTAMode();

/// Process incoming HTTP requests. Call in main loop().
void loop();

/// Stop the web server.
void stop();

/// Check if we're running in AP mode.
bool isAPMode();

} // namespace webportal
