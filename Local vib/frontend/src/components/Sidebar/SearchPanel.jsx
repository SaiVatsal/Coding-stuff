import React, { useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { Search, FileText } from 'lucide-react';

export default function SearchPanel() {
  const store = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`/api/files/search?q=${encodeURIComponent(query)}&workspace=${encodeURIComponent(store.workspaceRoot)}`);
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const handleResultClick = async (filePath, lineNumber) => {
    await store.openFile(filePath);
    
    // Attempt to focus the Monaco cursor on the line
    setTimeout(() => {
      const editor = window.NitroCodeActiveEditor;
      if (editor) {
        editor.revealLine(lineNumber);
        editor.setPosition({ lineNumber, column: 1 });
        editor.focus();
      }
    }, 100);
  };

  // Group results by file
  const groupedResults = results.reduce((acc, curr) => {
    acc[curr.file] = acc[curr.file] || [];
    acc[curr.file].push(curr);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full bg-bg-secondary border-r border-border-custom w-60 overflow-hidden text-xs">
      <div className="p-3 border-b border-border-custom bg-bg-secondary">
        <h2 className="text-xs uppercase font-semibold tracking-wider text-text-secondary mb-2">Search in Files</h2>
        <form onSubmit={handleSearch} className="flex items-center bg-bg-tertiary border border-border-custom rounded px-2 py-1.5 focus-within:border-accent-custom">
          <input 
            id="global-search-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search query..."
            className="flex-1 bg-transparent text-xs text-text-primary outline-none"
          />
          <button type="submit" disabled={searching} className="text-text-secondary hover:text-text-primary">
            <Search size={14} className={searching ? 'animate-pulse' : ''} />
          </button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {searching && <div className="text-center text-text-secondary py-8">Searching files...</div>}

        {Object.entries(groupedResults).map(([file, matches]) => (
          <div key={file} className="space-y-1">
            <div className="flex items-center gap-1.5 px-1 py-0.5 text-text-primary font-semibold truncate">
              <FileText size={12} className="text-accent-custom" />
              <span className="truncate" title={file}>{file.split('/').pop()}</span>
              <span className="text-[10px] text-text-secondary font-normal font-mono">({matches.length})</span>
            </div>
            
            <div className="border-l border-border-custom ml-2.5 pl-1.5 space-y-1">
              {matches.map((match, idx) => (
                <div 
                  key={idx}
                  onClick={() => handleResultClick(match.file, match.line)}
                  className="p-1 rounded hover:bg-bg-tertiary cursor-pointer transition flex flex-col font-mono text-[11px] leading-normal"
                >
                  <span className="text-text-secondary text-[10px]">Line {match.line}</span>
                  <span className="text-text-primary truncate">{match.content}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {results.length === 0 && !searching && query && (
          <div className="text-center text-text-secondary py-8">No matching results found.</div>
        )}
      </div>
    </div>
  );
}
