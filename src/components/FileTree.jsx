import React from 'react';
import { TreeNode } from './TreeNode.jsx';
import { FolderTree, RefreshCw } from 'lucide-react';

/**
 * FileTree container component.
 * Renders the top-level tree root and manages scrolling/presentation.
 */
export function FileTree({
  tree,
  selectedIds,
  expandedIds,
  onSelect,
  onToggleExpand,
  onExpandAll,
  onCollapseAll
}) {
  if (!tree) {
    return (
      <div className="file-tree-empty">
        <RefreshCw className="spin" size={20} />
        <span>Loading file system...</span>
      </div>
    );
  }

  return (
    <div className="file-tree-container">
      <div className="file-tree-header">
        <div className="file-tree-title">
          <FolderTree size={16} />
          <span>Explorer</span>
        </div>
        <div className="file-tree-header-actions">
          <button
            type="button"
            className="btn-tiny"
            onClick={onExpandAll}
            title="Expand all folders"
          >
            Expand All
          </button>
          <button
            type="button"
            className="btn-tiny"
            onClick={onCollapseAll}
            title="Collapse all folders"
          >
            Collapse All
          </button>
        </div>
      </div>

      <div className="file-tree-content" role="tree" tabIndex={0}>
        <TreeNode
          node={tree}
          level={0}
          selectedIds={selectedIds}
          expandedIds={expandedIds}
          onSelect={onSelect}
          onToggleExpand={onToggleExpand}
        />
      </div>
    </div>
  );
}

