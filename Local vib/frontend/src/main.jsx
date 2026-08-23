import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactMarkdown from 'react-markdown';
import App from './App.jsx';
import './index.css';
import { useStore } from './store/useStore.js';
import { sendChatMessageStream } from './utils/ai.js';

// Expose React, ReactMarkdown and Zustand to window for dynamic plugin imports
window.React = React;
window.ReactMarkdown = ReactMarkdown;


// Initialize the global NitroCode Plugin API
window.NitroCodeAPI = {
  store: useStore,

  registerPanel: (pluginId, panelComponent) => {
    // Allows plugins to register custom panels
    console.log(`Plugin '${pluginId}' registered a sidebar panel.`);
    window._nitrocode_panels = window._nitrocode_panels || {};
    window._nitrocode_panels[pluginId] = panelComponent;
  },

  registerAction: (pluginId, actionLabel, actionHandler) => {
    // Allows plugins to register context menu actions
    console.log(`Plugin '${pluginId}' registered action: '${actionLabel}'`);
    window._nitrocode_actions = window._nitrocode_actions || [];
    window._nitrocode_actions.push({ pluginId, label: actionLabel, handler: actionHandler });
  },

  getFileContent: async (path) => {
    const store = useStore.getState();
    const workspace = store.workspaceRoot;
    const res = await fetch(`/api/files/content?path=${encodeURIComponent(path)}&workspace=${encodeURIComponent(workspace)}`);
    const data = await res.json();
    return data.content;
  },

  setFileContent: async (path, content) => {
    const store = useStore.getState();
    const workspace = store.workspaceRoot;
    await fetch('/api/files/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path, content, workspace })
    });
    // Trigger UI refresh
    store.updateFileContent(path, content);
  },

  sendToAI: async (prompt, onChunk) => {
    const store = useStore.getState();
    const model = store.activeModel;
    const messages = [{ role: 'user', content: prompt }];
    return await sendChatMessageStream(model, messages, onChunk);
  },

  getCurrentModel: () => {
    return useStore.getState().activeModel;
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
