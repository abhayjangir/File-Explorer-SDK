import React, { useState, useEffect } from 'react';
import { X, Folder, File, AlertCircle } from 'lucide-react';

export function ItemDialog({
  isOpen,
  mode, // 'createFile' | 'createFolder' | 'rename' | 'move'
  targetItem,
  parentFolder,
  availableFolders = [],
  onSubmit,
  onClose
}) {
  const [name, setName] = useState('');
  const [targetParentId, setTargetParentId] = useState('');
  const [dialogError, setDialogError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDialogError('');

    if (mode === 'rename' && targetItem) {
      setName(targetItem.name);
    } else {
      setName('');
    }

    if (mode === 'move' && availableFolders.length > 0) {
      // Default to root or first available folder that isn't current parent
      const defaultFolder = availableFolders.find((f) => f.id !== targetItem?.parentId);
      setTargetParentId(defaultFolder ? defaultFolder.id : availableFolders[0].id);
    }
  }, [isOpen, mode, targetItem, availableFolders]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setDialogError('');

    try {
      if (mode === 'createFile' || mode === 'createFolder') {
        if (!name.trim()) {
          setDialogError('Name cannot be empty.');
          return;
        }
        onSubmit({ name: name.trim() });
      } else if (mode === 'rename') {
        if (!name.trim()) {
          setDialogError('Name cannot be empty.');
          return;
        }
        onSubmit({ name: name.trim() });
      } else if (mode === 'move') {
        if (!targetParentId) {
          setDialogError('Please select a destination folder.');
          return;
        }
        onSubmit({ targetParentId });
      }
    } catch (err) {
      setDialogError(err.message || 'Operation failed.');
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'createFile':
        return 'Create New File';
      case 'createFolder':
        return 'Create New Folder';
      case 'rename':
        return `Rename "${targetItem?.name}"`;
      case 'move':
        return `Move "${targetItem?.name}"`;
      default:
        return 'Item Dialog';
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{getTitle()}</h3>
          <button type="button" className="btn-icon-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {dialogError && (
              <div className="dialog-alert-error">
                <AlertCircle size={16} />
                <span>{dialogError}</span>
              </div>
            )}

            {/* Destination folder info when creating */}
            {(mode === 'createFile' || mode === 'createFolder') && (
              <div className="form-info-box">
                <Folder size={16} className="folder-closed" />
                <span>
                  Creating inside: <strong>{parentFolder?.name || 'Root'}</strong>
                </span>
              </div>
            )}

            {/* Name Input for create and rename */}
            {(mode === 'createFile' || mode === 'createFolder' || mode === 'rename') && (
              <div className="form-group">
                <label className="form-label" htmlFor="item-name-input">
                  {mode === 'rename' ? 'New Name' : 'Item Name'}
                </label>
                <input
                  id="item-name-input"
                  type="text"
                  className="form-input"
                  placeholder={
                    mode === 'createFile'
                      ? 'e.g. document.pdf'
                      : mode === 'createFolder'
                      ? 'e.g. My Folder'
                      : 'Enter name'
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                />
              </div>
            )}

            {/* Destination Folder Selector for Move */}
            {mode === 'move' && (
              <div className="form-group">
                <label className="form-label" htmlFor="destination-folder-select">
                  Destination Folder
                </label>
                <select
                  id="destination-folder-select"
                  className="form-select"
                  value={targetParentId}
                  onChange={(e) => setTargetParentId(e.target.value)}
                >
                  {availableFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.path || folder.name}
                    </option>
                  ))}
                </select>
                <span className="form-hint">
                  Only valid destination folders are displayed.
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {mode === 'rename'
                ? 'Rename'
                : mode === 'move'
                ? 'Move'
                : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

