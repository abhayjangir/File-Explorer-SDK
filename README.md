# VideoSDK File Explorer SDK & React Application

A production-grade, reusable in-memory JavaScript File Explorer SDK paired with a responsive, modern React application. Built with modern ES6+ JavaScript, React 18, Vite, and automated Vitest testing.

---

## 1. Project Overview

This project simulates a complete virtual file system in memory (similar to Windows File Explorer or Google Drive) without any backend or operating-system dependencies. It is split into two cleanly separated tiers:

1. **Independent File Explorer SDK (`FileExplorerSDK`)**: Pure vanilla JavaScript library that encapsulates the in-memory data store (`Map`), tree construction, validation, recursive search, command-pattern undo/redo, change subscriptions, and atomic transactions.
2. **React 18 User Interface**: A responsive frontend with a recursive file tree, contextual toolbar, full-text hierarchy search drawer, inspector details panel, live activity audit log, and confirmation dialogs.

---

## 2. Key Features

- **Decoupled Architecture**: The SDK is completely independent of React and can be embedded in Node.js, CLI utilities, or other frontend frameworks.
- **Strict Data Integrity & Validation**:
  - Stable, collision-free unique IDs (`UUID`).
  - Case-insensitive name uniqueness within the same parent folder.
  - Type enforcement: files cannot hold children.
  - Cycle detection: folders cannot be moved into themselves or their own descendants.
  - Root folder protection: root folder cannot be deleted, moved, or renamed.
  - Defensive copying: external consumers receive deep copies; internal state cannot be mutated directly.
- **Recursive File Tree Component**:
  - Dynamically renders arbitrary folder depth.
  - Expand/collapse states, folder child count badges, and file-type-specific icons.
  - Multi-selection support (Ctrl/Cmd/Shift click) and single-click inspection.
  - Rendering logs via `console.log()` inside `TreeNode` to observe component re-rendering behavior.
- **Advanced Hierarchy Search**:
  - Case-insensitive substring matching at every nesting level.
  - Type filtering (`all`, `file`, `folder`).
  - Multi-column sorting (`name`, `type`, `updatedAt`, `createdAt`) with `asc`/`desc` orders.
  - 1-indexed pagination with total results and page metadata.
  - One-click navigation: selecting a search result auto-expands all ancestor folders and highlights the item in the tree.
- **Robust Undo / Redo**:
  - Built using the Command Pattern.
  - Supports file creation, folder creation, renaming, moving, file deletion, and nested folder deletion.
  - Deep descendant preservation: restoring a deleted folder re-inserts all subfolders and files with their exact original IDs, timestamps, and metadata.
  - Clears redo history upon new mutations; graceful handling of empty histories.
- **Lightweight Event Subscriptions**:
  - Native listener registration and automatic cleanup functions (`() => unsubscribe()`).
  - Error-isolated notification dispatch: listener errors never corrupt SDK internal state.
- **Completed Bonus Features**:
  - **Atomic Transactions (`sdk.transaction`)**: Execute batches of operations atomically. If any operation fails, the entire transaction rolls back cleanly without partial changes or notifications. Successful transactions count as a single compound undoable operation.
  - **Multi-Selection & Bulk Deletion (`sdk.deleteMultiple`)**: Allows selecting multiple files and folders, displaying selection counts, pruning redundant child selections, and deleting them atomically.

---

## 3. Technology Stack

- **Language**: JavaScript (ES6+)
- **UI Library**: React 18
- **Build Tool / Bundler**: Vite 6
- **Test Runner & Assertions**: Vitest 3
- **Component Testing**: React Testing Library & `@testing-library/jest-dom`
- **DOM Environment for Tests**: jsdom
- **Icons**: Lucide React
- **Version Control**: Git

---

## 4. Prerequisites

- **Node.js**: v18.0.0 or higher (tested on Node v22.19.0)
- **npm**: v9.0.0 or higher (tested on npm 10.9.3)

---

## 5. Installation Commands

Clone the repository and install all dependencies:

```bash
git clone <repository-url>
cd videosdk
npm install
```

---

