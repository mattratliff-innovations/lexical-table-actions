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

  const moveMenu = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      const nativeSelection = window.getSelection();
      const { activeElement } = document;
      const rootElement = editor.getRootElement();
  
      if (!selection || !rootElement || !nativeSelection) {
        setTableCellNode(null);
        return;
      }
  
      if ($isRangeSelection(selection)
          && rootElement.contains(nativeSelection.anchorNode)) {
        const cellNode = $getTableCellNodeFromLexicalNode(selection.anchor.getNode());
  
        if (!cellNode) {
          setTableCellNode(null);
          return;
        }
  
        const cellNodeDOM = editor.getElementByKey(cellNode.getKey());
        if (!cellNodeDOM) {
          setTableCellNode(null);
          return;
        }
  
        setTableCellNode(cellNode);
      } else if (!activeElement) {
        setTableCellNode(null);
      }
    });
  }, [editor]);

  useEffect(() => editor.registerUpdateListener(() => {
    editor.getEditorState().read(() => {
      moveMenu();
    });
  }), [editor, moveMenu]);

  return tableCellNode;
};

// Hook to position the menu button
const useMenuPosition = (menuButtonRef, tableCellNode, editor, anchorElem) => {
  useEffect(() => {
    const menuButton = menuButtonRef.current;
    if (!menuButton || !tableCellNode) return;

    const tableCellDOM = editor.getElementByKey(tableCellNode.getKey());
    if (!tableCellDOM) {
      menuButton.style.opacity = '0';
      menuButton.style.transform = 'translate(-10000px, -10000px)';
      return;
    }

    const calculatePosition = () => {
      const tableCellRect = tableCellDOM.getBoundingClientRect();
      const menuRect = menuButton.getBoundingClientRect();
      const anchorRect = anchorElem.getBoundingClientRect();

      let top = tableCellRect.top - anchorRect.top + 8;
      let left = tableCellRect.right - menuRect.width - 3 - anchorRect.left;

      return { top, left };
    };

    const position = calculatePosition();
    menuButton.style.opacity = '1';
    menuButton.style.transform = `translate(${position.left}px, ${position.top}px)`;

    const handleResize = () => {
      const newPosition = calculatePosition();
      menuButton.style.transform = `translate(${newPosition.left}px, ${newPosition.top}px)`;
    };

    window.addEventListener('resize', handleResize);
    // eslint-disable-next-line consistent-return
    return () => window.removeEventListener('resize', handleResize);
  }, [menuButtonRef, tableCellNode, editor, anchorElem]);
};

// The main TableCellActionMenuContainer component
function TableCellActionMenuContainer({ anchorElem }) {
  const [editor] = useLexicalComposerContext();
  const menuButtonRef = useRef(null);
  const menuRootRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tableCellNode = useTableCellNode(editor);
  useMenuPosition(menuButtonRef, tableCellNode, editor, anchorElem);

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

  if (!tableCellNode) return null;

  return (
    <div className="table-cell-action-button-container" ref={menuButtonRef}>
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
        />
      )}
    </div>
  );
}

export default memo(TableCellActionMenuContainer);