import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FileExplorerSDK, DEFAULT_INITIAL_DATA } from '../src/sdk/index.js';
import { ErrorCodes } from '../src/sdk/errors.js';

describe('FileExplorerSDK', () => {
  let sdk;

  beforeEach(() => {
    sdk = new FileExplorerSDK();
  });

  describe('Initial State & Sample Hierarchy', () => {
    it('initializes with root folder and expected sample structure', () => {
      const root = sdk.getItem('root');
      expect(root).toBeDefined();
      expect(root.name).toBe('My Files');
      expect(root.type).toBe('folder');
      expect(root.parentId).toBeNull();

      const docs = sdk.getItem('folder-documents');
      expect(docs).toBeDefined();
      expect(docs.name).toBe('Documents');
      expect(docs.parentId).toBe('root');

      const resume = sdk.getItem('file-resume');
      expect(resume).toBeDefined();
      expect(resume.name).toBe('Resume.pdf');
      expect(resume.type).toBe('file');
      expect(resume.parentId).toBe('folder-documents');

      const images = sdk.getItem('folder-images');
      expect(images).toBeDefined();
      expect(images.name).toBe('Images');

      const notes = sdk.getItem('file-notes');
      expect(notes).toBeDefined();
      expect(notes.name).toBe('Notes.txt');
      expect(notes.parentId).toBe('root');
    });
  });

  describe('Tree Construction & Hierarchy Retrieval', () => {
    it('returns recursive tree with nested children', () => {
      const tree = sdk.getTree();
      expect(tree.id).toBe('root');
      expect(tree.name).toBe('My Files');
      expect(Array.isArray(tree.children)).toBe(true);

      const docsNode = tree.children.find((c) => c.id === 'folder-documents');
      expect(docsNode).toBeDefined();
      expect(docsNode.children.length).toBe(2);
      expect(docsNode.children.some((c) => c.name === 'Resume.pdf')).toBe(true);
      expect(docsNode.children.some((c) => c.name === 'Project Plan.docx')).toBe(true);
    });

    it('returns direct children with getChildren()', () => {
      const children = sdk.getChildren('folder-documents');
      expect(children.length).toBe(2);
      expect(children.map((c) => c.name)).toContain('Resume.pdf');
      expect(children.map((c) => c.name)).toContain('Project Plan.docx');
    });

    it('throws error when getting children of non-existent folder or file', () => {
      expect(() => sdk.getChildren('non-existent')).toThrowError();
      expect(() => sdk.getChildren('file-notes')).toThrowError();
    });
  });

  describe('Item Lookup & Immutability', () => {
    it('returns defensive copy of item', () => {
      const item = sdk.getItem('file-notes');
      expect(item).not.toBeNull();
      expect(item.id).toBe('file-notes');
      expect(item.name).toBe('Notes.txt');

      // Mutation test: modifying returned object must not mutate SDK
      item.name = 'Hacked.txt';
      const fetchedAgain = sdk.getItem('file-notes');
      expect(fetchedAgain.name).toBe('Notes.txt');
    });

    it('returns null for non-existent item', () => {
      expect(sdk.getItem('does-not-exist')).toBeNull();
    });
  });

  describe('File & Folder Creation', () => {
    it('creates file inside folder and returns item', () => {
      const file = sdk.createFile('folder-documents', 'Budget.xlsx', { size: 5000 });
      expect(file.id).toBeDefined();
      expect(file.name).toBe('Budget.xlsx');
      expect(file.type).toBe('file');
      expect(file.parentId).toBe('folder-documents');
      expect(file.size).toBe(5000);

      const retrieved = sdk.getItem(file.id);
      expect(retrieved.name).toBe('Budget.xlsx');
    });

    it('creates folder inside parent folder', () => {
      const folder = sdk.createFolder('root', 'Archive');
      expect(folder.id).toBeDefined();
      expect(folder.name).toBe('Archive');
      expect(folder.type).toBe('folder');
      expect(folder.parentId).toBe('root');

      const retrieved = sdk.getItem(folder.id);
      expect(retrieved.name).toBe('Archive');
    });
  });

  describe('Renaming Items', () => {
    it('renames file and preserves ID and parent', () => {
      const original = sdk.getItem('file-notes');
      const updated = sdk.renameItem('file-notes', 'QuickNotes.txt');

      expect(updated.id).toBe(original.id);
      expect(updated.parentId).toBe(original.parentId);
      expect(updated.name).toBe('QuickNotes.txt');
      expect(updated.updatedAt).toBeGreaterThanOrEqual(original.updatedAt);
    });

    it('renames folder successfully', () => {
      const updated = sdk.renameItem('folder-images', 'Pictures');
      expect(updated.name).toBe('Pictures');
      expect(sdk.getItem('folder-images').name).toBe('Pictures');
    });

    it('prevents renaming root folder', () => {
      expect(() => sdk.renameItem('root', 'New Root')).toThrowError();
    });
  });

  describe('Moving Items', () => {
    it('moves file to another folder and preserves ID', () => {
      const moved = sdk.moveItem('file-resume', 'folder-images');
      expect(moved.id).toBe('file-resume');
      expect(moved.parentId).toBe('folder-images');

      const resume = sdk.getItem('file-resume');
      expect(resume.parentId).toBe('folder-images');
    });

    it('moves folder to another folder', () => {
      const newFolder = sdk.createFolder('root', 'Work');
      const moved = sdk.moveItem('folder-documents', newFolder.id);
      expect(moved.parentId).toBe(newFolder.id);
    });
  });

  describe('File Deletion', () => {
    it('deletes a single file', () => {
      const deleted = sdk.deleteItem('file-notes');
      expect(deleted.length).toBe(1);
      expect(deleted[0].id).toBe('file-notes');
      expect(sdk.getItem('file-notes')).toBeNull();
    });
  });

  describe('Folder Deletion with Descendants', () => {
    it('deletes folder and all its descendants recursively', () => {
      const deleted = sdk.deleteItem('folder-documents');
      // folder-documents + Resume.pdf + Project Plan.docx = 3 items
      expect(deleted.length).toBe(3);
      expect(deleted.map((d) => d.id)).toContain('folder-documents');
      expect(deleted.map((d) => d.id)).toContain('file-resume');
      expect(deleted.map((d) => d.id)).toContain('file-project-plan');

      expect(sdk.getItem('folder-documents')).toBeNull();
      expect(sdk.getItem('file-resume')).toBeNull();
      expect(sdk.getItem('file-project-plan')).toBeNull();
    });

    it('prevents deleting root folder', () => {
      expect(() => sdk.deleteItem('root')).toThrowError();
    });
  });

  describe('Name Uniqueness & Case-Insensitivity', () => {
    it('prevents duplicate names in same folder', () => {
      expect(() => {
        sdk.createFile('folder-documents', 'Resume.pdf');
      }).toThrowError();
    });

    it('prevents duplicate names case-insensitively in same folder', () => {
      expect(() => {
        sdk.createFile('folder-documents', 'resume.pdf');
      }).toThrowError();

      expect(() => {
        sdk.createFile('folder-documents', 'RESUME.PDF');
      }).toThrowError();
    });

    it('allows same name in different folders', () => {
      const fileInRoot = sdk.createFile('root', 'Resume.pdf');
      expect(fileInRoot.name).toBe('Resume.pdf');
      expect(fileInRoot.parentId).toBe('root');
      expect(sdk.getItem('file-resume').parentId).toBe('folder-documents');
    });
  });

  describe('Type Enforcement & Child Restrictions', () => {
    it('throws error when trying to create file inside a file', () => {
      expect(() => {
        sdk.createFile('file-notes', 'SubNote.txt');
      }).toThrowError();
    });

    it('throws error when trying to create folder inside a file', () => {
      expect(() => {
        sdk.createFolder('file-notes', 'SubFolder');
      }).toThrowError();
    });
  });

  describe('Cycle Detection & Move Validation', () => {
    it('prevents moving folder into itself', () => {
      expect(() => {
        sdk.moveItem('folder-documents', 'folder-documents');
      }).toThrowError();
    });

    it('prevents moving folder into its own descendant', () => {
      const subFolder = sdk.createFolder('folder-documents', 'Contracts');
      const deepSubFolder = sdk.createFolder(subFolder.id, '2026');

      expect(() => {
        sdk.moveItem('folder-documents', deepSubFolder.id);
      }).toThrowError();
    });

    it('prevents moving into a file', () => {
      expect(() => {
        sdk.moveItem('folder-documents', 'file-notes');
      }).toThrowError();
    });
  });

  describe('Error Handling on Invalid Identifiers', () => {
    it('throws error when renaming non-existent item', () => {
      expect(() => sdk.renameItem('non-existent', 'Test')).toThrowError();
    });

    it('throws error when moving non-existent item', () => {
      expect(() => sdk.moveItem('non-existent', 'root')).toThrowError();
    });

    it('throws error when moving item to non-existent parent', () => {
      expect(() => sdk.moveItem('file-notes', 'non-existent')).toThrowError();
    });

    it('throws error when deleting non-existent item', () => {
      expect(() => sdk.deleteItem('non-existent')).toThrowError();
    });
  });

  describe('Identifier Stability', () => {
    it('maintains original ID after rename and move', () => {
      const original = sdk.getItem('file-notes');
      const renamed = sdk.renameItem('file-notes', 'Notes-Updated.txt');
      expect(renamed.id).toBe(original.id);

      const moved = sdk.moveItem('file-notes', 'folder-images');
      expect(moved.id).toBe(original.id);

      const finalItem = sdk.getItem('file-notes');
      expect(finalItem.id).toBe(original.id);
      expect(finalItem.name).toBe('Notes-Updated.txt');
      expect(finalItem.parentId).toBe('folder-images');
    });
  });

  describe('Defensive Copying & Mutation Protection', () => {
    it('mutating tree returned by getTree does not affect internal SDK state', () => {
      const tree = sdk.getTree();
      tree.name = 'Corrupted Root';
      tree.children[0].name = 'Corrupted Child';
      delete tree.children;

      const freshTree = sdk.getTree();
      expect(freshTree.name).toBe('My Files');
      expect(freshTree.children.length).toBeGreaterThan(0);
      expect(freshTree.children[0].name).not.toBe('Corrupted Child');
    });
  });

  describe('Hierarchical Search, Sorting & Pagination', () => {
    it('searches nested items case-insensitively', () => {
      const result = sdk.search('resume');
      expect(result.total).toBe(1);
      expect(result.results[0].name).toBe('Resume.pdf');
      expect(result.results[0].path).toBe('My Files/Documents/Resume.pdf');
    });

    it('filters by type: file, folder, all', () => {
      const filesOnly = sdk.search('', { type: 'file' });
      expect(filesOnly.results.every((r) => r.type === 'file')).toBe(true);

      const foldersOnly = sdk.search('', { type: 'folder' });
      expect(foldersOnly.results.every((r) => r.type === 'folder')).toBe(true);
    });

    it('sorts results ascending and descending', () => {
      const asc = sdk.search('', { sortBy: 'name', order: 'asc', limit: 100 });
      const desc = sdk.search('', { sortBy: 'name', order: 'desc', limit: 100 });

      expect(asc.results[0].name.toLowerCase() <= asc.results[1].name.toLowerCase()).toBe(true);
      expect(desc.results[0].name.toLowerCase() >= desc.results[1].name.toLowerCase()).toBe(true);
    });

    it('paginates search results accurately', () => {
      const page1 = sdk.search('', { page: 1, limit: 2 });
      expect(page1.results.length).toBe(2);
      expect(page1.page).toBe(1);
      expect(page1.limit).toBe(2);
      expect(page1.totalPages).toBeGreaterThan(1);

      const page2 = sdk.search('', { page: 2, limit: 2 });
      expect(page2.results.length).toBe(2);
      expect(page2.page).toBe(2);
      expect(page1.results[0].id).not.toBe(page2.results[0].id);
    });

    it('throws error for invalid search options', () => {
      expect(() => sdk.search('', { type: 'invalid' })).toThrowError();
      expect(() => sdk.search('', { page: 0 })).toThrowError();
      expect(() => sdk.search('', { limit: -5 })).toThrowError();
      expect(() => sdk.search('', { sortBy: 'unknown' })).toThrowError();
    });

    it('reflects mutations immediately in search results', () => {
      sdk.createFile('root', 'TestSearchItem.pdf');
      const searchAfterCreate = sdk.search('TestSearchItem');
      expect(searchAfterCreate.total).toBe(1);
      expect(searchAfterCreate.results[0].name).toBe('TestSearchItem.pdf');

      sdk.deleteItem(searchAfterCreate.results[0].id);
      const searchAfterDelete = sdk.search('TestSearchItem');
      expect(searchAfterDelete.total).toBe(0);
    });
  });

  describe('Command-Pattern Undo and Redo', () => {
    it('undos and redoes file creation', () => {
      const file = sdk.createFile('root', 'UndoFile.txt');
      expect(sdk.getItem(file.id)).toBeDefined();

      const undoResult = sdk.undo();
      expect(undoResult.success).toBe(true);
      expect(sdk.getItem(file.id)).toBeNull();

      const redoResult = sdk.redo();
      expect(redoResult.success).toBe(true);
      expect(sdk.getItem(file.id)).toBeDefined();
    });

    it('undos and redoes renaming', () => {
      sdk.renameItem('file-notes', 'RenamedNotes.txt');
      expect(sdk.getItem('file-notes').name).toBe('RenamedNotes.txt');

      sdk.undo();
      expect(sdk.getItem('file-notes').name).toBe('Notes.txt');

      sdk.redo();
      expect(sdk.getItem('file-notes').name).toBe('RenamedNotes.txt');
    });

    it('undos and redoes moving', () => {
      sdk.moveItem('file-notes', 'folder-images');
      expect(sdk.getItem('file-notes').parentId).toBe('folder-images');

      sdk.undo();
      expect(sdk.getItem('file-notes').parentId).toBe('root');

      sdk.redo();
      expect(sdk.getItem('file-notes').parentId).toBe('folder-images');
    });

    it('restores entire nested folder hierarchy on undoing folder deletion', () => {
      sdk.deleteItem('folder-documents');
      expect(sdk.getItem('folder-documents')).toBeNull();
      expect(sdk.getItem('file-resume')).toBeNull();
      expect(sdk.getItem('file-project-plan')).toBeNull();

      const undoRes = sdk.undo();
      expect(undoRes.success).toBe(true);

      const restoredDocs = sdk.getItem('folder-documents');
      expect(restoredDocs).toBeDefined();
      expect(restoredDocs.name).toBe('Documents');

      const restoredResume = sdk.getItem('file-resume');
      expect(restoredResume).toBeDefined();
      expect(restoredResume.name).toBe('Resume.pdf');
      expect(restoredResume.parentId).toBe('folder-documents');

      const restoredPlan = sdk.getItem('file-project-plan');
      expect(restoredPlan).toBeDefined();
      expect(restoredPlan.parentId).toBe('folder-documents');

      // Verify tree structure
      const tree = sdk.getTree();
      const docsInTree = tree.children.find((c) => c.id === 'folder-documents');
      expect(docsInTree.children.length).toBe(2);
    });

    it('clears redo stack when new operation occurs after undo', () => {
      sdk.createFile('root', 'A.txt');
      sdk.undo();
      expect(sdk.canRedo()).toBe(true);

      sdk.createFile('root', 'B.txt');
      expect(sdk.canRedo()).toBe(false);

      const redoRes = sdk.redo();
      expect(redoRes.success).toBe(false);
    });

    it('handles empty undo and redo histories gracefully', () => {
      expect(sdk.canUndo()).toBe(false);
      expect(sdk.canRedo()).toBe(false);

      expect(sdk.undo()).toEqual({ success: false, command: null });
      expect(sdk.redo()).toEqual({ success: false, command: null });
    });

    it('failed operations do not change state or add history entries', () => {
      expect(sdk.canUndo()).toBe(false);

      // Attempt invalid duplicate creation
      expect(() => sdk.createFile('folder-documents', 'Resume.pdf')).toThrowError();

      // Ensure no history was created
      expect(sdk.canUndo()).toBe(false);
      expect(sdk.undo().success).toBe(false);
    });
  });

  describe('Event Subscriptions & Change Notifications', () => {
    it('notifies subscriber on mutation', () => {
      const listener = vi.fn();
      sdk.subscribe(listener);

      sdk.createFile('root', 'SubTest.txt');
      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0][0];
      expect(event.type).toBe('CREATE');
      expect(event.item.name).toBe('SubTest.txt');
    });

    it('allows unsubscribing with cleanup function', () => {
      const listener = vi.fn();
      const unsubscribe = sdk.subscribe(listener);

      sdk.createFile('root', 'One.txt');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();

      sdk.createFile('root', 'Two.txt');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('supports multiple independent subscribers', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const unsub1 = sdk.subscribe(listener1);
      sdk.subscribe(listener2);

      sdk.createFile('root', 'Multi.txt');
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);

      unsub1();

      sdk.createFile('root', 'Multi2.txt');
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(2);
    });

    it('listener errors do not crash SDK or disrupt other listeners', () => {
      const badListener = vi.fn(() => {
        throw new Error('Listener crash');
      });
      const goodListener = vi.fn();

      sdk.subscribe(badListener);
      sdk.subscribe(goodListener);

      expect(() => {
        sdk.createFile('root', 'CrashTest.txt');
      }).not.toThrow();

      expect(goodListener).toHaveBeenCalledTimes(1);
    });
  });

  describe('Atomic Transactions & Bulk Operations', () => {
    it('commits all operations in transaction and counts as 1 undoable unit', () => {
      sdk.transaction((tx) => {
        const f1 = tx.createFolder('root', 'TxFolder');
        tx.createFile(f1.id, 'TxFile1.txt');
        tx.createFile(f1.id, 'TxFile2.txt');
      });

      const txFolderSearch = sdk.search('TxFolder');
      expect(txFolderSearch.total).toBe(1);

      // Single undo should reverse all 3 operations
      const undoRes = sdk.undo();
      expect(undoRes.success).toBe(true);

      expect(sdk.search('TxFolder').total).toBe(0);
      expect(sdk.search('TxFile1').total).toBe(0);

      // Single redo should reapply all
      sdk.redo();
      expect(sdk.search('TxFolder').total).toBe(1);
    });

    it('rolls back completely if any operation fails in transaction', () => {
      expect(() => {
        sdk.transaction((tx) => {
          tx.createFolder('root', 'ShouldRollback');
          // Duplicate name triggers error
          tx.createFile('folder-documents', 'Resume.pdf');
        });
      }).toThrowError();

      // Verify ShouldRollback was not committed
      expect(sdk.search('ShouldRollback').total).toBe(0);
      expect(sdk.canUndo()).toBe(false);
    });

    it('deletes multiple items in bulk atomically', () => {
      const f1 = sdk.createFile('root', 'Bulk1.txt');
      const f2 = sdk.createFile('root', 'Bulk2.txt');

      const deleted = sdk.deleteMultiple([f1.id, f2.id]);
      expect(deleted.length).toBe(2);

      expect(sdk.getItem(f1.id)).toBeNull();
      expect(sdk.getItem(f2.id)).toBeNull();

      // Undo bulk deletion restores both
      sdk.undo();
      expect(sdk.getItem(f1.id)).toBeDefined();
      expect(sdk.getItem(f2.id)).toBeDefined();
    });
  });
});

