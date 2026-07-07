import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore.js';
import { File, Search } from 'lucide-react';

export default function QuickOpen() {
  const store = useStore();
  const [query, setQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef(null);

  // Flatten the file tree to build a flat list of paths
  const getFlatFileList = () => {
    const list = [];
    function traverse(node) {
      if (!node) return;
      if (!node.isDirectory) {
        list.push(node.path);
      }
      if (node.children) {
        node.children.forEach(traverse);
      }
    }
    traverse(store.fileTree);
    return list;
  };

  const files = getFlatFileList();

  useEffect(() => {
    if (store.isQuickOpenOpen) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [store.isQuickOpenOpen]);

  useEffect(() => {
    if (!query) {
      setFilteredFiles(files.slice(0, 10)); // default list of first 10
    } else {
      const q = query.toLowerCase();
      const filtered = files.filter(f => f.toLowerCase().includes(q));
      setFilteredFiles(filtered.slice(0, 10));
    }
    setSelectedIdx(0);
  }, [query, store.fileTree]);

  if (!store.isQuickOpenOpen) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      store.setQuickOpenOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, filteredFiles.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredFiles[selectedIdx]) {
        handleSelect(filteredFiles[selectedIdx]);
      }
    }
  };

  const handleSelect = (filePath) => {
    store.openFile(filePath);
    store.setQuickOpenOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#00000080] flex items-start justify-center pt-20 backdrop-blur-sm">
      <div 
        className="bg-bg-secondary border border-border-custom rounded-lg flex flex-col w-[500px] max-h-[350px] shadow-2xl overflow-hidden text-xs"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input bar */}
        <div className="flex items-center px-3 py-2 border-b border-border-custom bg-bg-tertiary">
          <Search size={14} className="text-text-secondary mr-2" />
          <input 
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files by name..."
            className="flex-1 bg-transparent text-xs text-text-primary outline-none"
          />
          <span className="text-[10px] text-text-secondary font-mono">ESC to close</span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
          {filteredFiles.map((file, idx) => (
            <div
              key={file}
              onClick={() => handleSelect(file)}
              onMouseEnter={() => setSelectedIdx(idx)}
              className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
                selectedIdx === idx 
                  ? 'bg-accent-custom text-white' 
                  : 'text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <File size={13} className={selectedIdx === idx ? 'text-white' : 'text-text-secondary'} />
              <div className="flex-1 truncate flex items-center justify-between font-mono text-[11px]">
                <span className="truncate">{file.split('/').pop()}</span>
                <span className={`text-[9px] truncate ml-2 ${selectedIdx === idx ? 'text-white/70' : 'text-text-secondary'}`}>
                  {file}
                </span>
              </div>
            </div>
          ))}

          {filteredFiles.length === 0 && (
            <div className="text-center text-text-secondary py-8 select-none">No matching files found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
