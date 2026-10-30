import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search as SearchIcon,
  X,
  File,
  Folder,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export function SearchPanel({
  searchFn,
  onSelectResult,
  onClose,
  version = 0
}) {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [order, setOrder] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit] = useState(6);

  // Execute search through SDK search function
  const searchResult = useMemo(() => {
    try {
      return searchFn(query, {
        type,
        sortBy,
        order,
        page,
        limit
      });
    } catch (err) {
      console.error('Search error:', err);
      return { results: [], total: 0, page: 1, limit, totalPages: 0 };
    }
  }, [searchFn, query, type, sortBy, order, page, limit, version]);

  // Reset to page 1 when query or filters change
  const handleQueryChange = (e) => {
    setQuery(e.target.value);
    setPage(1);
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    setPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setPage(1);
  };

  const toggleOrder = () => {
    setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    setPage(1);
  };

  const handleClear = () => {
    setQuery('');
    setPage(1);
  };

  return (
    <div className="search-panel">
      <div className="search-panel-header">
        <div className="search-panel-title">
          <SearchIcon size={16} />
          <span>Hierarchy Search</span>
        </div>
        <button
          type="button"
          className="btn-icon-sm"
          onClick={onClose}
          title="Close search panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* Query input */}
      <div className="search-input-wrapper">
        <SearchIcon className="search-input-icon" size={16} />
        <input
          type="text"
          className="search-input"
          placeholder="Search files and folders..."
          value={query}
          onChange={handleQueryChange}
          autoFocus
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={handleClear}
            title="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter and Sort controls */}
      <div className="search-controls">
        <div className="filter-group">
          <span className="filter-label">Filter:</span>
          <button
            type="button"
            className={`filter-pill ${type === 'all' ? 'active' : ''}`}
            onClick={() => handleTypeChange('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`filter-pill ${type === 'file' ? 'active' : ''}`}
            onClick={() => handleTypeChange('file')}
          >
            Files
          </button>
          <button
            type="button"
            className={`filter-pill ${type === 'folder' ? 'active' : ''}`}
            onClick={() => handleTypeChange('folder')}
          >
            Folders
          </button>
        </div>

        <div className="sort-group">
          <span className="filter-label">Sort:</span>
          <select
            className="sort-select"
            value={sortBy}
            onChange={handleSortChange}
          >
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="updatedAt">Modified</option>
            <option value="createdAt">Created</option>
          </select>
          <button
            type="button"
            className="btn-order"
            onClick={toggleOrder}
            title={`Order: ${order.toUpperCase()}`}
          >
            <ArrowUpDown size={14} />
            <span>{order.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Search result count */}
      <div className="search-summary">
        {searchResult.total} {searchResult.total === 1 ? 'item found' : 'items found'}
      </div>

      {/* Search results list */}
      <div className="search-results-list">
        {searchResult.results.length === 0 ? (
          <div className="search-empty">
            <p>No matching items found</p>
            {query && <small>Try searching with another keyword</small>}
          </div>
        ) : (
          searchResult.results.map((item) => (
            <div
              key={item.id}
              className="search-result-item"
              onClick={() => onSelectResult(item)}
              role="button"
              tabIndex={0}
            >
              <div className="search-item-icon">
                {item.type === 'folder' ? (
                  <Folder className="folder-closed" size={18} />
                ) : (
                  <File className="file-generic" size={18} />
                )}
              </div>
              <div className="search-item-info">
                <div className="search-item-name-row">
                  <span className="search-item-name">{item.name}</span>
                  <span className={`item-badge ${item.type}`}>
                    {item.type}
                  </span>
                </div>
                <div className="search-item-path" title={item.path}>
                  {item.path}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination controls */}
      {searchResult.totalPages > 1 && (
        <div className="search-pagination">
          <button
            type="button"
            className="btn-page"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <span className="page-indicator">
            Page {searchResult.page} of {searchResult.totalPages}
          </span>

          <button
            type="button"
            className="btn-page"
            disabled={page >= searchResult.totalPages}
            onClick={() => setPage((p) => Math.min(searchResult.totalPages, p + 1))}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

