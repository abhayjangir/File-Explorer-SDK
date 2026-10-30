import React from 'react';
import {
  Folder,
  FolderOpen,
  File,
  FileText,
  FileCode,
  Image,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

/**
 * Helper to pick an appropriate icon based on item type and extension.
 */
function getFileIcon(name) {
  const ext = name.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':
    case 'docx':
    case 'txt':
      return <FileText className="node-icon file-doc" size={16} />;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
      return <Image className="node-icon file-img" size={16} />;
    case 'js':
    case 'jsx':
    case 'json':
    case 'html':
    case 'css':
      return <FileCode className="node-icon file-code" size={16} />;
    default:
      return <File className="node-icon file-generic" size={16} />;
  }
}

/**
 * Recursive TreeNode component.
 * Renders files and folders, expanding nested children recursively.
 */
export const TreeNode = React.memo(function TreeNode({
  node,
  level = 0,
  selectedIds = [],
  expandedIds = [],
  onSelect,
  onToggleExpand
}) {
  // Render tracking log for tree performance observation
  console.log(`[TreeNode render] id: ${node.id}, name: "${node.name}", type: ${node.type}`);

  if (!node) return null;

  const isFolder = node.type === 'folder';
  const isExpanded = isFolder && expandedIds.includes(node.id);
  const isSelected = selectedIds.includes(node.id);
  const hasChildren = isFolder && Array.isArray(node.children) && node.children.length > 0;

  const handleClick = (e) => {
    e.stopPropagation();
    const isMulti = e.ctrlKey || e.metaKey || e.shiftKey;
    onSelect(node.id, isMulti);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    if (isFolder) {
      onToggleExpand(node.id);
    }
  };

  return (
    <div className="tree-node-wrapper" data-testid={`tree-node-${node.id}`}>
      <div
        className={`tree-node-row ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 18 + 10}px` }}
        onClick={handleClick}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isFolder ? isExpanded : undefined}
      >
        {/* Expand / Collapse Chevron */}
        <span
          className={`chevron-box ${!isFolder ? 'invisible' : ''}`}
          onClick={handleToggle}
          title={isFolder ? (isExpanded ? 'Collapse' : 'Expand') : ''}
          role="button"
          tabIndex={isFolder ? 0 : -1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleToggle(e);
            }
          }}
        >
          {isFolder && (
            isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          )}
        </span>

        {/* Icon */}
        <span className="node-icon-box">
          {isFolder ? (
            isExpanded ? (
              <FolderOpen className="node-icon folder-open" size={16} />
            ) : (
              <Folder className="node-icon folder-closed" size={16} />
            )
          ) : (
            getFileIcon(node.name)
          )}
        </span>

        {/* Name */}
        <span className="node-name" title={node.name}>
          {node.name}
        </span>

        {/* Child count badge for folders */}
        {isFolder && (
          <span className="child-count">
            {node.children ? node.children.length : 0}
          </span>
        )}
      </div>

      {/* Recursive rendering of nested children */}
      {isFolder && isExpanded && (
        <div className="tree-children-container" role="group">
          {hasChildren ? (
            node.children.map((child) => (
              <TreeNode
                key={child.id}
                node={child}
                level={level + 1}
                selectedIds={selectedIds}
                expandedIds={expandedIds}
                onSelect={onSelect}
                onToggleExpand={onToggleExpand}
              />
            ))
          ) : (
            <div
              className="tree-node-empty"
              style={{ paddingLeft: `${(level + 1) * 18 + 24}px` }}
            >
              (empty folder)
            </div>
          )}
        </div>
      )}
    </div>
  );
});

