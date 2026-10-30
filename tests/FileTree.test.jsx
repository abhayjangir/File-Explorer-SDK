import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import App from '../src/App.jsx';
import { FileTree } from '../src/components/FileTree.jsx';
import { TreeNode } from '../src/components/TreeNode.jsx';

describe('React Component Tests', () => {
  describe('TreeNode & FileTree unit rendering', () => {
    const mockTree = {
      id: 'root',
      name: 'My Files',
      type: 'folder',
      parentId: null,
      children: [
        {
          id: 'folder-docs',
          name: 'Documents',
          type: 'folder',
          parentId: 'root',
          children: [
            {
              id: 'file-doc1',
              name: 'Note.txt',
              type: 'file',
              parentId: 'folder-docs'
            }
          ]
        },
        {
          id: 'file-root',
          name: 'ReadMe.md',
          type: 'file',
          parentId: 'root'
        }
      ]
    };

    it('renders folder and file names accurately', () => {
      const onSelect = vi.fn();
      const onToggle = vi.fn();

      render(
        <FileTree
          tree={mockTree}
          selectedIds={['root']}
          expandedIds={['root', 'folder-docs']}
          onSelect={onSelect}
          onToggleExpand={onToggle}
          onExpandAll={vi.fn()}
          onCollapseAll={vi.fn()}
        />
      );

      expect(screen.getByText('My Files')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Note.txt')).toBeInTheDocument();
      expect(screen.getByText('ReadMe.md')).toBeInTheDocument();
    });

    it('calls onToggleExpand when chevron is clicked', () => {
      const onToggle = vi.fn();

      render(
        <FileTree
          tree={mockTree}
          selectedIds={['root']}
          expandedIds={['root']}
          onSelect={vi.fn()}
          onToggleExpand={onToggle}
          onExpandAll={vi.fn()}
          onCollapseAll={vi.fn()}
        />
      );

      const rootRow = screen.getByTestId('tree-node-root');
      const chevron = rootRow.querySelector('.chevron-box');
      fireEvent.click(chevron);

      expect(onToggle).toHaveBeenCalledWith('root');
    });

    it('calls onSelect when row is clicked', () => {
      const onSelect = vi.fn();

      render(
        <FileTree
          tree={mockTree}
          selectedIds={['root']}
          expandedIds={['root']}
          onSelect={onSelect}
          onToggleExpand={vi.fn()}
          onExpandAll={vi.fn()}
          onCollapseAll={vi.fn()}
        />
      );

      const readMeRow = screen.getByText('ReadMe.md');
      fireEvent.click(readMeRow);

      expect(onSelect).toHaveBeenCalledWith('file-root', false);
    });

    it('calls console.log inside TreeNode identifying node rendering', () => {
      const consoleSpy = vi.spyOn(console, 'log');

      render(
        <TreeNode
          node={mockTree}
          level={0}
          selectedIds={[]}
          expandedIds={[]}
          onSelect={vi.fn()}
          onToggleExpand={vi.fn()}
        />
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TreeNode render] id: root, name: "My Files"')
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Full Application Integration Tests (App.jsx)', () => {
    it('renders initial tree hierarchy and details panel', () => {
      render(<App />);

      expect(screen.getByText('VideoSDK File Explorer')).toBeInTheDocument();
      const tree = screen.getByRole('tree');
      expect(within(tree).getByText('My Files')).toBeInTheDocument();
      expect(within(tree).getByText('Documents')).toBeInTheDocument();
      expect(within(tree).getByText('Images')).toBeInTheDocument();
      expect(within(tree).getByText('Notes.txt')).toBeInTheDocument();

      // Details panel shows root item initially
      const details = screen.getByTestId('details-panel');
      expect(within(details).getByRole('heading', { name: 'My Files' })).toBeInTheDocument();
    });

    it('updates details panel when selecting an item', () => {
      render(<App />);

      const tree = screen.getByRole('tree');
      const notesFile = within(tree).getByText('Notes.txt');
      fireEvent.click(notesFile);

      const details = screen.getByTestId('details-panel');
      expect(within(details).getByText('Notes.txt')).toBeInTheDocument();
      expect(within(details).getByText('FILE')).toBeInTheDocument();
      expect(within(details).getByText('file-notes')).toBeInTheDocument();
    });

    it('creates a new file inside selected folder', () => {
      render(<App />);

      const tree = screen.getByRole('tree');
      // Select Documents folder
      fireEvent.click(within(tree).getByText('Documents'));

      // Click New File button in toolbar
      const toolbar = document.querySelector('.app-toolbar');
      fireEvent.click(within(toolbar).getByRole('button', { name: /New File/i }));

      // Fill in file name in modal
      const input = screen.getByPlaceholderText(/document\.pdf/i);
      fireEvent.change(input, { target: { value: 'NewReport.pdf' } });

      // Submit modal
      const modal = document.querySelector('.modal-dialog');
      fireEvent.click(within(modal).getByRole('button', { name: 'Create' }));

      // Verify file is now rendered in tree
      expect(within(tree).getByText('NewReport.pdf')).toBeInTheDocument();
    });

    it('creates a new folder', () => {
      render(<App />);

      const tree = screen.getByRole('tree');
      // Click New Folder button in toolbar
      const toolbar = document.querySelector('.app-toolbar');
      fireEvent.click(within(toolbar).getByRole('button', { name: /New Folder/i }));

      // Fill in folder name
      const input = screen.getByPlaceholderText(/My Folder/i);
      fireEvent.change(input, { target: { value: 'Projects' } });

      // Submit modal
      const modal = document.querySelector('.modal-dialog');
      fireEvent.click(within(modal).getByRole('button', { name: 'Create' }));

      // Verify folder exists in tree
      expect(within(tree).getByText('Projects')).toBeInTheDocument();
    });

    it('renames an item from toolbar', () => {
      render(<App />);

      const tree = screen.getByRole('tree');
      // Select Notes.txt
      fireEvent.click(within(tree).getByText('Notes.txt'));

      // Click Rename button in toolbar
      const toolbar = document.querySelector('.app-toolbar');
      fireEvent.click(within(toolbar).getByRole('button', { name: /Rename/i }));

      // Change input inside modal
      const input = screen.getByDisplayValue('Notes.txt');
      fireEvent.change(input, { target: { value: 'Todo.txt' } });

      // Submit modal
      const modal = document.querySelector('.modal-dialog');
      fireEvent.click(within(modal).getByRole('button', { name: 'Rename' }));

      // Verify renamed item in tree
      expect(within(tree).getByText('Todo.txt')).toBeInTheDocument();
      expect(within(tree).queryByText('Notes.txt')).not.toBeInTheDocument();
    });

    it('deletes an item after user confirmation', () => {
      render(<App />);

      const tree = screen.getByRole('tree');
      // Select Notes.txt
      fireEvent.click(within(tree).getByText('Notes.txt'));

      // Click Delete button in toolbar
      const toolbar = document.querySelector('.app-toolbar');
      fireEvent.click(within(toolbar).getByRole('button', { name: /Delete/i }));

      // Check confirm dialog appears
      expect(screen.getByText('Delete Confirmation')).toBeInTheDocument();

      // Click Delete inside modal
      const modal = document.querySelector('.modal-dialog');
      fireEvent.click(within(modal).getByRole('button', { name: 'Delete' }));

      // Verify item is removed from tree
      expect(within(tree).queryByText('Notes.txt')).not.toBeInTheDocument();
    });

    it('reverts and reapplies actions via undo and redo buttons', () => {
      render(<App />);

      const tree = screen.getByRole('tree');
      const toolbar = document.querySelector('.app-toolbar');

      // Select Notes.txt and rename to Draft.txt
      fireEvent.click(within(tree).getByText('Notes.txt'));
      fireEvent.click(within(toolbar).getByRole('button', { name: /Rename/i }));

      const input = screen.getByDisplayValue('Notes.txt');
      fireEvent.change(input, { target: { value: 'Draft.txt' } });

      const modal = document.querySelector('.modal-dialog');
      fireEvent.click(within(modal).getByRole('button', { name: 'Rename' }));

      expect(within(tree).getByText('Draft.txt')).toBeInTheDocument();

      // Undo button in toolbar
      const undoBtn = within(toolbar).getByRole('button', { name: /Undo/i });
      expect(undoBtn).not.toBeDisabled();
      fireEvent.click(undoBtn);

      // Verify reverted in tree
      expect(within(tree).getByText('Notes.txt')).toBeInTheDocument();
      expect(within(tree).queryByText('Draft.txt')).not.toBeInTheDocument();

      // Redo button in toolbar
      const redoBtn = within(toolbar).getByRole('button', { name: /Redo/i });
      expect(redoBtn).not.toBeDisabled();
      fireEvent.click(redoBtn);

      // Verify redone in tree
      expect(within(tree).getByText('Draft.txt')).toBeInTheDocument();
    });

    it('searches hierarchy and auto-expands ancestors on selection', () => {
      render(<App />);

      // Open Search panel
      const toolbar = document.querySelector('.app-toolbar');
      fireEvent.click(within(toolbar).getByRole('button', { name: /Search/i }));

      // Search input appears
      const searchInput = screen.getByPlaceholderText(/Search files and folders/i);
      fireEvent.change(searchInput, { target: { value: 'Resume' } });

      // Search result item appears inside search results list
      const searchList = document.querySelector('.search-results-list');
      const resultItem = within(searchList).getByText('Resume.pdf');
      expect(resultItem).toBeInTheDocument();

      // Click search result item
      fireEvent.click(resultItem);

      // Details panel should now reflect Resume.pdf
      const details = screen.getByTestId('details-panel');
      expect(within(details).getByText('Resume.pdf')).toBeInTheDocument();
    });

    it('logs file operations in recent activity panel', () => {
      render(<App />);

      // Open Activity panel
      const toolbar = document.querySelector('.app-toolbar');
      fireEvent.click(within(toolbar).getByRole('button', { name: /Activity/i }));

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();

      // Create a file to generate activity
      fireEvent.click(within(toolbar).getByRole('button', { name: /New File/i }));
      const input = screen.getByPlaceholderText(/document\.pdf/i);
      fireEvent.change(input, { target: { value: 'LoggedFile.txt' } });

      const modal = document.querySelector('.modal-dialog');
      fireEvent.click(within(modal).getByRole('button', { name: 'Create' }));

      // Activity list should show the creation
      const activityList = document.querySelector('.activity-list');
      expect(within(activityList).getByText('Created file "LoggedFile.txt"')).toBeInTheDocument();
    });
  });
});
