import React, { useEffect, useState } from 'react';
import { useStore } from './store/useStore.js';
import { useKeyboardShortcuts } from './utils/shortcuts.js';

// Components
import FileExplorer from './components/Sidebar/FileExplorer.jsx';
import SearchPanel from './components/Sidebar/SearchPanel.jsx';
import GitPanel from './components/Sidebar/GitPanel.jsx';
import PluginPanel from './components/Sidebar/PluginPanel.jsx';
import MCPPanel from './components/Sidebar/MCPPanel.jsx';

import EditorPane from './components/Editor/EditorPane.jsx';
import DiffViewer from './components/Editor/DiffViewer.jsx';
import ChatPanel from './components/AI/ChatPanel.jsx';
import TerminalPane from './components/Terminal/TerminalPane.jsx';
import BrowserPreview from './components/Preview/BrowserPreview.jsx';

// Modals
import SettingsModal from './components/Settings/SettingsModal.jsx';
import QuickOpen from './components/Modals/QuickOpen.jsx';
import CommandPalette from './components/Modals/CommandPalette.jsx';

import { 
  Folder, Search, GitBranch, Puzzle, Database, Settings, 
  Sparkles, Monitor, Play, Cpu, ArrowUpCircle 
} from 'lucide-react';

export default function App() {
  const store = useStore();
  const [showPreview, setShowPreview] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [editorLineCol, setEditorLineCol] = useState('1:1');

  // Load shortcuts
  useKeyboardShortcuts();

  // Expose core layout components to plugins namespace
  useEffect(() => {
    window.NitroCodeComponents = {
      GitPanel,
      FileExplorer,
      SearchPanel,
      MCPPanel,
      BrowserPreview
    };
  }, []);

  // Dynamic Plugin Loader
  useEffect(() => {
    const loadPlugins = async () => {
      const enabled = store.plugins.filter(p => p.enabled);
      for (const plugin of enabled) {
        window._nitrocode_panels = window._nitrocode_panels || {};
        if (window._nitrocode_panels[plugin.id]) continue; // Already loaded

        try {
          console.log(`Loading plugin ${plugin.name} from ${plugin.entry}`);
          const module = await import(plugin.entry);
          if (module.default) {
            const p = module.default;
            if (p.panel) {
              window.NitroCodeAPI.registerPanel(plugin.id, p.panel);
            }
            if (p.actions) {
              p.actions.forEach(act => {
                window.NitroCodeAPI.registerAction(plugin.id, act.label, act.handler);
              });
            }
            if (p.onLoad) p.onLoad(window.NitroCodeAPI);
          }
        } catch (e) {
          console.error(`Failed to load plugin ${plugin.name}:`, e.message);
        }
      }
    };

    if (store.plugins.length > 0) {
      loadPlugins();
    }
  }, [store.plugins]);

  // Initialize workspace and connect websockets
  useEffect(() => {
    store.fetchSettings();
    store.fetchFileTree();
    store.fetchPlugins();
    store.fetchSystemInfo(); // Detect RAM/GPU for model suggestions
    store.createTerminal(); // Create initial terminal on boot

    
    // Connect WebSocket
    const connectWS = () => {
      const loc = window.location;
      const wsUri = `ws://${loc.hostname}:3232`;
      console.log(`Connecting to WebSocket: ${wsUri}`);
      
      const ws = new WebSocket(wsUri);
      
      ws.onopen = () => {
        console.log('WebSocket client connection established.');
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          // Broadcast raw WS event to document
          window.dispatchEvent(new CustomEvent(`ws:${msg.type}`, { detail: msg }));
        } catch (err) {
          // Ignore
        }
      };

      ws.onclose = () => {
        console.log('WebSocket connection lost, reconnecting in 3 seconds...');
        setTimeout(connectWS, 3000);
      };

      window.NitroCodeWebSocket = ws;
    };

    connectWS();
    checkOllama();

    // Check Ollama status every 30s
    const statusInterval = setInterval(checkOllama, 30000);

    // Track Monaco editor cursor movements
    const handleCursorMove = (e) => {
      setEditorLineCol(`${e.detail.line}:${e.detail.col}`);
    };
    window.addEventListener('monaco-cursor-move', handleCursorMove);

    return () => {
      clearInterval(statusInterval);
      window.removeEventListener('monaco-cursor-move', handleCursorMove);
      if (window.NitroCodeWebSocket) window.NitroCodeWebSocket.close();
    };
  }, []);

  const checkOllama = async () => {
    try {
      const res = await fetch('/api/ollama/status');
      const data = await res.json();
      setOllamaOnline(data.online);
    } catch (e) {
      setOllamaOnline(false);
    }
  };

  // Activity Bar Navigation Items
  const sidebarItems = [
    { id: 'explorer', icon: <Folder size={18} />, label: 'Files' },
    { id: 'search', icon: <Search size={18} />, label: 'Search' },
    { id: 'git', icon: <GitBranch size={18} />, label: 'Source Control' },
    { id: 'plugins', icon: <Puzzle size={18} />, label: 'Plugins' },
    { id: 'mcp', icon: <Database size={18} />, label: 'MCP catalog' }
  ];

  const handleSidebarClick = (id) => {
    if (store.activeSidebar === id) {
      // Toggle collapsing sidebar
      store.setActiveSidebar(null);
    } else {
      store.setActiveSidebar(id);
    }
  };

  // Check if offline mode indicator should be active (no cloud keys and Ollama online)
  const isOfflineMode = !store.settings.openaiKey && 
                         !store.settings.anthropicKey && 
                         !store.settings.googleKey && 
                         ollamaOnline;

  const getActiveLanguage = () => {
    if (!store.activeFile) return 'Plain Text';
    const ext = store.activeFile.split('.').pop().toLowerCase();
    const map = {
      js: 'JavaScript', jsx: 'React JS', ts: 'TypeScript', tsx: 'React TS',
      py: 'Python', go: 'Go', rs: 'Rust', css: 'CSS', html: 'HTML', json: 'JSON', md: 'Markdown'
    };
    return map[ext] || ext.toUpperCase();
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0A0A0B] text-[#F0F0F0] select-none font-sans overflow-hidden">
      
      {/* Top Header Navigation */}
      <header className="h-10 border-b border-border-custom bg-bg-secondary flex items-center justify-between px-3 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base text-accent-custom animate-pulse font-bold flex items-center gap-1">⚡ NitroCode</span>
          <span className="text-[10px] text-text-secondary border border-border-custom rounded-full px-2 py-0.5 mt-0.5">
            Code faster. Think local. Scale to cloud.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick command palette action launcher */}
          <button 
            onClick={() => store.setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1 bg-bg-tertiary border border-border-custom rounded text-text-secondary hover:text-text-primary text-[10px] select-none"
          >
            <span>Run action command...</span>
            <kbd className="bg-bg-secondary px-1 border border-border-custom rounded text-[8px]">Ctrl+Shift+P</kbd>
          </button>

          {/* Preview server toggler */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`p-1.5 rounded hover:bg-bg-tertiary transition cursor-pointer ${
              showPreview ? 'text-accent-custom bg-bg-tertiary' : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Toggle Live Web Browser Preview"
          >
            <Monitor size={15} />
          </button>

          {/* Settings modal toggler */}
          <button
            onClick={() => store.setSettingsOpen(true)}
            className="p-1.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition cursor-pointer"
            title="Settings Panel"
          >
            <Settings size={15} />
          </button>
        </div>
      </header>

      {/* Main Workspace Frame Body */}
      <div className="flex-1 flex overflow-hidden w-full relative">
        
        {/* Leftmost Activity Bar */}
        <nav className="w-12 bg-bg-secondary border-r border-border-custom flex flex-col items-center py-2 gap-3 shrink-0">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleSidebarClick(item.id)}
              className={`p-2.5 rounded transition cursor-pointer relative ${
                store.activeSidebar === item.id 
                  ? 'text-accent-custom bg-bg-tertiary' 
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary/40'
              }`}
              title={item.label}
            >
              {item.icon}
              {store.activeSidebar === item.id && (
                <span className="absolute left-0 top-1/4 bottom-1/4 w-0.5 bg-accent-custom rounded-r" />
              )}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => store.setSettingsOpen(true)}
            className="p-2.5 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition cursor-pointer"
            title="Open Settings"
          >
            <Settings size={18} />
          </button>
        </nav>

        {/* Dynamic Sidebar Pane (collapsible) */}
        {store.activeSidebar && (
          <aside className="h-full shrink-0 border-r border-border-custom z-10 flex">
            {store.activeSidebar === 'explorer' && <FileExplorer />}
            {store.activeSidebar === 'search' && <SearchPanel />}
            {store.activeSidebar === 'git' && <GitPanel />}
            {store.activeSidebar === 'plugins' && <PluginPanel />}
            {store.activeSidebar === 'mcp' && <MCPPanel />}
          </aside>
        )}

        {/* Editor Area, Browser Preview, and Terminal Pane */}
        <div className="flex-1 flex flex-col overflow-hidden h-full">
          {/* Main workspace container */}
          <div className="flex-1 flex overflow-hidden">
            {/* Editor Pane */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <EditorPane />
            </div>

            {/* Live Web Browser Preview Split right */}
            {showPreview && (
              <div className="w-[45%] border-l border-border-custom flex flex-col h-full overflow-hidden">
                <BrowserPreview />
              </div>
            )}
          </div>

          {/* Bottom terminal pane (stays mounted but toggleable) */}
          <TerminalPane />
        </div>

        {/* Collapsible Right-side AI Chat Panel */}
        <ChatPanel />
      </div>

      {/* Bottom Status Bar */}
      <footer className="h-6 border-t border-border-custom bg-bg-secondary flex items-center justify-between px-3 text-[10px] text-text-secondary select-none shrink-0 font-mono">
        <div className="flex items-center gap-4.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${ollamaOnline ? 'bg-success-custom' : 'bg-error-custom'}`} />
            <span>Ollama {ollamaOnline ? 'Online' : 'Offline'}</span>
          </div>

          {isOfflineMode && (
            <div className="flex items-center gap-1 text-success-custom font-semibold">
              <CheckCircle size={10} />
              <span>Offline Mode ✓</span>
            </div>
          )}

          {store.gitIsRepo && (
            <div className="flex items-center gap-1">
              <GitBranch size={10} className="text-accent-custom" />
              <span>{store.gitBranch}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span>Active Model: <strong className="text-text-primary">{store.activeModel}</strong></span>
          <span>{getActiveLanguage()}</span>
          <span>Line/Col: {editorLineCol}</span>
          <span>Cost: <strong className="text-success-custom">${store.costThisSession.toFixed(4)}</strong></span>
        </div>
      </footer>

      {/* Modals & Dialog overlays */}
      <SettingsModal />
      <QuickOpen />
      <CommandPalette />
      <DiffViewer />
      
    </div>
  );
}
