import express from 'express';
import simpleGit from 'simple-git';
import { getWorkspaceRoot } from './files.js';

const router = express.Router();

router.get('/status', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const git = simpleGit(root);
    const isRepo = await git.checkIsRepo();
    if (!isRepo) {
      return res.json({ isRepo: false, branch: '', files: [] });
    }
    const status = await git.status();
    res.json({
      isRepo: true,
      branch: status.current,
      files: status.files.map(f => ({
        path: f.path,
        working_dir: f.working_dir, // M, A, D, ?, etc.
        index: f.index // M, A, D, etc. (staged)
      }))
    });
  } catch (error) {
    res.json({ isRepo: false, branch: '', files: [], error: error.message });
  }
});

router.post('/stage', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const git = simpleGit(root);
    const { file } = req.body;
    await git.add(file);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/unstage', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const git = simpleGit(root);
    const { file } = req.body;
    await git.reset(['--', file]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/commit', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const git = simpleGit(root);
    const { message } = req.body;
    const summary = await git.commit(message);
    res.json({ success: true, summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/push', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const git = simpleGit(root);
    await git.push();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pull', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const git = simpleGit(root);
    const result = await git.pull();
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/diff', async (req, res) => {
  try {
    const root = getWorkspaceRoot(req);
    const git = simpleGit(root);
    const filePath = req.query.path;
    // Get diff of file (staged or unstaged)
    let diff = '';
    if (filePath) {
      diff = await git.diff([filePath]);
      if (!diff) {
        // If not tracked or new, try diffing against empty tree
        diff = await git.diff(['--no-index', '/dev/null', filePath]).catch(() => '');
      }
    } else {
      diff = await git.diff();
    }
    res.json({ diff });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
