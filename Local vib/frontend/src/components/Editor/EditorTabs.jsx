import React from 'react';
import { useStore } from '../../store/useStore.js';
import { X, Save } from 'lucide-react';

export default function EditorTabs() {
  const store = useStore();

  const handleTabClick = (path) => {
    store.setActiveFile(path);
  };

  const handleClose = (e, path) => {
    e.stopPropagation();
    store.closeFile(path);
  };

  return (
    <div className="flex-1 flex items-center overflow-x-auto h-9 select-none">
      {store.openFiles.map((file) => {
        const isActive = store.activeFile === file.path;
        return (
          <div
            key={file.path}
            onClick={() => store.openFile(file.path)}
            className={`flex items-center gap-2 px-3 h-full border-r border-border-custom cursor-pointer transition ${
              isActive 
                ? 'bg-bg-primary text-text-primary border-t-2 border-t-accent-custom' 
                : 'bg-bg-secondary text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
            }`}
          >
            <span className="text-[11px] font-mono truncate max-w-[120px]">{file.name}</span>
            
            {/* Unsaved indicator dot */}
            {file.isDirty ? (
              <span className="w-2 h-2 rounded-full bg-warning-custom flex-shrink-0" title="Unsaved changes" />
            ) : (
              <button
                onClick={(e) => handleClose(e, file.path)}
                className="p-0.5 rounded-full hover:bg-bg-tertiary text-text-secondary hover:text-text-primary"
              >
                <X size={10} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
