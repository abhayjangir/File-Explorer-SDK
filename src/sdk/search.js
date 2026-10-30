import { FileExplorerError, ErrorCodes } from './errors.js';
import { deepClone } from './validation.js';

/**
 * Computes the full path of an item by traversing up to the root.
 *
 * @param {Map<string, Object>} items - Map of items.
 * @param {Object} item - Target item.
 * @returns {string} Hierarchical path, e.g. "My Files/Documents/Resume.pdf"
 */
export function buildItemPath(items, item) {
  const segments = [item.name];
  let curr = item;

  while (curr.parentId) {
    curr = items.get(curr.parentId);
    if (!curr) break;
    segments.unshift(curr.name);
  }

  return segments.join('/');
}

/**
 * Validates search options and assigns defaults.
 *
 * @param {Object} options - Search options.
 * @returns {Object} Validated options with defaults.
 * @throws {FileExplorerError}
 */
export function validateSearchOptions(options = {}) {
  const {
    type = 'all',
    sortBy = 'name',
    order = 'asc',
    page = 1,
    limit = 10
  } = options;

  if (!['all', 'file', 'folder'].includes(type)) {
    throw new FileExplorerError(
      ErrorCodes.INVALID_SEARCH_OPTIONS,
      `Invalid search type "${type}". Must be "all", "file", or "folder".`
    );
  }

  if (!['name', 'type', 'updatedAt', 'createdAt'].includes(sortBy)) {
    throw new FileExplorerError(
      ErrorCodes.INVALID_SEARCH_OPTIONS,
      `Invalid sortBy field "${sortBy}". Must be "name", "type", "updatedAt", or "createdAt".`
    );
  }

  if (!['asc', 'desc'].includes(order.toLowerCase())) {
    throw new FileExplorerError(
      ErrorCodes.INVALID_SEARCH_OPTIONS,
      `Invalid sort order "${order}". Must be "asc" or "desc".`
    );
  }

  const numPage = Number(page);
  const numLimit = Number(limit);

  if (!Number.isInteger(numPage) || numPage < 1) {
    throw new FileExplorerError(
      ErrorCodes.INVALID_SEARCH_OPTIONS,
      `Invalid page "${page}". Must be a positive integer greater than or equal to 1.`
    );
  }

  if (!Number.isInteger(numLimit) || numLimit < 1) {
    throw new FileExplorerError(
      ErrorCodes.INVALID_SEARCH_OPTIONS,
      `Invalid limit "${limit}". Must be a positive integer greater than or equal to 1.`
    );
  }

  return {
    type,
    sortBy,
    order: order.toLowerCase(),
    page: numPage,
    limit: numLimit
  };
}

/**
 * Searches items in the file system with filtering, sorting, and pagination.
 *
 * @param {Map<string, Object>} items - Map of items.
 * @param {string} [query=''] - Search query string.
 * @param {Object} [options={}] - Search options.
 * @returns {Object} Search result containing items and pagination metadata.
 */
export function searchItems(items, query = '', options = {}) {
  if (typeof query !== 'string') {
    throw new FileExplorerError(
      ErrorCodes.INVALID_SEARCH_OPTIONS,
      'Search query must be a string.'
    );
  }

  const validatedOptions = validateSearchOptions(options);
  const normalizedQuery = query.trim().toLowerCase();

  const matched = [];

  for (const item of items.values()) {
    // Exclude the root folder from search results if desired, or include:
    // Usually searching matches user files & subfolders, let's include if matches
    // Type filter
    if (validatedOptions.type !== 'all' && item.type !== validatedOptions.type) {
      continue;
    }

    // Name match (case-insensitive substring)
    if (normalizedQuery.length > 0 && !item.name.toLowerCase().includes(normalizedQuery)) {
      continue;
    }

    // Prepare result object with path
    const resultItem = deepClone(item);
    resultItem.path = buildItemPath(items, item);
    matched.push(resultItem);
  }

  // Sort matched items
  matched.sort((a, b) => {
    let valA = a[validatedOptions.sortBy];
    let valB = b[validatedOptions.sortBy];

    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB || '').toLowerCase();
      const comp = valA.localeCompare(valB);
      return validatedOptions.order === 'asc' ? comp : -comp;
    }

    if (valA < valB) return validatedOptions.order === 'asc' ? -1 : 1;
    if (valA > valB) return validatedOptions.order === 'asc' ? 1 : -1;
    return 0;
  });

  const total = matched.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / validatedOptions.limit);
  const startIndex = (validatedOptions.page - 1) * validatedOptions.limit;
  const paginatedResults = matched.slice(startIndex, startIndex + validatedOptions.limit);

  return {
    results: paginatedResults,
    total,
    page: validatedOptions.page,
    limit: validatedOptions.limit,
    totalPages
  };
}

