import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Settings State
  settings: {},
  fetchSettings: async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      set({ settings: data });
    } catch (e) {
      console.error('Failed to fetch settings:', e);
    }
  },
  updateSettings: async (newSettings) => {
    try {
      set((state) => ({ settings: { ...state.settings, ...newSettings } }));
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(get().settings)
      });
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  },

  // Workspace & File Tree State
  workspaceRoot: '.',
  fileTree: null,
  fetchFileTree: async () => {
    try {
      const res = await fetch(`/api/files?workspace=${encodeURIComponent(get().workspaceRoot)}`);
      const data = await res.json();
      set({ fileTree: data });
    } catch (e) {
      console.error('Failed to fetch file tree:', e);
    }
  },

  // Tabs / Editor Files State
  openFiles: [], // Array of { path, name, content, originalContent, isDirty }
  activeFile: null, // Path string
  openFile: async (filePath) => {
    const openFiles = get().openFiles;
    const existing = openFiles.find((f) => f.path === filePath);
    
    if (existing) {
      set({ activeFile: filePath });
      return;
    }

    try {
      const res = await fetch(`/api/files/content?path=${encodeURIComponent(filePath)}&workspace=${encodeURIComponent(get().workspaceRoot)}`);
      const data = await res.json();
      
      const newFile = {
        path: filePath,
        name: filePath.split('/').pop(),
        content: data.content,
        originalContent: data.content,
        isDirty: false
      };

      set({
        openFiles: [...openFiles, newFile],
        activeFile: filePath
      });
    } catch (e) {
      console.error(`Failed to load file ${filePath}:`, e);
    }
  },
  closeFile: (filePath) => {
    const openFiles = get().openFiles;
    const activeFile = get().activeFile;
    const remaining = openFiles.filter((f) => f.path !== filePath);
    
    let nextActive = activeFile;
    if (activeFile === filePath) {
      nextActive = remaining.length > 0 ? remaining[remaining.length - 1].path : null;
    }

    set({ openFiles: remaining, activeFile: nextActive });
  },
  updateFileContent: (filePath, newContent) => {
    const openFiles = get().openFiles.map((f) => {
      if (f.path === filePath) {
        return {
          ...f,
          content: newContent,
          isDirty: newContent !== f.originalContent
        };
      }
      return f;
    });
    set({ openFiles });
  },
  saveFile: async (filePath) => {
    const file = get().openFiles.find((f) => f.path === filePath);
    if (!file) return;

    try {
      const res = await fetch('/api/files/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          content: file.content,
          workspace: get().workspaceRoot
        })
      });
      if (res.ok) {
        set((state) => ({
          openFiles: state.openFiles.map((f) =>
            f.path === filePath ? { ...f, originalContent: f.content, isDirty: false } : f
          )
        }));
      }
    } catch (e) {
      console.error('Failed to save file:', e);
    }
  },
  createFile: async (filePath, isDirectory) => {
    try {
      const res = await fetch('/api/files/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          isDirectory,
          workspace: get().workspaceRoot
        })
      });
      if (res.ok) {
        await get().fetchFileTree();
      }
    } catch (e) {
      console.error('Failed to create file:', e);
    }
  },
  renameFile: async (oldPath, newPath) => {
    try {
      const res = await fetch('/api/files/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPath,
          newPath,
          workspace: get().workspaceRoot
        })
      });
      if (res.ok) {
        // Update tabs paths
        set((state) => ({
          openFiles: state.openFiles.map((f) => {
            if (f.path === oldPath) {
              return { ...f, path: newPath, name: newPath.split('/').pop() };
            }
            return f;
          }),
          activeFile: state.activeFile === oldPath ? newPath : state.activeFile
        }));
        await get().fetchFileTree();
      }
    } catch (e) {
      console.error('Failed to rename file:', e);
    }
  },
  deleteFile: async (filePath) => {
    try {
      const res = await fetch(`/api/files/delete?path=${encodeURIComponent(filePath)}&workspace=${encodeURIComponent(get().workspaceRoot)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        get().closeFile(filePath);
        await get().fetchFileTree();
      }
    } catch (e) {
      console.error('Failed to delete file:', e);
    }
  },

  // AI Chat & Cost State
  chatHistory: {}, // filePath -> messages[]
  costThisSession: 0.0,
  sessionTokens: 0,
  activeModel: 'gemini-2.5-flash',
  availableModels: [],
  suggestedModels: [],   // Suggested based on system hardware
  systemInfo: null,      // { ramGB, freeRamGB, cpuName, gpu })
  addChatMessage: (filePath, message) => {
    set((state) => {
      const history = state.chatHistory[filePath] || [];
      const updated = [...history, message];
      return {
        chatHistory: {
          ...state.chatHistory,
          [filePath]: updated
        }
      };
    });
  },
  clearChatHistory: (filePath) => {
    set((state) => ({
      chatHistory: {
        ...state.chatHistory,
        [filePath]: []
      }
    }));
  },
  addSessionCost: (cost) => set((state) => ({ costThisSession: state.costThisSession + cost })),
  addSessionTokens: (tokens) => set((state) => ({ sessionTokens: state.sessionTokens + tokens })),
  setActiveModel: (model) => set({ activeModel: model }),
  fetchModels: async () => {
    try {
      const res = await fetch('/api/ollama/models');
      const localModels = await res.json();

      const cloudModels = [
        { name: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', status: 'ready', type: 'cloud', badges: ['fast', 'code', 'latest'] },
        { name: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', status: 'ready', type: 'cloud', badges: ['fast', 'code', 'large-ctx'] },
        { name: 'claude-3-opus-20240229', label: 'Claude 3 Opus', status: 'ready', type: 'cloud', badges: ['reasoning', 'large-ctx'] },
        { name: 'gpt-4o', label: 'GPT-4o', status: 'ready', type: 'cloud', badges: ['fast', 'code', 'vision'] },
        { name: 'gpt-4-turbo', label: 'GPT-4 Turbo', status: 'ready', type: 'cloud', badges: ['reasoning', 'large-ctx'] },
        { name: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', status: 'ready', type: 'cloud', badges: ['fast', 'code', 'large-ctx'] },
        { name: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', status: 'ready', type: 'cloud', badges: ['reasoning', 'large-ctx'] }
      ];

      const merged = [
        ...localModels.map(m => ({ ...m, type: 'local', badges: ['local'] })),
        ...cloudModels
      ];
      set({ availableModels: merged });
    } catch (e) {
      console.error('Failed to fetch Ollama models:', e);
    }
  },
  fetchSystemInfo: async () => {
    try {
      const [infoRes, suggestRes] = await Promise.all([
        fetch('/api/system/info'),
        fetch('/api/system/suggest')
      ]);
      const info = await infoRes.json();
      const suggest = await suggestRes.json();
      set({
        systemInfo: info,
        suggestedModels: suggest.suggestions || []
      });
    } catch (e) {
      console.error('Failed to fetch system info:', e);
    }
  },

  // Terminal State
  terminalSessions: [], // Array of { id, name }
  activeTerminalId: null,
  createTerminal: async () => {
    const id = Math.random().toString(36).substring(7);
    try {
      const res = await fetch('/api/terminal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, workspaceDir: get().workspaceRoot })
      });
      if (res.ok) {
        set((state) => ({
          terminalSessions: [...state.terminalSessions, { id, name: `Terminal ${state.terminalSessions.length + 1}` }],
          activeTerminalId: id
        }));
      }
    } catch (e) {
      console.error('Failed to create terminal:', e);
    }
  },
  killTerminal: async (id) => {
    try {
      await fetch('/api/terminal/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      set((state) => {
        const remaining = state.terminalSessions.filter(t => t.id !== id);
        let nextActive = state.activeTerminalId;
        if (state.activeTerminalId === id) {
          nextActive = remaining.length > 0 ? remaining[remaining.length - 1].id : null;
        }
        return {
          terminalSessions: remaining,
          activeTerminalId: nextActive
        };
      });
    } catch (e) {
      console.error('Failed to kill terminal:', e);
    }
  },
  setActiveTerminalId: (id) => set({ activeTerminalId: id }),

  // Live Preview State
  previewRunning: false,
  previewPort: 3131,
  startPreview: async () => {
    try {
      const res = await fetch('/api/preview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace: get().workspaceRoot })
      });
      const data = await res.json();
      if (data.success) {
        set({ previewRunning: true, previewPort: data.port });
      }
    } catch (e) {
      console.error('Failed to start preview server:', e);
    }
  },
  stopPreview: async () => {
    try {
      const res = await fetch('/api/preview/stop', { method: 'POST' });
      if (res.ok) {
        set({ previewRunning: false });
      }
    } catch (e) {
      console.error('Failed to stop preview server:', e);
    }
  },

  // Git State
  gitStatus: [],
  gitBranch: '',
  gitIsRepo: false,
  fetchGitStatus: async () => {
    try {
      const res = await fetch(`/api/git/status?workspace=${encodeURIComponent(get().workspaceRoot)}`);
      const data = await res.json();
      set({
        gitIsRepo: data.isRepo,
        gitBranch: data.branch,
        gitStatus: data.files || []
      });
    } catch (e) {
      console.error('Failed to fetch Git status:', e);
    }
  },

  // UI Panels State
  activeSidebar: 'explorer', // explorer | search | git | plugins | mcp
  isSettingsOpen: false,
  isCommandPaletteOpen: false,
  isQuickOpenOpen: false,
  isDiffOpen: false,
  
  setActiveSidebar: (panel) => set({ activeSidebar: panel }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  setQuickOpenOpen: (open) => set({ isQuickOpenOpen: open }),
  
  // Diff Viewer State
  diffEdits: [], // Array of { file, newContent }
  openDiffViewer: (edits) => set({ diffEdits: edits, isDiffOpen: true }),
  closeDiffViewer: () => set({ diffEdits: [], isDiffOpen: false }),

  // Plugins State
  plugins: [],
  fetchPlugins: async () => {
    try {
      const res = await fetch('/api/plugins');
      const data = await res.json();
      set({ plugins: data });
    } catch (e) {
      console.error('Failed to fetch plugins:', e);
    }
  },
  togglePlugin: async (id, enabled) => {
    try {
      const res = await fetch('/api/plugins/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled })
      });
      if (res.ok) {
        await get().fetchPlugins();
      }
    } catch (e) {
      console.error('Failed to toggle plugin:', e);
    }
  },

  // MCP Servers State
  mcpServers: [],
  fetchMcpServers: async () => {
    try {
      const res = await fetch('/api/mcp/servers');
      const data = await res.json();
      set({ mcpServers: data });
    } catch (e) {
      console.error('Failed to fetch MCP servers:', e);
    }
  }
}));
