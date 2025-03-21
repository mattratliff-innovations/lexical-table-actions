import React from 'react';
import Editor from './components/Editor';
import './styles/editor.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>Lexical Table Editor</h1>
        <p>Use the toolbar to insert a table, then click the chevron button in any cell to see options</p>
      </header>
      <main>
        <Editor />
      </main>
    </div>
  );
}

export default App;