## 6. Starting the Development Server

Start Vite in development mode with Hot Module Replacement (HMR):

```bash
npm run dev
```

By default, the application runs at `http://localhost:5173/`. Open this URL in your web browser.

---

## 7. Running Automated Tests

Run the full automated test suite using Vitest:

```bash
# Run all unit and integration tests once
npm test

# Run tests in watch mode during development
npm run test:watch
```

### Production Build Test

Verify production compilation and asset generation:

```bash
npm run build
```

---

## 8. Project Structure

```
videosdk/
├── src/
│   ├── sdk/                         # Standalone SDK (Independent of React)
│   │   ├── FileExplorerSDK.js       # Main SDK class & public API
│   │   ├── errors.js                # Custom FileExplorerError & ErrorCodes
│   │   ├── validation.js            # Validation helpers & deep cloning
│   │   ├── search.js                # Recursive search, filtering, sorting, pagination
│   │   ├── history.js               # Command pattern undo/redo & HistoryManager
│   │   └── index.js                 # Unified SDK exports
│   ├── components/                  # React UI Components
│   │   ├── TreeNode.jsx             # Recursive tree node with console.log
│   │   ├── FileTree.jsx             # File explorer tree wrapper
│   │   ├── Toolbar.jsx              # Action buttons, CRUD, undo/redo controls
│   │   ├── SearchPanel.jsx          # Search drawer with filter, sort, pagination
│   │   ├── DetailsPanel.jsx         # Metadata inspector panel
│   │   ├── ActivityPanel.jsx        # Audit log panel for recent file system events
│   │   ├── ItemDialog.jsx           # Modal for create, rename, and move
│   │   └── ConfirmDialog.jsx        # Destructive deletion confirmation dialog
│   ├── hooks/
│   │   └── useFileExplorer.js       # Custom React hook bridging React and SDK
│   ├── App.jsx                      # Main application workspace layout
│   ├── main.jsx                     # React application root entry
│   └── styles.css                   # Desktop-grade styling and CSS design system
├── tests/
│   ├── setup.js                     # Testing environment setup (jest-dom)
│   ├── FileExplorerSDK.test.js      # 50 SDK unit tests
│   └── FileTree.test.jsx            # 13 React UI integration tests
├── index.html                       # HTML entry point
├── package.json                     # Dependencies and test scripts
├── vite.config.js                   # Vite & Vitest configuration
└── README.md                        # Documentation and interview guide
```

---

## 9. SDK Architecture & Data Model

### Data Structures

The SDK maintains an in-memory `Map<string, Object>` where each key is an item's unique identifier (`id`).

#### Why `Map` over nested object trees?
1. **$O(1)$ Direct Lookup**: Accessing any file or folder by ID is constant time ($O(1)$) rather than requiring recursive tree traversals ($O(N)$).
2. **Atomic Updates**: Renaming, moving, and updating properties requires only direct mutation on the stored record without rebuilding the parent or tree.
3. **Decoupled Hierarchy**: Each item maintains a `parentId` pointer (`null` for the root folder). The nested hierarchical tree (`children: []`) is constructed dynamically on demand by `getTree()`.
4. **Clean Serialization**: Flat Map entries can be serialized, snapshot, or cloned with minimal overhead.

### Initial Sample Data

The SDK automatically seeds itself with the assignment's official sample hierarchy:

```
My Files/ (root)
├── Documents/
│   ├── Resume.pdf
│   └── Project Plan.docx
├── Images/
│   ├── Photo.png
│   └── Logo.svg
└── Notes.txt
```

### Item Data Model Schema

```javascript
{
  id: "file-resume",                 // Unique, stable string
  name: "Resume.pdf",                // File or folder name
  type: "file",                      // "file" | "folder"
  parentId: "folder-documents",      // Parent ID or null (for root)
  createdAt: 1700000000000,          // Timestamp (milliseconds)
  updatedAt: 1700000000000,          // Timestamp (milliseconds)
  size: 143360,                      // Size in bytes
  metadata: {}                       // Extensible custom metadata
}
```

---

## 10. Public API Reference

