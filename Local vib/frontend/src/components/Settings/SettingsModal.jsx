import React, { useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { X, Settings, ShieldAlert, Key, Plus, Trash2, Cpu, FileJson, CheckCircle } from 'lucide-react';

export default function SettingsModal() {
  const store = useStore();
  const [activeTab, setActiveTab] = useState('models');

  // Local form states for adding MCP servers
  const [mcpName, setMcpName] = useState('');
  const [mcpUrl, setMcpUrl] = useState('');
  const [mcpToken, setMcpToken] = useState('');

  if (!store.isSettingsOpen) return null;

  const handleUpdateSetting = (key, value) => {
    store.updateSettings({ [key]: value });
  };

  const handleAddMcpServer = async (e) => {
    e.preventDefault();
    if (!mcpName.trim() || !mcpUrl.trim()) return;

    const newServer = {
      name: mcpName.trim(),
      url: mcpUrl.trim(),
      token: mcpToken.trim(),
      enabled: true
    };

    const currentServers = store.settings.mcpServers || [];
    const updated = [...currentServers, newServer];

    await store.updateSettings({ mcpServers: updated });
    await store.fetchMcpServers();

    setMcpName('');
    setMcpUrl('');
    setMcpToken('');
  };

  const handleRemoveMcpServer = async (name) => {
    const currentServers = store.settings.mcpServers || [];
    const updated = currentServers.filter(s => s.name !== name);
    await store.updateSettings({ mcpServers: updated });
    await store.fetchMcpServers();
  };

  const tabs = [
    { id: 'models', label: 'Models' },
    { id: 'keys', label: 'API Keys' },
    { id: 'mcp', label: 'MCP Servers' },
    { id: 'preview', label: 'Preview' },
    { id: 'editor', label: 'Editor' },
    { id: 'voice', label: 'Voice' },
    { id: 'plugins', label: 'Plugins' },
    { id: 'shortcuts', label: 'Shortcuts' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#00000080] flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border-custom rounded-lg flex flex-col w-[680px] h-[480px] shadow-2xl overflow-hidden text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-custom bg-bg-tertiary">
          <span className="font-semibold text-text-primary flex items-center gap-1.5">
            <Settings size={14} className="text-accent-custom" /> IDE Settings
          </span>
          <button onClick={() => store.setSettingsOpen(false)} className="text-text-secondary hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        {/* Core Frame Split */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Tabs Navigation sidebar */}
          <div className="w-40 border-r border-border-custom bg-bg-secondary flex flex-col p-2 space-y-0.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded transition cursor-pointer font-medium ${
                  activeTab === tab.id 
                    ? 'bg-bg-tertiary text-accent-custom' 
                    : 'text-text-secondary hover:bg-bg-tertiary/40 hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Settings contents viewport */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-bg-primary">
            
            {/* Tab: Models */}
            {activeTab === 'models' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary border-b border-border-custom pb-1.5">Model Engine Settings</h3>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-secondary uppercase font-semibold">Ollama Local Manifests Directory Path</label>
                  <input 
                    type="text" 
                    value={store.settings.ollamaPath || ''}
                    onChange={(e) => handleUpdateSetting('ollamaPath', e.target.value)}
                    placeholder="e.g. C:\Users\name\.ollama\models"
                    className="w-full bg-bg-secondary border border-border-custom rounded p-2 text-text-primary outline-none focus:border-accent-custom font-mono"
                  />
                  <span className="text-[10px] text-text-secondary">NitroCode scans for manifests inside this path to identify downloaded local LLMs.</span>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-secondary uppercase font-semibold">Default Workspace Model</label>
                  <select 
                    value={store.settings.defaultModel || 'gemini-2.5-flash'}
                    onChange={(e) => handleUpdateSetting('defaultModel', e.target.value)}
                    className="w-full bg-bg-secondary border border-border-custom rounded p-2 text-text-primary outline-none focus:border-accent-custom"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    <option value="gpt-4o">GPT-4o</option>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded border border-border-custom">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-text-primary">Smart Auto-Routing</span>
                    <span className="text-[10px] text-text-secondary">Route short questions to local models and coding requests to Cloud APIs.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={store.settings.autoRouting !== false}
                    onChange={(e) => handleUpdateSetting('autoRouting', e.target.checked)}
                    className="w-4 h-4 accent-accent-custom"
                  />
                </div>
              </div>
            )}

            {/* Tab: Keys */}
            {activeTab === 'keys' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary border-b border-border-custom pb-1.5">Cloud API Key Credentials</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-secondary uppercase font-semibold">Anthropic API Key</label>
                  <input 
                    type="password" 
                    value={store.settings.anthropicKey || ''}
                    onChange={(e) => handleUpdateSetting('anthropicKey', e.target.value)}
                    placeholder="sk-ant-..."
                    className="w-full bg-bg-secondary border border-border-custom rounded p-2 text-text-primary outline-none focus:border-accent-custom font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-secondary uppercase font-semibold">OpenAI API Key</label>
                  <input 
                    type="password" 
                    value={store.settings.openaiKey || ''}
                    onChange={(e) => handleUpdateSetting('openaiKey', e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full bg-bg-secondary border border-border-custom rounded p-2 text-text-primary outline-none focus:border-accent-custom font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-secondary uppercase font-semibold">Google Gemini API Key</label>
                  <input 
                    type="password" 
                    value={store.settings.googleKey || ''}
                    onChange={(e) => handleUpdateSetting('googleKey', e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-bg-secondary border border-border-custom rounded p-2 text-text-primary outline-none focus:border-accent-custom font-mono"
                  />
                </div>
              </div>
            )}

            {/* Tab: MCP */}
            {activeTab === 'mcp' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary border-b border-border-custom pb-1.5 font-mono">Model Context Protocol Servers</h3>
                
                {/* Form to add server */}
                <form onSubmit={handleAddMcpServer} className="p-3 bg-bg-secondary border border-border-custom rounded-lg space-y-3">
                  <h4 className="font-semibold text-text-primary flex items-center gap-1.5"><Plus size={12} /> Add MCP Server</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="text" 
                      value={mcpName}
                      onChange={(e) => setMcpName(e.target.value)}
                      placeholder="Server name (e.g. filesystem)"
                      className="bg-bg-primary border border-border-custom rounded p-2 text-text-primary outline-none"
                    />
                    <input 
                      type="text" 
                      value={mcpUrl}
                      onChange={(e) => setMcpUrl(e.target.value)}
                      placeholder="SSE URL (http://...) or command (npx...)"
                      className="bg-bg-primary border border-border-custom rounded p-2 text-text-primary outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="password" 
                      value={mcpToken}
                      onChange={(e) => setMcpToken(e.target.value)}
                      placeholder="Auth token (optional)"
                      className="flex-1 bg-bg-primary border border-border-custom rounded p-2 text-text-primary outline-none"
                    />
                    <button type="submit" className="px-4 bg-accent-custom hover:bg-accent-hover text-white rounded font-medium cursor-pointer">Add</button>
                  </div>
                </form>

                {/* List of servers */}
                <div className="space-y-1.5">
                  {store.settings.mcpServers?.map(server => (
                    <div key={server.name} className="flex items-center justify-between p-2.5 bg-bg-secondary rounded border border-border-custom font-mono text-[11px]">
                      <div className="flex flex-col">
                        <span className="font-semibold text-text-primary">{server.name}</span>
                        <span className="text-[10px] text-text-secondary truncate max-w-[340px]">{server.url}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveMcpServer(server.name)}
                        className="text-text-secondary hover:text-error-custom p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Preview */}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary border-b border-border-custom pb-1.5">Live Preview Settings</h3>
                
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-text-secondary uppercase font-semibold">Static Preview Host Port</label>
                  <input 
                    type="number" 
                    value={store.settings.previewPort || 3131}
                    onChange={(e) => handleUpdateSetting('previewPort', parseInt(e.target.value, 10))}
                    className="w-24 bg-bg-secondary border border-border-custom rounded p-2 text-text-primary outline-none focus:border-accent-custom font-mono"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded border border-border-custom">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-text-primary">Live Code Auto-Refresh</span>
                    <span className="text-[10px] text-text-secondary">Automatically reload preview frames when workspace code is saved.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={store.settings.autoRefresh !== false}
                    onChange={(e) => handleUpdateSetting('autoRefresh', e.target.checked)}
                    className="w-4 h-4 accent-accent-custom"
                  />
                </div>
              </div>
            )}

            {/* Tab: Editor */}
            {activeTab === 'editor' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary border-b border-border-custom pb-1.5">Monaco Viewport Configs</h3>
                
                <div className="flex items-center justify-between">
                  <label className="font-medium text-text-primary">Font Size</label>
                  <input 
                    type="range" 
                    min="10" 
                    max="24"
                    value={store.settings.fontSize || 13}
                    onChange={(e) => handleUpdateSetting('fontSize', parseInt(e.target.value, 10))}
                    className="w-32 accent-accent-custom"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="font-medium text-text-primary">Tab Indent Space Size</label>
                  <select 
                    value={store.settings.tabSize || 2}
                    onChange={(e) => handleUpdateSetting('tabSize', parseInt(e.target.value, 10))}
                    className="bg-bg-secondary border border-border-custom rounded p-1.5 text-text-primary outline-none"
                  >
                    <option value="2">2 Spaces</option>
                    <option value="4">4 Spaces</option>
                    <option value="8">8 Spaces</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded border border-border-custom">
                  <span className="font-medium text-text-primary">Word Wrapping</span>
                  <input 
                    type="checkbox" 
                    checked={store.settings.wordWrap !== false}
                    onChange={(e) => handleUpdateSetting('wordWrap', e.target.checked)}
                    className="w-4 h-4 accent-accent-custom"
                  />
                </div>

                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded border border-border-custom">
                  <span className="font-medium text-text-primary">Display Editor Minimap</span>
                  <input 
                    type="checkbox" 
                    checked={store.settings.minimap !== false}
                    onChange={(e) => handleUpdateSetting('minimap', e.target.checked)}
                    className="w-4 h-4 accent-accent-custom"
                  />
                </div>
              </div>
            )}

            {/* Tab: Voice */}
            {activeTab === 'voice' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary border-b border-border-custom pb-1.5">Voice Transcription Settings</h3>
                
                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded border border-border-custom">
                  <span className="font-medium text-text-primary">Enable Voice Dictation Inputs</span>
                  <input 
                    type="checkbox" 
                    checked={store.settings.voiceEnabled !== false}
                    onChange={(e) => handleUpdateSetting('voiceEnabled', e.target.checked)}
                    className="w-4 h-4 accent-accent-custom"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="font-medium text-text-primary">Voice Input Mode</label>
                  <select 
                    value={store.settings.voiceMode || 'click-toggle'}
                    onChange={(e) => handleUpdateSetting('voiceMode', e.target.value)}
                    className="bg-bg-secondary border border-border-custom rounded p-1.5 text-text-primary outline-none"
                  >
                    <option value="click-toggle">Click Toggle (Tap to Start/Stop)</option>
                    <option value="push-to-talk">Push-to-Talk (Hold Mic)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-2 bg-bg-secondary rounded border border-border-custom">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-text-primary">OpenAI Whisper Fallback API</span>
                    <span className="text-[10px] text-text-secondary">Capture local wav audio streams and proxy to cloud Whisper transcription.</span>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={!!store.settings.whisperApiEnabled}
                    onChange={(e) => handleUpdateSetting('whisperApiEnabled', e.target.checked)}
                    className="w-4 h-4 accent-accent-custom"
                  />
                </div>
              </div>
            )}

            {/* Tab: Plugins */}
            {activeTab === 'plugins' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary border-b border-border-custom pb-1.5">Workspace Plugins Manager</h3>
                <div className="space-y-2">
                  {store.plugins.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 bg-bg-secondary border border-border-custom rounded-lg">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{p.icon}</span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-text-primary">{p.name}</span>
                          <span className="text-[10px] text-text-secondary">{p.version}</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={p.enabled}
                        onChange={() => store.togglePlugin(p.id, p.enabled)}
                        className="w-4 h-4 accent-success-custom"
                      />
                    </div>
                  ))}
                  {store.plugins.length === 0 && (
                    <div className="text-center text-text-secondary py-8">No plugins installed.</div>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Shortcuts */}
            {activeTab === 'shortcuts' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-text-primary border-b border-border-custom pb-1.5">Keyboard Shortcut Reference</h3>
                <table className="w-full text-left font-mono text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-border-custom text-text-secondary text-[10px] uppercase">
                      <th className="py-2">Shortcut</th>
                      <th className="py-2">Action description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-custom/50 text-text-primary">
                    <tr>
                      <td className="py-2"><kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Ctrl+S</kbd> / <kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Cmd+S</kbd></td>
                      <td className="py-2">Save current file edits to disk</td>
                    </tr>
                    <tr>
                      <td className="py-2"><kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Ctrl+P</kbd> / <kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Cmd+P</kbd></td>
                      <td className="py-2">Fuzzy search project files list</td>
                    </tr>
                    <tr>
                      <td className="py-2"><kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Ctrl+K</kbd> / <kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Cmd+K</kbd></td>
                      <td className="py-2">Focus AI chat text entry box</td>
                    </tr>
                    <tr>
                      <td className="py-2"><kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Ctrl+`</kbd> / <kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Cmd+`</kbd></td>
                      <td className="py-2">Show or minimize interactive console</td>
                    </tr>
                    <tr>
                      <td className="py-2"><kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Ctrl+Shift+F</kbd></td>
                      <td className="py-2">Open global grep text finder panel</td>
                    </tr>
                    <tr>
                      <td className="py-2"><kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Ctrl+Shift+P</kbd></td>
                      <td className="py-2">Open action command palette list</td>
                    </tr>
                    <tr>
                      <td className="py-2"><kbd className="bg-bg-secondary px-1 border border-border-custom rounded">Alt</kbd> + Hover</td>
                      <td className="py-2">Generate instant definition tooltips</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
