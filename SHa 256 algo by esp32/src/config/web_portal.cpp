// ===========================================================================
// miniMiner — Web Portal Implementation
// web_portal.cpp
// ===========================================================================
// Serves two roles:
//   1. AP Mode: Captive portal for initial WiFi + pool configuration
//   2. STA Mode: Live mining dashboard + settings editor
// ===========================================================================

#include "web_portal.h"
#include "config_manager.h"
#include "../hal/board_config.h"
#include "../mining/miner.h"
#include "../stratum/stratum.h"
#include "../utils/bitcoin_utils.h"

#include <WebServer.h>
#include <WiFi.h>
#include <DNSServer.h>

namespace webportal {

static WebServer   s_server(80);
static DNSServer   s_dnsServer;
static bool        s_apMode = false;
static bool        s_running = false;

// ---------------------------------------------------------------------------
// HTML Templates — hand-crafted, dark theme, mobile-first
// ---------------------------------------------------------------------------

static const char SETUP_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>miniMiner Setup</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
    background:#0a0a0f;color:#e0e0e8;min-height:100vh;
    display:flex;align-items:center;justify-content:center;padding:20px}
  .card{background:#14141f;border-radius:16px;padding:32px;
    max-width:420px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.6);
    border:1px solid #1e1e2e}
  .logo{text-align:center;margin-bottom:24px}
  .logo h1{font-size:28px;font-weight:700;color:#f7931a;letter-spacing:-0.5px}
  .logo .pick{font-size:24px;margin-right:6px}
  .logo p{color:#8888a0;font-size:13px;margin-top:4px}
  .field{margin-bottom:16px}
  .field label{display:block;font-size:13px;color:#8888a0;
    margin-bottom:6px;font-weight:500;letter-spacing:0.3px;text-transform:uppercase}
  .field input,.field select{width:100%;padding:12px 14px;
    background:#0a0a0f;border:1px solid #2a2a3a;border-radius:10px;
    color:#e0e0e8;font-size:15px;outline:none;transition:border 0.2s}
  .field input:focus,.field select:focus{border-color:#f7931a}
  .field input::placeholder{color:#555568}
  .field .hint{font-size:11px;color:#555568;margin-top:4px}
  .row{display:flex;gap:12px}
  .row .field{flex:1}
  .btn{width:100%;padding:14px;background:#f7931a;color:#0a0a0f;
    border:none;border-radius:10px;font-size:16px;font-weight:600;
    cursor:pointer;transition:background 0.2s;margin-top:8px;letter-spacing:0.3px}
  .btn:hover{background:#ffaa33}
  .btn:active{transform:scale(0.98)}
  .divider{height:1px;background:#1e1e2e;margin:20px 0}
  .scan-btn{background:none;border:1px solid #2a2a3a;color:#8888a0;
    padding:8px 14px;border-radius:8px;font-size:12px;cursor:pointer;
    margin-bottom:8px;transition:all 0.2s}
  .scan-btn:hover{border-color:#f7931a;color:#f7931a}
  .preset{display:flex;gap:8px;margin-bottom:8px}
  .preset button{flex:1;padding:8px;background:#0a0a0f;border:1px solid #2a2a3a;
    color:#8888a0;border-radius:8px;font-size:12px;cursor:pointer;transition:all 0.2s}
  .preset button:hover,.preset button.active{border-color:#f7931a;color:#f7931a}
  .status{text-align:center;padding:16px;color:#f7931a;display:none;font-size:14px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <h1><span class="pick">⛏</span>miniMiner</h1>
    <p>ESP32 Bitcoin Solo Miner — Setup</p>
  </div>

  <form id="setupForm" action="/save" method="POST">
    <div class="field">
      <label>WiFi Network</label>
      <button type="button" class="scan-btn" onclick="scanWifi()">↻ Scan Networks</button>
      <select name="ssid" id="ssidSelect" style="display:none"></select>
      <input type="text" name="ssid_manual" id="ssidManual"
        placeholder="Enter SSID or scan above" value="">
    </div>

    <div class="field">
      <label>WiFi Password</label>
      <input type="password" name="password" placeholder="WiFi password">
    </div>

    <div class="divider"></div>

    <div class="field">
      <label>BTC Wallet Address</label>
      <input type="text" name="btc_address" placeholder="bc1q... or 1... or 3..."
        pattern="[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[a-z0-9]{39,59}"
        title="Enter a valid Bitcoin address">
      <div class="hint">Your Bitcoin address for receiving mining rewards</div>
    </div>

    <div class="divider"></div>

    <div class="field">
      <label>Mining Pool</label>
      <div class="preset">
        <button type="button" onclick="setPool('public-pool.io',21496)">public-pool.io</button>
        <button type="button" onclick="setPool('solo.ckpool.org',3333)">solo.ckpool</button>
      </div>
      <div class="row">
        <div class="field">
          <input type="text" name="pool_url" id="poolUrl" value="public-pool.io"
            placeholder="Pool URL">
        </div>
        <div class="field" style="max-width:100px">
          <input type="number" name="pool_port" id="poolPort" value="21496"
            placeholder="Port">
        </div>
      </div>
    </div>

    <div class="field">
      <label>Worker Name</label>
      <input type="text" name="worker_name" value="miniMiner"
        placeholder="miniMiner" maxlength="24">
    </div>

    <button type="submit" class="btn">⛏ Save & Start Mining</button>
  </form>

  <div class="status" id="status">Saving configuration...</div>
</div>

<script>
function setPool(url, port) {
  document.getElementById('poolUrl').value = url;
  document.getElementById('poolPort').value = port;
  document.querySelectorAll('.preset button').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
}

function scanWifi() {
  fetch('/scan').then(r => r.json()).then(networks => {
    const sel = document.getElementById('ssidSelect');
    const man = document.getElementById('ssidManual');
    sel.innerHTML = '<option value="">— Select Network —</option>';
    networks.forEach(n => {
      sel.innerHTML += '<option value="'+n.ssid+'">'+n.ssid+' ('+n.rssi+'dBm)</option>';
    });
    sel.style.display = 'block';
    sel.onchange = function() {
      if (this.value) man.value = this.value;
    };
  }).catch(() => {});
}

document.getElementById('setupForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const fd = new FormData(this);
  // Use manual SSID if select wasn't used
  if (!fd.get('ssid') || fd.get('ssid') === '') {
    fd.set('ssid', fd.get('ssid_manual'));
  }
  fetch('/save', { method: 'POST', body: new URLSearchParams(fd) })
    .then(r => r.text())
    .then(() => {
      document.getElementById('status').style.display = 'block';
      document.getElementById('status').textContent = '✓ Saved! Rebooting...';
      setTimeout(() => { document.getElementById('status').textContent = 'Reconnect to your WiFi network to access the dashboard.'; }, 3000);
    });
});
</script>
</body>
</html>
)rawliteral";

// ---------------------------------------------------------------------------
// Dashboard page — live stats (STA mode)
// ---------------------------------------------------------------------------

static const char DASHBOARD_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>miniMiner Dashboard</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
    background:#0a0a0f;color:#e0e0e8;min-height:100vh;padding:16px}
  .header{display:flex;align-items:center;justify-content:space-between;
    padding:16px 0;border-bottom:1px solid #1e1e2e;margin-bottom:20px}
  .header h1{font-size:22px;color:#f7931a;font-weight:700}
  .header .pick{margin-right:6px}
  .header .status-dot{width:10px;height:10px;border-radius:50%;
    display:inline-block;margin-right:6px}
  .header .status-dot.on{background:#22c55e;box-shadow:0 0 8px #22c55e80}
  .header .status-dot.off{background:#ef4444;box-shadow:0 0 8px #ef444480}
  .header .status-text{font-size:13px;color:#8888a0}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
  .card{background:#14141f;border-radius:14px;padding:20px;
    border:1px solid #1e1e2e}
  .card h2{font-size:13px;color:#8888a0;text-transform:uppercase;
    letter-spacing:0.5px;margin-bottom:14px;font-weight:500}
  .stat{display:flex;justify-content:space-between;align-items:baseline;
    padding:8px 0;border-bottom:1px solid #0a0a0f}
  .stat:last-child{border-bottom:none}
  .stat .label{font-size:13px;color:#8888a0}
  .stat .value{font-size:16px;font-weight:600;font-family:'Cascadia Code',
    'Fira Code',monospace;color:#e0e0e8}
  .stat .value.highlight{color:#f7931a}
  .stat .value.good{color:#22c55e}
  .stat .value.warn{color:#eab308}
  .big-stat{text-align:center;padding:20px 0}
  .big-stat .number{font-size:42px;font-weight:700;color:#f7931a;
    font-family:'Cascadia Code','Fira Code',monospace;line-height:1}
  .big-stat .unit{font-size:14px;color:#8888a0;margin-top:4px}
  .footer{margin-top:20px;padding-top:16px;border-top:1px solid #1e1e2e;
    display:flex;justify-content:space-between;align-items:center}
  .footer a{color:#f7931a;text-decoration:none;font-size:13px;
    padding:8px 16px;border:1px solid #f7931a33;border-radius:8px;
    transition:all 0.2s}
  .footer a:hover{background:#f7931a15;border-color:#f7931a}
  .footer .version{font-size:12px;color:#555568}
</style>
</head>
<body>
<div class="header">
  <h1><span class="pick">⛏</span> miniMiner</h1>
  <div>
    <span class="status-dot" id="statusDot"></span>
    <span class="status-text" id="statusText">Loading...</span>
  </div>
</div>

<div class="grid">
  <div class="card">
    <h2>⛏ Mining</h2>
    <div class="big-stat">
      <div class="number" id="hashrate">—</div>
      <div class="unit">hashrate</div>
    </div>
    <div class="stat">
      <span class="label">Shares Accepted</span>
      <span class="value good" id="accepted">0</span>
    </div>
    <div class="stat">
      <span class="label">Shares Rejected</span>
      <span class="value" id="rejected">0</span>
    </div>
    <div class="stat">
      <span class="label">Best Difficulty</span>
      <span class="value highlight" id="bestDiff">—</span>
    </div>
    <div class="stat">
      <span class="label">Templates</span>
      <span class="value" id="templates">0</span>
    </div>
    <div class="stat">
      <span class="label">Uptime</span>
      <span class="value" id="uptime">—</span>
    </div>
  </div>

  <div class="card">
    <h2>🌐 Network</h2>
    <div class="stat">
      <span class="label">BTC Price</span>
      <span class="value highlight" id="btcPrice">—</span>
    </div>
    <div class="stat">
      <span class="label">Block Height</span>
      <span class="value" id="blockHeight">—</span>
    </div>
    <div class="stat">
      <span class="label">Network Hashrate</span>
      <span class="value" id="netHashrate">—</span>
    </div>
    <div class="stat">
      <span class="label">Network Difficulty</span>
      <span class="value" id="netDifficulty">—</span>
    </div>
    <div class="stat">
      <span class="label">Pool</span>
      <span class="value" id="poolUrl">—</span>
    </div>
  </div>

  <div class="card">
    <h2>📊 Device</h2>
    <div class="stat">
      <span class="label">Board</span>
      <span class="value" id="board">—</span>
    </div>
    <div class="stat">
      <span class="label">WiFi Signal</span>
      <span class="value" id="rssi">—</span>
    </div>
    <div class="stat">
      <span class="label">IP Address</span>
      <span class="value" id="ipAddr">—</span>
    </div>
    <div class="stat">
      <span class="label">Free Heap</span>
      <span class="value" id="freeHeap">—</span>
    </div>
    <div class="stat">
      <span class="label">Temperature</span>
      <span class="value" id="chipTemp">—</span>
    </div>
    <div class="stat">
      <span class="label">Total Hashes</span>
      <span class="value" id="totalHashes">—</span>
    </div>
  </div>
</div>

<div class="footer">
  <a href="/settings">⚙ Settings</a>
  <span class="version" id="fwVersion"></span>
</div>

<script>
function update() {
  fetch('/api/stats').then(r => r.json()).then(d => {
    // Mining
    document.getElementById('hashrate').textContent = d.hashrate_str || '0 H/s';
    document.getElementById('accepted').textContent = d.shares_accepted || '0';
    document.getElementById('rejected').textContent = d.shares_rejected || '0';
    document.getElementById('bestDiff').textContent = d.best_diff_str || '—';
    document.getElementById('templates').textContent = d.templates || '0';
    document.getElementById('uptime').textContent = d.uptime_str || '—';
    document.getElementById('totalHashes').textContent = d.total_hashes_str || '0';

    // Status
    const dot = document.getElementById('statusDot');
    const txt = document.getElementById('statusText');
    dot.className = 'status-dot ' + (d.is_mining ? 'on' : 'off');
    txt.textContent = d.stratum_status || 'Unknown';

    // Network
    if (d.btc_price > 0) document.getElementById('btcPrice').textContent = '$' + d.btc_price.toLocaleString();
    if (d.block_height > 0) document.getElementById('blockHeight').textContent = d.block_height.toLocaleString();
    document.getElementById('netHashrate').textContent = d.net_hashrate_str || '—';
    document.getElementById('netDifficulty').textContent = d.net_diff_str || '—';
    document.getElementById('poolUrl').textContent = d.pool || '—';

    // Device
    document.getElementById('board').textContent = d.board || '—';
    document.getElementById('rssi').textContent = (d.rssi || '?') + ' dBm';
    document.getElementById('ipAddr').textContent = d.ip || '—';
    document.getElementById('freeHeap').textContent = d.free_heap_str || '—';
    document.getElementById('chipTemp').textContent = (d.temp || '?') + '°C';
    document.getElementById('fwVersion').textContent = 'miniMiner ' + (d.version || '');
  }).catch(() => {});
}

update();
setInterval(update, 3000);
</script>
</body>
</html>
)rawliteral";

// ---------------------------------------------------------------------------
// Settings page (accessible from dashboard)
// ---------------------------------------------------------------------------

static const char SETTINGS_PAGE[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>miniMiner Settings</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;
    background:#0a0a0f;color:#e0e0e8;min-height:100vh;padding:20px;
    display:flex;align-items:center;justify-content:center}
  .card{background:#14141f;border-radius:16px;padding:32px;
    max-width:420px;width:100%;box-shadow:0 8px 32px rgba(0,0,0,0.6);
    border:1px solid #1e1e2e}
  h1{font-size:20px;color:#f7931a;margin-bottom:20px;font-weight:700}
  .field{margin-bottom:16px}
  .field label{display:block;font-size:13px;color:#8888a0;
    margin-bottom:6px;font-weight:500;text-transform:uppercase;letter-spacing:0.3px}
  .field input{width:100%;padding:12px 14px;
    background:#0a0a0f;border:1px solid #2a2a3a;border-radius:10px;
    color:#e0e0e8;font-size:15px;outline:none;transition:border 0.2s}
  .field input:focus{border-color:#f7931a}
  .row{display:flex;gap:12px}
  .row .field{flex:1}
  .btn{width:100%;padding:14px;background:#f7931a;color:#0a0a0f;
    border:none;border-radius:10px;font-size:16px;font-weight:600;
    cursor:pointer;transition:background 0.2s;margin-top:8px}
  .btn:hover{background:#ffaa33}
  .btn-outline{background:none;border:1px solid #2a2a3a;color:#8888a0;
    margin-top:12px}
  .btn-outline:hover{border-color:#ef4444;color:#ef4444}
  .back{display:inline-block;color:#8888a0;text-decoration:none;
    font-size:13px;margin-bottom:16px}
  .back:hover{color:#f7931a}
  .status{text-align:center;padding:12px;color:#22c55e;display:none;font-size:14px}
</style>
</head>
<body>
<div class="card">
  <a href="/" class="back">← Back to Dashboard</a>
  <h1>⚙ Settings</h1>

  <form id="settingsForm">
    <div class="field">
      <label>BTC Wallet Address</label>
      <input type="text" name="btc_address" id="btcAddr">
    </div>
    <div class="row">
      <div class="field">
        <label>Pool URL</label>
        <input type="text" name="pool_url" id="poolUrlInput">
      </div>
      <div class="field" style="max-width:100px">
        <label>Port</label>
        <input type="number" name="pool_port" id="poolPortInput">
      </div>
    </div>
    <div class="field">
      <label>Worker Name</label>
      <input type="text" name="worker_name" id="workerInput" maxlength="24">
    </div>
    <button type="submit" class="btn">Save & Reconnect</button>
  </form>

  <div class="status" id="status"></div>

  <form action="/reset" method="POST" onsubmit="return confirm('Reset all settings to defaults?')">
    <button type="submit" class="btn btn-outline">Factory Reset</button>
  </form>
</div>

<script>
// Load current settings
fetch('/api/config').then(r => r.json()).then(c => {
  document.getElementById('btcAddr').value = c.btc_address || '';
  document.getElementById('poolUrlInput').value = c.pool_url || '';
  document.getElementById('poolPortInput').value = c.pool_port || 21496;
  document.getElementById('workerInput').value = c.worker_name || 'miniMiner';
}).catch(() => {});

document.getElementById('settingsForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const fd = new FormData(this);
  fetch('/save_settings', { method:'POST', body: new URLSearchParams(fd) })
    .then(r => r.text())
    .then(() => {
      const st = document.getElementById('status');
      st.style.display = 'block';
      st.textContent = '✓ Saved! Reconnecting to pool...';
      setTimeout(() => { st.style.display = 'none'; }, 4000);
    });
});
</script>
</body>
</html>
)rawliteral";

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

static void handleRoot() {
    if (s_apMode) {
        s_server.send_P(200, "text/html", SETUP_PAGE);
    } else {
        s_server.send_P(200, "text/html", DASHBOARD_PAGE);
    }
}

static void handleSettings() {
    s_server.send_P(200, "text/html", SETTINGS_PAGE);
}

static void handleScan() {
    int n = WiFi.scanNetworks();
    String json = "[";
    for (int i = 0; i < n; i++) {
        if (i > 0) json += ",";
        json += "{\"ssid\":\"" + WiFi.SSID(i) + "\",\"rssi\":" + String(WiFi.RSSI(i)) + "}";
    }
    json += "]";
    WiFi.scanDelete();
    s_server.send(200, "application/json", json);
}

static void handleSave() {
    MinerConfig& cfg = config::getMutable();

    String ssid = s_server.arg("ssid");
    if (ssid.isEmpty()) ssid = s_server.arg("ssid_manual");
    strncpy(cfg.wifiSsid, ssid.c_str(), sizeof(cfg.wifiSsid) - 1);
    strncpy(cfg.wifiPassword, s_server.arg("password").c_str(), sizeof(cfg.wifiPassword) - 1);
    strncpy(cfg.btcAddress, s_server.arg("btc_address").c_str(), sizeof(cfg.btcAddress) - 1);
    strncpy(cfg.poolUrl, s_server.arg("pool_url").c_str(), sizeof(cfg.poolUrl) - 1);
    cfg.poolPort = s_server.arg("pool_port").toInt();
    strncpy(cfg.workerName, s_server.arg("worker_name").c_str(), sizeof(cfg.workerName) - 1);

    if (cfg.poolPort == 0) cfg.poolPort = DEFAULT_POOL_PORT;
    if (strlen(cfg.poolUrl) == 0) strncpy(cfg.poolUrl, DEFAULT_POOL_URL, sizeof(cfg.poolUrl));
    if (strlen(cfg.workerName) == 0) strncpy(cfg.workerName, DEFAULT_WORKER_NAME, sizeof(cfg.workerName));

    config::save(cfg);
    s_server.send(200, "text/plain", "OK");

    // Reboot after a short delay to apply settings
    delay(1000);
    ESP.restart();
}

static void handleSaveSettings() {
    MinerConfig& cfg = config::getMutable();

    String addr = s_server.arg("btc_address");
    if (addr.length() > 0) strncpy(cfg.btcAddress, addr.c_str(), sizeof(cfg.btcAddress) - 1);

    String url = s_server.arg("pool_url");
    if (url.length() > 0) strncpy(cfg.poolUrl, url.c_str(), sizeof(cfg.poolUrl) - 1);

    uint16_t port = s_server.arg("pool_port").toInt();
    if (port > 0) cfg.poolPort = port;

    String worker = s_server.arg("worker_name");
    if (worker.length() > 0) strncpy(cfg.workerName, worker.c_str(), sizeof(cfg.workerName) - 1);

    config::save(cfg);
    s_server.send(200, "text/plain", "OK");

    // Reconnect Stratum with new settings
    stratum::configure(cfg.poolUrl, cfg.poolPort, cfg.btcAddress, cfg.workerName);
    stratum::reconnect();
}

static void handleReset() {
    config::resetToDefaults();
    s_server.send(200, "text/plain", "Reset complete. Rebooting...");
    delay(1000);
    ESP.restart();
}

static void handleApiStats() {
    MiningStats ms = miner::getStats();
    NetworkStats ns = stratum::getNetworkStats();

    StaticJsonDocument<1024> doc;

    // Mining stats
    doc["hashrate"]        = ms.hashrate;
    doc["hashrate_str"]    = btc::formatHashrate(ms.hashrate);
    doc["total_hashes"]    = (unsigned long)ms.totalHashes;
    doc["total_hashes_str"]= btc::formatNumber(ms.totalHashes);
    doc["shares_accepted"] = ms.sharesAccepted;
    doc["shares_rejected"] = ms.sharesRejected;
    doc["best_diff"]       = ms.bestDifficulty;
    doc["best_diff_str"]   = btc::formatDifficulty(ms.bestDifficulty);
    doc["uptime_str"]      = btc::formatUptime(ms.uptimeSeconds);
    doc["is_mining"]       = ms.isMining;
    doc["templates"]       = ms.templates;

    // Stratum
    doc["stratum_status"]  = stratum::getStatusString();
    doc["pool"]            = stratum::getPoolUrl();

    // Network
    doc["btc_price"]       = ns.btcPriceUsd;
    doc["block_height"]    = (unsigned long)ns.blockHeight;
    doc["net_hashrate"]    = ns.networkHashrate;
    doc["net_hashrate_str"]= String(ns.networkHashrate, 2) + " EH/s";
    doc["net_diff"]        = ns.networkDifficulty;
    doc["net_diff_str"]    = btc::formatDifficulty(ns.networkDifficulty);

    // Device
    doc["board"]           = BOARD_NAME;
    doc["version"]         = MINI_MINER_VERSION;
    doc["rssi"]            = WiFi.RSSI();
    doc["ip"]              = WiFi.localIP().toString();
    doc["free_heap"]       = ESP.getFreeHeap();
    doc["free_heap_str"]   = String(ESP.getFreeHeap() / 1024) + " KB";

    // Chip temperature (ESP32-S3 has a built-in temp sensor)
    #if defined(CONFIG_IDF_TARGET_ESP32S3) || defined(CONFIG_IDF_TARGET_ESP32C3)
        doc["temp"] = temperatureRead();
    #else
        doc["temp"] = 0;
    #endif

    String output;
    serializeJson(doc, output);
    s_server.send(200, "application/json", output);
}

static void handleApiConfig() {
    const MinerConfig& cfg = config::get();
    StaticJsonDocument<512> doc;
    doc["btc_address"]  = cfg.btcAddress;
    doc["pool_url"]     = cfg.poolUrl;
    doc["pool_port"]    = cfg.poolPort;
    doc["worker_name"]  = cfg.workerName;
    String output;
    serializeJson(doc, output);
    s_server.send(200, "application/json", output);
}

// Captive portal — redirect all requests to root
static void handleNotFound() {
    if (s_apMode) {
        s_server.sendHeader("Location", "http://192.168.4.1/");
        s_server.send(302, "text/plain", "");
    } else {
        s_server.send(404, "text/plain", "Not found");
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

void init() {
    s_server.on("/", handleRoot);
    s_server.on("/settings", handleSettings);
    s_server.on("/scan", HTTP_GET, handleScan);
    s_server.on("/save", HTTP_POST, handleSave);
    s_server.on("/save_settings", HTTP_POST, handleSaveSettings);
    s_server.on("/reset", HTTP_POST, handleReset);
    s_server.on("/api/stats", HTTP_GET, handleApiStats);
    s_server.on("/api/config", HTTP_GET, handleApiConfig);
    s_server.onNotFound(handleNotFound);
}

void startAPMode() {
    WiFi.mode(WIFI_AP);
    WiFi.softAP(MINI_MINER_AP_NAME, MINI_MINER_AP_PASS);
    delay(100);

    // Start DNS server to redirect all domains to our IP (captive portal)
    s_dnsServer.start(53, "*", WiFi.softAPIP());

    s_apMode = true;
    s_server.begin();
    s_running = true;

    Serial.printf("[WEBPORTAL] AP Mode started. SSID: %s  IP: %s\n",
                  MINI_MINER_AP_NAME, WiFi.softAPIP().toString().c_str());
}

void startSTAMode() {
    s_apMode = false;
    s_server.begin();
    s_running = true;
    Serial.printf("[WEBPORTAL] Dashboard at http://%s/\n", WiFi.localIP().toString().c_str());
}

void loop() {
    if (!s_running) return;
    if (s_apMode) {
        s_dnsServer.processNextRequest();
    }
    s_server.handleClient();
}

void stop() {
    s_server.stop();
    if (s_apMode) {
        s_dnsServer.stop();
    }
    s_running = false;
}

bool isAPMode() {
    return s_apMode;
}

} // namespace webportal
