import React from 'react';

const TodoPanelComponent = () => {
  const [todos, setTodos] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const scanTodos = async () => {
    setLoading(true);
    try {
      // Reuse file search route for TODO and FIXME
      const resTodo = await fetch(`/api/files/search?q=TODO`);
      const dataTodo = await resTodo.json();
      const resFixme = await fetch(`/api/files/search?q=FIXME`);
      const dataFixme = await resFixme.json();

      const merged = [
        ...(dataTodo.results || []),
        ...(dataFixme.results || [])
      ];
      setTodos(merged);
    } catch (e) {
      console.error('Failed to scan TODO comments:', e);
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    scanTodos();
    // Re-scan when files are saved
    const handleSave = () => scanTodos();
    window.addEventListener('ws:file-changed', handleSave);
    return () => window.removeEventListener('ws:file-changed', handleSave);
  }, []);

  const handleJump = async (file, line) => {
    const store = window.NitroCodeAPI.store.getState();
    await store.openFile(file);

    setTimeout(() => {
      const editor = window.NitroCodeActiveEditor;
      if (editor) {
        editor.revealLine(line);
        editor.setPosition({ lineNumber: line, column: 1 });
        editor.focus();
      }
    }, 100);
  };

  return React.createElement(
    'div',
    { className: 'space-y-3 text-xs' },
    React.createElement('div', { className: 'flex justify-between items-center' },
      React.createElement('h3', { className: 'font-semibold text-text-secondary uppercase tracking-wider text-[10px]' }, 'TODOs & FIXMEs'),
      React.createElement('button', { onClick: scanTodos, className: 'text-[9px] text-[#5E6AD2] hover:underline cursor-pointer' }, 'Scan')
    ),
    loading ? React.createElement('p', { className: 'text-text-secondary italic' }, 'Scanning files...') : null,
    !loading && todos.length === 0 ? React.createElement('p', { className: 'text-text-secondary italic' }, 'No comments found.') : null,
    React.createElement(
      'div',
      { className: 'space-y-1.5' },
      todos.map((todo, idx) => 
        React.createElement(
          'div',
          { 
            key: idx, 
            onClick: () => handleJump(todo.file, todo.line),
            className: 'p-2 bg-[#1A1A1F]/40 border border-[#1F1F28] rounded hover:bg-[#1A1A1F] cursor-pointer transition'
          },
          React.createElement('div', { className: 'flex items-center justify-between text-[#8B8B9A] text-[9px] font-mono mb-1' },
            React.createElement('span', { className: 'truncate pr-1 font-semibold text-white' }, todo.file.split('/').pop()),
            React.createElement('span', null, `Line ${todo.line}`)
          ),
          React.createElement('p', { className: 'font-mono text-[10px] text-white truncate' }, todo.content)
        )
      )
    )
  );
};

export default {
  name: 'TODO Tracker',
  version: '1.0.0',
  icon: '📋',
  panel: TodoPanelComponent,
  onLoad: () => {
    console.log('TODO Tracker loaded.');
  }
};
