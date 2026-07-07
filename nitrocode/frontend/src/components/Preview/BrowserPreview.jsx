import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { Play, Square, RotateCw, ExternalLink, RefreshCw, AlertTriangle, Monitor } from 'lucide-react';

export default function BrowserPreview() {
  const store = useStore();
  const iframeRef = useRef(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [urlInput, setUrlInput] = useState('');

  const previewPort = store.previewPort || 3131;
  const previewUrl = `http://localhost:${previewPort}`;

  // Sync URL input bar
  useEffect(() => {
    setUrlInput(previewUrl);
  }, [previewPort]);

  // WebSocket Live Reload: reload iframe when a file changes
  useEffect(() => {
    const handleFileChanged = () => {
      if (store.previewRunning && store.settings.autoRefresh !== false) {
        console.log('File change detected: reloading preview server...');
        triggerReload();
      }
    };
    window.addEventListener('ws:file-changed', handleFileChanged);
    return () => window.removeEventListener('ws:file-changed', handleFileChanged);
  }, [store.previewRunning, store.settings.autoRefresh]);

  const triggerReload = () => {
    setReloadKey(prev => prev + 1);
  };

  const handleRun = async () => {
    await store.startPreview();
  };

  const handleStop = async () => {
    await store.stopPreview();
  };

  const handleOpenBrowser = () => {
    window.open(previewUrl, '_blank');
  };

  const handleReset = async () => {
    await store.stopPreview();
    await store.startPreview();
    triggerReload();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden">
      
      {/* Control bar */}
      <div className="flex items-center justify-between px-3 h-9 bg-bg-secondary border-b border-border-custom text-xs select-none">
        <div className="flex items-center gap-2">
          {store.previewRunning ? (
            <button 
              onClick={handleStop}
              className="flex items-center gap-1.5 px-2 py-1 bg-error-custom text-white hover:bg-opacity-80 rounded cursor-pointer transition font-medium"
            >
              <Square size={11} fill="white" /> Stop
            </button>
          ) : (
            <button 
              onClick={handleRun}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-success-custom text-white hover:bg-opacity-80 rounded cursor-pointer transition font-medium"
            >
              <Play size={11} fill="white" /> Run
            </button>
          )}
          
          <button 
            disabled={!store.previewRunning}
            onClick={triggerReload}
            title="Reload Preview"
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-40"
          >
            <RotateCw size={12} />
          </button>
          
          <button 
            disabled={!store.previewRunning}
            onClick={handleReset}
            title="Reset preview port connection"
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-40"
          >
            <RefreshCw size={12} />
          </button>
        </div>

        {/* Mock browser address bar */}
        <div className="flex-1 max-w-sm mx-4 bg-bg-tertiary border border-border-custom rounded px-2.5 py-0.5 text-text-secondary font-mono text-[10px] truncate select-all">
          {store.previewRunning ? urlInput : 'Preview server offline'}
        </div>

        <div className="flex items-center gap-1">
          <button 
            disabled={!store.previewRunning}
            onClick={handleOpenBrowser}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary disabled:opacity-40 flex items-center gap-1 font-semibold"
          >
            <ExternalLink size={12} /> Browser
          </button>
        </div>
      </div>

      {/* Frame Screen */}
      <div className="flex-1 bg-white relative">
        {store.previewRunning ? (
          <iframe 
            key={reloadKey}
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-none bg-white"
            title="Live Application Preview"
          />
        ) : (
          <div className="absolute inset-0 bg-[#0A0A0B] flex flex-col items-center justify-center text-xs text-text-secondary gap-3 select-none text-center p-4">
            <Monitor size={36} className="text-text-secondary opacity-25 animate-pulse" />
            <div className="space-y-1">
              <p className="font-semibold text-text-primary">Preview Server is Stopped</p>
              <p>Click "Run" to host and preview your static HTML/JS website on port {previewPort}.</p>
            </div>
            {store.fileTree ? (
              <span className="text-[10px] px-2 py-0.5 bg-bg-tertiary border border-border-custom rounded text-accent-custom font-mono">
                Serving: {store.workspaceRoot}
              </span>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