### Standalone JavaScript Usage (Without React)

```javascript
import { FileExplorerSDK } from './src/sdk/index.js';

// Initialize SDK
const sdk = new FileExplorerSDK();

// 1. Retrieve complete hierarchical tree
const tree = sdk.getTree();
console.log(tree.name); // "My Files"

// 2. Create a folder
const projectsFolder = sdk.createFolder('root', 'Projects');

// 3. Create a file inside that folder
const spec = sdk.createFile(projectsFolder.id, 'spec.md', { size: 2048 });

// 4. Rename an item
sdk.renameItem(spec.id, 'specification.md');

// 5. Move an item
sdk.moveItem(spec.id, 'folder-documents');

// 6. Search hierarchy
const results = sdk.search('spec', {
  type: 'file',
  sortBy: 'name',
  order: 'asc',
  page: 1,
  limit: 10
});

// 7. Undo & Redo
sdk.undo(); // Reverts move
sdk.redo(); // Re-applies move

// 8. Delete item & descendants
sdk.deleteItem(projectsFolder.id);

// 9. Subscribe to file-system changes
const unsubscribe = sdk.subscribe((event) => {
  console.log(`Event: ${event.type} on ${event.itemIds.join(', ')}`);
});
```

### Complete Method Signatures

| Method | Parameters | Return Value | Description |
|---|---|---|---|
| `getTree()` | *None* | `Object` (root node with nested `children`) | Returns deep copy of the complete file tree. |
| `getItem(id)` | `id: string` | `Object \| null` | Returns a defensive deep copy of the item. |
| `getChildren(folderId)` | `folderId: string` | `Array<Object>` | Returns defensive copies of direct folder children. |
| `getItemPath(id)` | `id: string` | `string` | Returns hierarchical path (e.g. `My Files/Documents/Resume.pdf`). |
| `createFile(parentId, name, metadata?)` | `parentId, name, metadata?` | `Object` | Creates a new file inside parent folder. |
| `createFolder(parentId, name, metadata?)` | `parentId, name, metadata?` | `Object` | Creates a new folder inside parent folder. |
| `renameItem(id, newName)` | `id, newName` | `Object` | Renames an item while preserving its ID. |
| `moveItem(id, targetParentId)` | `id, targetParentId` | `Object` | Moves an item to target parent folder. |
| `deleteItem(id)` | `id: string` | `Array<Object>` | Deletes item and all descendants recursively. |
| `search(query, options?)` | `query: string, options: Object` | `{ results, total, page, limit, totalPages }` | Non-mutating recursive search with filters, sorting, and pagination. |
| `undo()` | *None* | `{ success: boolean, command: Object \| null }` | Undoes the most recent operation. |
| `redo()` | *None* | `{ success: boolean, command: Object \| null }` | Redoes the most recently undone operation. |
| `canUndo()` | *None* | `boolean` | Checks if undo is possible. |
| `canRedo()` | *None* | `boolean` | Checks if redo is possible. |
| `subscribe(listener)` | `listener: Function` | `Function` (`() => void`) | Subscribes callback to changes and returns unsubscribe function. |
| `unsubscribe(listener)` | `listener: Function` | `void` | Removes subscription. |
| `getRecentActivity(limit?)` | `limit?: number` (default 20) | `Array<Object>` | Retrieves recent file system notification history. |
| `transaction(fn)` | `fn: (tx) => void` | `*` (return value of `fn`) | Executes operations atomically with automatic rollback on error. |
| `deleteMultiple(ids)` | `ids: Array<string>` | `Array<Object>` | Bulk deletion of multiple items atomically. |

---

## 11. Validation and Data Integrity Rules

The SDK validates all constraints **prior** to committing state changes:

