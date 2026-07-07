import React, { useEffect, useRef } from 'react';
import { Terminal as XtermTerminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useStore } from '../../store/useStore.js';
import { Plus, X, Terminal as TerminalIcon } from 'lucide-react';
import 'xterm/css/xterm.css';

export default function TerminalPane() {
  const store = useStore();
  const containerRef = useRef(null);
  
  // Maps to track active terminal xterm instances
  const terminalInstances = useRef(new Map());
  const fitAddons = useRef(new Map());

  // Initialize terminal on session list update
  useEffect(() => {
    store.terminalSessions.forEach((session) => {
      if (terminalInstances.current.has(session.id)) return; // Already exists

      // 1. Create Terminal DOM target
      const termContainer = document.createElement('div');
      termContainer.id = `xterm-target-${session.id}`;
      termContainer.style.width = '100%';
      termContainer.style.height = '100%';
      termContainer.style.padding = '4px 8px';
      termContainer.style.display = store.activeTerminalId === session.id ? 'block' : 'none';
      containerRef.current.appendChild(termContainer);

      // 2. Initialize Xterm
      const term = new XtermTerminal({
        cursorBlink: true,
        theme: {
          background: '#0D0D10',
          foreground: '#F0F0F0',
          cursor: '#5E6AD2',
          black: '#111113',
          red: '#F85149',
          green: '#2DA44E',
          yellow: '#F0A732',
          blue: '#5E6AD2',
          magenta: '#6B78E5',
          cyan: '#6B78E5',
          white: '#F0F0F0'
        },
        fontSize: 13,
        fontFamily: 'JetBrains Mono, monospace',
        convertEol: true
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(termContainer);
      fitAddon.fit();

      // Write welcome line
      term.writeln('\x1b[35mNitroCode Terminal Session Initialized...\x1b[0m');

      // 3. Stdin handler
      term.onData((data) => {
        if (window.NitroCodeWebSocket && window.NitroCodeWebSocket.readyState === 1) {
          window.NitroCodeWebSocket.send(JSON.stringify({
            type: 'terminal-input',
            id: session.id,
            data
          }));
        }
      });

      terminalInstances.current.set(session.id, term);
      fitAddons.current.set(session.id, fitAddon);
    });

    // Handle session deletions (clean up unused DOM and terminal instances)
    const activeIds = store.terminalSessions.map(t => t.id);
    for (const [id, term] of terminalInstances.current.entries()) {
      if (!activeIds.includes(id)) {
        term.dispose();
        terminalInstances.current.delete(id);
        fitAddons.current.delete(id);
        const domNode = document.getElementById(`xterm-target-${id}`);
        if (domNode) domNode.remove();
      }
    }
  }, [store.terminalSessions]);

  // Adjust display visibility of DOM containers based on active tab
  useEffect(() => {
    store.terminalSessions.forEach((session) => {
      const domNode = document.getElementById(`xterm-target-${session.id}`);
      if (domNode) {
        domNode.style.display = store.activeTerminalId === session.id ? 'block' : 'none';
        if (store.activeTerminalId === session.id) {
          // Refit and focus
          const addon = fitAddons.current.get(session.id);
          const term = terminalInstances.current.get(session.id);
          if (addon && term) {
            setTimeout(() => {
              addon.fit();
              term.focus();
            }, 30);
          }
        }
      }
    });
  }, [store.activeTerminalId, store.terminalSessions]);

  // Subscribe to WebSocket broadcast event bus
  useEffect(() => {
    const handleTermData = (e) => {
      const { id, data } = e.detail;
      const term = terminalInstances.current.get(id);
      if (term) {
        term.write(data);
      }
    };

    const handleTermError = (e) => {
      const { id, text } = e.detail;
      // Emit a unified browser CustomEvent for ChatPanel to show error popup
      window.dispatchEvent(new CustomEvent('terminal-error-broadcast', { detail: { text, id } }));
    };

    window.addEventListener('ws:terminal-data', handleTermData);
    window.addEventListener('ws:terminal-error', handleTermError);
    
    // Fit handles on window resize
    const handleResize = () => {
      fitAddons.current.forEach(addon => addon.fit());
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('ws:terminal-data', handleTermData);
      window.removeEventListener('ws:terminal-error', handleTermError);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleCreate = () => {
    store.createTerminal();
  };

  const handleClose = (e, id) => {
    e.stopPropagation();
    store.killTerminal(id);
  };

  return (
    <div id="terminal-pane-container" className="h-52 border-t border-border-custom bg-[#0D0D10] flex flex-col overflow-hidden">
      
      {/* Tab bar header */}
      <div className="flex items-center justify-between px-3 h-8 bg-bg-secondary border-b border-border-custom select-none text-xs">
        <div className="flex items-center overflow-x-auto h-full">
          {store.terminalSessions.map((session) => {
            const isActive = store.activeTerminalId === session.id;
            return (
              <div
                key={session.id}
                onClick={() => store.setActiveTerminalId(session.id)}
                className={`flex items-center gap-1.5 px-3 h-full border-r border-border-custom cursor-pointer transition ${
                  isActive 
                    ? 'bg-[#0D0D10] text-accent-custom font-semibold' 
                    : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                }`}
              >
                <TerminalIcon size={12} />
                <span>{session.name}</span>
                <button 
                  onClick={(e) => handleClose(e, session.id)}
                  className="p-0.5 rounded-full hover:bg-bg-tertiary text-text-secondary hover:text-text-primary"
                >
                  <X size={10} />
                </button>
              </div>
            );
          })}
          <button 
            onClick={handleCreate}
            title="New Terminal"
            className="p-1 ml-1.5 rounded hover:bg-bg-tertiary text-text-secondary hover:text-text-primary transition"
          >
            <Plus size={14} />
          </button>
        </div>
        <div className="text-[10px] text-text-secondary font-mono">
          Interactive Shell (PowerShell/Bash)
        </div>
      </div>

      {/* Terminal Viewports Container */}
      <div 
        ref={containerRef} 
        className="flex-1 w-full overflow-hidden bg-terminal-bg"
      />
    </div>
  );
}
