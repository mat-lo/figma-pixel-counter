# Complete Guide to Building Figma Plugins

## Table of Contents
1. [Introduction](#introduction)
2. [What Are Figma Plugins?](#what-are-figma-plugins)
3. [Prerequisites](#prerequisites)
4. [How Plugins Work](#how-plugins-work)
5. [Getting Started](#getting-started)
6. [Understanding the Document Structure](#understanding-the-document-structure)
7. [Working with Asynchronous Tasks](#working-with-asynchronous-tasks)
8. [Editing Properties](#editing-properties)
9. [Using TypeScript](#using-typescript)
10. [Creating User Interfaces](#creating-user-interfaces)
11. [Theming and CSS Variables](#theming-and-css-variables)
12. [Plugin Parameters](#plugin-parameters)
13. [Publishing Your Plugin](#publishing-your-plugin)

---

## Introduction

Welcome! This guide will teach you everything you need to know to build Figma plugins. Whether you're a beginner or experienced developer, you'll learn how to extend Figma's functionality and create tools that help users work more efficiently.

Figma plugins are powerful extensions created by the community that add new features and automate workflows in Figma, FigJam, Figma Slides, and Figma Buzz.

---

## What Are Figma Plugins?

### The Basics

Plugins are programs that:
- Run inside Figma files
- Perform specific actions or tasks
- Are built using JavaScript and HTML (just like websites!)
- Can read and modify the contents of Figma files
- Help users customize their experience and work faster

### Key Characteristics

**Short-lived Actions**: Plugins run for a short time to complete a specific task. They must be started by the user and can only run one at a time.

**No Background Processing**: Plugins can't run in the background. When finished, they must call `figma.closePlugin()` to tell Figma they're done.

**User-Initiated**: Users start plugins either:
- From the plugins menu
- Using keyboard shortcuts
- Through the quick actions menu (Cmd/Ctrl + /)

---

## Prerequisites

### What You Need to Know

Before building plugins, you should be comfortable with:

1. **JavaScript (ES6+)**
   - Variables, functions, and objects
   - Arrays and array methods
   - Promises and async/await
   - Modern JavaScript features

2. **HTML & CSS**
   - Basic HTML structure
   - CSS for styling
   - DOM manipulation (optional but helpful)

3. **Basic Programming Concepts**
   - Loops and conditionals
   - Event handling
   - API concepts

### What You Don't Need

You don't need:
- Advanced server-side programming
- Database knowledge
- Complex frameworks (though you can use them if you want!)

---

## How Plugins Work

### The Plugin Environment

Figma plugins run in a unique environment with two parts:

#### 1. Main Thread (Sandbox)
- Runs your plugin's core JavaScript code
- Has access to the Figma document (the layers, nodes, properties)
- **Cannot** access browser APIs directly
- Runs standard JavaScript (ES6+)

#### 2. UI Thread (iframe)
- Displays your plugin's user interface
- Has access to browser APIs (fetch, localStorage, etc.)
- **Cannot** access the Figma document directly

Think of it like this:
```
┌─────────────────────────────────────┐
│         Plugin Environment          │
├──────────────────┬──────────────────┤
│   Main Thread    │   UI Thread      │
│   (Sandbox)      │   (iframe)       │
│                  │                  │
│ • Access Figma   │ • Build UI       │
│   document       │ • Browser APIs   │
│ • Modify nodes   │ • Network calls  │
│ • Run plugin     │ • User input     │
│   logic          │                  │
│                  │                  │
│      ↕ Message Passing ↕           │
└──────────────────┴──────────────────┘
```

### Why This Design?

This separation keeps Figma:
- **Fast**: Plugin code runs efficiently without blocking the UI
- **Secure**: Plugins can't access things they shouldn't
- **Stable**: Crashes in plugins don't crash Figma

---

## Getting Started

### Quick Start Steps

1. **Create a New Plugin**
   - Open Figma
   - Go to Plugins → Development → New Plugin
   - Choose a template or start from scratch

2. **Basic File Structure**
   ```
   my-plugin/
   ├── manifest.json  (Plugin configuration)
   ├── code.js        (Main plugin code)
   └── ui.html        (Optional: UI for your plugin)
   ```

3. **The Manifest File**

Every plugin needs a `manifest.json` file:

```json
{
  "name": "My First Plugin",
  "id": "1234567890",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma", "figjam"]
}
```

**Key Fields**:
- `name`: Your plugin's name
- `main`: JavaScript file with your plugin code
- `ui`: HTML file for your UI (optional)
- `editorType`: Where your plugin works (figma, figjam, slides, buzz)

4. **Your First Plugin Code**

Here's a simple plugin that changes selected objects to 50% opacity:

```javascript
// code.js
// Get all selected nodes
for (const node of figma.currentPage.selection) {
  // Check if the node has an opacity property
  if ("opacity" in node) {
    node.opacity *= 0.5
  }
}

// Always close your plugin when done!
figma.closePlugin("Made selection 50% transparent!")
```

---

## Understanding the Document Structure

### The Node Tree

Figma files are organized as a tree of **nodes**. Everything in Figma is a node!

```
DocumentNode (root)
└── PageNode (each page)
    ├── FrameNode
    │   ├── RectangleNode
    │   ├── TextNode
    │   └── EllipseNode
    ├── GroupNode
    └── ComponentNode
```

### Key Concepts

#### DocumentNode
- The root of every Figma file
- Contains all the pages
- Access via `figma.root`

#### PageNode
- Represents each page in your file
- Access current page via `figma.currentPage`
- Contains all the layers on that page

#### SceneNode
- Any visible layer (frames, shapes, text, etc.)
- Has properties like position, size, color

### Accessing the Document

**Get Current Selection**:
```javascript
const selection = figma.currentPage.selection

// Check if anything is selected
if (selection.length === 0) {
  figma.notify("Please select something!")
  figma.closePlugin()
  return
}

// Process first selected item
const node = selection[0]
console.log(node.name, node.type)
```

**Accessing Pages**:
```javascript
// Current page (always loaded)
const currentPage = figma.currentPage

// All pages (may not be loaded!)
const allPages = figma.root.children

// Load a page before accessing its content
for (const page of figma.root.children) {
  await page.loadAsync()  // Important!
  console.log(`${page.name} has ${page.children.length} children`)
}
```

### Node Types

Common node types you'll work with:

- `FRAME`: Container/frame
- `GROUP`: Group of objects
- `RECTANGLE`: Rectangle shape
- `ELLIPSE`: Circle/ellipse shape
- `TEXT`: Text layer
- `COMPONENT`: Component
- `INSTANCE`: Component instance
- `VECTOR`: Vector path
- `LINE`: Line

**Always check node types** before working with specific properties:

```javascript
if (node.type === "RECTANGLE") {
  // Only rectangles have cornerRadius
  node.cornerRadius = 10
}

if (node.type === "TEXT") {
  // Only text nodes have characters
  console.log(node.characters)
}
```

### Traversing the Document

**Find specific nodes**:
```javascript
// Find first text node with more than 100 characters
const longText = figma.currentPage.findOne(node => {
  return node.type === "TEXT" && node.characters.length > 100
})

// Find all empty frames
const emptyFrames = figma.currentPage.findAll(node => {
  return node.type === "FRAME" && node.children.length === 0
})
```

**Custom traversal**:
```javascript
function countLayers(node) {
  let count = 0
  
  function traverse(n) {
    count++
    if ("children" in n) {
      for (const child of n.children) {
        traverse(child)
      }
    }
  }
  
  traverse(node)
  return count
}

const total = countLayers(figma.currentPage)
console.log(`Total layers: ${total}`)
```

---

## Working with Asynchronous Tasks

### Why Asynchronous?

Some operations take time and shouldn't block your plugin:
- Loading pages
- Loading fonts
- Exporting images
- Network requests

### Synchronous vs Asynchronous

**Synchronous** (waits for each task to complete):
```javascript
console.log("First")
console.log("Second")
console.log("Third")
// Output: First, Second, Third (in order)
```

**Asynchronous** (doesn't wait, continues running):
```javascript
console.log("First")
setTimeout(() => console.log("Second"), 1000)
console.log("Third")
// Output: First, Third, Second (Second comes last!)
```

### Promises

A Promise represents a task that will complete in the future:

```javascript
const promise = fetch("https://api.example.com/data")

promise
  .then(response => response.json())  // Success!
  .then(data => console.log(data))
  .catch(error => console.error(error))  // Error!
```

### Async/Await (Easier Way!)

```javascript
async function fetchData() {
  try {
    const response = await fetch("https://api.example.com/data")
    const data = await response.json()
    console.log(data)
  } catch (error) {
    console.error(error)
  }
}

fetchData()
```

### Common Async Operations in Figma

#### Loading Pages
```javascript
// Load a specific page
await page.loadAsync()

// Load all pages (use carefully in large files!)
await figma.loadAllPagesAsync()
```

#### Loading Fonts
```javascript
// Always load fonts before editing text
await figma.loadFontAsync({ family: "Roboto", style: "Regular" })

// Now you can edit text
textNode.characters = "Hello World"
```

#### Exporting Images
```javascript
// Export a node as PNG
const bytes = await node.exportAsync({
  format: 'PNG',
  constraint: { type: 'SCALE', value: 2 }  // 2x resolution
})
```

#### Creating a Complete Async Function
```javascript
async function createStyledText() {
  // Load the font first
  await figma.loadFontAsync({ family: "Inter", style: "Bold" })
  
  // Create text node
  const text = figma.createText()
  text.characters = "Hello, Figma!"
  text.fontSize = 48
  
  // Export it
  const imageBytes = await text.exportAsync({ format: 'PNG' })
  
  console.log("Done!")
  figma.closePlugin()
}

createStyledText()
```

---

## Editing Properties

### The Golden Rule

**You can't modify properties directly**. You must:
1. Clone the property
2. Modify the clone
3. Set the entire property back

### Why?

Figma needs to:
- Track changes for undo/redo
- Update all instances of components
- Re-render the canvas
- Maintain file integrity

### Editing Arrays (like selection)

**Wrong ❌**:
```javascript
// This won't work!
figma.currentPage.selection.push(newNode)
```

**Right ✅**:
```javascript
// Clone the array, modify it, then set it back
const selection = figma.currentPage.selection.slice()
selection.push(newNode)
figma.currentPage.selection = selection

// Or use concat
figma.currentPage.selection = 
  figma.currentPage.selection.concat(newNode)
```

### Editing Objects (like fills)

**Wrong ❌**:
```javascript
// This won't work!
node.fills[0].color.r = 0.5
```

**Right ✅**:
```javascript
// Clone the fills array
const fills = JSON.parse(JSON.stringify(node.fills))

// Modify the clone
fills[0].color.r = 0.5

// Set it back
node.fills = fills
```

### Helper Function for Cloning

```javascript
function clone(val) {
  const type = typeof val
  
  if (val === null) return null
  
  if (type === 'undefined' || type === 'number' || 
      type === 'string' || type === 'boolean') {
    return val
  }
  
  if (type === 'object') {
    if (val instanceof Array) {
      return val.map(x => clone(x))
    } else if (val instanceof Uint8Array) {
      return new Uint8Array(val)
    } else {
      let o = {}
      for (const key in val) {
        o[key] = clone(val[key])
      }
      return o
    }
  }
}
```

### Changing Colors the Easy Way

Use Figma's built-in utilities:

```javascript
// Create a solid color paint
const paint = figma.util.solidPaint("#FF00FF")
node.fills = [paint]

// With opacity
const paintWithOpacity = figma.util.solidPaint("#FF00FF88")
node.fills = [paintWithOpacity]

// Using RGB values
const rgbPaint = figma.util.solidPaint(figma.util.rgb(255, 0, 255))
node.fills = [rgbPaint]
```

### Common Editing Patterns

**Change multiple properties**:
```javascript
// Select a node and modify several properties
const rect = figma.createRectangle()
rect.x = 100
rect.y = 100
rect.resize(200, 100)
rect.cornerRadius = 10
rect.fills = [figma.util.solidPaint("#FF6B6B")]
```

**Batch changes efficiently**:
```javascript
// Better: Build new selection array once
const newSelection = []

for (const node of figma.currentPage.selection) {
  // Process each node
  if (node.type === "FRAME") {
    newSelection.push(node)
  }
}

// Set selection once at the end
figma.currentPage.selection = newSelection
```

---

## Using TypeScript

### What is TypeScript?

TypeScript is JavaScript with **type annotations**. It helps catch errors before you run your code!

**Regular JavaScript**:
```javascript
function greet(name) {
  return "Hello, " + name
}

greet(123)  // Oops! We passed a number
```

**TypeScript**:
```typescript
function greet(name: string): string {
  return "Hello, " + name
}

greet(123)  // Error! TypeScript catches this!
```

### Why Use TypeScript for Plugins?

1. **Catch Errors Early**: The compiler tells you about mistakes
2. **Better Autocomplete**: Your editor knows what properties exist
3. **Safer Code**: Less likely to crash for users
4. **Documentation**: Types explain what your code expects

### Setting Up TypeScript

1. **Install TypeScript**:
```bash
npm install --save-dev typescript @figma/plugin-typings
```

2. **Create `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "strict": true,
    "typeRoots": ["./node_modules/@types", "./node_modules/@figma"]
  }
}
```

3. **Compile TypeScript**:
```bash
npx tsc --watch
```

### Using Types with Figma

**Check node types safely**:
```typescript
function resizeIfFrame(node: SceneNode) {
  // TypeScript knows not all nodes can be resized
  if (node.type === "FRAME") {
    // Now TypeScript knows node is a FrameNode
    node.resize(100, 100)  // OK!
  }
}
```

**Type predicates**:
```typescript
function hasChildren(node: SceneNode): 
  node is FrameNode | GroupNode | ComponentNode {
  return node.type === "FRAME" || 
         node.type === "GROUP" || 
         node.type === "COMPONENT"
}

const node = figma.currentPage.selection[0]
if (hasChildren(node)) {
  // TypeScript knows node has .children now
  console.log(node.children)
}
```

**Working with fills**:
```typescript
// TypeScript knows fills is readonly
const fills: readonly Paint[] = node.fills as readonly Paint[]

// Clone before modifying
const newFills = clone(fills)
newFills[0].opacity = 0.5
node.fills = newFills
```

---

## Creating User Interfaces

### Basic UI Setup

1. **Create an HTML file** (`ui.html`):
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 10px;
      font-family: sans-serif;
    }
    button {
      padding: 8px 16px;
    }
  </style>
</head>
<body>
  <h2>My Plugin</h2>
  <button id="create-btn">Create Rectangle</button>
  
  <script>
    // UI code goes here
    document.getElementById('create-btn').onclick = () => {
      parent.postMessage({ pluginMessage: 'create-rectangle' }, '*')
    }
  </script>
</body>
</html>
```

2. **Update your manifest**:
```json
{
  "name": "My Plugin",
  "main": "code.js",
  "ui": "ui.html"
}
```

3. **Show the UI in your plugin code**:
```javascript
// code.js
figma.showUI(__html__)
```

### Message Passing

Communication between UI and plugin code:

#### From UI to Plugin Code

**In UI (ui.html)**:
```html
<script>
  const data = { color: "#FF0000", size: 100 }
  parent.postMessage({ pluginMessage: data }, '*')
</script>
```

**In Plugin Code (code.js)**:
```javascript
figma.ui.onmessage = (message) => {
  console.log("Received:", message)
  // message = { color: "#FF0000", size: 100 }
  
  // Do something with the data
  const rect = figma.createRectangle()
  rect.resize(message.size, message.size)
  rect.fills = [figma.util.solidPaint(message.color)]
  
  figma.closePlugin()
}
```

#### From Plugin Code to UI

**In Plugin Code**:
```javascript
figma.ui.postMessage({
  type: 'selection-changed',
  count: figma.currentPage.selection.length
})
```

**In UI**:
```html
<script>
  onmessage = (event) => {
    const msg = event.data.pluginMessage
    console.log("Received:", msg)
    
    if (msg.type === 'selection-changed') {
      document.getElementById('count').innerText = 
        `Selected: ${msg.count}`
    }
  }
</script>
```

### Complete UI Example

```html
<!-- ui.html -->
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      padding: 16px; 
      font-family: Inter, sans-serif;
    }
    input { 
      width: 100%; 
      padding: 8px; 
      margin: 8px 0;
    }
    button {
      width: 100%;
      padding: 8px;
      background: #0d99ff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <h3>Create Colored Rectangle</h3>
  
  <label>Color:</label>
  <input type="color" id="color-input" value="#ff0000">
  
  <label>Size:</label>
  <input type="number" id="size-input" value="100">
  
  <button id="create-btn">Create</button>
  
  <script>
    document.getElementById('create-btn').onclick = () => {
      const color = document.getElementById('color-input').value
      const size = parseInt(document.getElementById('size-input').value)
      
      parent.postMessage({ 
        pluginMessage: { color, size }
      }, '*')
    }
  </script>
</body>
</html>
```

```javascript
// code.js
figma.showUI(__html__, { width: 240, height: 240 })

figma.ui.onmessage = (msg) => {
  const rect = figma.createRectangle()
  rect.resize(msg.size, msg.size)
  rect.fills = [figma.util.solidPaint(msg.color)]
  
  figma.currentPage.selection = [rect]
  figma.viewport.scrollAndZoomIntoView([rect])
  
  figma.notify("Rectangle created!")
  figma.closePlugin()
}
```

---

## Theming and CSS Variables

### Supporting Light and Dark Modes

Figma provides CSS variables for consistent theming:

#### Enable Theme Colors

```javascript
figma.showUI(__html__, { themeColors: true })
```

#### Use CSS Variables in Your UI

```html
<style>
  body {
    background-color: var(--figma-color-bg);
    color: var(--figma-color-text);
  }
  
  button {
    background: var(--figma-color-bg-brand);
    color: var(--figma-color-text-onbrand);
  }
  
  input {
    background: var(--figma-color-bg-secondary);
    border: 1px solid var(--figma-color-border);
    color: var(--figma-color-text);
  }
</style>
```

### Most Common Theme Variables

**Text Colors**:
- `--figma-color-text`: Default text
- `--figma-color-text-secondary`: Secondary/lighter text
- `--figma-color-text-tertiary`: Placeholder text
- `--figma-color-text-brand`: Blue/purple brand color

**Background Colors**:
- `--figma-color-bg`: Main background (white/dark)
- `--figma-color-bg-secondary`: Secondary background
- `--figma-color-bg-brand`: Brand color background

**Border Colors**:
- `--figma-color-border`: Default border
- `--figma-color-border-strong`: Darker border
- `--figma-color-border-selected`: Blue selection border

**Semantic Colors**:
- `--figma-color-bg-success`: Green (success)
- `--figma-color-bg-warning`: Yellow (warning)
- `--figma-color-bg-danger`: Red (error/danger)

### Complete Themed UI Example

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      padding: 16px;
      font-family: Inter, sans-serif;
      background: var(--figma-color-bg);
      color: var(--figma-color-text);
    }
    
    h2 {
      margin-bottom: 16px;
      color: var(--figma-color-text);
    }
    
    .input-group {
      margin-bottom: 12px;
    }
    
    label {
      display: block;
      margin-bottom: 4px;
      font-size: 11px;
      color: var(--figma-color-text-secondary);
    }
    
    input {
      width: 100%;
      padding: 8px;
      border: 1px solid var(--figma-color-border);
      border-radius: 4px;
      background: var(--figma-color-bg-secondary);
      color: var(--figma-color-text);
      font-size: 12px;
    }
    
    input:focus {
      outline: none;
      border-color: var(--figma-color-border-selected);
    }
    
    button {
      width: 100%;
      padding: 8px;
      border: none;
      border-radius: 4px;
      background: var(--figma-color-bg-brand);
      color: var(--figma-color-text-onbrand);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
    }
    
    button:hover {
      background: var(--figma-color-bg-brand-hover);
    }
    
    .status {
      margin-top: 12px;
      padding: 8px;
      border-radius: 4px;
      font-size: 11px;
      background: var(--figma-color-bg-success);
      color: var(--figma-color-text-onsuccess);
    }
  </style>
</head>
<body>
  <h2>Create Rectangle</h2>
  
  <div class="input-group">
    <label>Width</label>
    <input type="number" id="width" value="100">
  </div>
  
  <div class="input-group">
    <label>Height</label>
    <input type="number" id="height" value="100">
  </div>
  
  <button id="create">Create</button>
  
  <script>
    document.getElementById('create').onclick = () => {
      const width = document.getElementById('width').value
      const height = document.getElementById('height').value
      parent.postMessage({ pluginMessage: { width, height } }, '*')
    }
  </script>
</body>
</html>
```

---

## Plugin Parameters

### What Are Plugin Parameters?

Parameters let users provide input **without opening a UI**. They're entered directly in the quick actions menu!

**Benefits**:
- Faster for power users
- No UI development needed
- Keyboard-friendly workflow
- Great for simple inputs

### Setting Up Parameters

1. **Define parameters in manifest.json**:
```json
{
  "name": "Resize Tool",
  "main": "code.js",
  "parameters": [
    {
      "name": "Width",
      "key": "width",
      "allowFreeform": true
    },
    {
      "name": "Height",
      "key": "height",
      "allowFreeform": true
    },
    {
      "name": "Keep Aspect Ratio",
      "key": "keepRatio",
      "optional": true
    }
  ]
}
```

**Parameter Options**:
- `name`: Display name in UI
- `key`: Identifier used in code
- `allowFreeform`: Allow any value (not just suggestions)
- `optional`: Parameter can be skipped

2. **Provide Suggestions**:
```javascript
figma.parameters.on('input', ({ key, query, result }) => {
  switch (key) {
    case 'width':
      // Suggest common widths
      result.setSuggestions(['100', '200', '300', '400', '500']
        .filter(s => s.includes(query)))
      break
      
    case 'height':
      // Suggest common heights
      result.setSuggestions(['100', '200', '300', '400', '500']
        .filter(s => s.includes(query)))
      break
      
    case 'keepRatio':
      result.setSuggestions(['yes', 'no'])
      break
  }
})
```

3. **Handle the Run Event**:
```javascript
figma.on('run', ({ parameters }) => {
  if (!parameters) {
    // No parameters provided, show UI or exit
    figma.notify("Please use quick actions to set parameters")
    figma.closePlugin()
    return
  }
  
  const width = parseInt(parameters.width)
  const height = parseInt(parameters.height)
  
  // Resize selected nodes
  for (const node of figma.currentPage.selection) {
    if ("resize" in node) {
      node.resize(width, height)
    }
  }
  
  figma.notify(`Resized to ${width}x${height}`)
  figma.closePlugin()
})
```

### Complete Parameter Example

```javascript
// code.js

// Provide parameter suggestions
figma.parameters.on('input', ({ key, query, result }) => {
  if (key === 'shape') {
    const shapes = ['rectangle', 'ellipse', 'polygon']
    result.setSuggestions(
      shapes.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    )
  }
  
  if (key === 'color') {
    const colors = ['red', 'blue', 'green', 'yellow', 'purple']
    result.setSuggestions(
      colors.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    )
  }
})

// Handle the run
figma.on('run', ({ parameters }) => {
  if (!parameters) {
    figma.closePlugin()
    return
  }
  
  const { shape, color } = parameters
  let node
  
  // Create the shape
  switch (shape) {
    case 'rectangle':
      node = figma.createRectangle()
      break
    case 'ellipse':
      node = figma.createEllipse()
      break
    case 'polygon':
      node = figma.createPolygon()
      break
  }
  
  // Set color
  const colors = {
    red: '#FF0000',
    blue: '#0000FF',
    green: '#00FF00',
    yellow: '#FFFF00',
    purple: '#800080'
  }
  
  node.fills = [figma.util.solidPaint(colors[color])]
  node.resize(100, 100)
  
  figma.currentPage.selection = [node]
  figma.viewport.scrollAndZoomIntoView([node])
  
  figma.notify(`Created ${color} ${shape}!`)
  figma.closePlugin()
})
```

---

## Publishing Your Plugin

### Before Publishing

**✅ Checklist**:
- [ ] Plugin works without errors
- [ ] Handles edge cases (empty selection, wrong node types)
- [ ] Has clear error messages
- [ ] Supports light and dark themes (if has UI)
- [ ] Tested in different scenarios
- [ ] Has a good name and description
- [ ] Includes a cover image

### Publishing Steps

1. **Prepare Your Plugin**
   - Test thoroughly
   - Write clear documentation
   - Create a cover image (1920x960px)

2. **Publish from Figma**
   - Plugins → Development → Your Plugin → Publish
   - Fill in:
     - Description
     - Instructions
     - Support contact (email or website)
     - Tags/categories
   - Upload cover image
   - Submit for review

3. **Approval Process**
   - Figma reviews your plugin (usually 1-2 days)
   - They check for quality and safety
   - You'll get feedback if changes needed

4. **After Approval**
   - Plugin appears in Figma Community
   - Users can install it
   - You can push updates anytime (no re-approval needed!)

### Best Practices

**Code Quality**:
```javascript
// Good: Handle errors gracefully
try {
  const selection = figma.currentPage.selection
  if (selection.length === 0) {
    figma.notify("Please select something first")
    figma.closePlugin()
    return
  }
  
  // ... your code
} catch (error) {
  figma.notify("Something went wrong: " + error.message)
  figma.closePlugin()
}
```

**User Experience**:
- Show helpful notifications
- Provide clear instructions
- Handle all edge cases
- Support keyboard shortcuts
- Test with real users

**Performance**:
- Only load pages you need
- Batch operations when possible
- Close plugin when done
- Don't traverse entire document unless necessary

---

## Complete Example Plugin

Here's a full example that puts everything together:

### manifest.json
```json
{
  "name": "Color Palette Generator",
  "id": "1234567890",
  "api": "1.0.0",
  "main": "code.js",
  "ui": "ui.html",
  "editorType": ["figma"]
}
```

### code.js
```javascript
// Show the UI
figma.showUI(__html__, { 
  width: 300, 
  height: 400,
  themeColors: true 
})

// Handle messages from UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === 'generate-palette') {
    const { baseColor, count } = msg
    
    // Create frames for palette
    const swatchSize = 100
    const spacing = 20
    
    for (let i = 0; i < count; i++) {
      // Create a rectangle for each color
      const rect = figma.createRectangle()
      rect.resize(swatchSize, swatchSize)
      rect.x = i * (swatchSize + spacing)
      rect.y = 0
      
      // Generate color variant
      const hue = (parseInt(baseColor) + (i * (360 / count))) % 360
      rect.fills = [figma.util.solidPaint(`hsl(${hue}, 70%, 60%)`)]
      
      // Add to canvas
      figma.currentPage.appendChild(rect)
    }
    
    figma.notify(`Created palette with ${count} colors!`)
    figma.closePlugin()
  }
  
  if (msg.type === 'cancel') {
    figma.closePlugin()
  }
}

// Send current selection to UI
figma.ui.postMessage({
  type: 'selection-changed',
  count: figma.currentPage.selection.length
})
```

### ui.html
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    body {
      padding: 20px;
      font-family: Inter, sans-serif;
      background: var(--figma-color-bg);
      color: var(--figma-color-text);
    }
    
    h2 {
      margin-bottom: 20px;
      font-size: 18px;
    }
    
    .input-group {
      margin-bottom: 16px;
    }
    
    label {
      display: block;
      margin-bottom: 8px;
      font-size: 12px;
      color: var(--figma-color-text-secondary);
    }
    
    input[type="range"] {
      width: 100%;
      margin-bottom: 8px;
    }
    
    input[type="color"] {
      width: 100%;
      height: 40px;
      border: 1px solid var(--figma-color-border);
      border-radius: 4px;
      cursor: pointer;
    }
    
    .value {
      font-size: 14px;
      color: var(--figma-color-text);
      font-weight: 500;
    }
    
    button {
      width: 100%;
      padding: 12px;
      margin-top: 10px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .primary {
      background: var(--figma-color-bg-brand);
      color: var(--figma-color-text-onbrand);
    }
    
    .primary:hover {
      background: var(--figma-color-bg-brand-hover);
    }
    
    .secondary {
      background: var(--figma-color-bg-secondary);
      color: var(--figma-color-text);
    }
    
    .secondary:hover {
      background: var(--figma-color-bg-hover);
    }
  </style>
</head>
<body>
  <h2>🎨 Color Palette Generator</h2>
  
  <div class="input-group">
    <label>Base Color</label>
    <input type="color" id="baseColor" value="#FF6B6B">
  </div>
  
  <div class="input-group">
    <label>
      Number of Colors: <span class="value" id="countValue">5</span>
    </label>
    <input type="range" id="count" min="2" max="10" value="5">
  </div>
  
  <button class="primary" id="generate">Generate Palette</button>
  <button class="secondary" id="cancel">Cancel</button>
  
  <script>
    // Update count display
    const countInput = document.getElementById('count')
    const countValue = document.getElementById('countValue')
    
    countInput.oninput = () => {
      countValue.textContent = countInput.value
    }
    
    // Generate button
    document.getElementById('generate').onclick = () => {
      const baseColor = document.getElementById('baseColor').value
      const count = parseInt(document.getElementById('count').value)
      
      // Convert hex to hue
      const hex = baseColor.replace('#', '')
      const r = parseInt(hex.substr(0,2), 16) / 255
      const g = parseInt(hex.substr(2,2), 16) / 255
      const b = parseInt(hex.substr(4,2), 16) / 255
      
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const delta = max - min
      
      let hue = 0
      if (delta !== 0) {
        if (max === r) {
          hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6
        } else if (max === g) {
          hue = ((b - r) / delta + 2) / 6
        } else {
          hue = ((r - g) / delta + 4) / 6
        }
      }
      hue = Math.round(hue * 360)
      
      parent.postMessage({ 
        pluginMessage: { 
          type: 'generate-palette',
          baseColor: hue,
          count 
        }
      }, '*')
    }
    
    // Cancel button
    document.getElementById('cancel').onclick = () => {
      parent.postMessage({ 
        pluginMessage: { type: 'cancel' }
      }, '*')
    }
    
    // Listen for messages from plugin
    onmessage = (event) => {
      const msg = event.data.pluginMessage
      if (msg.type === 'selection-changed') {
        console.log('Selection count:', msg.count)
      }
    }
  </script>
</body>
</html>
```

---

## Summary and Next Steps

### What You've Learned

1. **Plugin Basics**: What plugins are and how they work
2. **Architecture**: Main thread vs UI thread, message passing
3. **Document Structure**: Nodes, pages, and traversing the tree
4. **Async Operations**: Promises, async/await, loading data
5. **Editing**: How to properly modify node properties
6. **TypeScript**: Type safety and better development experience
7. **UI Creation**: Building interfaces with HTML/CSS
8. **Theming**: Supporting light and dark modes
9. **Parameters**: Fast input without UI
10. **Publishing**: Sharing your plugin with the community

### Resources

- **Official Docs**: [developers.figma.com](https://developers.figma.com)
- **API Reference**: [developers.figma.com/docs/api](https://developers.figma.com/docs/plugins/api/api-reference/)
- **Community Forum**: [forum.figma.com](https://forum.figma.com/)
- **Discord**: [Join the Figma Developers Discord](https://discord.gg/xzQhe2Vcvx)
- **Sample Plugins**: [github.com/figma/plugin-samples](https://github.com/figma/plugin-samples)

### Practice Ideas

Start with simple plugins:
1. **Text Formatter**: Convert text to UPPERCASE/lowercase
2. **Layer Renamer**: Batch rename selected layers
3. **Color Picker**: Apply a color to all selected items
4. **Duplicate & Space**: Duplicate and evenly space objects
5. **Export Helper**: Batch export selected items

Then try more complex ones:
1. **Icon Library**: Drag and drop SVG icons
2. **Style Manager**: Save and apply custom styles
3. **Layout Tool**: Auto-arrange items in grids
4. **Asset Generator**: Create multiple variations of designs
5. **Data Populator**: Fill designs with real data

### Tips for Success

1. **Start Small**: Build simple plugins first
2. **Test Thoroughly**: Try edge cases and error scenarios
3. **Ask for Feedback**: Share with others early
4. **Study Examples**: Learn from existing plugins
5. **Join the Community**: Ask questions, share knowledge
6. **Iterate**: Improve based on user feedback
7. **Document Well**: Help users understand your plugin

---

## Quick Reference

### Common Code Patterns

**Check selection**:
```javascript
if (figma.currentPage.selection.length === 0) {
  figma.notify("Please select something")
  figma.closePlugin()
}
```

**Load fonts for text editing**:
```javascript
await figma.loadFontAsync({ family: "Inter", style: "Regular" })
textNode.characters = "New text"
```

**Create and style a shape**:
```javascript
const rect = figma.createRectangle()
rect.resize(100, 100)
rect.fills = [figma.util.solidPaint("#FF0000")]
```

**Export as image**:
```javascript
const bytes = await node.exportAsync({ 
  format: 'PNG',
  constraint: { type: 'SCALE', value: 2 }
})
```

**Traverse all nodes**:
```javascript
node.findAll(node => {
  // Return true for nodes you want
  return node.type === "TEXT"
})
```

**Show notification**:
```javascript
figma.notify("Success!", { timeout: 2000 })
```

**Close plugin**:
```javascript
figma.closePlugin("Optional message")
```

---

Happy plugin building! 🎉

Remember: Start simple, test often, and don't be afraid to experiment. The Figma plugin community is friendly and always ready to help!
