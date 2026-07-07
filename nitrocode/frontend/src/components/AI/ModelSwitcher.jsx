import React, { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { Cpu, Cloud, AlertCircle } from 'lucide-react';

export default function ModelSwitcher() {
  const store = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState(false);

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

  const handleSelect = (modelName) => {
    store.setActiveModel(modelName);
    setIsOpen(false);
  };

  const selectedModel = store.availableModels.find(m => m.name === store.activeModel) || {
    name: store.activeModel,
    label: store.activeModel,
    type: 'cloud',
    badges: ['fast']
  };

  const localModels = store.availableModels.filter(m => m.type === 'local');
  const cloudModels = store.availableModels.filter(m => m.type === 'cloud');

  const checkKeyMissing = (modelName) => {
    if (modelName.startsWith('claude-')) return !store.settings.anthropicKey;
    if (modelName.startsWith('gpt-')) return !store.settings.openaiKey;
    if (modelName.startsWith('gemini-')) return !store.settings.googleKey;
    return false;
  };

  return (
    <div className="relative text-xs select-none">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-bg-tertiary border border-border-custom rounded hover:bg-border-custom text-text-primary outline-none cursor-pointer"
      >
        {selectedModel.type === 'local' ? <Cpu size={12} className="text-accent-custom" /> : <Cloud size={12} className="text-accent-custom" />}
        <span className="truncate max-w-[110px]">{selectedModel.label || selectedModel.name}</span>
        <span className={`w-1.5 h-1.5 rounded-full ${
          selectedModel.type === 'local' 
            ? (ollamaOnline ? 'bg-success-custom' : 'bg-error-custom') 
            : (checkKeyMissing(selectedModel.name) ? 'bg-warning-custom' : 'bg-success-custom')
        }`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-1.5 left-0 w-64 bg-bg-tertiary border border-border-custom rounded shadow-xl py-1 z-40 max-h-80 overflow-y-auto">
            
            {/* Local Section */}
            <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-text-secondary tracking-wider flex items-center justify-between border-b border-border-custom/50 mb-1">
              <span>🖥 Local — Ollama</span>
              <span className={`w-2 h-2 rounded-full ${ollamaOnline ? 'bg-success-custom' : 'bg-error-custom'}`} />
            </div>

            {localModels.map(model => (
              <button
                key={model.name}
                onClick={() => handleSelect(model.name)}
                className={`w-full text-left px-3 py-1.5 hover:bg-bg-secondary flex flex-col gap-0.5 ${
                  store.activeModel === model.name ? 'text-accent-custom bg-bg-secondary/40' : 'text-text-primary'
                }`}
              >
                <div className="flex items-center justify-between font-medium">
                  <span className="truncate pr-1">{model.name}</span>
                  <span className="text-[9px] text-text-secondary">{(model.size / (1024**3)).toFixed(1)} GB</span>
                </div>
              </button>
            ))}

            {localModels.length === 0 && (
              <div className="px-3 py-2 text-[10px] text-text-secondary italic">
                No Ollama models found. Ensure path config matches and models are pulled.
              </div>
            )}

            {/* Cloud Section */}
            <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-text-secondary tracking-wider border-b border-border-custom/50 my-1">
              <span>☁ Cloud API</span>
            </div>

            {cloudModels.map(model => {
              const isKeyMissing = checkKeyMissing(model.name);
              return (
                <button
                  key={model.name}
                  onClick={() => handleSelect(model.name)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-bg-secondary flex flex-col gap-1 ${
                    store.activeModel === model.name ? 'text-accent-custom bg-bg-secondary/40' : 'text-text-primary'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium truncate">{model.label}</span>
                    <div className="flex gap-1">
                      {model.badges?.map(b => (
                        <span key={b} className="text-[8px] bg-border-custom px-1 rounded text-text-secondary">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                  {isKeyMissing && (
                    <span className="text-[9px] text-warning-custom flex items-center gap-1 font-medium">
                      <AlertCircle size={9} /> Key not set in Settings
                    </span>
                  )}
                </button>
              );
            })}

            {!ollamaOnline && (
              <div className="p-2 border-t border-border-custom mt-2 bg-error-custom/10 text-error-custom text-[10px] text-center select-none rounded-b">
                Ollama Offline. Start Ollama on localhost:11434.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
