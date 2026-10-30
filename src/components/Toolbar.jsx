import React from 'react';
import {
  FilePlus,
  FolderPlus,
  Edit2,
  FolderInput,
  Trash2,
  Undo2,
  Redo2,
  Search,
  Activity,
  HardDrive
} from 'lucide-react';

export function Toolbar({
  selectedCount = 0,
  canRename = false,
  canMove = false,
  canDelete = false,
  canUndo = false,
  canRedo = false,
  isSearchOpen = false,
  isActivityOpen = false,
  onNewFile,
  onNewFolder,
  onRename,
  onMove,
  onDelete,
  onUndo,
  onRedo,
  onToggleSearch,
  onToggleActivity
}) {
  return (
    <header className="app-toolbar">
      <div className="toolbar-brand">
        <HardDrive className="brand-icon" size={22} />
        <span className="brand-name">VideoSDK File Explorer</span>
      </div>

      <div className="toolbar-actions">
        {/* Creation controls */}
        <div className="btn-group">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onNewFile}
            title="Create new file inside selected folder"
          >
            <FilePlus size={16} />
            <span>New File</span>
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNewFolder}
            title="Create new folder inside selected folder"
          >
            <FolderPlus size={16} />
            <span>New Folder</span>
          </button>
        </div>

        <div className="divider-vertical" />

        {/* Selected item actions */}
        <div className="btn-group">
          <button
            type="button"
            className="btn btn-icon"
            onClick={onRename}
            disabled={!canRename}
            title={canRename ? 'Rename selected item' : 'Select an item to rename'}
          >
            <Edit2 size={16} />
            <span>Rename</span>
          </button>

          <button
            type="button"
            className="btn btn-icon"
            onClick={onMove}
            disabled={!canMove}
            title={canMove ? 'Move selected item' : 'Select an item to move'}
          >
            <FolderInput size={16} />
            <span>Move</span>
          </button>

          <button
            type="button"
            className="btn btn-icon btn-danger"
            onClick={onDelete}
            disabled={!canDelete}
            title={
              canDelete
                ? `Delete ${selectedCount > 1 ? `${selectedCount} items` : 'selected item'}`
                : 'Select an item to delete'
            }
          >
            <Trash2 size={16} />
            <span>
              Delete
              {selectedCount > 1 ? ` (${selectedCount})` : ''}
            </span>
          </button>
        </div>

        <div className="divider-vertical" />

        {/* History actions */}
        <div className="btn-group">
          <button
            type="button"
            className="btn btn-icon"
            onClick={onUndo}
            disabled={!canUndo}
            title={canUndo ? 'Undo last operation (Ctrl+Z)' : 'Nothing to undo'}
          >
            <Undo2 size={16} />
            <span>Undo</span>
          </button>

          <button
            type="button"
            className="btn btn-icon"
            onClick={onRedo}
            disabled={!canRedo}
            title={canRedo ? 'Redo operation (Ctrl+Y)' : 'Nothing to redo'}
          >
            <Redo2 size={16} />
            <span>Redo</span>
          </button>
        </div>

        <div className="divider-vertical" />

        {/* Search & Activity toggle buttons */}
        <div className="btn-group">
          <button
            type="button"
            className={`btn btn-icon ${isSearchOpen ? 'active' : ''}`}
            onClick={onToggleSearch}
            title="Toggle Search Panel"
          >
            <Search size={16} />
            <span>Search</span>
          </button>

          <button
            type="button"
            className={`btn btn-icon ${isActivityOpen ? 'active' : ''}`}
            onClick={onToggleActivity}
            title="Toggle Activity Log"
          >
            <Activity size={16} />
            <span>Activity</span>
          </button>
        </div>
      </div>
    </header>
  );
}

