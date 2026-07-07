import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import { getSettings, saveSettings } from '../routes/settings.js';

const router = express.Router();

export function getPluginsDir() {
  return path.resolve(process.env.WORKSPACE_ROOT || '../../', 'plugins');
}

// Ensure the plugins directory and built-in plugins exist
export async function ensureBuiltinPlugins() {
  const dir = getPluginsDir();
  await fs.ensureDir(dir);
  // We will create the plugins later in our script, but this ensures directory is ready.
}

router.get('/', async (req, res) => {
  try {
    const dir = getPluginsDir();
    await fs.ensureDir(dir);
    
    const settings = await getSettings();
    const pluginStates = settings.plugins || {};

    const contents = await fs.readdir(dir);
    const list = [];

    for (const folder of contents) {
      const p = path.join(dir, folder);
      const stat = await fs.stat(p);
      if (stat.isDirectory()) {
        const manifestPath = path.join(p, 'manifest.json');
        if (await fs.pathExists(manifestPath)) {
          const manifest = await fs.readJson(manifestPath);
          const id = folder;
          list.push({
            id,
            name: manifest.name,
            version: manifest.version,
            icon: manifest.icon || '🔌',
            description: manifest.description || '',
            entry: `/api/plugins/file/${id}/${manifest.entry || 'index.js'}`,
            enabled: pluginStates[id] !== false // Default to enabled
          });
        }
      }
    }

    res.json(list);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/toggle', async (req, res) => {
  try {
    const { id, enabled } = req.body;
    const settings = await getSettings();
    settings.plugins = settings.plugins || {};
    settings.plugins[id] = enabled;
    await saveSettings(settings);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve plugin files statically
router.use('/file', (req, res, next) => {
  const dir = getPluginsDir();
  express.static(dir)(req, res, next);
});

export default router;
