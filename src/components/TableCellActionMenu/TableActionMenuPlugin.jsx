import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import TableCellActionMenuContainer from './TableActionMenuContainer';

export default function TableActionMenuPlugin({ anchorElem = document.body }) {
  const [editor] = useLexicalComposerContext();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);
  
  if (!mounted) {
    return null;
  }
  
  return createPortal(
    <TableCellActionMenuContainer anchorElem={anchorElem} />,
    anchorElem,
  );
}