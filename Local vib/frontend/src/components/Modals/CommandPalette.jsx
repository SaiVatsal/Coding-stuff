import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore.js';
import { Search, Terminal, Settings, Play, Square, GitBranch, Layout, FileText } from 'lucide-react';

export default function CommandPalette() {
  const store = useStore();
  const [query, setQuery] = useState('');
  const [filteredActions, setFilteredActions] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  const actions = [
    {
      id: 'quick-open',
      name: 'File: Open File Quick Search...',
      icon: <FileText size={13} />,
      run: () => { store.setQuickOpenOpen(true); }
    },
    {
      id: 'toggle-terminal',
      name: 'Terminal: Toggle Interactive Shell',
      icon: <Terminal size={13} />,
      run: () => {
        const term = document.getElementById('terminal-pane-container');
        if (term) {
          term.style.display = term.style.display === 'none' ? 'block' : 'none';
        }
      }
    },
    {
      id: 'new-terminal',
      name: 'Terminal: Create New Shell Instance',
      icon: <Terminal size={13} />,
      run: () => { store.createTerminal(); }
    },
    {
      id: 'open-settings',
      name: 'Settings: Open Configuration Tab Panel',
      icon: <Settings size={13} />,
      run: () => { store.setSettingsOpen(true); }
    },
    {
      id: 'start-preview',
      name: 'Preview: Host Static Application Server',
      icon: <Play size={13} />,
      run: () => { store.startPreview(); }
    },
    {
      id: 'stop-preview',
      name: 'Preview: Stop Live Preview Host Listeners',
      icon: <Square size={13} />,
      run: () => { store.stopPreview(); }
    },
    {
      id: 'git-status',
      name: 'Git: Scan Repository Modified Statuses',
      icon: <GitBranch size={13} />,
      run: () => { store.fetchGitStatus(); }
    },
    {
      id: 'toggle-minimap',
      name: 'Editor: Toggle Monaco Minimap Display',
      icon: <Layout size={13} />,
      run: () => { store.updateSettings({ minimap: !store.settings.minimap }); }
    },
    {
      id: 'toggle-wrap',
      name: 'Editor: Toggle Editor Line Word Wrap',
      icon: <Layout size={13} />,
      run: () => { store.updateSettings({ wordWrap: !store.settings.wordWrap }); }
    }
  ];

  useEffect(() => {
    if (store.isCommandPaletteOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [store.isCommandPaletteOpen]);

  useEffect(() => {
    if (!query) {
      setFilteredActions(actions);
    } else {
      const q = query.toLowerCase();
      const filtered = actions.filter(act => act.name.toLowerCase().includes(q));
      setFilteredActions(filtered);
    }
    setSelectedIdx(0);
  }, [query]);

  if (!store.isCommandPaletteOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      store.setCommandPaletteOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, filteredActions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIdx]) {
        handleSelect(filteredActions[selectedIdx]);
      }
    }
  };

  const handleSelect = (action) => {
    action.run();
    store.setCommandPaletteOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#00000080] flex items-start justify-center pt-20 backdrop-blur-sm">
      <div 
        className="bg-bg-secondary border border-border-custom rounded-lg flex flex-col w-[500px] max-h-[350px] shadow-2xl overflow-hidden text-xs"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center px-3 py-2 border-b border-border-custom bg-bg-tertiary">
          <Search size={14} className="text-text-secondary mr-2" />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command to execute..."
            className="flex-1 bg-transparent text-xs text-text-primary outline-none"
          />
          <span className="text-[10px] text-text-secondary font-mono">ESC to close</span>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filteredActions.map((action, idx) => (
            <div
              key={action.id}
              onClick={() => handleSelect(action)}
              onMouseEnter={() => setSelectedIdx(idx)}
              className={`p-2 rounded cursor-pointer flex items-center justify-between ${
                selectedIdx === idx 
                  ? 'bg-accent-custom text-white' 
                  : 'text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={selectedIdx === idx ? 'text-white' : 'text-text-secondary'}>
                  {action.icon}
                </span>
                <span>{action.name}</span>
              </div>
              <span className={`text-[10px] uppercase font-mono ${selectedIdx === idx ? 'text-white/60' : 'text-text-secondary'}`}>
                action
              </span>
            </div>
          ))}

          {filteredActions.length === 0 && (
            <div className="text-center text-text-secondary py-8 select-none">No matching commands found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
