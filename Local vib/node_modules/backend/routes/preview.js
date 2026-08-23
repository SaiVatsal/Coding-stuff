import express from 'express';
import net from 'net';
import chokidar from 'chokidar';
import { getWorkspaceRoot } from './files.js';
import { getSettings } from './settings.js';

const router = express.Router();

let previewServer = null;
let activePort = null;
let watcher = null;
function findFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      server.once('close', () => resolve(startPort));
      server.close();
    });
    server.on('error', () => {
      resolve(findFreePort(startPort + 1));
    });
  });
}

router.post('/start', async (req, res) => {
  try {
    if (previewServer) {
      return res.json({ success: true, port: activePort, message: 'Server already running' });
    }

    const settings = await getSettings();
    const basePort = parseInt(settings.previewPort || 3131, 10);
    const workspaceRoot = getWorkspaceRoot(req);
    activePort = await findFreePort(basePort);
    const portChanged = activePort !== basePort;

    const previewApp = express();
    previewApp.use(express.static(workspaceRoot));

    previewServer = previewApp.listen(activePort, () => {
      console.log(`Live preview server running on port ${activePort}`);

      // Start chokidar watche r
      if (watcher) watcher.close();
      watcher = chokidar.watch(workspaceRoot, {
        ignored: ['**/node_modules/**', '**/.git/**', '**/.nitrocode/**'],
        ignoreInitial: true
      });

      watcher.on('all', (event, path) => {
        if (global.broadcastWS) {
          global.broadcastWS({ type: 'file-changed', path });
        }
      });
    });

    res.json({
      success: true,
      port: activePort,
      portChanged,
      originalPort: basePort
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/stop', (req, res) => {
  try {
    if (previewServer) {
      previewServer.close(() => {
        previewServer = null;
        activePort = null;
        console.log('Live preview server stopped');
      });
      if (watcher) {
        watcher.close();
        watcher = null;
      }
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', (req, res) => {
  res.json({
    running: !!previewServer,
    port: activePort
  });
});

export default router;
