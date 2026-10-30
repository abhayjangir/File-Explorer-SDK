import { FileExplorerError, ErrorCodes } from './errors.js';
import {
  deepClone,
  validateItemName,
  validateNameUniqueness,
  validateParentFolder,
  validateMove
} from './validation.js';
import { searchItems, buildItemPath } from './search.js';
import {
  HistoryManager,
  createItemCommand,
  renameItemCommand,
  moveItemCommand,
  deleteItemCommand,
  transactionCommand
} from './history.js';

/**
 * Generates a unique identifier.
 * Uses crypto.randomUUID if available, with a random fallback.
 *
 * @returns {string} Unique ID.
 */
export function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'item-' + Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
}

/**
 * Initial seed data representing the default file system structure:
 * My Files/
 * ├── Documents/
 * │   ├── Resume.pdf
 * │   └── Project Plan.docx
 * ├── Images/
 * │   ├── Photo.png
 * │   └── Logo.svg
 * └── Notes.txt
 */
export const DEFAULT_INITIAL_DATA = [
  { id: 'root', name: 'My Files', type: 'folder', parentId: null },
  { id: 'folder-documents', name: 'Documents', type: 'folder', parentId: 'root' },
  { id: 'file-resume', name: 'Resume.pdf', type: 'file', parentId: 'folder-documents', size: 1024 * 140 },
  { id: 'file-project-plan', name: 'Project Plan.docx', type: 'file', parentId: 'folder-documents', size: 1024 * 280 },
  { id: 'folder-images', name: 'Images', type: 'folder', parentId: 'root' },
  { id: 'file-photo', name: 'Photo.png', type: 'file', parentId: 'folder-images', size: 1024 * 1024 * 2.5 },
  { id: 'file-logo', name: 'Logo.svg', type: 'file', parentId: 'folder-images', size: 1024 * 18 },
  { id: 'file-notes', name: 'Notes.txt', type: 'file', parentId: 'root', size: 512 }
];

/**
 * Standalone JavaScript File Explorer SDK.
 * Manages an in-memory virtual file system independently of any UI framework.
 */
export class FileExplorerSDK {
  /**
   * @param {Object} [options={}] - Configuration options.
   * @param {Array<Object>} [options.initialData] - Initial items to seed the file system.
   * @param {string} [options.rootId='root'] - ID of root folder.
   */
  constructor(options = {}) {
    this.rootId = options.rootId || 'root';
    this.items = new Map();
    this.listeners = new Set();
    this.history = new HistoryManager();
    this.recentActivity = [];
    this.maxActivityLimit = 50;
    this.activeTransaction = null;

    this._initialize(options.initialData || DEFAULT_INITIAL_DATA);
  }

  /**
   * Initializes internal Map with initial data.
   * @private
   */
  _initialize(seedData) {
    const now = Date.now();
    for (const data of seedData) {
      this.items.set(data.id, {
        id: data.id,
        name: data.name,
        type: data.type,
        parentId: data.parentId,
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
        size: data.size || (data.type === 'file' ? 1024 : 0),
        metadata: data.metadata ? deepClone(data.metadata) : {}
      });
    }

    if (!this.items.has(this.rootId)) {
      this.items.set(this.rootId, {
        id: this.rootId,
        name: 'My Files',
        type: 'folder',
        parentId: null,
        createdAt: now,
        updatedAt: now,
        size: 0,
        metadata: {}
      });
    }
  }

  // ==========================================
  // SUBSCRIPTION & NOTIFICATION API
  // ==========================================

