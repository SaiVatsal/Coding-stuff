# ⛏ miniMiner

**Open-source Bitcoin solo miner for the ESP32 family.**

miniMiner turns any ESP32 board into a Bitcoin lottery miner. It connects to a solo mining pool, hashes away on the SHA-256 algorithm, and shows live stats on the built-in display (if your board has one). It's educational, it's fun, and who knows — maybe you'll get lucky.

> **Reality check:** An ESP32 mines at ~30-80 kH/s. The Bitcoin network runs at ~600 EH/s. Your odds of finding a block are roughly 1 in 10^16. This is a lottery ticket, not a business plan. But the block reward is currently 3.125 BTC, so... 🎲

---

## Supported Boards

| Board | Display | Cores | Status |
|---|---|---|---|
| **LILYGO T-Display S3** | 1.9" TFT 170×320 | Dual | ✅ Primary target |
| **LILYGO T-Display** | 1.14" TFT 135×240 | Dual | ✅ Supported |
| **M5StickC Plus** | 1.14" TFT 135×240 | Dual | ✅ Supported |
| **ESP32-WROOM-32 DevKit** | None (web UI) | Dual | ✅ Supported |
| **ESP32-S3 DevKitC** | None (web UI) | Dual | ✅ Supported |
| **ESP32-S2 Mini** | None (web UI) | Single | ✅ Supported |
| **ESP32-C3 SuperMini** | None (web UI) | Single | ✅ Supported |

Boards without displays work via the **web dashboard** and serial monitor.

---

## Features

- **Solo Bitcoin mining** via Stratum V1 protocol
- **Dual-core optimized** — mining on Core 1, system on Core 0
- **Single-core support** — ESP32-S2 and ESP32-C3 mine cooperatively
- **SHA-256 midstate optimization** — precomputes the first 64 bytes for faster hashing
- **Hardware SHA acceleration** via mbedtls
- **On-screen display** with three pages: Mining Dashboard, Network Stats, Device Info
- **Web dashboard** — live stats accessible from any browser on your network
- **Captive portal setup** — no code editing needed, configure via your phone
- **SD card config** — drop a `config.json` for headless batch setup
- **Auto-reconnect** — exponential backoff on pool disconnection
- **Network stats** — BTC price, block height, network hashrate, difficulty
- **OTA-ready** partition layout for future firmware updates

---

## Quick Start

### What You Need

