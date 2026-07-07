import { useEffect } from 'react';
import { useStore } from '../store/useStore.js';

export function useKeyboardShortcuts() {
  const store = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isShift = e.shiftKey;

      // 1. Save Active File: Ctrl+S / Cmd+S
      if (isCmdOrCtrl && e.key.toLowerCase() === 's' && !isShift) {
        e.preventDefault();
        if (store.activeFile) {
          store.saveFile(store.activeFile);
        }
      }

      // 2. Fuzzy File Open: Ctrl+P / Cmd+P
      if (isCmdOrCtrl && e.key.toLowerCase() === 'p' && !isShift) {
        e.preventDefault();
        store.setQuickOpenOpen(!store.isQuickOpenOpen);
      }

      // 3. Command Palette: Ctrl+Shift+P / Cmd+Shift+P
      if (isCmdOrCtrl && isShift && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        store.setCommandPaletteOpen(!store.isCommandPaletteOpen);
      }

      // 4. Focus AI Chat: Ctrl+K / Cmd+K
      if (isCmdOrCtrl && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const chatInput = document.getElementById('chat-input-textarea');
        if (chatInput) {
          chatInput.focus();
        }
      }

      // 5. Toggle Terminal Pane: Ctrl+` / Cmd+`
      if (isCmdOrCtrl && e.key === '`') {
        e.preventDefault();
        // Toggle the terminal pane focus or minimize
        const terminalContainer = document.getElementById('terminal-pane-container');
        if (terminalContainer) {
          if (terminalContainer.style.display === 'none') {
            terminalContainer.style.display = 'block';
            if (store.terminalSessions.length === 0) {
              store.createTerminal();
            }
          } else {
            terminalContainer.style.display = 'none';
          }
        }
      }

      // 6. Search Across Files: Ctrl+Shift+F / Cmd+Shift+F
      if (isCmdOrCtrl && isShift && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        store.setActiveSidebar('search');
        // Focus the search input field
        setTimeout(() => {
          const searchInput = document.getElementById('global-search-input');
          if (searchInput) searchInput.focus();
        }, 50);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);
}
