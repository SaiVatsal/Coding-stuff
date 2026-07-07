import React, { useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { 
  Folder, File, ChevronDown, ChevronRight, FilePlus, FolderPlus, 
  Trash2, Edit, MoreVertical, X 
} from 'lucide-react';

export default function FileExplorer() {
  const store = useStore();
  const [expandedFolders, setExpandedFolders] = useState({ '.': true });
  const [contextMenu, setContextMenu] = useState(null); // { x, y, path, isDirectory }
  const [newInput, setNewInput] = useState(null); // { type: 'file'|'folder', parentPath }
  const [inputValue, setInputValue] = useState('');
  const [renamePath, setRenamePath] = useState(null);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const handleFileClick = (path) => {
    store.openFile(path);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      path: item.path,
      isDirectory: item.isDirectory
    });
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    let targetPath = inputValue;
    if (newInput.parentPath !== '.') {
      targetPath = `${newInput.parentPath}/${inputValue}`;
    }

    await store.createFile(targetPath, newInput.type === 'folder');
    setNewInput(null);
    setInputValue('');
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const folderParts = renamePath.split('/');
    folderParts.pop();
    const newPath = folderParts.length > 0 ? `${folderParts.join('/')}/${inputValue}` : inputValue;

    await store.renameFile(renamePath, newPath);
    setRenamePath(null);
    setInputValue('');
  };

  const handleDelete = async (path) => {
    if (confirm(`Are you sure you want to delete ${path}?`)) {
      await store.deleteFile(path);
    }
    setContextMenu(null);
  };

  // Drag and drop handler
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const textContent = evt.target.result;
        await store.createFile(file.name, false);
        // Write content
        await fetch('/api/files/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: file.name,
            content: textContent,
            workspace: store.workspaceRoot
          })
        });
        await store.fetchFileTree();
      };
      reader.readAsText(file);
    }
  };

  const renderNode = (node) => {
    const isExpanded = expandedFolders[node.path];
    const isFolder = node.isDirectory;

    return (
      <div key={node.path} className="select-none pl-2 text-xs">
        <div 
          onClick={() => isFolder ? toggleFolder(node.path) : handleFileClick(node.path)}
          onContextMenu={(e) => handleContextMenu(e, node)}
          className={`flex items-center gap-1.5 py-1 px-1 rounded cursor-pointer hover:bg-bg-tertiary group transition ${
            store.activeFile === node.path ? 'bg-bg-tertiary text-accent-custom' : 'text-text-primary'
          }`}
        >
          {isFolder ? (
            <>
              {isExpanded ? <ChevronDown size={14} className="text-text-secondary" /> : <ChevronRight size={14} className="text-text-secondary" />}
              <Folder size={14} className="text-accent-custom fill-accent-custom/20" />
            </>
          ) : (
            <>
              <span className="w-3.5"></span>
              <File size={14} className="text-text-secondary" />
            </>
          )}
          <span className="truncate flex-1">{node.name}</span>
          
          <MoreVertical 
            size={12} 
            className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-text-primary"
            onClick={(e) => { e.stopPropagation(); handleContextMenu(e, node); }}
          />
        </div>

        {isFolder && isExpanded && node.children && (
          <div className="border-l border-border-custom ml-2.5 pl-1.5">
            {node.children.map(child => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="flex flex-col h-full bg-bg-secondary border-r border-border-custom w-60 overflow-hidden"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between p-3 border-b border-border-custom">
        <h2 className="text-xs uppercase font-semibold tracking-wider text-text-secondary">Workspace</h2>
        <div className="flex gap-1.5">
          <button 
            title="New File"
            onClick={() => { setNewInput({ type: 'file', parentPath: '.' }); setInputValue(''); }}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          >
            <FilePlus size={14} />
          </button>
          <button 
            title="New Folder"
            onClick={() => { setNewInput({ type: 'folder', parentPath: '.' }); setInputValue(''); }}
            className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {newInput && (
          <form onSubmit={handleCreateSubmit} className="flex items-center gap-1.5 p-1 mb-2 bg-bg-tertiary rounded border border-accent-custom/30">
            {newInput.type === 'folder' ? <Folder size={14} className="text-accent-custom" /> : <File size={14} className="text-text-secondary" />}
            <input 
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Name ${newInput.type}...`}
              className="bg-transparent text-xs text-text-primary outline-none flex-1 w-full"
            />
            <button type="button" onClick={() => setNewInput(null)} className="text-error-custom"><X size={12} /></button>
          </form>
        )}

        {renamePath && (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-1.5 p-1 mb-2 bg-bg-tertiary rounded border border-accent-custom/30">
            <Edit size={14} className="text-accent-custom" />
            <input 
              autoFocus
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Rename to..."
              className="bg-transparent text-xs text-text-primary outline-none flex-1 w-full"
            />
            <button type="button" onClick={() => setRenamePath(null)} className="text-error-custom"><X size={12} /></button>
          </form>
        )}

        {store.fileTree ? (
          <div className="space-y-0.5">
            {store.fileTree.children && store.fileTree.children.map(child => renderNode(child))}
          </div>
        ) : (
          <div className="text-center text-xs text-text-secondary py-8">Loading files...</div>
        )}
      </div>

      {/* Context Menu Overlay */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} onContextMenu={() => setContextMenu(null)} />
          <div 
            className="fixed z-50 bg-bg-tertiary border border-border-custom rounded shadow-lg py-1 min-w-[120px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {contextMenu.isDirectory && (
              <>
                <button 
                  onClick={() => { setNewInput({ type: 'file', parentPath: contextMenu.path }); setContextMenu(null); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-accent-custom hover:text-white flex items-center gap-1.5"
                >
                  <FilePlus size={12} /> New File
                </button>
                <button 
                  onClick={() => { setNewInput({ type: 'folder', parentPath: contextMenu.path }); setContextMenu(null); }}
                  className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-accent-custom hover:text-white flex items-center gap-1.5"
                >
                  <FolderPlus size={12} /> New Folder
                </button>
              </>
            )}
            <button 
              onClick={() => { setRenamePath(contextMenu.path); setInputValue(contextMenu.path.split('/').pop()); setContextMenu(null); }}
              className="w-full text-left px-3 py-1.5 text-xs text-text-primary hover:bg-accent-custom hover:text-white flex items-center gap-1.5"
            >
              <Edit size={12} /> Rename
            </button>
            <hr className="border-border-custom my-1" />
            <button 
              onClick={() => handleDelete(contextMenu.path)}
              className="w-full text-left px-3 py-1.5 text-xs text-error-custom hover:bg-error-custom hover:text-white flex items-center gap-1.5"
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
