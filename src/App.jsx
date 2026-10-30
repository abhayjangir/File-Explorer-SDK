import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FileExplorerSDK } from './sdk/index.js';
import { useFileExplorer } from './hooks/useFileExplorer.js';
import { Toolbar } from './components/Toolbar.jsx';
import { FileTree } from './components/FileTree.jsx';
import { DetailsPanel } from './components/DetailsPanel.jsx';
import { SearchPanel } from './components/SearchPanel.jsx';
import { ActivityPanel } from './components/ActivityPanel.jsx';
import { ItemDialog } from './components/ItemDialog.jsx';
import { ConfirmDialog } from './components/ConfirmDialog.jsx';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function App() {
  // Stable SDK instance
  const sdk = useMemo(() => new FileExplorerSDK(), []);

  // Hook connecting UI with SDK
  const {
    tree,
    canUndo,
    canRedo,
    activities,
    error: sdkError,
    clearError,
    createFile,
    createFolder,
    renameItem,
    moveItem,
    deleteItem,
    undo,
    redo,
    search,
    getItem,
    getItemPath,
    deleteMultiple
  } = useFileExplorer(sdk);

  // UI States
  const [selectedIds, setSelectedIds] = useState(['root']);
  const [expandedIds, setExpandedIds] = useState(['root', 'folder-documents']);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Dialog states
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    mode: 'createFile', // 'createFile' | 'createFolder' | 'rename' | 'move'
    targetItem: null,
    parentFolder: null
  });

  const [confirmDeleteState, setConfirmDeleteState] = useState({
    isOpen: false,
    items: []
  });

  // Display toast notification
  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Synchronize toast with SDK errors
  useEffect(() => {
    if (sdkError) {
      showToast(sdkError, 'error');
    }
  }, [sdkError, showToast]);

  // Ensure deleted items cannot remain selected
  useEffect(() => {
    if (!tree) return;
    setSelectedIds((prev) => {
      const valid = prev.filter((id) => sdk.getItem(id) !== null);
      return valid.length > 0 ? valid : ['root'];
    });
  }, [tree, sdk]);

  // Selected item and metadata resolution
  const primarySelectedId = selectedIds.length > 0 ? selectedIds[selectedIds.length - 1] : null;
  const selectedItem = useMemo(() => {
    return primarySelectedId ? getItem(primarySelectedId) : null;
  }, [primarySelectedId, getItem, tree]);

  const selectedItemPath = useMemo(() => {
    if (!primarySelectedId) return '';
    try {
      return getItemPath(primarySelectedId);
    } catch {
      return '';
    }
  }, [primarySelectedId, getItemPath, tree]);

  const parentItem = useMemo(() => {
    if (!selectedItem || !selectedItem.parentId) return null;
    return getItem(selectedItem.parentId);
  }, [selectedItem, getItem, tree]);

  // Determine current target folder for file/folder creation
  const currentTargetFolder = useMemo(() => {
    if (!selectedItem) {
      return getItem('root');
    }
    if (selectedItem.type === 'folder') {
      return selectedItem;
    }
    // If a file is selected, create inside file's parent folder
    return selectedItem.parentId ? getItem(selectedItem.parentId) : getItem('root');
  }, [selectedItem, getItem, tree]);

  // Selection handlers
  const handleSelect = useCallback((id, isMulti = false) => {
    setSelectedIds((prev) => {
      if (isMulti) {
        // Multi-selection: toggle item in selection
        if (prev.includes(id)) {
          const next = prev.filter((item) => item !== id);
          return next.length > 0 ? next : ['root'];
        }
        return [...prev, id];
      }
      return [id];
    });
  }, []);

  // Expand / collapse handlers
  const handleToggleExpand = useCallback((id) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const handleExpandAll = useCallback(() => {
    const allFolderIds = [];
    const traverse = (node) => {
      if (node && node.type === 'folder') {
        allFolderIds.push(node.id);
        if (node.children) {
          node.children.forEach(traverse);
        }
      }
    };
    if (tree) traverse(tree);
    setExpandedIds(allFolderIds);
  }, [tree]);

  const handleCollapseAll = useCallback(() => {
    setExpandedIds(['root']);
  }, []);

  // Toolbar Actions
  const handleNewFile = useCallback(() => {
    setDialogState({
      isOpen: true,
      mode: 'createFile',
      targetItem: null,
      parentFolder: currentTargetFolder
    });
  }, [currentTargetFolder]);

  const handleNewFolder = useCallback(() => {
    setDialogState({
      isOpen: true,
      mode: 'createFolder',
      targetItem: null,
      parentFolder: currentTargetFolder
    });
  }, [currentTargetFolder]);

  const handleRename = useCallback(() => {
    if (!selectedItem || selectedItem.id === 'root') return;
    setDialogState({
      isOpen: true,
      mode: 'rename',
      targetItem: selectedItem,
      parentFolder: parentItem
    });
  }, [selectedItem, parentItem]);

  const handleMove = useCallback(() => {
    if (!selectedItem || selectedItem.id === 'root') return;
    setDialogState({
      isOpen: true,
      mode: 'move',
      targetItem: selectedItem,
      parentFolder: parentItem
    });
  }, [selectedItem, parentItem]);

  const handleDelete = useCallback(() => {
    const itemsToDelete = selectedIds
      .filter((id) => id !== 'root')
      .map((id) => getItem(id))
      .filter(Boolean);

    if (itemsToDelete.length === 0) return;

    setConfirmDeleteState({
      isOpen: true,
      items: itemsToDelete
    });
  }, [selectedIds, getItem]);

  const handleConfirmDelete = useCallback(() => {
    try {
      const items = confirmDeleteState.items;
      if (items.length === 1) {
        deleteItem(items[0].id);
        showToast(`Deleted ${items[0].name}`, 'info');
      } else if (items.length > 1) {
        deleteMultiple(items.map((i) => i.id));
        showToast(`Deleted ${items.length} items`, 'info');
      }
      setSelectedIds(['root']);
      setConfirmDeleteState({ isOpen: false, items: [] });
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [confirmDeleteState, deleteItem, deleteMultiple, showToast]);

  const handleUndo = useCallback(() => {
    try {
      const res = undo();
      if (res && res.success) {
        showToast('Operation undone', 'info');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [undo, showToast]);

  const handleRedo = useCallback(() => {
    try {
      const res = redo();
      if (res && res.success) {
        showToast('Operation redone', 'info');
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [redo, showToast]);

  // Dialog submission dispatcher
  const handleDialogSubmit = useCallback(
    ({ name, targetParentId }) => {
      const { mode, targetItem, parentFolder } = dialogState;

      try {
        if (mode === 'createFile') {
          const newFile = createFile(parentFolder.id, name);
          showToast(`Created file "${newFile.name}"`, 'success');
          setSelectedIds([newFile.id]);
        } else if (mode === 'createFolder') {
          const newFolder = createFolder(parentFolder.id, name);
          showToast(`Created folder "${newFolder.name}"`, 'success');
          setExpandedIds((prev) => (prev.includes(parentFolder.id) ? prev : [...prev, parentFolder.id]));
          setSelectedIds([newFolder.id]);
        } else if (mode === 'rename') {
          const renamed = renameItem(targetItem.id, name);
          showToast(`Renamed to "${renamed.name}"`, 'success');
        } else if (mode === 'move') {
          const moved = moveItem(targetItem.id, targetParentId);
          showToast(`Moved "${moved.name}"`, 'success');
          setExpandedIds((prev) => (prev.includes(targetParentId) ? prev : [...prev, targetParentId]));
        }
        setDialogState({ isOpen: false, mode: 'createFile', targetItem: null, parentFolder: null });
      } catch (err) {
        showToast(err.message, 'error');
      }
    },
    [dialogState, createFile, createFolder, renameItem, moveItem, showToast]
  );

  // Available destination folders for Move dialog
  const availableFoldersForMove = useMemo(() => {
    if (!dialogState.targetItem || dialogState.mode !== 'move') return [];

    const targetId = dialogState.targetItem.id;
    const isFolder = dialogState.targetItem.type === 'folder';

    // Collect all descendant IDs if target is a folder
    const descendantIds = new Set();
    if (isFolder) {
      const collect = (node) => {
        if (!node) return;
        descendantIds.add(node.id);
        if (node.children) {
          node.children.forEach(collect);
        }
      };
      // Find node in tree
      const findNode = (n, id) => {
        if (n.id === id) return n;
        if (n.children) {
          for (const c of n.children) {
            const f = findNode(c, id);
            if (f) return f;
          }
        }
        return null;
      };
      const found = tree ? findNode(tree, targetId) : null;
      if (found) collect(found);
    }

    // Get all folders from search
    const allFolders = search('', { type: 'folder', limit: 1000 }).results;

    // Filter out target folder itself and any of its descendants
    return allFolders.filter((f) => {
      if (f.id === targetId) return false;
      if (descendantIds.has(f.id)) return false;
      return true;
    });
  }, [dialogState, tree, search]);

  // When clicking a search result: select item & auto-expand ancestors
  const handleSelectSearchResult = useCallback(
    (item) => {
      // Find path ancestors
      const ancestors = [];
      let curr = getItem(item.id);
      while (curr && curr.parentId) {
        ancestors.push(curr.parentId);
        curr = getItem(curr.parentId);
      }

      setExpandedIds((prev) => {
        const next = new Set([...prev, ...ancestors]);
        return Array.from(next);
      });

      setSelectedIds([item.id]);
      showToast(`Selected "${item.name}" from search`, 'info');
    },
    [getItem, showToast]
  );

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing inside an input or select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          if (canRedo) handleRedo();
        } else {
          e.preventDefault();
          if (canUndo) handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        if (canRedo) handleRedo();
      } else if (e.key === 'Delete') {
        if (selectedIds.some((id) => id !== 'root')) {
          handleDelete();
        }
      } else if (e.key === 'F2') {
        if (selectedItem && selectedItem.id !== 'root') {
          handleRename();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, handleUndo, handleRedo, handleDelete, handleRename, selectedIds, selectedItem]);

  const canRename = selectedIds.length === 1 && primarySelectedId !== 'root';
  const canMove = selectedIds.length === 1 && primarySelectedId !== 'root';
  const canDelete = selectedIds.some((id) => id !== 'root');

  return (
    <div className="app-layout">
      {/* Toast Notification Banner */}
      {toast && (
        <div className={`toast toast-${toast.type}`} role="alert">
          {toast.type === 'error' && <AlertCircle size={16} />}
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.type === 'info' && <Info size={16} />}
          <span>{toast.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={() => setToast(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Toolbar */}
      <Toolbar
        selectedCount={selectedIds.length}
        canRename={canRename}
        canMove={canMove}
        canDelete={canDelete}
        canUndo={canUndo}
        canRedo={canRedo}
        isSearchOpen={isSearchOpen}
        isActivityOpen={isActivityOpen}
        onNewFile={handleNewFile}
        onNewFolder={handleNewFolder}
        onRename={handleRename}
        onMove={handleMove}
        onDelete={handleDelete}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        onToggleActivity={() => setIsActivityOpen((prev) => !prev)}
      />

      {/* Main Content Workspace */}
      <div className="workspace-container">
        {/* Left: Recursive File Tree */}
        <section className="pane-tree">
          <FileTree
            tree={tree}
            selectedIds={selectedIds}
            expandedIds={expandedIds}
            onSelect={handleSelect}
            onToggleExpand={handleToggleExpand}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
          />
        </section>

        {/* Center / Search Drawer */}
        {isSearchOpen && (
          <section className="pane-search">
            <SearchPanel
              searchFn={search}
              onSelectResult={handleSelectSearchResult}
              onClose={() => setIsSearchOpen(false)}
            />
          </section>
        )}

        {/* Center-Right / Activity Drawer */}
        {isActivityOpen && (
          <section className="pane-activity">
            <ActivityPanel
              activities={activities}
              onClose={() => setIsActivityOpen(false)}
            />
          </section>
        )}

        {/* Right: Item Details Panel */}
        <section className="pane-details">
          <DetailsPanel
            selectedItem={selectedItem}
            selectedCount={selectedIds.length}
            path={selectedItemPath}
            parentItem={parentItem}
          />
        </section>
      </div>

      {/* Modals & Dialogs */}
      <ItemDialog
        isOpen={dialogState.isOpen}
        mode={dialogState.mode}
        targetItem={dialogState.targetItem}
        parentFolder={dialogState.parentFolder}
        availableFolders={availableFoldersForMove}
        onSubmit={handleDialogSubmit}
        onClose={() =>
          setDialogState({ isOpen: false, mode: 'createFile', targetItem: null, parentFolder: null })
        }
      />

      <ConfirmDialog
        isOpen={confirmDeleteState.isOpen}
        title="Delete Confirmation"
        items={confirmDeleteState.items}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmDeleteState({ isOpen: false, items: [] })}
      />
    </div>
  );
}
