import React, {
  useCallback, useEffect, useRef, useState, memo,
} from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getTableCellNodeFromLexicalNode,
} from '@lexical/table';
import {
  $getSelection,
  $isRangeSelection,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import { createPortal } from 'react-dom';
import TableActionMenu from './TableActionMenu';

// ChevronButton component
const ChevronButton = memo(({ onClick, menuRootRef }) => (
  <button
    type="button"
    data-testid="chevron-down"
    id="chevron-down"
    aria-label="Table actions"
    tabIndex={0}
    className="table-cell-action-button"
    onClick={onClick}
    ref={menuRootRef}
  >
    <i className="chevron-down" />
  </button>
));

// Hook to get table cell node from selection
const useTableCellNode = (editor) => {
  const [tableCellNode, setTableCellNode] = useState(null);
  const [tableCellDOMNode, setTableCellDOMNode] = useState(null);

  const moveMenu = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const rootElement = editor.getRootElement();
  
      if (!selection || !rootElement || !nativeSelection) {
        return;
      }
  
      if ($isRangeSelection(selection)) {
        const cellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
  
        if (!cellNode) {
          setTableCellNode(null);
          setTableCellDOMNode(null);
          return;
        }
  
        const cellNodeDOM = editor.getElementByKey(cellNode.getKey());
        if (!cellNodeDOM) {
          setTableCellNode(null);
          setTableCellDOMNode(null);
          return;
        }
  
        setTableCellNode(cellNode);
        setTableCellDOMNode(cellNodeDOM);
      }
    });
  }, [editor]);

  // Register a selection change listener
  useEffect(() => {
    // Listen for editor updates
    const unregisterListener = editor.registerUpdateListener(({editorState}) => {
      editorState.read(() => {
        moveMenu();
      });
    });

    // Listen for selection changes using the SELECTION_CHANGE_COMMAND
    const removeSelectionListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        moveMenu();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );

    // Additional registration for document clicks
    const handleDocumentClick = () => {
      setTimeout(moveMenu, 0);
    };
    
    document.addEventListener('click', handleDocumentClick);
    
    return () => {
      unregisterListener();
      removeSelectionListener();
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [editor, moveMenu]);

  // Also check for selection changes on mouse up
  useEffect(() => {
    const checkSelectionOnMouseUp = () => {
      setTimeout(moveMenu, 0);
    };
    
    document.addEventListener('mouseup', checkSelectionOnMouseUp);
    
    return () => {
      document.removeEventListener('mouseup', checkSelectionOnMouseUp);
    };
  }, [moveMenu]);

  return { tableCellNode, tableCellDOMNode };
};

// The main TableCellActionMenuContainer component
function TableCellActionMenuContainer() {
  const [editor] = useLexicalComposerContext();
  const menuRootRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const buttonContainerRef = useRef(null);
  const previousCellRef = useRef(null);

  const { tableCellNode, tableCellDOMNode } = useTableCellNode(editor);

  // Clean up previous button container when cell changes
  useEffect(() => {
    return () => {
      // Clean up any orphaned button containers on unmount
      if (buttonContainerRef.current && buttonContainerRef.current.parentElement) {
        try {
          buttonContainerRef.current.parentElement.removeChild(buttonContainerRef.current);
        } catch (e) {
          // Handle possible errors if node is already removed
          console.log('Cleanup attempt - node may already be removed');
        }
      }
    };
  }, []);

  // Handle DOM manipulation directly instead of using createPortal
  useEffect(() => {
    if (!tableCellDOMNode) {
      return;
    }

    const addButtonToCell = () => {
      // If the cell changes, clean up the previous button
      if (previousCellRef.current && previousCellRef.current !== tableCellDOMNode) {
        const existingButton = previousCellRef.current.querySelector('.table-cell-action-button-container');
        if (existingButton) {
          try {
            previousCellRef.current.removeChild(existingButton);
          } catch (e) {
            console.log('Previous cell cleanup attempt');
          }
        }
      }

      // Create a new button container if it doesn't exist in the current cell
      let buttonContainer = tableCellDOMNode.querySelector('.table-cell-action-button-container');
      
      if (!buttonContainer) {
        buttonContainer = document.createElement('div');
        buttonContainer.className = 'table-cell-action-button-container';
        buttonContainer.style.position = 'absolute';
        buttonContainer.style.top = '5px';
        buttonContainer.style.right = '5px';
        buttonContainer.style.zIndex = '10';
        
        // Create button element
        const button = document.createElement('button');
        button.className = 'table-cell-action-button';
        button.setAttribute('aria-label', 'Table actions');
        button.setAttribute('type', 'button');
        button.setAttribute('id', 'table-cell-action-button-' + Date.now()); // Unique ID
        
        // Create chevron icon
        const icon = document.createElement('i');
        icon.className = 'chevron-down';
        
        // Add click handler using a more persistent approach
        const handleButtonClick = (e) => {
          e.stopPropagation();
          setIsMenuOpen(prev => !prev);
        };
        
        button.addEventListener('click', handleButtonClick);
        
        // Assemble and append
        button.appendChild(icon);
        buttonContainer.appendChild(button);
        tableCellDOMNode.appendChild(buttonContainer);
        
        // Store references
        buttonContainerRef.current = buttonContainer;
        menuRootRef.current = button;
      } else {
        // Update references if button already exists
        menuRootRef.current = buttonContainer.querySelector('button');
      }
      
      // Update the previous cell reference
      previousCellRef.current = tableCellDOMNode;
    };

    // Initial creation
    addButtonToCell();

    // Add an observer to ensure the button remains in the cell
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const buttonExists = tableCellDOMNode.querySelector('.table-cell-action-button-container');
          if (!buttonExists && tableCellDOMNode) {
            // If button was removed, add it back
            addButtonToCell();
          }
        }
      }
    });

    // Start observing the cell for changes to its children
    observer.observe(tableCellDOMNode, { childList: true });
    
    // Clean up function
    return () => {
      observer.disconnect();
      // We don't remove the button here to avoid the 'removeChild' error
      // Buttons will be cleaned up when switching cells
    };
  }, [tableCellDOMNode]);

  // Close menu with Escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close menu when cell changes
  const prevTableCellRef = useRef(tableCellNode);
  useEffect(() => {
    if (prevTableCellRef.current !== tableCellNode) {
      setIsMenuOpen(false);
    }
    prevTableCellRef.current = tableCellNode;
  }, [tableCellNode]);

  if (!tableCellNode || !tableCellDOMNode) return null;

  // Only render the menu, the button is handled by DOM manipulation
  return isMenuOpen ? (
    <TableActionMenu
      contextRef={menuRootRef}
      onClose={() => setIsMenuOpen(false)}
      tableCellNode={tableCellNode}
      tableCellDOMNode={tableCellDOMNode}
    />
  ) : null;
}

export default memo(TableCellActionMenuContainer);