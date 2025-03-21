import React, { useState, useRef, useEffect } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TablePlugin } from '@lexical/react/LexicalTablePlugin';
import './TablePlugin/TablePlugin.css';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import ToolbarPlugin from '../components/ToolbarPlugin';
import TableActionMenuPlugin from '../components/TableCellActionMenu/TableActionMenuPlugin';
import { editorConfig } from '../utils/lexicalUtil';
import '../styles/lexicalTable.css'; // Make sure to import the table styles

// Placeholder component
function Placeholder() {
  return <div className="editor-placeholder">Enter some text...</div>;
}

function Editor() {
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const editorRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);

  // Set editor as ready after initial render
  useEffect(() => {
    if (editorRef.current) {
      setEditorReady(true);
    }
  }, [editorRef.current]);

  return (
    <div className="editor-container">
      <LexicalComposer initialConfig={editorConfig}>
        <div className="editor-inner" ref={editorRef}>
          <ToolbarPlugin 
            editorId="main-editor"
            toolList="bold italic underline bullist numlist table undo redo"
            isCanUndo={(val) => setCanUndo(val)}
            isCanRedo={(val) => setCanRedo(val)}
          />
          <div className="editor-content">
            <RichTextPlugin
              contentEditable={<ContentEditable className="editor-input" />}
              placeholder={<Placeholder />}
            />
            <HistoryPlugin />
            <ListPlugin />
            <TablePlugin />
            {editorReady && <TableActionMenuPlugin />}
            <OnChangePlugin onChange={(editorState) => {
              editorState.read(() => {
                // Optional: Save content to localStorage or handle changes
              });
            }} />
          </div>
        </div>
      </LexicalComposer>
    </div>
  );
}

export default Editor;