1. **Unique Identifiers**: Every item receives a stable, non-colliding unique ID. Moving or renaming an item preserves its ID and creation timestamp.
2. **Name Uniqueness**: No two sibling items in the same parent folder can share the same name (case-insensitive check: `a.name.toLowerCase() === b.name.toLowerCase()`).
3. **Different Folders Permitted**: Items with identical names may exist in different parent folders.
4. **File Restrictions**: Files cannot contain children. Attempting to add an item inside a file or move an item into a file throws `CANNOT_CONTAIN_CHILDREN`.
5. **Cycle & Self-Move Prevention**:
   - A folder cannot be moved into itself (`CANNOT_MOVE_INTO_SELF`).
   - A folder cannot be moved into any of its descendants (`CANNOT_MOVE_INTO_DESCENDANT`). The SDK traverses ancestors upward from the destination to root to prevent graph cycles.
6. **Root Protection**: The root folder (`id: 'root'`) cannot be renamed, moved, or deleted (`INVALID_OPERATION_ON_ROOT`).
7. **Defensive Copying**: Every object returned by `getItem`, `getTree`, `search`, and notifications is deep-cloned via `deepClone()`. External mutations do not alter internal SDK storage.
8. **Failure Isolation**: An invalid operation aborts before committing any changes, leaves the state uncorrupted, and does not push any entry to the undo history.

### Error Handling

The SDK throws descriptive `FileExplorerError` instances with standardized `ErrorCodes`:

```javascript
import { FileExplorerError, ErrorCodes } from './src/sdk/index.js';

try {
  sdk.createFile('folder-documents', 'Resume.pdf'); // Duplicate name
} catch (err) {
  if (err instanceof FileExplorerError) {
    console.log(err.code);    // ErrorCodes.DUPLICATE_NAME
    console.log(err.message); // Human-readable explanation
  }
}
```

---

## 12. Search Implementation

Search is executed entirely inside the SDK (`search.js`), keeping React free of data querying logic:

- **Case-Insensitive Substring Match**: Matches against `item.name`.
- **Empty Query Handling**: An empty string `""` or whitespace query matches all items subject to type filters.
- **Filter By Type**: `'all'` (files & folders), `'file'` (files only), or `'folder'` (folders only).
- **Multi-Field Sorting**: Supports `'name'`, `'type'`, `'updatedAt'`, and `'createdAt'`.
- **Directional Order**: `'asc'` (ascending) or `'desc'` (descending).
- **Pagination**: Supports 1-indexed `page` and customizable `limit`.
- **Full Path Enrichment**: Each result item includes its calculated hierarchical path (e.g. `My Files/Documents/Resume.pdf`).
- **Option Validation**: Invalid `page < 1`, `limit < 1`, unknown sort keys, or unknown filter types throw `INVALID_SEARCH_OPTIONS`.

---

## 13. Undo and Redo Implementation

### Command Pattern Architecture

Instead of cloning the entire 10,000-node state on every keystroke (State Snapshot approach), the SDK employs the **Command Pattern with Delta Payloads**:

```
[ User Action ] -> Create Command { type, description, undo(sdk), redo(sdk) } -> Push to UndoStack
                                                                              -> Clear RedoStack
```

| Operation | Command Data Captured | `undo(sdk)` Action | `redo(sdk)` Action |
|---|---|---|---|
| **Create File/Folder** | Cloned created item | Deletes created item by ID | Re-inserts item with original ID & metadata |
| **Rename** | `itemId, oldName, newName` | Renames back to `oldName` | Renames to `newName` |
| **Move** | `itemId, oldParentId, newParentId` | Moves back to `oldParentId` | Moves to `newParentId` |
| **Delete File** | Cloned deleted file | Restores file | Deletes file |
| **Delete Folder** | **All deleted subtree items** (folder + all descendants) | Re-inserts folder and all descendants with exact IDs and parents | Re-deletes root folder |
| **Transaction** | Array of constituent commands | Reverses commands in reverse order | Executes commands in forward order |

### Trade-offs: Command Pattern vs. State Snapshots

- **State Snapshot Pattern**:
  - *Pros*: Simple to code (`history.push(deepClone(entireMap))`).
  - *Cons*: Memory usage scales linearly with history depth and file system size ($O(M \times N)$). Cloning 100,000 items on every rename causes memory spikes and GC pauses.
