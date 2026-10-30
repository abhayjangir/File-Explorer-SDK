import React from 'react';
import {
  FileText,
  Folder,
  Info,
  Calendar,
  HardDrive,
  Hash,
  FolderTree,
  FileCheck
} from 'lucide-react';

/**
 * Formats byte size into human readable string.
 */
function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Formats epoch timestamp into local date and time string.
 */
function formatDate(timestamp) {
  if (!timestamp) return '—';
  return new Date(timestamp).toLocaleString();
}

export function DetailsPanel({
  selectedItem,
  selectedCount = 0,
  path = '',
  parentItem = null
}) {
  if (selectedCount > 1) {
    return (
      <aside className="details-panel">
        <div className="details-header">
          <Info size={18} />
          <h3>Multiple Items Selected</h3>
        </div>
        <div className="details-multi-summary">
          <FileCheck size={36} className="text-accent" />
          <p className="multi-count">
            <strong>{selectedCount}</strong> items selected
          </p>
          <span className="multi-hint">
            You can delete these items together using the Delete button in the toolbar.
          </span>
        </div>
      </aside>
    );
  }

  if (!selectedItem) {
    return (
      <aside className="details-panel">
        <div className="details-header">
          <Info size={18} />
          <h3>Item Details</h3>
        </div>
        <div className="details-empty">
          <HardDrive size={36} className="text-muted" />
          <p>No item selected</p>
          <span className="details-empty-hint">
            Click any file or folder in the tree to inspect its metadata.
          </span>
        </div>
      </aside>
    );
  }

  const isFolder = selectedItem.type === 'folder';

  return (
    <aside className="details-panel" data-testid="details-panel">
      <div className="details-header">
        <Info size={18} />
        <h3>Item Details</h3>
      </div>

      <div className="details-hero">
        <div className="details-hero-icon">
          {isFolder ? (
            <Folder size={32} className="folder-closed" />
          ) : (
            <FileText size={32} className="file-doc" />
          )}
        </div>
        <div className="details-hero-info">
          <h4 className="details-name" title={selectedItem.name}>
            {selectedItem.name}
          </h4>
          <span className={`item-badge ${selectedItem.type}`}>
            {selectedItem.type.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="details-section">
        <div className="detail-row">
          <span className="detail-label">
            <Hash size={14} /> ID
          </span>
          <span className="detail-value mono" title={selectedItem.id}>
            {selectedItem.id}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">
            <FolderTree size={14} /> Path
          </span>
          <span className="detail-value" title={path || selectedItem.name}>
            {path || selectedItem.name}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">
            <Folder size={14} /> Parent Folder
          </span>
          <span className="detail-value">
            {parentItem ? parentItem.name : selectedItem.parentId ? selectedItem.parentId : '(Root)'}
          </span>
        </div>

        {isFolder ? (
          <div className="detail-row">
            <span className="detail-label">
              <FolderTree size={14} /> Contents
            </span>
            <span className="detail-value">
              {Array.isArray(selectedItem.children)
                ? `${selectedItem.children.length} items`
                : 'Folder'}
            </span>
          </div>
        ) : (
          <div className="detail-row">
            <span className="detail-label">
              <HardDrive size={14} /> File Size
            </span>
            <span className="detail-value">
              {formatSize(selectedItem.size)}
            </span>
          </div>
        )}

        <div className="detail-row">
          <span className="detail-label">
            <Calendar size={14} /> Created
          </span>
          <span className="detail-value">
            {formatDate(selectedItem.createdAt)}
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">
            <Calendar size={14} /> Modified
          </span>
          <span className="detail-value">
            {formatDate(selectedItem.updatedAt)}
          </span>
        </div>
      </div>
    </aside>
  );
}

