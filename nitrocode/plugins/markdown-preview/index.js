import React from 'react';

const MdPanelComponent = () => {
  const [content, setContent] = React.useState('');
  const [activeFile, setActiveFile] = React.useState('');

  const syncContent = () => {
    const store = window.NitroCodeAPI.store.getState();
    const active = store.activeFile;
    setActiveFile(active);
    
    if (active && active.endsWith('.md')) {
      const fileData = store.openFiles.find(f => f.path === active);
      setContent(fileData ? fileData.content : '');
    } else {
      setContent('');
    }
  };

  React.useEffect(() => {
    syncContent();
    // Subscribe to Zustand store modifications
    const unsubscribe = window.NitroCodeAPI.store.subscribe(syncContent);
    return () => unsubscribe();
  }, []);

  if (!activeFile || !activeFile.endsWith('.md')) {
    return React.createElement(
      'div',
      { className: 'text-center text-[#8B8B9A] py-8 text-xs select-none' },
      'Open a Markdown (.md) file to show preview.'
    );
  }

  return React.createElement(
    'div',
    { className: 'text-xs text-[#F0F0F0] leading-relaxed space-y-3' },
    React.createElement('h3', { className: 'font-semibold text-[#8B8B9A] uppercase tracking-wider text-[10px] border-b border-[#1F1F28] pb-1' }, 'Markdown Live View'),
    React.createElement(
      'div',
      { className: 'prose prose-invert' },
      React.createElement(window.ReactMarkdown, null, content)
    )
  );
};

export default {
  name: 'Markdown Preview',
  version: '1.0.0',
  icon: '📝',
  panel: MdPanelComponent,
  onLoad: () => {
    console.log('Markdown Preview loaded.');
  }
};
