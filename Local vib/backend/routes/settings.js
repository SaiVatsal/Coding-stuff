import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const router = express.Router();
export const SETTINGS_DIR = path.join(os.homedir(), '.nitrocode');
export const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  ollamaPath: path.join(os.homedir(), '.ollama', 'models'),
  defaultModel: 'ollama',
  autoRouting: true,
  anthropicKey: '',
  openaiKey: '',
  googleKey: '',
  openaiWhisper: false,
  mcpServers: [],
  previewPort: 3131,
  autoRefresh: true,
  fontSize: 13,
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  autoSave: true,
  voiceEnabled: true,
  voiceMode: 'click-toggle',
  whisperApiEnabled: false,
  plugins: {}
};

// Ensure settings exist
export async function getSettings() {
  try {
    await fs.ensureDir(SETTINGS_DIR);
    if (!await fs.pathExists(SETTINGS_FILE)) {
      await fs.writeJson(SETTINGS_FILE, DEFAULT_SETTINGS, { spaces: 2 });
      return DEFAULT_SETTINGS;
    }
    const current = await fs.readJson(SETTINGS_FILE);
    return { ...DEFAULT_SETTINGS, ...current };
  } catch (err) {
    console.error('Error reading settings:', err);
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings) {
  try {
    await fs.ensureDir(SETTINGS_DIR);
    await fs.writeJson(SETTINGS_FILE, settings, { spaces: 2 });
    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    throw err;
  }
}

// Mask an API key — show only last 4 chars for UI display
function maskKey(key) {
  if (!key || key.length < 5) return key;
  return '••••••••' + key.slice(-4);
}

// GET /api/settings — returns masked keys (safe for frontend)
router.get('/', async (req, res) => {
  try {
    const s = await getSettings();
    // Return masked keys to the frontend — full keys are ONLY used server-side
    res.json({
      ...s,
      anthropicKey: maskKey(s.anthropicKey),
      openaiKey: maskKey(s.openaiKey),
      googleKey: maskKey(s.googleKey),
      // Also expose a simple boolean so the frontend knows if a key is set
      _hasAnthropicKey: !!s.anthropicKey,
      _hasOpenaiKey: !!s.openaiKey,
      _hasGoogleKey: !!s.googleKey,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/settings — saves settings; if a key value is all bullets, keep the existing one
router.post('/', async (req, res) => {
  try {
    const incoming = req.body;
    const existing = await getSettings();

    // Preserve existing key if the frontend sends back a masked value
    const isMasked = (v) => typeof v === 'string' && v.startsWith('••••');
    const merged = {
      ...existing,
      ...incoming,
      anthropicKey: isMasked(incoming.anthropicKey) ? existing.anthropicKey : (incoming.anthropicKey ?? existing.anthropicKey),
      openaiKey: isMasked(incoming.openaiKey) ? existing.openaiKey : (incoming.openaiKey ?? existing.openaiKey),
      googleKey: isMasked(incoming.googleKey) ? existing.googleKey : (incoming.googleKey ?? existing.googleKey),
    };
    // Strip helper flags before saving
    delete merged._hasAnthropicKey;
    delete merged._hasOpenaiKey;
    delete merged._hasGoogleKey;

    await saveSettings(merged);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
