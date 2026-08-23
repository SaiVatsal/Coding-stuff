import express from 'express';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';

const router = express.Router();
const execFileAsync = promisify(execFile);

// Detect GPU info (Windows — uses wmic)
async function getGpuInfo() {
  try {
    const { stdout } = await execFileAsync('wmic', [
      'path', 'win32_VideoController',
      'get', 'Name,AdapterRAM',
      '/format:csv'
    ], { timeout: 4000 });

    const lines = stdout.trim().split('\n').filter(l => l.trim() && !l.startsWith('Node'));
    const gpus = [];

    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 3) {
        const vramBytes = parseInt(parts[1], 10);
        const name = parts[2]?.trim() || 'Unknown GPU';
        if (name && name !== 'Unknown GPU') {
          gpus.push({
            name,
            vramGB: isNaN(vramBytes) ? null : +(vramBytes / 1e9).toFixed(1)
          });
        }
      }
    }

    return gpus[0] || null;
  } catch (e) {
    return null;
  }
}

// Model suggestion logic based on RAM & GPU VRAM
function suggestModels(ramGB, gpuVramGB) {
  const suggestions = [];

  // Always add tiny models for any machine
  suggestions.push({
    name: 'qwen2.5-coder:1.5b',
    label: 'Qwen2.5-Coder 1.5B',
    reason: 'Ultra-fast code completion, runs on any machine',
    minRamGB: 2,
    sizeGB: 1,
    badges: ['code', 'fast', '1.5B'],
    pullCmd: 'ollama pull qwen2.5-coder:1.5b',
    recommended: ramGB < 8
  });

  if (ramGB >= 4) {
    suggestions.push({
      name: 'phi3:mini',
      label: 'Phi-3 Mini',
      reason: 'Microsoft\'s tiny but smart model, great for low RAM',
      minRamGB: 4,
      sizeGB: 2.3,
      badges: ['smart', 'fast', '3.8B'],
      pullCmd: 'ollama pull phi3:mini',
      recommended: ramGB >= 4 && ramGB < 8
    });
  }

  if (ramGB >= 8) {
    suggestions.push({
      name: 'qwen2.5-coder:7b',
      label: 'Qwen2.5-Coder 7B',
      reason: 'Best code model at 7B — excellent for 8GB+ RAM',
      minRamGB: 8,
      sizeGB: 4.7,
      badges: ['code', 'best-7B'],
      pullCmd: 'ollama pull qwen2.5-coder:7b',
      recommended: ramGB >= 8 && ramGB < 16
    });

    suggestions.push({
      name: 'llama3.2:3b',
      label: 'Llama 3.2 3B',
      reason: 'Meta\'s fast general-purpose model, 8GB RAM friendly',
      minRamGB: 8,
      sizeGB: 2,
      badges: ['general', 'fast', '3B'],
      pullCmd: 'ollama pull llama3.2:3b',
      recommended: false
    });
  }

  if (ramGB >= 16) {
    suggestions.push({
      name: 'deepseek-coder-v2:16b',
      label: 'DeepSeek Coder V2 16B',
      reason: 'Exceptional code quality, needs 16GB RAM',
      minRamGB: 16,
      sizeGB: 9,
      badges: ['code', 'smart', '16B'],
      pullCmd: 'ollama pull deepseek-coder-v2:16b',
      recommended: ramGB >= 16 && ramGB < 32
    });

    suggestions.push({
      name: 'llama3.1:8b',
      label: 'Llama 3.1 8B',
      reason: 'Well-rounded general & coding model',
      minRamGB: 16,
      sizeGB: 4.7,
      badges: ['general', 'code', '8B'],
      pullCmd: 'ollama pull llama3.1:8b',
      recommended: false
    });
  }

  if (ramGB >= 32) {
    suggestions.push({
      name: 'qwen2.5-coder:32b',
      label: 'Qwen2.5-Coder 32B',
      reason: 'Near-GPT-4 code quality, needs 32GB RAM',
      minRamGB: 32,
      sizeGB: 19,
      badges: ['code', 'flagship', '32B'],
      pullCmd: 'ollama pull qwen2.5-coder:32b',
      recommended: ramGB >= 32
    });

    suggestions.push({
      name: 'llama3.3:70b',
      label: 'Llama 3.3 70B',
      reason: 'Flagship open-source model, needs 32GB+ RAM',
      minRamGB: 32,
      sizeGB: 43,
      badges: ['flagship', 'smart', '70B'],
      pullCmd: 'ollama pull llama3.3:70b',
      recommended: false
    });
  }

  // GPU VRAM bonus suggestions
  if (gpuVramGB && gpuVramGB >= 8) {
    // Check if we haven't already added this
    if (!suggestions.find(s => s.name === 'llama3.1:8b')) {
      suggestions.push({
        name: 'llama3.1:8b',
        label: 'Llama 3.1 8B (GPU)',
        reason: `Your GPU has ${gpuVramGB}GB VRAM — can run 8B GPU-accelerated`,
        minRamGB: 8,
        sizeGB: 4.7,
        badges: ['GPU', 'fast', '8B'],
        pullCmd: 'ollama pull llama3.1:8b',
        recommended: true
      });
    }
  }

  // Sort: recommended first, then by minRamGB
  return suggestions
    .filter(s => s.minRamGB <= ramGB)
    .sort((a, b) => (b.recommended ? 1 : 0) - (a.recommended ? 1 : 0));
}

// GET /api/system/info
router.get('/info', async (req, res) => {
  try {
    const totalRamBytes = os.totalmem();
    const freeRamBytes = os.freemem();
    const ramGB = +(totalRamBytes / 1e9).toFixed(1);
    const freeRamGB = +(freeRamBytes / 1e9).toFixed(1);
    const platform = os.platform();
    const arch = os.arch();
    const cpus = os.cpus();
    const cpuName = cpus[0]?.model || 'Unknown CPU';
    const cpuCount = cpus.length;

    const gpu = await getGpuInfo();

    res.json({
      ramGB,
      freeRamGB,
      platform,
      arch,
      cpuName,
      cpuCount,
      gpu: gpu ? { name: gpu.name, vramGB: gpu.vramGB } : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/system/suggest
router.get('/suggest', async (req, res) => {
  try {
    const ramGB = +(os.totalmem() / 1e9);
    const gpu = await getGpuInfo();
    const gpuVramGB = gpu?.vramGB || null;

    const suggestions = suggestModels(ramGB, gpuVramGB);

    res.json({
      ramGB: +ramGB.toFixed(1),
      gpuName: gpu?.name || null,
      gpuVramGB,
      suggestions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
