import React, { useRef, useEffect, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { useStore } from '../../store/useStore.js';
import EditorTabs from './EditorTabs.jsx';
import { ChevronRight, Columns, RefreshCw } from 'lucide-react';

function getLanguageFromExtension(filePath) {
  if (!filePath) return 'javascript';
  const ext = filePath.split('.').pop().toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'css':
      return 'css';
    case 'html':
      return 'html';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'sh':
      return 'shell';
    case 'env':
      return 'ini';
    default:
      return 'plaintext';
  }
}

export default function EditorPane() {
  const store = useStore();
  const [isSplit, setIsSplit] = useState(false);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const [splitActiveFile, setSplitActiveFile] = useState(null);
  const [envRevealed, setEnvRevealed] = useState({});

  const mainEditorRef = useRef(null);
  const hoverCache = useRef(new Map());

  // Listen to Alt key states for hover explanations
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Alt') setIsAltPressed(true);
    };
    const handleKeyUp = (e) => {
      if (e.key === 'Alt') setIsAltPressed(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleEditorDidMount = (editor, monaco) => {
    mainEditorRef.current = editor;

    // 1. Define theme
    monaco.editor.defineTheme('nitro-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', background: '0A0A0B' },
        { token: 'comment', foreground: '8B8B9A', fontStyle: 'italic' },
        { token: 'keyword', foreground: '5E6AD2', fontStyle: 'bold' },
        { token: 'string', foreground: '2DA44E' },
        { token: 'number', foreground: 'F0A732' },
        { token: 'regexp', foreground: 'F85149' }
      ],
      colors: {
        'editor.background': '#0A0A0B',
        'editor.foreground': '#F0F0F0',
        'editor.lineHighlightBackground': '#111113',
        'editorCursor.foreground': '#5E6AD2',
        'editorLineNumber.foreground': '#8B8B9A/40',
        'editorLineNumber.activeForeground': '#5E6AD2',
        'editor.selectionBackground': '#1F1F28',
        'editor.inactiveSelectionBackground': '#1A1A1F'
      }
    });
    monaco.editor.setTheme('nitro-dark');

    // 2. Register Inline Ghost Autocomplete Provider (Debounced)
    let completionTimeout;
    monaco.languages.registerInlineCompletionsProvider({
      provideInlineCompletions: async (model, position, context, token) => {
        return new Promise((resolve) => {
          clearTimeout(completionTimeout);
          
          completionTimeout = setTimeout(async () => {
            if (token.isCancellationRequested) {
              return resolve({ items: [] });
            }

            const value = model.getValue();
            const offset = model.getOffsetAt(position);
            const prefix = value.substring(0, offset);
            const suffix = value.substring(offset);
            const filename = store.activeFile || 'untitled.js';

            try {
              const res = await fetch('/api/ai/complete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  model: store.activeModel,
                  prefix,
                  suffix,
                  filename
                })
              });
              const data = await res.json();
              if (data.suggestion && data.suggestion.trim()) {
                return resolve({
                  items: [{
                    insertText: data.suggestion,
                    range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
                  }]
                });
              }
            } catch (e) {
              console.error('Autocomplete error:', e);
            }
            resolve({ items: [] });
          }, 500); // 500ms typing debounce
        });
      },
      freeInlineCompletions: () => {}
    });

    // 3. Register Alt+Hover Code Explanation Provider
    const languagesList = ['javascript', 'typescript', 'python', 'go', 'rust', 'html', 'css', 'json', 'plaintext'];
    languagesList.forEach((lang) => {
      monaco.languages.registerHoverProvider(lang, {
        provideHover: async (model, position) => {
          if (!isAltPressed) return null;

          const word = model.getWordAtPosition(position);
          if (!word) return null;

          const cacheKey = `${lang}:${word.word}`;
          if (hoverCache.current.has(cacheKey)) {
            return {
              contents: [{ value: `**AI Explanation (Alt+Hover):**\n\n${hoverCache.current.get(cacheKey)}` }]
            };
          }

          // Trigger brief explanation fetch
          try {
            const contextLine = model.getLineContent(position.lineNumber);
            const prompt = `Provide a single-sentence definition/explanation of the variable/function name '${word.word}' in the context of this code line: \`${contextLine.trim()}\`.`;
            
            const res = await fetch('/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: store.activeModel,
                messages: [{ role: 'user', content: prompt }],
                stream: false
              })
            });
            const data = await res.json();
            const explanation = data.text || 'No explanation available.';
            hoverCache.current.set(cacheKey, explanation);
            
            return {
              contents: [{ value: `**AI Explanation (Alt+Hover):**\n\n${explanation}` }]
            };
          } catch (e) {
            return null;
          }
        }
      });
    });

    // 4. Register Right-click Editor AI Action Triggers
    const triggerAiAction = (actionName) => {
      const selection = editor.getSelection();
      const selectedText = editor.getModel().getValueInRange(selection) || editor.getModel().getValue();
      const codeScope = selection.isEmpty() ? 'the entire file' : 'the highlighted selection';
      
      const fileContext = `File: ${store.activeFile}\nCode Scope: ${codeScope}\n\n\`\`\`\n${selectedText}\n\`\`\``;
      
      let systemPrompt = '';
      if (actionName === 'explain') {
        systemPrompt = `Explain this code in detail, highlighting logic, pitfalls, and time/space complexity:\n\n${fileContext}`;
      } else if (actionName === 'fix') {
        systemPrompt = `Identify any syntax errors, logical bugs, edge cases, or resource leaks in this code and provide a corrected version:\n\n${fileContext}`;
      } else if (actionName === 'refactor') {
        systemPrompt = `Refactor this code to follow clean code standards, improve readability, and implement best design patterns:\n\n${fileContext}`;
      } else if (actionName === 'tests') {
        systemPrompt = `Generate a robust suite of unit tests for this code, checking typical cases and boundary bounds:\n\n${fileContext}`;
      } else if (actionName === 'jsdoc') {
        systemPrompt = `Add JSDoc/docstring comments documenting params, returns, classes, and types for this code:\n\n${fileContext}`;
      } else if (actionName === 'optimize') {
        systemPrompt = `Analyze bottlenecks and optimize performance of this code, lowering allocations and CPU cycles:\n\n${fileContext}`;
      } else if (actionName === 'typescript') {
        systemPrompt = `Convert this code to TypeScript, adding explicit type definitions, interfaces, or generics:\n\n${fileContext}`;
      }

      // Populate prompt in store and focus chat pane
      store.addChatMessage(store.activeFile, { role: 'user', content: systemPrompt });
      store.setActiveSidebar('explorer'); // Switch or keep explorer sidebar focus
      const chatInput = document.getElementById('chat-input-textarea');
      if (chatInput) chatInput.focus();
    };

    const aiActions = [
      { id: 'explain', label: 'AI: Explain Code' },
      { id: 'fix', label: 'AI: Fix Bugs' },
      { id: 'refactor', label: 'AI: Refactor Code' },
      { id: 'tests', label: 'AI: Write Tests' },
      { id: 'jsdoc', label: 'AI: Add JSDoc Comments' },
      { id: 'optimize', label: 'AI: Optimize Speed' },
      { id: 'typescript', label: 'AI: Convert to TS' }
    ];

    aiActions.forEach((act) => {
      editor.addAction({
        id: `nitro-ai-${act.id}`,
        label: act.label,
        contextMenuGroupId: 'navigation',
        contextMenuOrder: 1.5,
        run: () => triggerAiAction(act.id)
      });
    });
  };

  const handleContentChange = (val) => {
    if (store.activeFile) {
      store.updateFileContent(store.activeFile, val);
    }
  };

  const activeFileData = store.openFiles.find((f) => f.path === store.activeFile);
  const isEnvFile = store.activeFile && store.activeFile.endsWith('.env');
  const isMasked = isEnvFile && !envRevealed[store.activeFile];

  // Breadcrumb segments helper
  const breadcrumbSegments = store.activeFile ? store.activeFile.split('/') : [];

  return (
    <div className="flex-1 flex flex-col h-full bg-bg-primary overflow-hidden">
      {/* Editor Tabs */}
      <div className="flex items-center justify-between bg-bg-secondary border-b border-border-custom px-2">
        <EditorTabs />
        
        {/* Toolbar Pane controls */}
        {store.activeFile && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSplit(!isSplit)}
              title="Split Editor Right"
              className={`p-1.5 rounded hover:bg-bg-tertiary transition text-text-secondary hover:text-text-primary ${
                isSplit ? 'text-accent-custom bg-bg-tertiary' : ''
              }`}
            >
              <Columns size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Editor Breadcrumbs */}
      {store.activeFile && (
        <div className="flex items-center gap-1 px-3 py-1.5 bg-bg-primary border-b border-border-custom text-[11px] text-text-secondary select-none">
          <span className="font-mono text-accent-custom">nitro</span>
          {breadcrumbSegments.map((seg, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight size={10} className="opacity-50" />
              <span className={idx === breadcrumbSegments.length - 1 ? 'text-text-primary font-medium' : ''}>{seg}</span>
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Core Editor view viewport */}
      <div className="flex-1 flex overflow-hidden">
        {store.activeFile ? (
          <div className="flex-1 flex h-full w-full relative">
            
            {/* Environment Mask Overlay */}
            {isMasked ? (
              <div className="absolute inset-0 bg-[#0A0A0B] z-10 flex flex-col items-center justify-center text-xs text-text-secondary gap-3 p-4">
                <p>This is a protected configuration file (.env). Its values are hidden to prevent accidental leaks.</p>
                <button 
                  onClick={() => setEnvRevealed(prev => ({ ...prev, [store.activeFile]: true }))}
                  className="px-3 py-1.5 bg-accent-custom text-white font-medium rounded hover:bg-accent-hover transition cursor-pointer"
                >
                  Reveal Content
                </button>
              </div>
            ) : null}

            {/* Left/Main Editor View */}
            <div className="flex-1 h-full w-full">
              <MonacoEditor
                height="100%"
                language={getLanguageFromExtension(store.activeFile)}
                theme="nitro-dark"
                value={activeFileData?.content || ''}
                onChange={handleContentChange}
                onMount={handleEditorDidMount}
                options={{
                  fontSize: store.settings.fontSize || 13,
                  tabSize: store.settings.tabSize || 2,
                  wordWrap: store.settings.wordWrap ? 'on' : 'off',
                  minimap: { enabled: !!store.settings.minimap },
                  fontFamily: 'JetBrains Mono',
                  automaticLayout: true,
                  lineNumbersMinChars: 3,
                  padding: { top: 12, bottom: 12 },
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true
                }}
              />
            </div>

            {/* Split Screen Panel View */}
            {isSplit && (
              <div className="w-[50%] h-full border-l border-border-custom bg-bg-primary flex flex-col">
                <div className="p-2 border-b border-border-custom flex items-center justify-between text-[11px] text-text-secondary bg-bg-secondary select-none">
                  <span className="font-mono">Split Pane Editor</span>
                  <select 
                    value={splitActiveFile || ''}
                    onChange={(e) => setSplitActiveFile(e.target.value)}
                    className="bg-bg-tertiary border border-border-custom text-text-primary px-1.5 py-0.5 rounded outline-none"
                  >
                    <option value="">Select File...</option>
                    {store.openFiles.map(f => (
                      <option key={f.path} value={f.path}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  {splitActiveFile ? (
                    <MonacoEditor
                      height="100%"
                      language={getLanguageFromExtension(splitActiveFile)}
                      theme="nitro-dark"
                      value={store.openFiles.find(f => f.path === splitActiveFile)?.content || ''}
                      onChange={(val) => store.updateFileContent(splitActiveFile, val)}
                      options={{
                        fontSize: store.settings.fontSize || 13,
                        minimap: { enabled: false },
                        fontFamily: 'JetBrains Mono',
                        automaticLayout: true,
                        lineNumbersMinChars: 3
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-text-secondary">Select a file to show side-by-side.</div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        ) : (
          /* Empty Workspace state */
          <div className="flex-1 flex flex-col items-center justify-center gap-2 select-none text-center bg-[#0A0A0B]">
            <span className="text-4xl">⚡</span>
            <h1 className="text-lg font-semibold text-text-primary">NitroCode IDE</h1>
            <p className="text-xs text-text-secondary max-w-[280px]">
              "Code faster. Think local. Scale to cloud."
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-4 text-[11px] text-text-secondary text-left border border-border-custom p-4 bg-bg-secondary rounded">
              <div><kbd className="bg-bg-tertiary px-1 border border-border-custom rounded mr-1">Ctrl+P</kbd> Open File</div>
              <div><kbd className="bg-bg-tertiary px-1 border border-border-custom rounded mr-1">Ctrl+S</kbd> Save File</div>
              <div><kbd className="bg-bg-tertiary px-1 border border-border-custom rounded mr-1">Ctrl+K</kbd> Focus AI Chat</div>
              <div><kbd className="bg-bg-tertiary px-1 border border-border-custom rounded mr-1">Ctrl+`</kbd> Open Terminal</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
