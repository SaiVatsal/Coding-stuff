import express from 'express';
import { spawn } from 'child_process';
import os from 'os';

const router = express.Router();
export const terminalSessions = new Map();

const ERROR_PATTERNS = [
  /Error:/i,
  /TypeError:/i,
  /SyntaxError:/i,
  /ReferenceError:/i,
  /RangeError:/i,
  /RuntimeError:/i,
  /Failed to compile/i
];

// POST /api/terminal/create - Starts a new terminal session
router.post('/create', (req, res) => {
  try {
    const id = req.body.id || Math.random().toString(36).substring(7);
    const workspaceDir = req.body.workspaceDir || process.cwd();

    const shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
    const shellArgs = os.platform() === 'win32' ? ['-NoLogo'] : [];

    const proc = spawn(shell, shellArgs, {
      cwd: workspaceDir,
      env: { ...process.env, COLUMNS: '80', LINES: '24', TERM: 'xterm-256color' }
    });

    const session = {
      id,
      proc,
      outputHistory: []
    };

    terminalSessions.set(id, session);

    // Pipe outputs to WS if connection is available
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      session.outputHistory.push(text);
      if (session.outputHistory.length > 200) {
        session.outputHistory.shift();
      }

      // Broadcast terminal data
      if (global.broadcastWS) {
        global.broadcastWS({ type: 'terminal-data', id, data: text });
      }

      // Scan for error patterns
      for (const pattern of ERROR_PATTERNS) {
        if (pattern.test(text)) {
          if (global.broadcastWS) {
            global.broadcastWS({ type: 'terminal-error', id, text });
          }
          break;
        }
      }
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      session.outputHistory.push(text);
      if (global.broadcastWS) {
        global.broadcastWS({ type: 'terminal-data', id, data: text });
      }

      for (const pattern of ERROR_PATTERNS) {
        if (pattern.test(text)) {
          if (global.broadcastWS) {
            global.broadcastWS({ type: 'terminal-error', id, text });
          }
          break;
        }
      }
    });

    proc.on('close', (code) => {
      if (global.broadcastWS) {
        global.broadcastWS({ type: 'terminal-exit', id, code });
      }
      terminalSessions.delete(id);
    });

    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/terminal/write - Write command data to session
router.post('/write', (req, res) => {
  const { id, data } = req.body;
  const session = terminalSessions.get(id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.proc.stdin.write(data);
  res.json({ success: true });
});

// POST /api/terminal/resize - Handles window resizing (no-op in process but placeholder)
router.post('/resize', (req, res) => {
  res.json({ success: true });
});

// POST /api/terminal/kill - Kill a session
router.post('/kill', (req, res) => {
  const { id } = req.body;
  const session = terminalSessions.get(id);
  if (session) {
    session.proc.kill();
    terminalSessions.delete(id);
  }
  res.json({ success: true });
});

export default router;
