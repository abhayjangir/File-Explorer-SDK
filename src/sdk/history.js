import { deepClone } from './validation.js';

/**
 * Creates a command representing a file or folder creation.
 *
 * @param {Object} item - Created item.
 * @returns {Object} Command object.
 */
export function createItemCommand(item) {
  const clonedItem = deepClone(item);
  return {
    type: 'CREATE',
    description: `Create ${item.type} "${item.name}"`,
    item: clonedItem,
    undo(sdk) {
      sdk._deleteInternal(clonedItem.id);
    },
    redo(sdk) {
      sdk._restoreInternal([clonedItem]);
    }
  };
}

/**
 * Creates a command representing an item rename.
 *
 * @param {string} itemId - ID of renamed item.
 * @param {string} oldName - Previous name.
 * @param {string} newName - New name.
 * @returns {Object} Command object.
 */
export function renameItemCommand(itemId, oldName, newName) {
  return {
    type: 'RENAME',
    description: `Rename to "${newName}"`,
    itemId,
    oldName,
    newName,
    undo(sdk) {
      sdk._renameInternal(itemId, oldName);
    },
    redo(sdk) {
      sdk._renameInternal(itemId, newName);
    }
  };
}

/**
 * Creates a command representing an item move.
 *
 * @param {string} itemId - ID of moved item.
 * @param {string} oldParentId - Previous parent folder ID.
 * @param {string} newParentId - New parent folder ID.
 * @returns {Object} Command object.
 */
export function moveItemCommand(itemId, oldParentId, newParentId) {
  return {
    type: 'MOVE',
    description: 'Move item',
    itemId,
    oldParentId,
    newParentId,
    undo(sdk) {
      sdk._moveInternal(itemId, oldParentId);
    },
    redo(sdk) {
      sdk._moveInternal(itemId, newParentId);
    }
  };
}

/**
 * Creates a command representing a deletion of an item and its descendants.
 *
 * @param {Array<Object>} deletedItems - Array of all deleted items (item + descendants).
 * @returns {Object} Command object.
 */
export function deleteItemCommand(deletedItems) {
  const clonedItems = deepClone(deletedItems);
  const rootDeleted = clonedItems[0];
  return {
    type: 'DELETE',
    description: `Delete ${rootDeleted.type} "${rootDeleted.name}"`,
    deletedItems: clonedItems,
    undo(sdk) {
      sdk._restoreInternal(clonedItems);
    },
    redo(sdk) {
      sdk._deleteInternal(rootDeleted.id);
    }
  };
}

/**
 * Creates a compound transaction command representing multiple operations.
 *
 * @param {Array<Object>} commands - Array of constituent commands.
 * @param {string} [description='Transaction'] - Description.
 * @returns {Object} Command object.
 */
export function transactionCommand(commands, description = 'Atomic transaction') {
  return {
    type: 'TRANSACTION',
    description,
    commands,
    undo(sdk) {
      // Execute in reverse order
      for (let i = commands.length - 1; i >= 0; i--) {
        commands[i].undo(sdk);
      }
    },
    redo(sdk) {
      // Execute in forward order
      for (let i = 0; i < commands.length; i++) {
        commands[i].redo(sdk);
      }
    }
  };
}

/**
 * Manages the undo and redo stacks.
 */
export class HistoryManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Pushes a successful command onto the undo stack and clears redo stack.
   *
   * @param {Object} command - Command to record.
   */
  push(command) {
    this.undoStack.push(command);
    this.redoStack = [];
  }

  /**
   * Checks if undo is possible.
   * @returns {boolean}
   */
  canUndo() {
    return this.undoStack.length > 0;
  }

  /**
   * Checks if redo is possible.
   * @returns {boolean}
   */
  canRedo() {
    return this.redoStack.length > 0;
  }

  /**
   * Undoes the most recent command.
   *
   * @param {Object} sdk - The SDK instance.
   * @returns {Object|null} The undone command, or null if empty.
   */
  undo(sdk) {
    if (!this.canUndo()) {
      return null;
    }

    const command = this.undoStack.pop();
    command.undo(sdk);
    this.redoStack.push(command);
    return command;
  }

  /**
   * Redoes the most recently undone command.
   *
   * @param {Object} sdk - The SDK instance.
   * @returns {Object|null} The redone command, or null if empty.
   */
  redo(sdk) {
    if (!this.canRedo()) {
      return null;
    }

    const command = this.redoStack.pop();
    command.redo(sdk);
    this.undoStack.push(command);
    return command;
  }

  /**
   * Clears undo and redo stacks.
   */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}

