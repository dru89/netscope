# HAR Explorer

A native macOS desktop application for viewing and analyzing HTTP Archive (HAR) files. Built with Electron, React, and TypeScript.

HAR Explorer gives you the same network inspection experience as Chrome or Firefox DevTools, but as a standalone app -- no browser required.

## Features

- **Three ways to open files** -- Use File > Open (Cmd+O), drag-and-drop onto the window, or double-click `.har` files in Finder
- **Request list** -- Sortable table showing method, status, URL, content type, transfer size, and duration for every request
- **Waterfall chart** -- Color-coded timing bars showing blocked, DNS, connect, TLS, send, wait (TTFB), and receive phases
- **Detail panel** -- Tabbed inspector with Headers, Payload, Response, Timing, and Cookies views
- **Filtering** -- Filter requests by URL text and content type (XHR, JS, CSS, Image, Font, Doc, Media, Other)
- **Response preview** -- Auto-formatted JSON, rendered base64 images, and raw text display
- **Summary bar** -- Aggregate stats: total requests, transfer size, resource size, total time, and breakdown by type
- **System theme** -- Automatically follows macOS light/dark mode

## Quick Start

```bash
# Install dependencies
npm install

# Run in development mode (hot reload)
npm run dev

# Build the packaged .app and .dmg
npm run build
```

After building, the output is in the `release/` directory:

| Path | Description |
|------|-------------|
| `release/mac-arm64/HAR Explorer.app` | Standalone application |
| `release/HAR Explorer-1.0.0-arm64.dmg` | Distributable disk image |

To launch the app directly:

```bash
open "release/mac-arm64/HAR Explorer.app"
```

## Setting as Default `.har` Handler

1. Right-click any `.har` file in Finder
2. Choose **Get Info**
3. Under **Open with**, select **HAR Explorer**
4. Click **Change All...**

After this, double-clicking any `.har` file will open it in HAR Explorer.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server + Electron with hot reload |
| `npm run build` | Type-check, bundle, and package the app with electron-builder |
| `npm run build:vite` | Type-check and bundle only (no electron-builder packaging) |

## Project Structure

```
har-explorer/
  electron/
    main.ts              Electron main process (window, menus, file I/O, IPC)
    preload.ts           Secure context bridge between main and renderer
  src/
    components/
      WelcomeScreen.tsx  Landing screen with open button and drag-and-drop hint
      Toolbar.tsx        Search bar, content type filters, file info
      RequestTable.tsx   Sortable request list with waterfall column
      DetailPanel.tsx    Tabbed detail view (Headers/Payload/Response/Timing/Cookies)
      SummaryBar.tsx     Bottom status bar with aggregate statistics
    types/
      har.ts             Full HAR 1.2 spec types and app-specific types
      electron.d.ts      TypeScript declarations for window.electronAPI
    utils/
      har.ts             Parser, formatters, timing computation, content detection
    styles/
      global.css         CSS variables, system theme, scrollbars, base reset
      app.css            All component styles
    App.tsx              Root component with state management and filtering logic
    main.tsx             React entry point
  package.json           Dependencies, scripts, and electron-builder config
  vite.config.ts         Vite + Electron plugin configuration
  tsconfig.json          TypeScript compiler options
```

## Tech Stack

- **Electron 28** -- Desktop runtime with native macOS integration
- **React 18** -- UI framework
- **TypeScript 5** -- Type safety
- **Vite 5** -- Build tooling and dev server
- **electron-builder** -- Packaging and distribution

## Documentation

See the [`docs/`](docs/) folder for detailed documentation:

- [Architecture](docs/architecture.md) -- How the main process, preload, and renderer work together
- [HAR Format](docs/har-format.md) -- Overview of the HAR 1.2 spec and how the app parses it
- [Features Guide](docs/features.md) -- Walkthrough of every feature in the app

## Notes

- The build is **unsigned** by default. On first launch, macOS Gatekeeper will block it. Right-click the app and choose "Open" to bypass this, or go to System Settings > Privacy & Security to allow it.
- The `.dmg` is ~95 MB because it bundles the full Electron runtime. This is standard for Electron apps.
- The app targets **macOS on Apple Silicon (arm64)**. To build for Intel Macs, pass `--mac --x64` to electron-builder.

## License

MIT
