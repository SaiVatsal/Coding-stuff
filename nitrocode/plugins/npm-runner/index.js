import React from 'react';

const NpmPanelComponent = () => {
  const [scripts, setScripts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchScripts = async () => {
    try {
      const content = await window.NitroCodeAPI.getFileContent('package.json');
      const parsed = JSON.parse(content);
      setScripts(Object.entries(parsed.scripts || {}));
    } catch (e) {
      console.warn('Failed to read package.json scripts:', e.message);
      setScripts([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchScripts();
    // Re-fetch when files are saved
    const handleSave = () => fetchScripts();
    window.addEventListener('ws:file-changed', handleSave);
    return () => window.removeEventListener('ws:file-changed', handleSave);
  }, []);

  const runScript = async (name) => {
    const store = window.NitroCodeAPI.store.getState();
    let termId = store.activeTerminalId;
    if (!termId) {
      await store.createTerminal();
      termId = store.activeTerminalId;
    }

    // Toggle terminal open
    const termPane = document.getElementById('terminal-pane-container');
    if (termPane) termPane.style.display = 'block';

    // Trigger input write
    fetch('/api/terminal/write', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: termId, data: `npm run ${name}\r` })
    });
  };

  return React.createElement(
    'div',
    { className: 'space-y-3 text-xs' },
    React.createElement('h3', { className: 'font-semibold text-text-secondary uppercase tracking-wider text-[10px]' }, 'NPM Scripts'),
    loading ? React.createElement('p', { className: 'text-text-secondary italic' }, 'Scanning package.json...') : null,
    !loading && scripts.length === 0 ? React.createElement('p', { className: 'text-text-secondary italic' }, 'No scripts found.') : null,
    React.createElement(
      'div',
      { className: 'space-y-1.5' },
      scripts.map(([name, cmd]) => 
        React.createElement(
          'div',
          { key: name, className: 'p-2 bg-[#1A1A1F]/40 border border-[#1F1F28] rounded flex flex-col gap-1.5' },
          React.createElement('div', { className: 'flex items-center justify-between font-mono font-medium text-white' }, 
            React.createElement('span', { className: 'truncate' }, name),
            React.createElement(
              'button',
              { 
                onClick: () => runScript(name),
                className: 'px-2 py-0.5 bg-[#5E6AD2] hover:bg-[#6B78E5] text-white rounded text-[10px] cursor-pointer' 
              },
              'Run'
            )
          ),
          React.createElement('span', { className: 'text-[9px] text-[#8B8B9A] truncate font-mono' }, cmd)
        )
      )
    )
  );
};

export default {
  name: 'NPM Runner',
  version: '1.0.0',
  icon: '📦',
  panel: NpmPanelComponent,
  onLoad: () => {
    console.log('NPM Runner loaded.');
  }
};
