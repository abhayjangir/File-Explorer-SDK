import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  title = 'Confirm Deletion',
  message,
  items = [],
  onConfirm,
  onClose
}) {
  if (!isOpen) return null;

  const hasFolder = items.some((it) => it.type === 'folder');

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-with-icon">
            <AlertTriangle className="text-danger" size={20} />
            <h3 className="modal-title">{title}</h3>
          </div>
          <button type="button" className="btn-icon-sm" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p className="confirm-message">
            {message ||
              `Are you sure you want to delete ${
                items.length > 1
                  ? `these ${items.length} items`
                  : `"${items[0]?.name}"`
              }?`}
          </p>

          {hasFolder && (
            <div className="dialog-alert-warning">
              <AlertTriangle size={16} />
              <span>
                Deleting a folder will permanently remove all files and subfolders inside it.
                (You can undo this later using Undo).
              </span>
            </div>
          )}

          {items.length > 0 && (
            <div className="confirm-items-list">
              {items.slice(0, 5).map((it) => (
                <div key={it.id} className="confirm-item-row">
                  <span className={`item-badge ${it.type}`}>{it.type}</span>
                  <span className="confirm-item-name">{it.name}</span>
                </div>
              ))}
              {items.length > 5 && (
                <div className="confirm-item-more">
                  ...and {items.length - 5} more item(s)
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            autoFocus
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

