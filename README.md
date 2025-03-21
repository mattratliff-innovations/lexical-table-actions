# Lexical Table Editor

A React application built with Lexical editor that features a rich text editor with table functionality. Users can insert tables using the toolbar and manipulate them using a contextual menu that appears when clicking on a chevron button in each table cell.

## Features

- Rich text editing with Lexical editor
- Insert and format tables 
- Table cell actions:
  - Insert row above/below
  - Insert column left/right
  - Delete row/column/table
  - Toggle row/column headers

## Project Setup

### Prerequisites

- Node.js and npm (or yarn)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

## Usage

1. Open the editor and click on the table icon in the toolbar
2. Select the desired table dimensions from the grid
3. After the table is inserted, click on any cell to start editing
4. Each cell has a small chevron button that appears when the cell is selected
5. Click on the chevron to see table action options (insert/delete rows and columns)

## Project Structure

```
src/
  ├── components/
  │   ├── Editor.jsx                # Main editor component
  │   ├── TableCellActionMenu/      # Table cell action menu components
  │   └── TablePlugin/              # Table creation plugin
  ├── styles/                       # CSS styles
  ├── utils/                        # Utility functions
  ├── App.jsx                       # Main application component
  └── index.jsx                     # Entry point
```

## Technologies Used

- React
- Lexical (Facebook's extensible text editor framework)
- CSS for styling

## License

MIT