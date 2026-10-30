import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom React Hook that integrates React with FileExplorerSDK.
 * Ensures the SDK remains the single source of truth while React
 * manages only UI state and subscribes to file-system changes.
 *
 * @param {import('../sdk/FileExplorerSDK.js').FileExplorerSDK} sdk - The SDK instance.
 * @returns {Object} React-friendly state and actions.
 */
export function useFileExplorer(sdk) {
  // Tree state derived from SDK
  const [tree, setTree] = useState(() => (sdk ? sdk.getTree() : null));
  const [canUndo, setCanUndo] = useState(() => (sdk ? sdk.canUndo() : false));
  const [canRedo, setCanRedo] = useState(() => (sdk ? sdk.canRedo() : false));
  const [activities, setActivities] = useState(() => (sdk ? sdk.getRecentActivity(25) : []));
  const [lastNotification, setLastNotification] = useState(null);
  const [error, setError] = useState(null);

  // Sync state whenever SDK fires a notification
  const refreshFromSdk = useCallback(() => {
    if (!sdk) return;
    try {
      setTree(sdk.getTree());
      setCanUndo(sdk.canUndo());
      setCanRedo(sdk.canRedo());
      setActivities(sdk.getRecentActivity(25));
    } catch (err) {
      console.error('Failed to refresh from SDK:', err);
    }
  }, [sdk]);

  // Handle subscription lifecycle & cleanup
  useEffect(() => {
    if (!sdk) return;

    // Refresh immediately on mount / sdk change
    refreshFromSdk();

    const handleNotification = (event) => {
      setLastNotification(event);
      refreshFromSdk();
    };

    const unsubscribe = sdk.subscribe(handleNotification);

    return () => {
      // Clean up subscription properly
      unsubscribe();
    };
  }, [sdk, refreshFromSdk]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Action wrappers with error capture
  const createFile = useCallback(
    (parentId, name, metadata) => {
      try {
        clearError();
        return sdk.createFile(parentId, name, metadata);
      } catch (err) {
        setError(err.message || 'Failed to create file');
        throw err;
      }
    },
    [sdk, clearError]
  );

  const createFolder = useCallback(
    (parentId, name, metadata) => {
      try {
        clearError();
        return sdk.createFolder(parentId, name, metadata);
      } catch (err) {
        setError(err.message || 'Failed to create folder');
        throw err;
      }
    },
    [sdk, clearError]
  );

  const renameItem = useCallback(
    (id, newName) => {
      try {
        clearError();
        return sdk.renameItem(id, newName);
      } catch (err) {
        setError(err.message || 'Failed to rename item');
        throw err;
      }
    },
    [sdk, clearError]
  );

  const moveItem = useCallback(
    (id, targetParentId) => {
      try {
        clearError();
        return sdk.moveItem(id, targetParentId);
      } catch (err) {
        setError(err.message || 'Failed to move item');
        throw err;
      }
    },
    [sdk, clearError]
  );

  const deleteItem = useCallback(
    (id) => {
      try {
        clearError();
        return sdk.deleteItem(id);
      } catch (err) {
        setError(err.message || 'Failed to delete item');
        throw err;
      }
    },
    [sdk, clearError]
  );

  const undo = useCallback(() => {
    try {
      clearError();
      return sdk.undo();
    } catch (err) {
      setError(err.message || 'Failed to undo');
      throw err;
    }
  }, [sdk, clearError]);

  const redo = useCallback(() => {
    try {
      clearError();
      return sdk.redo();
    } catch (err) {
      setError(err.message || 'Failed to redo');
      throw err;
    }
  }, [sdk, clearError]);

  const search = useCallback(
    (query, options) => {
      return sdk.search(query, options);
    },
    [sdk]
  );

  const getItem = useCallback(
    (id) => {
      return sdk.getItem(id);
    },
    [sdk]
  );

  const getItemPath = useCallback(
    (id) => {
      return sdk.getItemPath(id);
    },
    [sdk]
  );

  const deleteMultiple = useCallback(
    (ids) => {
      try {
        clearError();
        return sdk.deleteMultiple(ids);
      } catch (err) {
        setError(err.message || 'Failed to delete multiple items');
        throw err;
      }
    },
    [sdk, clearError]
  );

  return {
    tree,
    canUndo,
    canRedo,
    activities,
    lastNotification,
    error,
    clearError,
    createFile,
    createFolder,
    renameItem,
    moveItem,
    deleteItem,
    undo,
    redo,
    search,
    getItem,
    getItemPath,
    deleteMultiple
  };
}

