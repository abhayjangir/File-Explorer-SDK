/**
 * Custom Error class for FileExplorerSDK errors.
 * Provides machine-readable error codes and human-readable messages.
 */
export class FileExplorerError extends Error {
  /**
   * @param {string} code - Machine-readable error code.
   * @param {string} message - Human-readable explanation.
   * @param {Object} [details={}] - Optional contextual details.
   */
  constructor(code, message, details = {}) {
    super(message);
    this.name = 'FileExplorerError';
    this.code = code;
    this.details = details;
  }
}

export const ErrorCodes = {
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  PARENT_NOT_FOUND: 'PARENT_NOT_FOUND',
  INVALID_NAME: 'INVALID_NAME',
  DUPLICATE_NAME: 'DUPLICATE_NAME',
  CANNOT_CONTAIN_CHILDREN: 'CANNOT_CONTAIN_CHILDREN',
  INVALID_OPERATION_ON_ROOT: 'INVALID_OPERATION_ON_ROOT',
  CANNOT_MOVE_INTO_SELF: 'CANNOT_MOVE_INTO_SELF',
  CANNOT_MOVE_INTO_DESCENDANT: 'CANNOT_MOVE_INTO_DESCENDANT',
  INVALID_SEARCH_OPTIONS: 'INVALID_SEARCH_OPTIONS',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INVALID_ARGUMENT: 'INVALID_ARGUMENT'
};

