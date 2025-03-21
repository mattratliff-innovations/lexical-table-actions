import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import PropTypes from 'prop-types';
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
} from 'lexical';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import * as React from 'react';
import TablePlugin from '../components/TablePlugin/TablePlugin.jsx';

function ToolbarButton({
  classes = '',
  disabled = false, ...props
}) {
  const {
    id, ariaLabel, onClick, iconName,
  } = props;
  return (
    <button
      type="button"
      id={id}
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={() => onClick()}
      disabled={disabled}
      className={`toolbar-item spaced ${classes}`}
    >
      <i className={`format ${iconName}`} />
    </button>
  );
}

ToolbarButton.propTypes = {
  id: PropTypes.string,
  ariaLabel: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  classes: PropTypes.string,
  disabled: PropTypes.bool,
  iconName: PropTypes.string.isRequired,
};

export default function ToolbarPlugin({
  id = '',
  toolList = '',
  showToolbar = true,
  isCanUndo,
  isCanRedo,
  editorId, 
  customTools = [],
}) {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isTablePoppedUp, setIsTablePoppedUp] = useState(false);

  const toggleTablePopUp = () => {
    setIsTablePoppedUp(!isTablePoppedUp);
  };

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
    }
  }, []);

  const toolbarNameButtonMap = {
    bold: <ToolbarButton
      id="formatbold"
      ariaLabel="Format Bold"
      classes={isBold ? 'active' : ''}
      iconName="bold"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
    />,
    italic: <ToolbarButton
      id="formatitalics"
      ariaLabel="Format Italics"
      classes={isItalic ? 'active' : ''}
      iconName="italic"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
    />,
    underline: <ToolbarButton
      id="formatunderline"
      ariaLabel="Format Underline"
      classes={isUnderline ? 'active' : ''}
      iconName="underline"
      onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
    />,
    bullist: <ToolbarButton
      id="bulletedlist"
      ariaLabel="Bulleted List"
      iconName="bulleted-list"
      onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
    />,
    numlist: <ToolbarButton
      id="numberedlist"
      ariaLabel="Numbered List"
      iconName="numbered-list"
      onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
    />,
    table:
    <div id="lexical-table-icon" className="lexical-table-popup-container">
      <ToolbarButton
        id="table-button"
        ariaLabel="Insert Table"
        iconName="create-table"
        onClick={toggleTablePopUp}
      />
      {isTablePoppedUp && (
        <TablePlugin isTablePoppedUp={isTablePoppedUp} setIsTablePoppedUp={setIsTablePoppedUp} />
      )}
    </div>,
    undo: <ToolbarButton
      id="undo"
      ariaLabel="Undo"
      iconName="undo"
      disabled={!canUndo}
      onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
    />,
    redo: <ToolbarButton
      id="redo"
      ariaLabel="Redo"
      iconName="redo"
      disabled={!canRedo}
      onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
    />,
  };

  const buildToolbarButton = (name) => {
    const buttonComponent = toolbarNameButtonMap[name];
    if (buttonComponent) {
      return buttonComponent;
    }
    const customToolConfig = customTools.find((customTool) => name === customTool.name);
    if (!customToolConfig) return null;
    return (
      <ToolbarButton
        ariaLabel={customToolConfig.buttonTitle}
        iconName={customToolConfig.buttonIcon}
        onClick={() => customToolConfig.onClick(editor)}
      />
    );
  };

  const toolbarList = () => toolList.trim().split(/\s+/);

  useEffect(() => mergeRegister(
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateToolbar();
      });
    }),
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (/* _payload, newEditor */) => {
        updateToolbar();
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      CAN_UNDO_COMMAND,
      (payload) => {
        isCanUndo(payload);
        setCanUndo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      CAN_REDO_COMMAND,
      (payload) => {
        isCanRedo(payload);
        setCanRedo(payload);
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),
  ), [editor, updateToolbar, isCanUndo, isCanRedo]);

  if (!showToolbar) {
    return null;
  }

  return (
    <div className="toolbar" id={id} ref={toolbarRef}>
      {toolbarList().map((toolbarNameOption) => (
        <React.Fragment key={`${editorId}Menu${toolbarNameOption}`}>
          {buildToolbarButton(toolbarNameOption)}
        </React.Fragment>
      ))}
    </div>
  );
}

export const customToolProps = PropTypes.arrayOf(PropTypes.shape({
  buttonIcon: PropTypes.string.isRequired,
  buttonTitle: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
}));

ToolbarPlugin.propTypes = {
  id: PropTypes.string,
  editorId: PropTypes.string.isRequired,
  toolList: PropTypes.string,
  isCanUndo: PropTypes.func.isRequired,
  isCanRedo: PropTypes.func.isRequired,
  showToolbar: PropTypes.bool,
  customTools: customToolProps,
};