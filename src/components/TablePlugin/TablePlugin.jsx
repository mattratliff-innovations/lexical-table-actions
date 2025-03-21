import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import './TablePlugin.css';

const GRID_SIZE = 8;

function TablePlugin({ isTablePoppedUp, setIsTablePoppedUp }) {
  const [editor] = useLexicalComposerContext();
  const [selectedRows, setSelectedRows] = useState(0);
  const [selectedCols, setSelectedCols] = useState(0);
  const popupRef = useRef(null);

  const closePopup = () => {
    setIsTablePoppedUp(false);
  };

  const createTable = (rows, cols) => {
    if (!editor) {
      console.error('Editor is not available');
      return;
    }
    
    try {
      editor.dispatchCommand(INSERT_TABLE_COMMAND, { columns: cols, rows });
      editor.focus();
    } catch (error) {
      console.error('Error creating table:', error);
    }
    closePopup();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        closePopup();
      }
    };

    // Position the popup relative to the table button
    if (isTablePoppedUp && popupRef.current) {
      const tableButton = document.getElementById('lexical-table-icon');
      if (tableButton) {
        const rect = tableButton.getBoundingClientRect();
        popupRef.current.style.top = `${rect.bottom + window.scrollY + 5}px`;
        popupRef.current.style.left = `${rect.left + window.scrollX}px`;
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTablePoppedUp, closePopup]);

  const selectGridCells = (row, col) => {
    setSelectedRows(row + 1);
    setSelectedCols(col + 1);
  };

  const handleMouseOver = (row, col) => {
    selectGridCells(row, col);
  };

  const handleCellClick = () => {
    createTable(selectedRows, selectedCols);
  };

  if (!isTablePoppedUp) {
    return null;
  }

  return (
    <div className="lexical-table-popup" ref={popupRef} style={{ position: 'fixed' }}>
      <div
        className="lexical-table-popup-grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, 15px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, 15px)`,
        }}
      >
        {Array.from({ length: GRID_SIZE }).map((_, row) => (
          Array.from({ length: GRID_SIZE }).map((_, col) => (
            <div
              key={`grid-${row}-${col}`}
              aria-label={`Select ${row + 1} rows by ${col + 1} columns`}
              className={`lexical-table-popup-grid-cell ${
                row < selectedRows && col < selectedCols ? 'lexical-table-popup-selected' : ''
              }`}
              onMouseOver={() => handleMouseOver(row, col)}
              onClick={handleCellClick}
              role="button"
              tabIndex={0}
            />
          ))
        ))}
      </div>
      <div className="lexical-table-popup-dimension-text">
        {selectedRows} × {selectedCols}
      </div>
    </div>
  );
}

TablePlugin.propTypes = {
  isTablePoppedUp: PropTypes.bool.isRequired,
  setIsTablePoppedUp: PropTypes.func.isRequired,
};

export default TablePlugin;