- **Command Pattern (Chosen)**:
  - *Pros*: Memory footprint scales only with the specific modified items ($O(1)$ for renames and moves). Correctly restores nested subtrees on folder deletion by snapshotting only the deleted subtree.
  - *Cons*: Requires inverse logic for each mutation type.

---

## 14. Event Subscriptions & Change Notifications

The SDK includes a built-in pub/sub notification system implemented using a native JavaScript `Set`:

```javascript
const unsubscribe = sdk.subscribe((event) => {
  console.log(event.type);      // 'CREATE' | 'RENAME' | 'MOVE' | 'DELETE' | 'UNDO' | 'REDO' | 'TRANSACTION'
  console.log(event.action);    // Operation description
  console.log(event.itemIds);   // Affected item IDs
  console.log(event.timestamp); // Unix timestamp
});

// To unsubscribe:
unsubscribe();
```

- **Clean Listener Isolation**: Each subscriber callback is executed inside a `try...catch` block. If an external listener throws an uncaught exception, other listeners still execute and the SDK state remains intact.
- **Notification Guarantee**: Change notifications are emitted **only after** state mutations have succeeded and passed validation.

---

## 15. React State Management & Architecture

### Guiding Architectural Principle: SDK as Single Source of Truth

React never duplicates or independently mutates the file system hierarchy. React state is reserved strictly for **UI-specific state**:
- `selectedIds`: IDs of currently selected items.
- `expandedIds`: IDs of currently open folders.
- `isSearchOpen` & `isActivityOpen`: Panel visibility toggles.
- `dialogState`: Target item and mode for open modals.
- `confirmDeleteState`: Items pending destructive deletion confirmation.
- `toast`: Temporary floating feedback banners.

### The `useFileExplorer(sdk)` Hook

The custom hook coordinates the bridge between the SDK and React:
1. Subscribes to the SDK via `sdk.subscribe()`.
2. Re-reads `sdk.getTree()`, `sdk.canUndo()`, and `sdk.canRedo()` whenever a notification arrives.
3. Automatically unregisters the subscription on component unmount, preventing memory leaks and handling React 18 Strict Mode double-invocations cleanly.
4. Exposes action wrappers that capture errors and populate the UI error banner.

---

## 16. Rendering Behavior and Performance

### Required `console.log()` in `TreeNode`

As specified in the assignment requirements, a meaningful log statement is placed inside `TreeNode.jsx`:

```javascript
console.log(`[TreeNode render] id: ${node.id}, name: "${node.name}", type: ${node.type}`);
```

### Observed Rendering Behavior & Optimizations

1. **`React.memo(TreeNode)`**:
   - `TreeNode` is wrapped in `React.memo`. When expanding or collapsing a sibling folder, only the toggled node and its descendants re-render. Unrelated sibling trees skip re-rendering.
2. **`useCallback` for Event Handlers**:
   - Functions passed to tree nodes (`onSelect`, `onToggleExpand`) are memoized with `useCallback` to maintain stable reference identity across renders.
3. **Selection & Expansion Independence**:
   - Selection state is maintained as an array of IDs (`selectedIds`). Subtree hierarchies do not need to be reconstructed when simply changing active selection.
4. **Stable Keys**:
   - Every tree node uses its stable, immutable item `id` as its React `key` (`key={child.id}`). This prevents React from destroying and recreating DOM nodes during renames, moves, or sibling reordering.

---

## 17. Completed Bonus Features

### 1. Atomic Transactions (`sdk.transaction`)

Execute multiple operations as one atomic unit:

```javascript
sdk.transaction((tx) => {
  const folder = tx.createFolder('root', 'Archive');
  tx.createFile(folder.id, 'old-notes.txt');
  tx.createFile(folder.id, 'old-log.txt');
});
```

- **Rollback Guarantee**: If any validation fails (e.g. invalid name or duplicate), the transaction aborts, the pre-transaction state snapshot is restored, and no partial modifications remain.
- **Single Notification**: Emits one `TRANSACTION` notification upon commit.
- **Compound Undo**: Calling `sdk.undo()` once rolls back all operations in the transaction in reverse order.

