import React from 'react';
import {
  Activity as ActivityIcon,
  X,
  FilePlus,
  FolderPlus,
  Edit2,
  FolderInput,
  Trash2,
  Undo2,
  Redo2,
  Layers,
  Clock
} from 'lucide-react';

function getActivityIcon(type) {
  switch (type) {
    case 'CREATE':
      return <FilePlus size={14} className="text-success" />;
    case 'RENAME':
      return <Edit2 size={14} className="text-warning" />;
    case 'MOVE':
      return <FolderInput size={14} className="text-info" />;
    case 'DELETE':
      return <Trash2 size={14} className="text-danger" />;
    case 'UNDO':
      return <Undo2 size={14} className="text-secondary" />;
    case 'REDO':
      return <Redo2 size={14} className="text-secondary" />;
    case 'TRANSACTION':
      return <Layers size={14} className="text-accent" />;
    default:
      return <ActivityIcon size={14} />;
  }
}

function formatTime(timestamp) {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString();
}

export function ActivityPanel({ activities = [], onClose }) {
  return (
    <aside className="activity-panel">
      <div className="activity-panel-header">
        <div className="activity-panel-title">
          <ActivityIcon size={16} />
          <span>Recent Activity</span>
        </div>
        <button
          type="button"
          className="btn-icon-sm"
          onClick={onClose}
          title="Close activity panel"
        >
          <X size={16} />
        </button>
      </div>

      <div className="activity-list">
        {activities.length === 0 ? (
          <div className="activity-empty">
            <Clock size={24} className="text-muted" />
            <p>No recent activity</p>
            <small>File operations will be recorded here</small>
          </div>
        ) : (
          activities.map((act, index) => (
            <div key={index} className="activity-item">
              <div className="activity-icon-col">
                {getActivityIcon(act.type)}
              </div>
              <div className="activity-content-col">
                <div className="activity-message">{act.message}</div>
                <div className="activity-meta">
                  <span className="activity-badge">{act.type}</span>
                  <span className="activity-time">{formatTime(act.timestamp)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}

