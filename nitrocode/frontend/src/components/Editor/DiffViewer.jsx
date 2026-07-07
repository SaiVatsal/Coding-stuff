import React, { useState, useEffect } from 'react';
import { DiffEditor } from '@monaco-editor/react';
import { useStore } from '../../store/useStore.js';
import { X, Check, Trash } from 'lucide-react';

export default function DiffViewer() {
  const store = useStore();
  const [selectedFileIdx, setSelectedFileIdx] = useState(0);
  const [fileOriginalContents, setFileOriginalContents] = useState({});

  const edits = store.diffEdits || []; // Array of { file, newContent }

  // Load original contents for each file in the edit list
  useEffect(() => {
    async function loadOriginals() {
      const originals = {};
      for (const edit of edits) {
        try {
          const res = await fetch(`/api/files/content?path=${encodeURIComponent(edit.file)}&workspace=${encodeURIComponent(store.workspaceRoot)}`);
          const data = await res.json();
          originals[edit.file] = data.content || '';
        } catch (e) {
          originals[edit.file] = ''; // New file
        }
      }
      setFileOriginalContents(originals);
    }
    if (edits.length > 0) {
      loadOriginals();
      setSelectedFileIdx(0);
    }
  }, [edits]);

  if (!store.isDiffOpen || edits.length === 0) return null;

  const currentEdit = edits[selectedFileIdx];
  const originalVal = currentEdit ? (fileOriginalContents[currentEdit.file] || '') : '';
  const modifiedVal = currentEdit ? (currentEdit.newContent || '') : '';
  
  const getLanguage = (file) => {
    if (!file) return 'javascript';
    const ext = file.split('.').pop().toLowerCase();
    if (ext === 'jsx' || ext === 'js') return 'javascript';
    if (ext === 'tsx' || ext === 'ts') return 'typescript';
    if (ext === 'py') return 'python';
    if (ext === 'md') return 'markdown';
    return 'plaintext';
  };

  const handleAcceptFile = async (idx) => {
    const edit = edits[idx];
    
    // 1. Save modified content to backend
    try {
      await fetch('/api/files/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: edit.file,
          content: edit.newContent,
          workspace: store.workspaceRoot
        })
      });

      // 2. Open file and update local editor state
      await store.openFile(edit.file);
      store.updateFileContent(edit.file, edit.newContent);
    } catch (e) {
      console.error(e);
    }

    // Remove from edit list
    const remaining = edits.filter((_, i) => i !== idx);
    store.updateFileContent; // refresh
    if (remaining.length === 0) {
      store.closeDiffViewer();
      store.fetchFileTree();
    } else {
      store.openDiffViewer(remaining);
      setSelectedFileIdx(0);
    }
  };

  const handleRejectFile = (idx) => {
    const remaining = edits.filter((_, i) => i !== idx);
    if (remaining.length === 0) {
      store.closeDiffViewer();
    } else {
      store.openDiffViewer(remaining);
      setSelectedFileIdx(0);
    }
  };

  const handleAcceptAll = async () => {
    for (const edit of edits) {
      try {
        await fetch('/api/files/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: edit.file,
            content: edit.newContent,
            workspace: store.workspaceRoot
          })
        });
        await store.openFile(edit.file);
        store.updateFileContent(edit.file, edit.newContent);
      } catch (e) {
        console.error(e);
      }
    }
    store.closeDiffViewer();
    store.fetchFileTree();
  };

  const handleRejectAll = () => {
    store.closeDiffViewer();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#00000080] flex items-center justify-center p-6 backdrop-blur-sm">
      <div className="bg-bg-secondary border border-border-custom rounded-lg flex flex-col w-[90vw] h-[85vh] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-custom bg-bg-tertiary">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-text-primary">Review Proposed Changes ({edits.length} files)</span>
            <div className="flex gap-2">
              <button 
                onClick={handleAcceptAll}
                className="px-2.5 py-1 bg-success-custom hover:bg-opacity-80 text-white rounded text-[11px] font-medium transition cursor-pointer"
              >
                Accept All
              </button>
              <button 
                onClick={handleRejectAll}
                className="px-2.5 py-1 bg-error-custom hover:bg-opacity-80 text-white rounded text-[11px] font-medium transition cursor-pointer"
              >
                Reject All
              </button>
            </div>
          </div>
          <button onClick={() => store.closeDiffViewer()} className="text-text-secondary hover:text-text-primary">
            <X size={18} />
          </button>
        </div>

        {/* Core Layout split */}
        <div className="flex-1 flex overflow-hidden">
          {/* File sidebar list */}
          <div className="w-64 border-r border-border-custom flex flex-col bg-bg-secondary">
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {edits.map((edit, idx) => (
                <div 
                  key={edit.file}
                  onClick={() => setSelectedFileIdx(idx)}
                  className={`p-2 rounded cursor-pointer flex items-center justify-between border ${
                    selectedFileIdx === idx 
                      ? 'bg-bg-tertiary border-accent-custom text-text-primary' 
                      : 'border-transparent text-text-secondary hover:bg-bg-tertiary/50 hover:text-text-primary'
                  }`}
                >
                  <span className="font-mono text-[11px] truncate flex-1 pr-1">{edit.file}</span>
                  <div className="flex gap-1.5 opacity-80 hover:opacity-100">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleAcceptFile(idx); }}
                      className="p-1 bg-success-custom/20 hover:bg-success-custom text-success-custom hover:text-white rounded"
                      title="Accept changes for this file"
                    >
                      <Check size={11} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRejectFile(idx); }}
                      className="p-1 bg-error-custom/20 hover:bg-error-custom text-error-custom hover:text-white rounded"
                      title="Reject changes for this file"
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monaco Diff screen */}
          <div className="flex-1 h-full bg-bg-primary">
            {currentEdit ? (
              <DiffEditor
                height="100%"
                original={originalVal}
                modified={modifiedVal}
                language={getLanguage(currentEdit.file)}
                theme="nitro-dark"
                options={{
                  readOnly: true,
                  originalEditable: false,
                  renderSideBySide: true,
                  automaticLayout: true
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary">Select a file to review.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
