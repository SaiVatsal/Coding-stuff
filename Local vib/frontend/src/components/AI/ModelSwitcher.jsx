import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { Cpu, Cloud, AlertCircle, RefreshCw, Sparkles, Terminal, MemoryStick } from 'lucide-react';

export default function ModelSwitcher() {
  const store = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Poll models every 30s
  useEffect(() => {
    store.fetchModels();
    checkOllamaStatus();
    const interval = setInterval(() => {
      store.fetchModels();
      checkOllamaStatus();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkOllamaStatus = async () => {
    try {
      const res = await fetch('/api/ollama/status');
      const data = await res.json();
      setOllamaOnline(data.online);
    } catch (e) {
      setOllamaOnline(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([store.fetchModels(), checkOllamaStatus()]);
    setRefreshing(false);
  };

  const handleSelect = (modelName) => {
    store.setActiveModel(modelName);
    setIsOpen(false);
  };

  const selectedModel = store.availableModels.find(m => m.name === store.activeModel) || {
    name: store.activeModel,
    label: store.activeModel,
    type: 'cloud',
    badges: []
  };

  const localModels = store.availableModels.filter(m => m.type === 'local');
  const cloudModels = store.availableModels.filter(m => m.type === 'cloud');

  // Suggestions: only show models NOT already downloaded
  const downloadedNames = new Set(localModels.map(m => m.name));
  const suggestions = (store.suggestedModels || []).filter(s => !downloadedNames.has(s.name));

  const checkKeyMissing = (modelName) => {
    const s = store.settings;
    if (modelName.startsWith('claude-')) return !s._hasAnthropicKey && !s.anthropicKey;
    if (modelName.startsWith('gpt-')) return !s._hasOpenaiKey && !s.openaiKey;
    if (modelName.startsWith('gemini-')) return !s._hasGoogleKey && !s.googleKey;
    return false;
  };

  const formatSize = (m) => {
    if (m.sizeGB) return `${m.sizeGB} GB`;
    if (m.size && m.size > 1e6) return `${(m.size / 1e9).toFixed(1)} GB`;
    return null;
  };

  const sysInfo = store.systemInfo;

  return (
    <div className="relative text-xs select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-tertiary border border-border-custom rounded hover:bg-border-custom text-text-primary outline-none cursor-pointer"
      >
        {selectedModel.type === 'local'
          ? <Cpu size={12} className="text-accent-custom" />
          : <Cloud size={12} className="text-accent-custom" />}
        <span className="truncate max-w-[120px]">{selectedModel.label || selectedModel.name}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${
          selectedModel.type === 'local'
            ? (ollamaOnline ? 'bg-success-custom' : 'bg-error-custom')
            : (checkKeyMissing(selectedModel.name) ? 'bg-warning-custom' : 'bg-success-custom')
        }`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1.5 left-0 w-72 bg-bg-tertiary border border-border-custom rounded-lg shadow-xl py-1.5 z-40 max-h-[420px] overflow-y-auto">

            {/* System Info Bar */}
            {sysInfo && (
              <div className="px-3 py-1.5 flex items-center gap-3 text-[10px] text-text-secondary bg-bg-secondary/60 border-b border-border-custom/50 mb-1">
                <span className="flex items-center gap-1">
                  <MemoryStick size={9} />
                  {sysInfo.ramGB} GB RAM
                </span>
                {sysInfo.gpu && (
                  <span className="flex items-center gap-1 truncate">
                    <Cpu size={9} />
                    <span className="truncate max-w-[120px]">{sysInfo.gpu.name}{sysInfo.gpu.vramGB ? ` · ${sysInfo.gpu.vramGB}GB VRAM` : ''}</span>
                  </span>
                )}
              </div>
            )}

            {/* Local Section */}
            <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-text-secondary tracking-wider flex items-center justify-between border-b border-border-custom/50 mb-0.5">
              <span className="flex items-center gap-1">
                🖥 Local — Ollama
                <span className={`w-1.5 h-1.5 rounded-full ${ollamaOnline ? 'bg-success-custom' : 'bg-error-custom'}`} />
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); handleRefresh(); }}
                className="p-0.5 rounded hover:bg-bg-secondary text-text-secondary hover:text-text-primary transition cursor-pointer"
                title="Refresh Ollama models"
              >
                <RefreshCw size={10} className={refreshing ? 'animate-spin' : ''} />
              </button>
            </div>

            {localModels.map(model => (
              <button
                key={model.name}
                onClick={() => handleSelect(model.name)}
                className={`w-full text-left px-3 py-1.5 hover:bg-bg-secondary flex items-center justify-between gap-2 ${
                  store.activeModel === model.name ? 'text-accent-custom bg-bg-secondary/40' : 'text-text-primary'
                }`}
              >
                <span className="font-medium truncate flex-1">{model.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  {formatSize(model) && (
                    <span className="text-[9px] text-text-secondary">{formatSize(model)}</span>
                  )}
                  <span className={`w-1.5 h-1.5 rounded-full ${model.status === 'ready' ? 'bg-success-custom' : 'bg-warning-custom'}`} title={model.status} />
                </div>
              </button>
            ))}

            {localModels.length === 0 && (
              <div className="px-3 py-2 text-[10px] text-text-secondary italic">
                {ollamaOnline ? 'No models downloaded. See suggestions below.' : 'Ollama offline. Start Ollama first.'}
              </div>
            )}

            {/* Suggestions Section (models not yet downloaded) */}
            {suggestions.length > 0 && (
              <>
                <div className="px-2.5 py-1 mt-1 text-[10px] uppercase font-semibold text-text-secondary tracking-wider border-y border-border-custom/50 flex items-center gap-1">
                  <Sparkles size={9} className="text-accent-custom" />
                  Suggested for your PC
                </div>
                {suggestions.map(s => (
                  <div
                    key={s.name}
                    className="px-3 py-1.5 flex flex-col gap-0.5 border-b border-border-custom/20 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-text-primary">{s.label}</span>
                      <div className="flex items-center gap-1">
                        {s.recommended && (
                          <span className="text-[8px] bg-accent-custom/20 text-accent-custom px-1 rounded font-semibold">★ Best fit</span>
                        )}
                        <span className="text-[9px] text-text-secondary">{s.sizeGB} GB</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-text-secondary leading-tight">{s.reason}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Terminal size={8} className="text-text-secondary shrink-0" />
                      <code className="text-[8px] text-accent-custom font-mono truncate">{s.pullCmd}</code>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Cloud Section */}
            <div className="px-2.5 py-1 mt-1 text-[10px] uppercase font-semibold text-text-secondary tracking-wider border-y border-border-custom/50">
              ☁ Cloud API
            </div>

            {cloudModels.map(model => {
              const isKeyMissing = checkKeyMissing(model.name);
              return (
                <button
                  key={model.name}
                  onClick={() => handleSelect(model.name)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-bg-secondary flex flex-col gap-0.5 ${
                    store.activeModel === model.name ? 'text-accent-custom bg-bg-secondary/40' : 'text-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{model.label}</span>
                    <div className="flex gap-1">
                      {model.badges?.map(b => (
                        <span key={b} className="text-[8px] bg-border-custom px-1 rounded text-text-secondary">{b}</span>
                      ))}
                    </div>
                  </div>
                  {isKeyMissing && (
                    <span className="text-[9px] text-warning-custom flex items-center gap-1">
                      <AlertCircle size={9} /> Key not set in Settings
                    </span>
                  )}
                </button>
              );
            })}

            {!ollamaOnline && (
              <div className="p-2 border-t border-border-custom mt-1 bg-error-custom/10 text-error-custom text-[10px] text-center rounded-b">
                Ollama offline — start Ollama to use local models
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
