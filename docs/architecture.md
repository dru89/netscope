# Architecture

Netscope is an Electron application with a clear separation between the **main process** (Node.js), the **preload script** (bridge), and the **renderer process** (React UI).

## Process Model

```
+-------------------+       IPC        +-------------------+
|   Main Process    | <--------------> |  Renderer Process  |
|   (electron/)     |    (preload)     |  (src/)            |
|                   |                  |                    |
|  - Window mgmt    |                  |  - React UI        |
|  - File I/O       |                  |  - HAR parsing     |
|  - Native menus   |                  |  - State mgmt      |
|  - File assoc.    |                  |  - Filtering/sort  |
|  - Theme detect   |                  |  - Rendering       |
+-------------------+                  +-------------------+
```

### Main Process (`electron/main.ts`)

The main process runs in Node.js and handles everything that requires native OS access:

- **Window creation** -- Creates a `BrowserWindow` with a hidden title bar (`hiddenInset` style) and macOS traffic light positioning. The window starts hidden and is shown once `ready-to-show` fires to avoid a white flash.

- **File open dialog** -- Exposes an `open-file-dialog` IPC handler that opens a native file picker filtered to `.har` files. Reads the selected file from disk and returns its content to the renderer.

- **Drag-and-drop support** -- Exposes a `read-har-file` IPC handler. When a file is dropped onto the window, the renderer sends the file path to the main process, which reads it from disk and returns the content.

- **Finder file association** -- Listens for the `open-file` app event, which fires when macOS asks the app to open a `.har` file (double-click in Finder, drag onto dock icon, or `open` CLI command). If the window isn't ready yet, the file path is stored in `pendingFile` and sent once the window loads.

- **Command-line arguments** -- On startup, checks `process.argv` for a `.har` file path, supporting `open "Netscope.app" --args file.har` usage.

- **Application menu** -- Builds a native menu bar with File > Open HAR File (Cmd+O), standard Edit/View/Window menus, and the About panel.

- **Theme detection** -- Queries `nativeTheme.shouldUseDarkColors` and sends `theme-changed` events to the renderer when the system theme changes.

### Preload Script (`electron/preload.ts`)

The preload script runs in a sandboxed context and uses `contextBridge.exposeInMainWorld` to create a safe `window.electronAPI` object. This is the only bridge between the main and renderer processes.

The exposed API:

| Method | Direction | Purpose |
|--------|-----------|---------|
| `openFileDialog()` | Renderer -> Main | Opens native file picker, returns file content |
| `readHarFile(path)` | Renderer -> Main | Reads a file by path (used for drag-and-drop) |
| `getNativeTheme()` | Renderer -> Main | Returns current system theme |
| `onHarFileOpened(cb)` | Main -> Renderer | Listener for files opened via Finder/menu |
| `onThemeChanged(cb)` | Main -> Renderer | Listener for system theme changes |

Each listener method returns an unsubscribe function for cleanup in React `useEffect` hooks.

### Renderer Process (`src/`)

The renderer is a standard React application bundled by Vite. It has no direct access to Node.js APIs -- all OS interaction goes through `window.electronAPI`.

**State management** is handled entirely with React `useState`, `useCallback`, and `useMemo` hooks in `App.tsx`. There is no external state library. The key state:

- `har` -- The parsed HAR object (or null if no file is loaded)
- `selectedEntry` -- The currently selected request entry
- `detailPanelOpen` -- Whether the detail panel is visible
- `filter` -- Active search text and content type filter
- `sort` -- Current sort column and direction

**Filtering** uses a two-layer approach. The toolbar search input text is parsed into structured filter tokens by `parseFilterQuery()` in `src/utils/filterParser.ts`, then each entry is tested against all tokens by `matchEntry()`. Toolbar button filters (content type, method, status) are applied separately and AND'd with the text filter results. The filter tokens are memoized with `useMemo` so parsing only runs when the search string changes.

**Keyboard navigation** is split between two handlers. Table-scoped shortcuts (arrow keys, j/k, Enter/Space, Home/End, Cmd+Up/Down) are handled by an `onKeyDown` on the table container div in `RequestTable.tsx`. Global shortcuts (Escape, `/`, Cmd+F) are handled by a `document` keydown listener in `App.tsx`. The global handler checks `document.activeElement` to avoid interfering with inputs.

**Data flow for opening a file:**

1. User opens a file (any method)
2. Main process reads the file from disk via `fs.readFileSync`
3. Raw JSON string is sent to the renderer via IPC
4. Renderer calls `parseHar()` which validates and enriches the data
5. React state updates, triggering a re-render of the request table

## Build Pipeline

The build uses three tools in sequence:

```
tsc          ->  vite build  ->  electron-builder
(type check)    (bundle)        (package .app/.dmg)
```

1. **TypeScript** -- Type-checks all source files (no emit, just validation)
2. **Vite** -- Bundles three separate outputs:
   - `dist/` -- The React app (HTML, CSS, JS)
   - `dist-electron/main.js` -- The compiled main process
   - `dist-electron/preload.js` -- The compiled preload script
3. **electron-builder** -- Packages everything into `release/mac-arm64/Netscope.app` and `release/Netscope-1.0.0-arm64.dmg`

## Security Model

The app follows Electron's security best practices:

- **Context isolation** is enabled (`contextIsolation: true`)
- **Node integration** is disabled (`nodeIntegration: false`)
- The renderer has **no direct access** to `fs`, `path`, or any Node.js module
- All file I/O is handled in the main process and results are passed via IPC
- The preload script exposes a minimal, typed API surface