  /**
   * Subscribes a listener callback to file system changes.
   *
   * @param {Function} listener - Callback invoked with event payload.
   * @returns {Function} Unsubscribe function.
   */
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new FileExplorerError(
        ErrorCodes.INVALID_ARGUMENT,
        'Subscription listener must be a function.'
      );
    }

    this.listeners.add(listener);
    return () => this.unsubscribe(listener);
  }

  /**
   * Removes a subscription listener.
   *
   * @param {Function} listener - Listener callback to remove.
   */
  unsubscribe(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Emits a change notification to all subscribers.
   * Safely protects against listener errors.
   *
   * @private
   * @param {Object} event - Notification details.
   */
  _notify(event) {
    const notification = {
      ...deepClone(event),
      timestamp: Date.now()
    };

    // Record to recent activity
    this.recentActivity.unshift(notification);
    if (this.recentActivity.length > this.maxActivityLimit) {
      this.recentActivity.pop();
    }

    // Safely invoke listeners
    for (const listener of this.listeners) {
      try {
        listener(deepClone(notification));
      } catch (err) {
        // Listener errors do not corrupt SDK state or crash other listeners
        console.error('FileExplorerSDK: Listener threw an error:', err);
      }
    }
  }

  /**
   * Retrieves recent activity records.
   *
   * @param {number} [limit=20] - Maximum records to return.
   * @returns {Array<Object>} Recent activities.
   */
  getRecentActivity(limit = 20) {
    return deepClone(this.recentActivity.slice(0, limit));
  }

  // ==========================================
  // RETRIEVAL & HIERARCHY METHODS
  // ==========================================

  /**
   * Retrieves an item by its unique ID.
   *
   * @param {string} id - Item unique identifier.
   * @returns {Object|null} Defensive copy of item or null if not found.
   */
  getItem(id) {
    const item = this.items.get(id);
    return item ? deepClone(item) : null;
  }

  /**
   * Retrieves direct children of a folder.
   *
   * @param {string} folderId - Folder ID.
   * @returns {Array<Object>} Defensive copies of child items.
   */
  getChildren(folderId) {
    validateParentFolder(this.items, folderId);
    const children = [];
    for (const item of this.items.values()) {
      if (item.parentId === folderId) {
        children.push(deepClone(item));
      }
    }
    return this._sortNodes(children);
  }

  /**
   * Retrieves the complete nested file and folder hierarchy starting from root.
   *
   * @returns {Object} Root node with recursive children.
   */
  getTree() {
    const rootItem = this.items.get(this.rootId);
    if (!rootItem) {
      throw new FileExplorerError(
        ErrorCodes.ITEM_NOT_FOUND,
        `Root folder "${this.rootId}" does not exist.`
      );
    }

    const buildNode = (item) => {
      const node = deepClone(item);
      if (item.type === 'folder') {
        const children = [];
        for (const candidate of this.items.values()) {
          if (candidate.parentId === item.id) {
            children.push(buildNode(candidate));
          }
        }
        node.children = this._sortNodes(children);
      }
      return node;
    };

    return buildNode(rootItem);
  }

  /**
   * Sorts tree nodes (folders first, then alphabetically by name).
   * @private
   */
  _sortNodes(nodes) {
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  }

  /**
   * Computes the full path of an item.
   *
   * @param {string} id - Item ID.
   * @returns {string} Full path string.
   */
  getItemPath(id) {
    const item = this.items.get(id);
    if (!item) {
      throw new FileExplorerError(
        ErrorCodes.ITEM_NOT_FOUND,
        `Item with ID "${id}" was not found.`
      );
    }
    return buildItemPath(this.items, item);
  }

  // ==========================================
  // MUTATION METHODS
  // ==========================================

  /**
   * Creates a new file inside a parent folder.
   *
   * @param {string} parentId - Parent folder ID.
   * @param {string} name - File name.
   * @param {Object} [metadata={}] - Optional metadata.
   * @returns {Object} Created file.
   */
  createFile(parentId, name, metadata = {}) {
    return this._createItem(parentId, name, 'file', metadata);
  }

  /**
   * Creates a new folder inside a parent folder.
   *
   * @param {string} parentId - Parent folder ID.
   * @param {string} name - Folder name.
   * @param {Object} [metadata={}] - Optional metadata.
   * @returns {Object} Created folder.
   */
  createFolder(parentId, name, metadata = {}) {
    return this._createItem(parentId, name, 'folder', metadata);
  }

  /**
   * Internal implementation for creating an item.
   * @private
   */
  _createItem(parentId, name, type, metadata = {}) {
    const validName = validateItemName(name);
    validateParentFolder(this.items, parentId);
    validateNameUniqueness(this.items, parentId, validName);

    const now = Date.now();
    const item = {
      id: generateId(),
      name: validName,
      type,
      parentId,
      createdAt: now,
      updatedAt: now,
      size: metadata.size || (type === 'file' ? 1024 : 0),
      metadata: deepClone(metadata)
    };

    // Commit change
    this.items.set(item.id, item);

    const command = createItemCommand(item);
    if (this.activeTransaction) {
      this.activeTransaction.commands.push(command);
    } else {
      this.history.push(command);
      this._notify({
        type: 'CREATE',
        action: 'create',
        item: deepClone(item),
        itemIds: [item.id],
        message: `Created ${type} "${item.name}"`
      });
    }

    return deepClone(item);
  }

  /**
   * Renames an existing file or folder.
   *
   * @param {string} id - ID of item to rename.
   * @param {string} newName - New name.
   * @returns {Object} Updated item.
   */
  renameItem(id, newName) {
    const item = this.items.get(id);
    if (!item) {
      throw new FileExplorerError(
        ErrorCodes.ITEM_NOT_FOUND,
        `Item with ID "${id}" was not found.`
      );
    }

    if (item.id === this.rootId) {
      throw new FileExplorerError(
        ErrorCodes.INVALID_OPERATION_ON_ROOT,
        'The root folder cannot be renamed.'
      );
    }

    const validName = validateItemName(newName);

    if (item.name === validName) {
      return deepClone(item);
    }

    validateNameUniqueness(this.items, item.parentId, validName, id);

    const oldName = item.name;
    item.name = validName;
    item.updatedAt = Date.now();

    const command = renameItemCommand(id, oldName, validName);
    if (this.activeTransaction) {
      this.activeTransaction.commands.push(command);
    } else {
      this.history.push(command);
      this._notify({
        type: 'RENAME',
        action: 'rename',
        item: deepClone(item),
        itemIds: [item.id],
        oldName,
        newName: validName,
        message: `Renamed "${oldName}" to "${validName}"`
      });
    }

    return deepClone(item);
  }

  /**
   * Moves a file or folder into a target folder.
   *
   * @param {string} id - ID of item to move.
   * @param {string} targetParentId - Target folder ID.
   * @returns {Object} Moved item.
   */
  moveItem(id, targetParentId) {
    validateMove(this.items, id, targetParentId, this.rootId);

    const item = this.items.get(id);
    const oldParentId = item.parentId;

    if (oldParentId === targetParentId) {
      return deepClone(item);
    }

    item.parentId = targetParentId;
    item.updatedAt = Date.now();

    const command = moveItemCommand(id, oldParentId, targetParentId);
    if (this.activeTransaction) {
      this.activeTransaction.commands.push(command);
    } else {
      this.history.push(command);
      this._notify({
        type: 'MOVE',
        action: 'move',
        item: deepClone(item),
        itemIds: [item.id],
        oldParentId,
        newParentId: targetParentId,
        message: `Moved "${item.name}"`
      });
    }

    return deepClone(item);
  }

  /**
   * Deletes an item and all its descendants.
   *
   * @param {string} id - ID of item to delete.
   * @returns {Array<Object>} List of all deleted items.
   */
  deleteItem(id) {
    const item = this.items.get(id);
    if (!item) {
      throw new FileExplorerError(
        ErrorCodes.ITEM_NOT_FOUND,
        `Item with ID "${id}" was not found.`
      );
    }

    if (item.id === this.rootId) {
      throw new FileExplorerError(
        ErrorCodes.INVALID_OPERATION_ON_ROOT,
        'The root folder cannot be deleted.'
      );
    }

    // Collect item and all descendants recursively
    const deletedItems = this._collectSubtree(id);

    // Delete all from Map
    for (const del of deletedItems) {
      this.items.delete(del.id);
    }

    const command = deleteItemCommand(deletedItems);
    if (this.activeTransaction) {
      this.activeTransaction.commands.push(command);
    } else {
      this.history.push(command);
      this._notify({
        type: 'DELETE',
        action: 'delete',
        item: deepClone(item),
        itemIds: deletedItems.map((d) => d.id),
        message: `Deleted ${item.type} "${item.name}"`
      });
    }

    return deepClone(deletedItems);
  }

  /**
   * Collects an item and all its descendants in hierarchy order.
   * @private
   */
  _collectSubtree(rootId) {
    const result = [];
    const collect = (id) => {
      const it = this.items.get(id);
      if (!it) return;
      result.push(deepClone(it));
      if (it.type === 'folder') {
        for (const child of this.items.values()) {
          if (child.parentId === id) {
            collect(child.id);
          }
        }
      }
    };
    collect(rootId);
    return result;
  }

  // ==========================================
  // INTERNAL RESTORATION HELPERS (FOR UNDO/REDO)
  // ==========================================

  _deleteInternal(id) {
    const subtree = this._collectSubtree(id);
    for (const it of subtree) {
      this.items.delete(it.id);
    }
  }

  _restoreInternal(items) {
    for (const item of items) {
      this.items.set(item.id, deepClone(item));
    }
  }

  _renameInternal(id, name) {
    const it = this.items.get(id);
    if (it) {
      it.name = name;
      it.updatedAt = Date.now();
    }
  }

  _moveInternal(id, parentId) {
    const it = this.items.get(id);
    if (it) {
      it.parentId = parentId;
      it.updatedAt = Date.now();
    }
  }

  // ==========================================
  // SEARCH API
  // ==========================================

  /**
   * Searches the entire file system hierarchy.
   *
   * @param {string} [query=''] - Search term.
   * @param {Object} [options={}] - Search, filter, sorting, pagination options.
   * @returns {Object} Paginated search results and metadata.
   */
  search(query = '', options = {}) {
    return searchItems(this.items, query, options);
  }

  // ==========================================
  // UNDO & REDO API
  // ==========================================

  /**
   * Returns true if there is an operation to undo.
   * @returns {boolean}
   */
  canUndo() {
    return this.history.canUndo();
  }

  /**
   * Returns true if there is an operation to redo.
   * @returns {boolean}
   */
  canRedo() {
    return this.history.canRedo();
  }

  /**
   * Reverses the most recent successful operation.
   *
   * @returns {Object} Result object { success: boolean, command: Object|null }
   */
  undo() {
    const cmd = this.history.undo(this);
    if (!cmd) {
      return { success: false, command: null };
    }

    this._notify({
      type: 'UNDO',
      action: 'undo',
      undoneCommand: cmd.type,
      message: `Undid: ${cmd.description}`
    });

    return { success: true, command: cmd };
  }

  /**
   * Reapplies the most recently undone operation.
   *
   * @returns {Object} Result object { success: boolean, command: Object|null }
   */
  redo() {
    const cmd = this.history.redo(this);
    if (!cmd) {
      return { success: false, command: null };
    }

    this._notify({
      type: 'REDO',
      action: 'redo',
      redoneCommand: cmd.type,
      message: `Redid: ${cmd.description}`
    });

    return { success: true, command: cmd };
  }

  // ==========================================
  // ATOMIC TRANSACTIONS & BULK OPERATIONS
  // ==========================================

  /**
   * Executes a batch of operations atomically.
   * If any operation fails, rolls back all changes.
   * On success, records a single undoable transaction command and emits a single notification.
   *
   * @param {Function} transactionFn - Function receiving the SDK transaction context.
   * @returns {*} Return value of transactionFn.
   * @throws {FileExplorerError}
   */
  transaction(transactionFn) {
    if (typeof transactionFn !== 'function') {
      throw new FileExplorerError(
        ErrorCodes.INVALID_ARGUMENT,
        'Transaction callback must be a function.'
      );
    }

    if (this.activeTransaction) {
      throw new FileExplorerError(
        ErrorCodes.INVALID_OPERATION,
        'Nested transactions are not currently supported.'
      );
    }

    // Capture snapshot for rollback
    const backupItems = new Map();
    for (const [key, val] of this.items.entries()) {
      backupItems.set(key, deepClone(val));
    }

    const txContext = {
      commands: []
    };

    this.activeTransaction = txContext;

    try {
      const result = transactionFn(this);

      // Successfully finished transaction
      this.activeTransaction = null;

      if (txContext.commands.length > 0) {
        const cmd = transactionCommand(txContext.commands, `Batch of ${txContext.commands.length} operations`);
        this.history.push(cmd);

        this._notify({
          type: 'TRANSACTION',
          action: 'transaction',
          operationCount: txContext.commands.length,
          message: `Executed transaction (${txContext.commands.length} operations)`
        });
      }

      return result;
    } catch (err) {
      // Rollback internal state completely
      this.items = backupItems;
      this.activeTransaction = null;
      throw err;
    }
  }

  /**
   * Deletes multiple items as one atomic operation.
   * Prunes redundant descendants if an ancestor is also selected.
   *
   * @param {Array<string>} ids - IDs to delete.
   * @returns {Array<Object>} All deleted items.
   */
  deleteMultiple(ids) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return [];
    }

    // Filter out descendants if ancestor is in ids
    const idSet = new Set(ids);
    const topLevelIds = ids.filter((id) => {
      let curr = this.items.get(id);
      if (!curr) return false;
      while (curr.parentId) {
        if (idSet.has(curr.parentId)) {
          return false; // Parent/ancestor is already being deleted
        }
        curr = this.items.get(curr.parentId);
        if (!curr) break;
      }
      return true;
    });

    return this.transaction(() => {
      const allDeleted = [];
      for (const id of topLevelIds) {
        const deleted = this.deleteItem(id);
        allDeleted.push(...deleted);
      }
      return allDeleted;
    });
  }
}