1. An ESP32 board (see table above)
2. A USB-C cable
3. [PlatformIO](https://platformio.org/install) (VS Code extension recommended)
4. A Bitcoin wallet address (get one from [Electrum](https://electrum.org/), [BlueWallet](https://bluewallet.io/), etc.)

### Flash the Firmware

```bash
# Clone the repository
git clone https://github.com/yourusername/miniMiner.git
cd miniMiner

# Build and upload (select your board)
pio run -e lilygo-t-display-s3 -t upload

# Or for other boards:
pio run -e lilygo-t-display -t upload
pio run -e esp32-devkit -t upload
pio run -e esp32-s3-devkitc -t upload
pio run -e esp32-s2-mini -t upload
pio run -e esp32-c3-supermini -t upload
pio run -e m5stick-c-plus -t upload
```

### First Boot Setup

1. **Power on the board** — it will start in setup mode
2. **Connect to WiFi** `miniMiner-Setup` (password: `mine1234`)
3. **Open your browser** — a setup page will appear automatically
4. **Enter your details:**
   - WiFi network and password
   - Bitcoin wallet address
   - Pool settings (defaults to `public-pool.io:21496`)
5. **Save** — the device reboots and starts mining

### SD Card Config (Alternative)

Create a file called `config.json` on an SD card:

```json
{
  "wifi_ssid": "YourWiFiNetwork",
  "wifi_password": "YourWiFiPassword",
  "btc_address": "bc1qYourBitcoinAddressHere",
  "pool_url": "public-pool.io",
  "pool_port": 21496,
  "worker_name": "miniMiner",
  "brightness": 200,
  "timezone_offset": 0
}
```

Insert the SD card and power on. The device reads the config and starts mining.

---

## Display Pages

Cycle through pages by pressing the **left button** (GPIO 0) on your board.

### ⛏ Mining Dashboard
- Real-time hashrate with animated arc gauge
- Shares accepted / rejected
- Best difficulty achieved
- Job templates received
- Uptime counter

### 🌐 Network Stats
- Bitcoin price (USD)
- Current block height
- Network hashrate (EH/s)
- Network difficulty
- Blocks until next halving

### 📊 Device Info
- WiFi signal strength (visual bars)
- IP address
- Pool connection status
- Free heap memory
- Chip temperature
- Total hashes computed

---

## Web Dashboard

While mining, visit `http://<device-ip>/` in any browser to see live stats. The dashboard auto-refreshes every 3 seconds.

Features:
- All mining stats in one view
- Settings editor (change pool/wallet without reflashing)
- Factory reset option
- JSON API at `/api/stats` for custom monitoring

---

## Mining Pools

miniMiner works with any Stratum V1 compatible pool. Recommended solo pools:

| Pool | URL | Port |
|---|---|---|
| **public-pool.io** (default) | `public-pool.io` | `21496` |
| **solo.ckpool.org** | `solo.ckpool.org` | `3333` |

After connecting, verify your miner is working at [web.public-pool.io](https://web.public-pool.io/) — search for your Bitcoin address.

---

## 3D Printable Cases

Community-designed cases are available for boards with displays:

- **LILYGO T-Display S3**: Search [Thingiverse](https://www.thingiverse.com/search?q=nerdminer+t-display+s3) or [Printables](https://www.printables.com/search/all?q=nerdminer%20t-display%20s3)
- **M5StickC Plus**: Search [Thingiverse](https://www.thingiverse.com/search?q=m5stickc+plus+case)

Most cases print without supports in PLA or PETG.

---

## Architecture

```
Core 0 (System)              Core 1 (Mining)
┌──────────────────┐         ┌──────────────────┐
│  WiFi + NTP      │         │  SHA-256 Loop     │
│  Stratum Client  │◄═══════►│  Nonce Iteration  │
│  Web Server      │  Queue  │  Midstate Optim.  │
│  Display Manager │         └──────────────────┘
│  API Client      │
└──────────────────┘
```

- **FreeRTOS queues** for thread-safe communication between cores
- **Hardware Abstraction Layer** — all board-specific code in one file
- **Conditional compilation** — display code excluded on headless boards
- **Sprite double-buffering** — flicker-free display updates

---

## Project Structure

```
├── platformio.ini              # Build config (7 board environments)
├── sdkconfig.defaults          # ESP-IDF overrides
├── README.md
├── LICENSE                     # MIT
└── src/
    ├── main.cpp                # Boot sequence + main loop
    ├── hal/
    │   └── board_config.h      # Pin maps for all ESP32 boards
    ├── mining/
    │   ├── miner.h/cpp         # Mining engine (dual/single-core)
    │   └── sha256_midstate.h   # Midstate optimization
    ├── stratum/
    │   ├── stratum.h/cpp       # Stratum V1 protocol client
    ├── display/
    │   ├── display_manager.h/cpp  # 3-page display renderer
    │   └── ui_theme.h          # Visual constants (colors, layout)
    ├── config/
    │   ├── config_manager.h/cpp   # NVS + SD card settings
    │   └── web_portal.h/cpp    # Captive portal + web dashboard
    ├── network/
    │   └── api_client.h/cpp    # mempool.space + CoinGecko APIs
    └── utils/
        └── bitcoin_utils.h/cpp # Hex, SHA-256, Merkle, formatting
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| **Device won't connect to WiFi** | Double-check SSID/password. Try moving closer to the router. |
| **Not showing on public-pool.io** | Verify your BTC address is entered exactly. Check serial monitor for errors. |
| **Display stays blank** | The T-Display S3 backlight is on GPIO 38. Ensure your board variant matches the firmware. |
| **Upload fails** | Hold the BOOT button while connecting USB, then release after upload starts. |
| **Low hashrate** | Normal! ESP32 mines at ~30-80 kH/s. This is a lottery, not a farm. |
| **Frequent disconnects** | Check WiFi signal strength on the Device Info page. Use a stable 2.4GHz network. |
| **Can't access web dashboard** | Check the IP address on the display or serial monitor. Ensure you're on the same network. |

---

## Contributing

Pull requests welcome! Areas where help is appreciated:

- Support for additional ESP32 boards
- Display UI improvements
- Stratum V2 support
- Power consumption optimization
- Additional mining pool presets

---

## Credits

Inspired by [NerdMiner_v2](https://github.com/BitMaker-hub/NerdMiner_v2) by BitMaker-hub. Built from scratch with a focus on clean code, multi-board support, and polished UX.

## License

MIT License — see [LICENSE](LICENSE) for details.
