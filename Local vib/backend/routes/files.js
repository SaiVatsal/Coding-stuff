import express from 'express';
import fs from 'fs-extra';
import path from 'path';

const router = express.Router();

// Helper to normalize path for cross-platform safe comparison (handles Windows case-insensitivity)
function normalizePath(p) {
  return path.resolve(p).toLowerCase().replace(/\\/g, '/');
}

// Safe path check — prevents path traversal attacks
function isSafeSubPath(root, target) {
  const normalRoot = normalizePath(root) + '/';
  const normalTarget = normalizePath(target);
  return normalTarget.startsWith(normalRoot) || normalTarget === normalizePath(root);
}

// Helper to get workspace root. Defaults to process.cwd() (which is nitrocode folder)
export function getWorkspaceRoot(req) {
  if (req.query.workspace) {
    return path.resolve(req.query.workspace);
  }
  return path.resolve(process.env.WORKSPACE_ROOT || '../../');
}

// Recursively build file tree
async function buildFileTree(dirPath, rootPath) {
  const name = path.basename(dirPath);
  const relativePath = path.relative(rootPath, dirPath).replace(/\\/g, '/');

  const stats = await fs.stat(dirPath);
  if (!stats.isDirectory()) {
    return {
      name,
      path: relativePath || name,
      isDirectory: false
    };
  }

  const childrenNames = await fs.readdir(dirPath);
  const children = [];

  for (const childName of childrenNames) {
    // Skip heavy/system folders
    if (['node_modules', '.git', 'dist', '.next', 'build', '.nitrocode'].includes(childName)) {
      continue;
    }
    const childPath = path.join(dirPath, childName);
    try {
      const childNode = await buildFileTree(childPath, rootPath);
      children.push(childNode);
    } catch (e) {
      // Ignore broken symlinks or permission errors
    }
  }

  // Sort directories first, then files
  children.sort((a, b) => {
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    return a.name.localeCompare(b.name);
  });

  return {
    name: name || 'root',
    path: relativePath || '.',
    isDirectory: true,
    children
  };
}

// GET /api/files - Get tree
router.get('/', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    await fs.ensureDir(root);
    const tree = await buildFileTree(root, root);
    res.json(tree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files/content - Get file content
router.get('/content', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const filePath = path.join(root, req.query.path || '');

    if (!isSafeSubPath(root, filePath)) {
      return res.status(403).json({ error: 'Access denied: path traversal detected' });
    }

    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/files/save - Save file
router.post('/save', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const filePath = path.join(root, req.body.path || '');

    if (!isSafeSubPath(root, filePath)) {
      return res.status(403).json({ error: 'Access denied: path traversal detected' });
    }

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, req.body.content, 'utf-8');

    if (global.broadcastWS) {
      global.broadcastWS({ type: 'file-changed', path: req.body.path });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/files/create - Create file/folder
router.post('/create', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const targetPath = path.join(root, req.body.path || '');
    const isFolder = req.body.isDirectory;

    if (!isSafeSubPath(root, targetPath)) {
      return res.status(403).json({ error: 'Access denied: path traversal detected' });
    }

    if (isFolder) {
      await fs.ensureDir(targetPath);
    } else {
      await fs.ensureDir(path.dirname(targetPath));
      await fs.writeFile(targetPath, '', 'utf-8');
    }

    if (global.broadcastWS) {
      global.broadcastWS({ type: 'file-changed', path: req.body.path });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/files/delete - Delete file/folder
router.delete('/delete', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const targetPath = path.join(root, req.query.path || '');

    if (!isSafeSubPath(root, targetPath)) {
      return res.status(403).json({ error: 'Access denied: path traversal detected' });
    }

    await fs.remove(targetPath);

    if (global.broadcastWS) {
      global.broadcastWS({ type: 'file-changed', path: req.query.path });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/files/rename - Rename file
router.post('/rename', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const oldPath = path.join(root, req.body.oldPath || '');
    const newPath = path.join(root, req.body.newPath || '');

    if (!isSafeSubPath(root, oldPath) || !isSafeSubPath(root, newPath)) {
      return res.status(403).json({ error: 'Access denied: path traversal detected' });
    }

    await fs.move(oldPath, newPath);

    if (global.broadcastWS) {
      global.broadcastWS({ type: 'file-changed', path: req.body.oldPath });
      global.broadcastWS({ type: 'file-changed', path: req.body.newPath });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/files/search - Grep search (limited to 200 results)
router.get('/search', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json({ results: [] });
  }

  const MAX_RESULTS = 200;

  try {
    const root = getWorkspaceRoot(req);
    const results = [];

    async function searchDir(dir) {
      if (results.length >= MAX_RESULTS) return;
      const files = await fs.readdir(dir);
      for (const file of files) {
        if (results.length >= MAX_RESULTS) break;
        if (['node_modules', '.git', 'dist', '.next', 'build', '.nitrocode'].includes(file)) {
          continue;
        }
        const fullPath = path.join(dir, file);
        const stat = await fs.stat(fullPath);
        if (stat.isDirectory()) {
          await searchDir(fullPath);
        } else {
          const ext = path.extname(file).toLowerCase();
          if (['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.md', '.py', '.go', '.rs', '.txt', '.sh'].includes(ext)) {
            try {
              const content = await fs.readFile(fullPath, 'utf-8');
              const lines = content.split('\n');
              lines.forEach((line, idx) => {
                if (results.length < MAX_RESULTS && line.toLowerCase().includes(query.toLowerCase())) {
                  results.push({
                    file: path.relative(root, fullPath).replace(/\\/g, '/'),
                    line: idx + 1,
                    content: line.trim()
                  });
                }
              });
            } catch (e) {
              // Skip unreadable files
            }
          }
        }
      }
    }

    await searchDir(root);
    res.json({ results, truncated: results.length >= MAX_RESULTS });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
