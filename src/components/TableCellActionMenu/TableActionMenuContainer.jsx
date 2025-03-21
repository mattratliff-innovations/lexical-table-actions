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

// Hook to position the menu button relative to the table cell
const useMenuPosition = (menuButtonRef, tableCellDOMNode) => {
  useEffect(() => {
    const menuButton = menuButtonRef.current;
    if (!menuButton || !tableCellDOMNode) {
      // If we don't have valid elements, hide the button
      if (menuButton) {
        menuButton.style.opacity = '0';
      }
      return;
    }

    // Function to calculate and update the position
    const updatePosition = () => {
      const tableCellRect = tableCellDOMNode.getBoundingClientRect();
      
      // Position in the top-right corner of the cell
      menuButton.style.opacity = '1';
      menuButton.style.position = 'absolute';
      menuButton.style.top = '5px';
      menuButton.style.right = '5px';
      menuButton.style.left = 'auto';
      menuButton.style.transform = 'none';
      menuButton.style.zIndex = '10';
    };
    
    // Initial positioning
    updatePosition();
    
    // Set up a mutation observer to watch for changes in the table cell
    const observer = new MutationObserver(updatePosition);
    observer.observe(tableCellDOMNode, { 
      attributes: true, 
      childList: true, 
      subtree: true 
    });
    
    // Handle window resize events
    window.addEventListener('resize', updatePosition);
    
    // Cleanup function
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [menuButtonRef, tableCellDOMNode]);
};

  // The main TableCellActionMenuContainer component
function TableCellActionMenuContainer() {
  const [editor] = useLexicalComposerContext();
  const menuButtonRef = useRef(null);
  const menuRootRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { tableCellNode, tableCellDOMNode } = useTableCellNode(editor);
  
  // Always call hooks unconditionally
  useMenuPosition(menuButtonRef, tableCellDOMNode);

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
  }, [setIsMenuOpen]);

  // Close menu when cell changes
  const prevTableCellRef = useRef(tableCellNode);
  useEffect(() => {
    if (prevTableCellRef.current !== tableCellNode) {
      setIsMenuOpen(false);
    }
    prevTableCellRef.current = tableCellNode;
  }, [tableCellNode]);

  if (!tableCellNode || !tableCellDOMNode) return null;

  return (
    <div className="table-cell-action-menu-wrapper">
      <div 
        className="table-cell-action-button-container" 
        ref={menuButtonRef}
      >
        <ChevronButton
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          menuRootRef={menuRootRef}
        />
        {isMenuOpen && (
          <TableActionMenu
            contextRef={menuRootRef}
            onClose={() => setIsMenuOpen(false)}
            tableCellNode={tableCellNode}
            tableCellDOMNode={tableCellDOMNode}
          />
        )}
      </div>
    </div>
  );
}

export default memo(TableCellActionMenuContainer);