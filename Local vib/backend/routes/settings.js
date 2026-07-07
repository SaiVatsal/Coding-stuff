import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const router = express.Router();
export const SETTINGS_DIR = path.join(os.homedir(), '.nitrocode');
export const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json');

const DEFAULT_SETTINGS = {
  ollamaPath: os.platform() === 'win32' 
    ? path.join(os.homedir(), '.ollama', 'models') 
    : path.join(os.homedir(), '.ollama', 'models'),
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

router.get('/', async (req, res) => {
  try {
    const s = await getSettings();
    res.json(s);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    await saveSettings(req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
