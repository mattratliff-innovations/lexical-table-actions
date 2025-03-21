import React, { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import TableCellActionMenuContainer from './TableActionMenuContainer';

export default function TableActionMenuPlugin() {
  const [editor] = useLexicalComposerContext();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    
    // Apply CSS rules to the table cells to support the action menu
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .editor-input .scribe_lexical_tableCell {
        position: relative !important;
      }
    `;
    document.head.appendChild(styleElement);
    
    return () => {
      setMounted(false);
      document.head.removeChild(styleElement);
    };
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return <TableCellActionMenuContainer />;
}