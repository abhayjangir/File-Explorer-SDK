import { FileExplorerError, ErrorCodes } from './errors.js';

/**
 * Deep clones an object or array to prevent external mutations.
 * Handles dates, primitives, arrays, and plain objects.
 *
 * @param {*} value - Value to clone.
 * @returns {*} Cloned value.
 */
export function deepClone(value) {
  if (value === null || typeof value !== 'object') {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (Array.isArray(value)) {
    return value.map(deepClone);
  }

  const cloned = {};
  for (const key of Object.keys(value)) {
    cloned[key] = deepClone(value[key]);
  }
  return cloned;
}

/**
 * Validates that an item name is valid.
 *
 * @param {string} name - Name to validate.
 * @throws {FileExplorerError}
 */
export function validateItemName(name) {
  if (typeof name !== 'string' || name.trim().length === 0) {
    throw new FileExplorerError(
      ErrorCodes.INVALID_NAME,
      'Item name must be a non-empty string.'
    );
  }

  const trimmed = name.trim();
  if (trimmed.includes('/') || trimmed.includes('\\')) {
    throw new FileExplorerError(
      ErrorCodes.INVALID_NAME,
      'Item name cannot contain "/" or "\\".'
    );
  }

  return trimmed;
}

/**
 * Validates that an item name is unique within a parent folder, case-insensitively.
 *
 * @param {Map<string, Object>} items - Map of items.
 * @param {string} parentId - Parent folder ID.
 * @param {string} name - Name to check.
 * @param {string|null} [excludeId=null] - Item ID to exclude (e.g. during rename).
 * @throws {FileExplorerError}
 */
export function validateNameUniqueness(items, parentId, name, excludeId = null) {
  const normalizedName = name.trim().toLowerCase();

  for (const item of items.values()) {
    if (item.parentId === parentId && item.id !== excludeId) {
      if (item.name.toLowerCase() === normalizedName) {
        throw new FileExplorerError(
          ErrorCodes.DUPLICATE_NAME,
          `An item named "${name}" already exists in the destination folder.`
        );
      }
    }
  }
}

/**
 * Validates that a parent exists and is a folder.
 *
 * @param {Map<string, Object>} items - Map of items.
 * @param {string} parentId - Parent ID.
 * @returns {Object} The parent item.
 * @throws {FileExplorerError}
 */
export function validateParentFolder(items, parentId) {
  const parent = items.get(parentId);
  if (!parent) {
    throw new FileExplorerError(
      ErrorCodes.PARENT_NOT_FOUND,
      `Parent folder with ID "${parentId}" was not found.`
    );
  }

  if (parent.type !== 'folder') {
    throw new FileExplorerError(
      ErrorCodes.CANNOT_CONTAIN_CHILDREN,
      `Cannot add items inside "${parent.name}" because it is a file, not a folder.`
    );
  }

  return parent;
}

/**
 * Validates whether moving an item into targetParentId is valid:
 * - Target parent must exist and be a folder.
 * - Cannot move into itself.
 * - Cannot move into a descendant.
 * - Name must be unique in target folder.
 *
 * @param {Map<string, Object>} items - Map of items.
 * @param {string} itemId - ID of item to move.
 * @param {string} targetParentId - Target parent ID.
 * @param {string} rootId - Root folder ID.
 * @throws {FileExplorerError}
 */
export function validateMove(items, itemId, targetParentId, rootId) {
  const item = items.get(itemId);
  if (!item) {
    throw new FileExplorerError(
      ErrorCodes.ITEM_NOT_FOUND,
      `Item with ID "${itemId}" was not found.`
    );
  }

  if (item.id === rootId) {
    throw new FileExplorerError(
      ErrorCodes.INVALID_OPERATION_ON_ROOT,
      'The root folder cannot be moved.'
    );
  }

  if (itemId === targetParentId) {
    throw new FileExplorerError(
      ErrorCodes.CANNOT_MOVE_INTO_SELF,
      'A folder cannot be moved inside itself.'
    );
  }

  const targetParent = validateParentFolder(items, targetParentId);

  // Check if targetParentId is a descendant of itemId
  let curr = targetParent;
  while (curr) {
    if (curr.id === itemId) {
      throw new FileExplorerError(
        ErrorCodes.CANNOT_MOVE_INTO_DESCENDANT,
        'A folder cannot be moved inside one of its descendants.'
      );
    }
    curr = curr.parentId ? items.get(curr.parentId) : null;
  }

  // Check for duplicate name in target folder (if changing parents)
  validateNameUniqueness(items, targetParentId, item.name, itemId);
}

