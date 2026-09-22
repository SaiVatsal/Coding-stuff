import express from 'express';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { getSettings } from './settings.js';

const router = express.Router();

const MAX_SCAN_DEPTH = 6;

// Helper to scan manifest directories recursively with depth limit
async function scanLocalModels(ollamaPath, depth = 0) {
  if (depth > MAX_SCAN_DEPTH) return [];
  const manifestsDir = path.join(ollamaPath, 'manifests');
  if (!await fs.pathExists(manifestsDir)) {
    return [];
  }

  const models = [];

  async function walk(dir, currentDepth) {
    if (currentDepth > MAX_SCAN_DEPTH) return;
    let files;
    try {
      files = await fs.readdir(dir);
    } catch (e) {
      return;
    }
    for (const file of files) {
      const full = path.join(dir, file);
      let stat;
      try {
        stat = await fs.stat(full);
      } catch (e) {
        continue;
      }
      if (stat.isDirectory()) {
        await walk(full, currentDepth + 1);
      } else {
        const rel = path.relative(manifestsDir, full).replace(/\\/g, '/');
        // Parse name from folder structure (e.g. registry.ollama.ai/library/llama3/latest -> llama3:latest)
        let name = rel.replace(/^registry\.ollama\.ai\//, '').replace(/^library\//, '');
        const lastSlash = name.lastIndexOf('/');
        if (lastSlash !== -1) {
          name = name.substring(0, lastSlash) + ':' + name.substring(lastSlash + 1);
        }
        models.push({ name, size: 0, status: 'not-running' });
      }
    }
  }

  try {
    await walk(manifestsDir, 0);
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

    // 1. Try Ollama REST API first (most accurate — includes real model size)
    let apiModels = [];
    let isRunning = false;
    try {
      const response = await fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        const data = await response.json();
        isRunning = true;
        apiModels = (data.models || []).map(m => ({
          name: m.name,
          size: m.size || 0,           // Real model size in bytes from Ollama API
          sizeGB: m.size ? +(m.size / 1e9).toFixed(1) : null,
          modified: m.modified_at,
          status: 'ready'
        }));
      }
    } catch (err) {
      console.warn('Ollama API is not running at localhost:11434');
    }

    // 2. Fall back to filesystem scan if Ollama is offline
    let fsModels = [];
    if (!isRunning) {
      try {
        fsModels = await scanLocalModels(ollamaPath);
      } catch (err) {
        console.warn('Failed to scan local Ollama directory:', err.message);
      }
    }

    // 3. Merge & deduplicate — API models take priority
    const merged = new Map();
    fsModels.forEach(m => merged.set(m.name, m));
    apiModels.forEach(m => merged.set(m.name, m));

    res.json(Array.from(merged.values()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ollama/status
router.get('/status', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/version', { signal: AbortSignal.timeout(2000) });
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
