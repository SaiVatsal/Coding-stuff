import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { ToggleLeft, ToggleRight, Database, CheckCircle, AlertTriangle, Cpu } from 'lucide-react';

export default function MCPPanel() {
  const store = useStore();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    store.fetchMcpServers();
    loadMcpTools();
  }, []);

  const loadMcpTools = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mcp/tools');
      const data = await res.json();
      setTools(data.tools || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (server) => {
    const updatedServers = store.mcpServers.map(s => {
      if (s.name === server.name) {
        return { ...s, enabled: !s.enabled };
      }
      return s;
    });

    // Update settings in Zustand
    const fullSettings = { ...store.settings, mcpServers: updatedServers };
    await store.updateSettings(fullSettings);
    await store.fetchMcpServers();
    await loadMcpTools();
  };

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-r border-border-custom w-60 overflow-hidden text-xs">
      <div className="flex items-center justify-between p-3 border-b border-border-custom bg-bg-secondary">
        <h2 className="text-xs uppercase font-semibold tracking-wider text-text-secondary">MCP Servers</h2>
        <button 
          onClick={loadMcpTools}
          className="text-[10px] text-accent-custom hover:text-accent-hover font-semibold"
        >
          Refresh Tools
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Servers list */}
        <div>
          <h3 className="font-semibold text-text-secondary uppercase tracking-wider text-[10px] mb-2">Connected Servers</h3>
          <div className="space-y-2">
            {store.mcpServers.map(server => (
              <div 
                key={server.name}
                className="p-2.5 bg-bg-tertiary/40 border border-border-custom rounded hover:bg-bg-tertiary flex flex-col gap-1.5 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex flex-col">
                    <span className="font-medium text-text-primary">{server.name}</span>
                    <span className="text-[10px] text-text-secondary truncate max-w-[120px]">{server.url}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center">
                      {server.status === 'online' ? (
                        <CheckCircle size={10} className="text-success-custom" />
                      ) : (
                        <AlertTriangle size={10} className="text-warning-custom" />
                      )}
                    </span>
                    <button 
                      onClick={() => handleToggle(server)}
                      className="text-text-secondary hover:text-text-primary"
                    >
                      {server.enabled ? (
                        <ToggleRight size={18} className="text-success-custom" />
                      ) : (
                        <ToggleLeft size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {store.mcpServers.length === 0 && (
              <div className="text-center text-text-secondary py-4 bg-bg-tertiary/20 rounded border border-dashed border-border-custom">
                No MCP servers added.<br />Add them in Settings.
              </div>
            )}
          </div>
        </div>

        {/* Tools list */}
        <div>
          <h3 className="font-semibold text-text-secondary uppercase tracking-wider text-[10px] mb-2">Discovered Tools</h3>
          <div className="space-y-1.5">
            {tools.map(tool => (
              <div 
                key={tool.name}
                className="p-2 bg-bg-tertiary/30 rounded border border-border-custom flex items-start gap-2"
              >
                <Cpu size={12} className="text-accent-custom mt-0.5" />
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium text-text-primary">
                    <span className="truncate">{tool.name}</span>
                    <span className="text-[9px] text-text-secondary px-1 bg-border-custom rounded">{tool.serverName}</span>
                  </div>
                  <p className="text-[10px] text-text-secondary leading-normal mt-0.5 line-clamp-2" title={tool.description}>
                    {tool.description}
                  </p>
                </div>
              </div>
            ))}

            {tools.length === 0 && !loading && (
              <div className="text-center text-text-secondary py-8">No active tools found.</div>
            )}
            
            {loading && (
              <div className="text-center text-text-secondary py-8">Scanning server tools...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