### 2. Multi-Selection & Bulk Deletion (`sdk.deleteMultiple`)

- Users can select multiple items in the tree using `Ctrl+Click`, `Cmd+Click`, or `Shift+Click`.
- The details panel reflects the selection count and summarizes selected items.
- Clicking the Delete button prompts a confirmation dialog listing selected items.
- The SDK's `deleteMultiple` method intelligently prunes redundant child IDs (if a parent folder is selected, it does not attempt to delete descendants independently).
- Uses atomic transactions under the hood so either all items are deleted or none are.

---

## 18. Automated Test Suite Summary

The project includes **63 automated tests** passing across two test suites:

```
Test Files  2 passed (2)
     Tests  63 passed (63)
```

### Breakdown:

1. **SDK Unit Tests (`tests/FileExplorerSDK.test.js`) — 50 Tests**:
   - Initial structure & sample data verification
   - Recursive tree construction & `getChildren`
   - Defensive copy mutation protection
   - File and folder creation
   - Rename preservation of IDs and timestamps
   - Move preservation and hierarchy updates
   - File deletion and recursive nested folder deletion
   - Case-insensitive duplicate name prevention in same folder
   - Identical names allowed across different folders
   - Preventing child creation inside files
   - Circular move prevention (self-move and descendant move)
   - Root folder protection (cannot rename, move, or delete root)
   - Search: nested queries, type filtering, sorting, pagination, mutation reactivity
   - Undo/Redo: creation, rename, move, nested folder restore, clearing redo on mutation, empty history
   - Subscriptions: listener notifications, multiple listeners, cleanup, listener error safety
   - Atomic transactions: rollback on error, single undo unit
   - Bulk deletion

2. **React Integration Tests (`tests/FileTree.test.jsx`) — 13 Tests**:
   - Initial UI and tree rendering
   - Recursive node chevron expand/collapse
   - Node selection updating the details inspector
   - `console.log` rendering verification inside `TreeNode`
   - Creating files and folders via UI modals
   - Renaming items via UI modal
   - Destructive deletion confirmation dialog and removal
   - Toolbar Undo and Redo button updates
   - Hierarchy search drawer with instant result selection and auto-ancestor expansion
   - Live activity audit log reflecting mutations

---

## 19. Architecture & Design Decisions

### Why an Independent SDK?
Separating the virtual file system engine from React is a core architectural choice. File management involves business invariants—such as cycle detection, name collision checks, and transactional rollbacks—that should not be tied to UI rendering lifecycles. By keeping the SDK standalone, the file system logic is headless, testable in standard Node.js without browser DOM mocks, and reusable across other environments or frameworks.

### In-Memory Storage Strategy
A flat `Map<string, Item>` was chosen over a deeply nested JavaScript object. In file explorers, lookups, moves, and renames occur frequently. With a `Map`, direct access and property updates operate in $O(1)$ constant time. Items maintain parent references (`parentId`), and the nested hierarchical view is constructed on demand via `getTree()` in a single pass.

### Cycle Prevention in Move Operations
When moving a folder, the SDK verifies that the destination folder is neither the item itself nor any of its descendants. The algorithm traverses upward from the destination to the root via `parentId` links. If the item being moved is encountered in the ancestry chain, the operation is rejected before any state is mutated.

### Command-Pattern Undo / Redo
State snapshots require cloning the entire dataset on every mutation, which scales poorly in memory ($O(M \times N)$). Instead, the Command Pattern encapsulates specific forward and reverse operations. For folder deletion, the command captures the deleted subtree items so that undoing restores all nested subfolders and files with their original identifiers, timestamps, and hierarchy intact.

---

## 20. Known Limitations

1. **In-Memory Volatility**: The file system operates purely in memory per assignment constraints. Refreshing the browser reloads the default seed data.
2. **Linear History**: The history manager maintains a linear undo/redo stack; branching history trees are not implemented.
3. **Transaction Nesting**: The transaction API does not currently support nested transactions (`tx.transaction(...)`).

---

## 21. Build & Test Verification

```bash
# Run automated tests
npm test

# Build for production
npm run build
```

