import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Route Handlers
import settingsRouter from './routes/settings.js';
import filesRouter from './routes/files.js';
import terminalRouter, { terminalSessions } from './routes/terminal.js';
import gitRouter from './routes/git.js';
import previewRouter from './routes/preview.js';
import ollamaRouter from './routes/ollama.js';
import mcpRouter from './routes/mcp.js';
import pluginsRouter, { ensureBuiltinPlugins } from './plugins/loader.js';
import aiRouter from './routes/ai.js';
import systemRouter from './routes/system.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Configure CORS and JSON limits (10mb is sufficient; 50mb was excessive)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Register routes
app.use('/api/settings', settingsRouter);
app.use('/api/files', filesRouter);
app.use('/api/terminal', terminalRouter);
app.use('/api/git', gitRouter);
app.use('/api/preview', previewRouter);
app.use('/api/ollama', ollamaRouter);
app.use('/api/mcp', mcpRouter);
app.use('/api/plugins', pluginsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/system', systemRouter);

// Global WebSocket Broadcast Helper
const clients = new Set();
global.broadcastWS = (messageObj) => {
  const payload = JSON.stringify(messageObj);
  clients.forEach((ws) => {
    if (ws.readyState === 1) { // OPEN
      ws.send(payload);
    }
  });
};

// WebSocket Event Routing
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`WebSocket client connected (Active: ${clients.size})`);

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'terminal-input') {
        const { id, data } = parsed;
        const session = terminalSessions.get(id);
        if (session) {
          session.proc.stdin.write(data);
        }
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err.message);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`WebSocket client disconnected (Active: ${clients.size})`);
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
  });
});

// Port configuration
const PORT = process.env.PORT || 3232;

async function startServer() {
  await ensureBuiltinPlugins();
  server.listen(PORT, () => {
    console.log(`NitroCode Backend Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting NitroCode backend:', err);
});
