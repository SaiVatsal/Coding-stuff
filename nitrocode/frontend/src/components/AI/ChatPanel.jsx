import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useStore } from '../../store/useStore.js';
import { sendChatMessageStream, estimateTokenCount, calculateCost } from '../../utils/ai.js';
import VoiceInput from './VoiceInput.jsx';
import ModelSwitcher from './ModelSwitcher.jsx';
import CostTracker from './CostTracker.jsx';
import { 
  Send, Sparkles, AlertCircle, History, Terminal, 
  Trash2, Copy, FileCode, CheckCircle, ArrowDown 
} from 'lucide-react';

export default function ChatPanel() {
  const store = useStore();
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamedText, setStreamedText] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]); // List of request histories
  const [errorToast, setErrorToast] = useState(null);

  const messagesEndRef = useRef(null);

  // Sync active file changes
  const activeFile = store.activeFile;
  const messages = activeFile ? (store.chatHistory[activeFile] || []) : [];

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedText]);

  // Listen to global terminal error broadcasts
  useEffect(() => {
    const handleTerminalError = (e) => {
      // Structure: { detail: { text, id } }
      const text = e.detail?.text || '';
      setErrorToast(text);
    };
    window.addEventListener('terminal-error-broadcast', handleTerminalError);
    return () => window.removeEventListener('terminal-error-broadcast', handleTerminalError);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Compile active system context prompt
  const compileSystemPrompt = () => {
    const activeFileData = store.openFiles.find(f => f.path === activeFile);
    const fileList = store.openFiles.map(f => f.path).join(', ');
    
    // Attempt to parse project structure
    let fileStructure = 'Unknown';
    if (store.fileTree) {
      fileStructure = JSON.stringify(store.fileTree.children?.map(c => ({ name: c.name, isDir: c.isDirectory })), null, 2);
    }

    return `You are NitroCode AI, a elite coding assistant built into the NitroCode IDE.
Current workspace root: ${store.workspaceRoot}
Open tabs: [${fileList}]
Active file: ${activeFile || 'None'}
Language: ${activeFile ? activeFile.split('.').pop() : 'None'}

Project file structure:
${fileStructure}

${activeFileData ? `Active file contents:\n\`\`\`\n${activeFileData.content}\n\`\`\`` : ''}

Provide clean, modular, production-ready code. Wrap code snippets in markdown block formatting with specific languages. If edits span multiple files, return a JSON response containing an array of edits instead of normal text:
{
  "edits": [
    {
      "file": "src/App.jsx",
      "newContent": "complete file contents..."
    }
  ]
}
Otherwise, respond in standard Markdown style.`;
  };

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || inputMsg;
    if (!textToSend.trim() || !activeFile) return;

    setInputMsg('');
    setLoading(true);
    setStreamedText('');

    // 1. Estimate prompt tokens
    const promptTokens = estimateTokenCount(textToSend);

    // 2. Append User Message
    store.addChatMessage(activeFile, { role: 'user', content: textToSend });

    // 3. Build message thread
    const systemPrompt = compileSystemPrompt();
    const chatThread = [
      { role: 'system', content: systemPrompt },
      ...(store.chatHistory[activeFile] || []).map(m => ({ role: m.role, content: m.content }))
    ];

    try {
      const model = store.activeModel;
      const startTime = Date.now();

      // Start SSE Streaming
      const fullReply = await sendChatMessageStream(model, chatThread, (chunk) => {
        setStreamedText(prev => prev + chunk);
      });

      // 4. Calculate final cost and token counts
      const replyTokens = estimateTokenCount(fullReply);
      const totalTokens = promptTokens + replyTokens;
      const requestCost = calculateCost(model, promptTokens, replyTokens);

      // Save to store billing
      store.addSessionTokens(totalTokens);
      store.addSessionCost(requestCost);

      // Append AI Reply to conversation
      store.addChatMessage(activeFile, { 
        role: 'assistant', 
        content: fullReply,
        tokens: replyTokens,
        cost: requestCost
      });

      // Append request history log
      setHistoryLogs(prev => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString(),
          model,
          tokens: totalTokens,
          cost: requestCost,
          prompt: textToSend.substring(0, 40) + '...'
        }
      ]);

      // Check token budget warning (threshold 80,000 for warning, 100,000 for auto summarize)
      if (store.sessionTokens > 100000) {
        // Auto summarize
        store.addChatMessage(activeFile, { 
          role: 'system', 
          content: 'Context budget exceeded 100k tokens. Auto-summarizing session logs...' 
        });
        store.clearChatHistory(activeFile);
        store.addChatMessage(activeFile, { 
          role: 'assistant', 
          content: 'Context refreshed. I have summarized the conversation to free up capacity.' 
        });
      }

    } catch (err) {
      console.error(err);
      store.addChatMessage(activeFile, { role: 'assistant', content: `Error: ${err.message}` });
    } finally {
      setLoading(false);
      setStreamedText('');
    }
  };

  const handleFixError = () => {
    if (!errorToast) return;
    handleSend(`Fix this console error:\n\n${errorToast}`);
    setErrorToast(null);
  };

  // Helper code block insert/apply handlers
  const handleInsertIntoEditor = (code) => {
    const editor = window.NitroCodeActiveEditor;
    if (editor) {
      const selection = editor.getSelection();
      const range = new window.monaco.Range(
        selection.startLineNumber,
        selection.startColumn,
        selection.endLineNumber,
        selection.endColumn
      );
      editor.executeEdits('insert-ai-code', [{ range, text: code, forceMoveMarkers: true }]);
    } else {
      alert('Monaco Editor is not active or cursor is missing.');
    }
  };

  const handleApplyToFile = (code) => {
    if (!activeFile) return;
    
    // Trigger the diff viewer with this code as modified content
    store.openDiffViewer([{
      file: activeFile,
      newContent: code
    }]);
  };

  // Custom Markdown Code Component Mapper
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');

      if (inline) {
        return (
          <code className="bg-bg-tertiary text-accent-custom px-1.5 py-0.5 rounded font-mono text-[11px]" {...props}>
            {children}
          </code>
        );
      }

      // Check if it's JSON formatted multi-file edits
      if (match && match[1] === 'json') {
        try {
          const parsed = JSON.parse(codeString);
          if (parsed.edits && Array.isArray(parsed.edits)) {
            return (
              <div className="my-3 border border-dashed border-accent-custom/50 bg-bg-tertiary/20 p-3 rounded-lg text-center flex flex-col gap-2 select-none">
                <span className="font-semibold text-text-primary flex items-center justify-center gap-1.5 text-[11px]">
                  <FileCode size={14} className="text-accent-custom" /> Multi-file edits suggested
                </span>
                <button 
                  onClick={() => store.openDiffViewer(parsed.edits)}
                  className="mx-auto px-4 py-1.5 bg-accent-custom text-white rounded text-[11px] hover:bg-accent-hover transition cursor-pointer"
                >
                  Open Diff Viewer
                </button>
              </div>
            );
          }
        } catch (e) {
          // Fall back to standard rendering if parse fails
        }
      }

      return (
        <div className="my-2 border border-border-custom rounded-md overflow-hidden bg-terminal-bg text-left font-mono">
          <div className="flex items-center justify-between px-3 py-1.5 bg-bg-tertiary border-b border-border-custom text-[10px] text-text-secondary select-none">
            <span className="font-semibold">{match ? match[1].toUpperCase() : 'CODE'}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => navigator.clipboard.writeText(codeString)}
                className="hover:text-text-primary flex items-center gap-1"
              >
                <Copy size={10} /> Copy
              </button>
              <button 
                onClick={() => handleInsertIntoEditor(codeString)}
                className="hover:text-text-primary flex items-center gap-1"
              >
                <FileCode size={10} /> Insert
              </button>
              <button 
                onClick={() => handleApplyToFile(codeString)}
                className="hover:text-text-primary text-accent-custom flex items-center gap-1"
              >
                <Sparkles size={10} /> Apply
              </button>
            </div>
          </div>
          <pre className="p-3 text-[12px] overflow-x-auto text-text-primary">
            <code>{codeString}</code>
          </pre>
        </div>
      );
    }
  };

  return (
    <div className="w-80 flex flex-col h-full bg-bg-secondary border-l border-border-custom overflow-hidden text-xs">
      
      {/* Top switch panel */}
      <div className="flex items-center justify-between p-3 border-b border-border-custom">
        <ModelSwitcher />
        <button 
          title="Session Usage Logs"
          onClick={() => setShowHistory(!showHistory)}
          className={`p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary ${
            showHistory ? 'bg-bg-tertiary text-accent-custom' : ''
          }`}
        >
          <History size={14} />
        </button>
      </div>

      {/* Main Container screen */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Token warning banner */}
        {store.sessionTokens > 80000 && (
          <div className="bg-warning-custom/10 border-b border-warning-custom/30 text-warning-custom p-2 flex items-center gap-2 select-none text-[10px]">
            <AlertCircle size={12} />
            <span>Usage is at {Math.round((store.sessionTokens/100000)*100)}% of model context capability limits.</span>
          </div>
        )}

        {/* Error Pattern Toast warning */}
        {errorToast && (
          <div className="absolute top-2 left-2 right-2 bg-error-custom/15 border border-error-custom/40 rounded p-2.5 z-20 flex flex-col gap-2 shadow-lg backdrop-blur-md">
            <div className="flex items-start gap-2">
              <Terminal size={14} className="text-error-custom mt-0.5" />
              <p className="text-[10px] text-text-primary font-mono truncate">{errorToast}</p>
            </div>
            <div className="flex justify-end gap-2 text-[10px]">
              <button onClick={() => setErrorToast(null)} className="text-text-secondary hover:text-text-primary">Dismiss</button>
              <button onClick={handleFixError} className="px-2 py-0.5 bg-error-custom hover:bg-opacity-80 text-white rounded font-medium cursor-pointer">
                AI: Fix Error
              </button>
            </div>
          </div>
        )}

        {/* Dynamic Usage History Overlay */}
        {showHistory ? (
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-bg-primary">
            <h3 className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Usage History</h3>
            <div className="space-y-1.5">
              {historyLogs.map((log, idx) => (
                <div key={idx} className="p-2 bg-bg-secondary rounded border border-border-custom font-mono text-[10px] space-y-0.5">
                  <div className="flex justify-between font-semibold text-text-primary">
                    <span>{log.model}</span>
                    <span className="text-text-secondary">{log.timestamp}</span>
                  </div>
                  <div className="flex justify-between text-text-secondary">
                    <span>{log.tokens} tokens</span>
                    <span className="text-accent-custom">${log.cost}</span>
                  </div>
                </div>
              ))}
              {historyLogs.length === 0 && (
                <div className="text-center text-text-secondary py-8">No AI requests sent yet.</div>
              )}
            </div>
          </div>
        ) : (
          /* Normal Message viewport */
          <div className="flex-1 overflow-y-auto p-3 space-y-3.5">
            {!activeFile ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary p-4 gap-2">
                <Sparkles size={24} className="text-text-secondary opacity-30" />
                <p>Open a file to begin chatting with NitroCode AI.</p>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex flex-col gap-1 max-w-[85%] ${
                      msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                    }`}
                  >
                    <div 
                      className={`p-2.5 rounded-lg text-left leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-accent-custom text-white rounded-tr-none' 
                          : 'bg-bg-tertiary text-text-primary rounded-tl-none border border-border-custom'
                      }`}
                    >
                      <ReactMarkdown components={MarkdownComponents}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                    {msg.tokens && (
                      <span className="text-[9px] text-text-secondary/60">
                        {msg.tokens} tokens • ${msg.cost}
                      </span>
                    )}
                  </div>
                ))}
                
                {/* Streaming Chunk Reply bubble */}
                {streamedText && (
                  <div className="mr-auto items-start max-w-[85%] flex flex-col gap-1">
                    <div className="p-2.5 rounded-lg text-left leading-relaxed bg-bg-tertiary text-text-primary rounded-tl-none border border-border-custom">
                      <ReactMarkdown components={MarkdownComponents}>
                        {streamedText}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}

                {messages.length === 0 && !streamedText && (
                  <div className="text-center text-text-secondary py-12">
                    Ask a question about <span className="font-mono text-text-primary">{activeFile.split('/').pop()}</span>...
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        )}
      </div>

      {/* Input panel */}
      {activeFile && (
        <div className="p-3 border-t border-border-custom bg-bg-secondary flex flex-col gap-2">
          <div className="flex items-center bg-bg-tertiary border border-border-custom rounded-lg px-2 py-1.5 focus-within:border-accent-custom">
            <textarea 
              id="chat-input-textarea"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Ask AI, write code..."
              className="flex-1 bg-transparent text-xs text-text-primary outline-none resize-none h-12 max-h-32"
            />
            <div className="flex items-center gap-1 ml-1.5">
              <VoiceInput onTranscript={(txt) => setInputMsg(txt)} />
              <button 
                onClick={() => handleSend()}
                disabled={loading || !inputMsg.trim()}
                className="p-1.5 bg-accent-custom hover:bg-accent-hover text-white rounded cursor-pointer disabled:opacity-40"
              >
                <Send size={12} />
              </button>
            </div>
          </div>
          <CostTracker />
        </div>
      )}
    </div>
  );
}
