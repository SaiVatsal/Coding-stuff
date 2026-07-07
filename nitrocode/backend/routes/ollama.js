import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { getSettings } from './settings.js';

const router = express.Router();

// Helper to scan manifest directories recursively
async function scanLocalModels(ollamaPath) {
  const manifestsDir = path.join(ollamaPath, 'manifests');
  if (!await fs.pathExists(manifestsDir)) {
    return [];
  }
  
  const models = [];
  async function walk(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const full = path.join(dir, file);
      const stat = await fs.stat(full);
      if (stat.isDirectory()) {
        await walk(full);
      } else {
        const rel = path.relative(manifestsDir, full).replace(/\\/g, '/');
        // Parse name from folder structure (e.g. registry.ollama.ai/library/llama3/latest -> llama3:latest)
        let name = rel.replace(/^registry\.ollama\.ai\//, '').replace(/^library\//, '');
        const lastSlash = name.lastIndexOf('/');
        if (lastSlash !== -1) {
          name = name.substring(0, lastSlash) + ':' + name.substring(lastSlash + 1);
        }
        models.push({
          name,
          size: stat.size,
          status: 'not-running'
        });
      }
    }
  }
  
  try {
    await walk(manifestsDir);
  } catch (e) {
    console.error('Error walking manifests directory:', e);
  }
  return models;
}

// GET /api/ollama/models
router.get('/models', async (req, res) => {
  try {
    const settings = await getSettings();
    let ollamaPath = settings.ollamaPath;
    if (!ollamaPath) {
      ollamaPath = path.join(os.homedir(), '.ollama', 'models');
    }

    // 1. Scan filesystem
    let fsModels = [];
    try {
      fsModels = await scanLocalModels(ollamaPath);
    } catch (err) {
      console.warn('Failed to scan local Ollama directory:', err.message);
    }

    // 2. Call local Ollama REST API
    let apiModels = [];
    let isRunning = false;
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      if (response.ok) {
        const data = await response.json();
        isRunning = true;
        apiModels = (data.models || []).map(m => ({
          name: m.name,
          size: m.size,
          status: 'ready'
        }));
      }
    } catch (err) {
      console.warn('Ollama API is not running at localhost:11434');
    }

    // 3. Merge & Deduplicate
    const merged = new Map();
    // Start with local filesystem models
    fsModels.forEach(m => {
      merged.set(m.name, { ...m, status: isRunning ? 'not-running' : 'not-running' });
    });
    // Add or override with active running models
    apiModels.forEach(m => {
      merged.set(m.name, m);
    });

    res.json(Array.from(merged.values()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ollama/status
router.get('/status', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/version');
    if (response.ok) {
      const data = await response.json();
      return res.json({ online: true, version: data.version });
    }
  } catch (err) {
    // Ignore
  }
  res.json({ online: false });
});

export default router;
