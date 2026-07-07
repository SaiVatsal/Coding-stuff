import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { ToggleLeft, ToggleRight, FolderOpen, Puzzle, ChevronRight, Play } from 'lucide-react';

export default function PluginPanel() {
  const store = useStore();
  const [selectedPluginId, setSelectedPluginId] = useState(null);

  useEffect(() => {
    store.fetchPlugins();
  }, []);

  const handleToggle = async (id, currentVal) => {
    await store.togglePlugin(id, !currentVal);
  };

  const handleOpenFolder = async () => {
    // Open plugins folder via terminal
    try {
      await fetch('/api/terminal/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'open-plugins-dir', workspaceDir: process.cwd() })
      });
      // Execute system explorer command
      const cmd = process.platform === 'win32' ? 'explorer.exe plugins' : 'open plugins';
      await fetch('/api/terminal/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 'open-plugins-dir', data: `${cmd}\r` })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const enabledPlugins = store.plugins.filter(p => p.enabled);
  
  // Get active components registered by plugins
  const registeredPanels = window._nitrocode_panels || {};
  const activePluginPanelId = selectedPluginId || (enabledPlugins.length > 0 ? enabledPlugins[0].id : null);
  const ActivePanelComponent = registeredPanels[activePluginPanelId];

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-r border-border-custom w-60 overflow-hidden text-xs">
      <div className="flex items-center justify-between p-3 border-b border-border-custom">
        <h2 className="text-xs uppercase font-semibold tracking-wider text-text-secondary">Plugins</h2>
        <button 
          onClick={handleOpenFolder}
          title="Open plugins directory"
          className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
        >
          <FolderOpen size={14} />
        </button>
      </div>

      {/* Tabs between Plugin List and Plugin Views */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Dynamic Panel View if selected */}
        {ActivePanelComponent ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-2.5 bg-bg-tertiary/50 border-b border-border-custom">
              <span className="font-semibold text-text-primary flex items-center gap-1.5">
                <Puzzle size={13} className="text-accent-custom" />
                {store.plugins.find(p => p.id === activePluginPanelId)?.name || 'Plugin View'}
              </span>
              <button 
                onClick={() => setSelectedPluginId(null)}
                className="text-[10px] text-text-secondary hover:text-text-primary"
              >
                Back to list
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <ActivePanelComponent api={window.NitroCodeAPI} />
            </div>
          </div>
        ) : (
          /* Main Plugin List */
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            <div>
              <h3 className="font-semibold text-text-secondary uppercase tracking-wider text-[10px] mb-2">Available Plugins</h3>
              <div className="space-y-2">
                {store.plugins.map(plugin => (
                  <div 
                    key={plugin.id}
                    className="p-2.5 bg-bg-tertiary/40 border border-border-custom rounded hover:bg-bg-tertiary/75 flex flex-col gap-1.5 transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5 font-medium text-text-primary">
                        <span className="text-sm">{plugin.icon}</span>
                        <span>{plugin.name}</span>
                      </div>
                      <button 
                        onClick={() => handleToggle(plugin.id, plugin.enabled)}
                        className="text-text-secondary hover:text-text-primary"
                      >
                        {plugin.enabled ? (
                          <ToggleRight size={18} className="text-success-custom" />
                        ) : (
                          <ToggleLeft size={18} />
                        )}
                      </button>
                    </div>
                    
                    <p className="text-[11px] text-text-secondary leading-normal">{plugin.description}</p>
                    
                    {plugin.enabled && registeredPanels[plugin.id] && (
                      <button 
                        onClick={() => setSelectedPluginId(plugin.id)}
                        className="mt-1 self-start flex items-center gap-1 text-[10px] text-accent-custom hover:text-accent-hover font-semibold"
                      >
                        Open Panel <ChevronRight size={10} />
                      </button>
                    )}
                  </div>
                ))}
                
                {store.plugins.length === 0 && (
                  <div className="text-center text-text-secondary py-8">No plugins discovered.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
