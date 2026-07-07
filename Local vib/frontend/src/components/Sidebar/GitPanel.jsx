import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore.js';
import { GitBranch, Plus, Minus, ArrowUp, ArrowDown, RefreshCw, Send, Sparkles } from 'lucide-react';
import { sendChatMessageStream } from '../../utils/ai.js';

export default function GitPanel() {
  const store = useStore();
  const [commitMsg, setCommitMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    store.fetchGitStatus();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await store.fetchGitStatus();
    setLoading(false);
  };

  const handleStage = async (file, staged) => {
    const route = staged ? '/api/git/stage' : '/api/git/unstage';
    try {
      const res = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file, workspace: store.workspaceRoot })
      });
      if (res.ok) {
        store.fetchGitStatus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStageAll = async () => {
    try {
      const res = await fetch('/api/git/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: '.', workspace: store.workspaceRoot })
      });
      if (res.ok) {
        store.fetchGitStatus();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCommit = async (e) => {
    if (e) e.preventDefault();
    if (!commitMsg.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: commitMsg, workspace: store.workspaceRoot })
      });
      if (res.ok) {
        setCommitMsg('');
        store.fetchGitStatus();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/git/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: store.workspaceRoot })
      });
      if (res.ok) {
        alert('Push succeeded');
        store.fetchGitStatus();
      }
    } catch (e) {
      alert(`Push failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/git/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: store.workspaceRoot })
      });
      if (res.ok) {
        alert('Pull succeeded');
        store.fetchGitStatus();
      }
    } catch (e) {
      alert(`Pull failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAICommit = async () => {
    setAiGenerating(true);
    try {
      // 1. Get complete workspace git diff
      const resDiff = await fetch(`/api/git/diff?workspace=${encodeURIComponent(store.workspaceRoot)}`);
      const dataDiff = await resDiff.json();
      if (!dataDiff.diff) {
        setCommitMsg('No staged modifications to commit.');
        return;
      }

      // 2. Query AI model for a commit message
      const prompt = `Create a short, descriptive git commit message based on the following code diff. 
Use conventional commit style (e.g. feat: add terminal support, fix: resolve file loading error). 
Return ONLY the commit message itself. Do NOT output any explanation or markdown formatting.

${dataDiff.diff}`;

      const model = store.activeModel;
      let text = '';
      await sendChatMessageStream(model, [{ role: 'user', content: prompt }], (chunk) => {
        text += chunk;
        setCommitMsg(text.trim());
      });
    } catch (e) {
      console.error(e);
      setCommitMsg('Failed to generate commit message.');
    } finally {
      setAiGenerating(false);
    }
  };

  if (!store.gitIsRepo) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 bg-bg-secondary text-center text-xs text-text-secondary gap-3">
        <GitBranch size={32} className="text-text-secondary opacity-40 animate-pulse" />
        <p>Not a git repository (or git is not installed).</p>
        <button 
          onClick={handleRefresh}
          className="px-3 py-1.5 bg-bg-tertiary border border-border-custom hover:bg-border-custom text-text-primary rounded"
        >
          Scan Again
        </button>
      </div>
    );
  }

  const stagedFiles = store.gitStatus.filter(f => f.index && f.index !== ' ');
  const unstagedFiles = store.gitStatus.filter(f => f.working_dir && f.working_dir !== ' ' && f.working_dir !== '?');
  const untrackedFiles = store.gitStatus.filter(f => f.working_dir === '?');

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-r border-border-custom w-60 overflow-hidden text-xs">
      <div className="flex items-center justify-between p-3 border-b border-border-custom bg-bg-secondary">
        <div className="flex items-center gap-1.5 font-semibold text-text-primary">
          <GitBranch size={14} className="text-accent-custom" />
          <span className="truncate">{store.gitBranch}</span>
        </div>
        <div className="flex gap-1">
          <button 
            title="Refresh Status"
            disabled={loading}
            onClick={handleRefresh}
            className={`p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={14} />
          </button>
          <button 
            title="Pull"
            disabled={loading}
            onClick={handlePull}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          >
            <ArrowDown size={14} />
          </button>
          <button 
            title="Push"
            disabled={loading}
            onClick={handlePush}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          >
            <ArrowUp size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Actions bar */}
        {store.gitStatus.length > 0 && (
          <button 
            onClick={handleStageAll}
            className="w-full text-center py-1.5 bg-bg-tertiary border border-border-custom rounded text-text-primary hover:bg-border-custom"
          >
            Stage All Changes
          </button>
        )}

        {/* Staged files */}
        {stagedFiles.length > 0 && (
          <div>
            <h3 className="font-semibold text-text-secondary uppercase tracking-wider text-[10px] mb-1.5">Staged Changes</h3>
            <div className="space-y-1">
              {stagedFiles.map(f => (
                <div key={f.path} className="flex items-center justify-between p-1 bg-bg-tertiary/40 rounded border border-border-custom hover:bg-bg-tertiary">
                  <span className="truncate flex-1 pr-1 font-mono text-[11px]">{f.path.split('/').pop()}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1 bg-success-custom/20 text-success-custom rounded">Staged</span>
                    <button 
                      title="Unstage"
                      onClick={() => handleStage(f.path, false)}
                      className="p-0.5 text-text-secondary hover:text-error-custom"
                    >
                      <Minus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unstaged files */}
        {(unstagedFiles.length > 0 || untrackedFiles.length > 0) && (
          <div>
            <h3 className="font-semibold text-text-secondary uppercase tracking-wider text-[10px] mb-1.5">Changes</h3>
            <div className="space-y-1">
              {[...unstagedFiles, ...untrackedFiles].map(f => (
                <div key={f.path} className="flex items-center justify-between p-1 bg-bg-tertiary/40 rounded border border-border-custom hover:bg-bg-tertiary">
                  <span className="truncate flex-1 pr-1 font-mono text-[11px]">{f.path.split('/').pop()}</span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1 rounded ${
                      f.working_dir === '?' ? 'bg-text-secondary/20 text-text-secondary' : 'bg-warning-custom/20 text-warning-custom'
                    }`}>
                      {f.working_dir === '?' ? 'Untracked' : 'Modified'}
                    </span>
                    <button 
                      title="Stage"
                      onClick={() => handleStage(f.path, true)}
                      className="p-0.5 text-text-secondary hover:text-success-custom"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {store.gitStatus.length === 0 && (
          <div className="text-center text-text-secondary py-8">No unstaged or staged changes.</div>
        )}
      </div>

      {/* Commit message footer */}
      <div className="p-3 border-t border-border-custom bg-bg-secondary">
        <form onSubmit={handleCommit} className="space-y-2">
          <div className="relative">
            <textarea 
              value={commitMsg}
              onChange={(e) => setCommitMsg(e.target.value)}
              placeholder="Commit message..."
              className="w-full h-16 bg-bg-tertiary border border-border-custom rounded p-2 text-xs text-text-primary placeholder:text-text-secondary/50 outline-none resize-none focus:border-accent-custom"
            />
            <button 
              type="button"
              title="Generate commit message using AI"
              disabled={aiGenerating}
              onClick={handleGenerateAICommit}
              className={`absolute bottom-2 right-2 p-1.5 bg-accent-custom hover:bg-accent-hover text-white rounded transition ${
                aiGenerating ? 'animate-pulse' : ''
              }`}
            >
              <Sparkles size={12} />
            </button>
          </div>
          
          <button 
            type="submit"
            disabled={loading || !commitMsg.trim()}
            className="w-full py-1.5 bg-accent-custom hover:bg-accent-hover text-white font-medium rounded flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={12} /> Commit Changes
          </button>
        </form>
      </div>
    </div>
  );
}
