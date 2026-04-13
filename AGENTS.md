# AGENTS.md

## Project Overview

**Netscope** is a native macOS desktop app for viewing and analyzing HTTP Archive (HAR) files. It provides a Chrome DevTools-like network inspection experience as a standalone app. Built with Electron 28, React 18, TypeScript 5, and Vite 5.

- **Package name:** `netscope`
- **App ID:** `com.netscope.app`
- **Repository:** https://github.com/Dru89/netscope
- **License:** MIT

## Architecture

Netscope is an Electron app with three process layers:

1. **Main process** (`electron/main.ts`) -- Node.js runtime handling window management, file I/O, native menus, macOS file associations, theme detection, and auto-updates (`electron-updater`). Manages multiple windows via a `Set<BrowserWindow>` and tracks loaded files in a `Map<BrowserWindow, string>`.

2. **Preload script** (`electron/preload.ts`) -- Bridge layer using `contextBridge.exposeInMainWorld` to expose a typed `window.electronAPI` with 6 methods. This is the only communication channel between main and renderer.

3. **Renderer** (`src/`) -- A React 18 SPA bundled by Vite. No direct Node.js access. All file I/O goes through IPC. State is managed entirely with React hooks in `App.tsx` (no external state library). Falls back to browser `FileReader` when `window.electronAPI` is unavailable (dev mode).

Detailed architecture docs are in `docs/architecture.md`.

## Directory Structure

```
electron/           Electron main process + preload script
src/
  components/       React components (WelcomeScreen, Toolbar, RequestTable, DetailPanel, SummaryBar)
  hooks/            React hooks (currently empty, reserved for future use)
  styles/           Plain CSS (global.css for theme variables, app.css for component styles)
  types/            TypeScript types (HAR spec types, electron API declarations)
  utils/            HAR parsing, formatting, content type classification, filter parsing
  App.tsx           Root component -- all application state lives here
  main.tsx          ReactDOM entry point
build/              Electron-builder resources (icon.icns)
images/             README screenshots and app icon source (netscope.png)
scripts/
  notarize.js       Apple notarization afterSign hook (uses @electron/notarize)
  release.sh        Tag, push, build, sign, notarize, publish to GitHub Releases
site/               Marketing website (Astro 5, deployed to Netlify)
  src/layouts/      Base HTML layout with global CSS
  src/pages/        Single-page landing site (index.astro)
  public/           Static assets (favicons, screenshots)
docs/               Internal docs (architecture.md, features.md, har-format.md)
```

**Build outputs (all git-ignored):** `dist/` (Vite output), `dist-electron/` (bundled main/preload), `release/` (electron-builder .app/.dmg/.zip).

## Code Conventions

- **Components:** Named function exports in PascalCase files. Props interfaces defined inline at the top of each file. Sub-components may be co-located in the same file (e.g., `DetailPanel.tsx` contains 7 components for the panel and its tabs). Exception: `Toolbar.tsx` uses `forwardRef` to expose the filter input ref.
- **Types:** HAR spec types prefixed with `Har` (e.g., `HarEntry`, `HarRequest`). App types unprefixed (`FilterState`, `SortState`). Computed/internal fields prefixed with underscore (`_index`, `_url`, `_transferSize`).
- **Imports:** Use `import type { ... }` for type-only imports. A `@/` path alias is configured but not currently used -- existing code uses relative paths.
- **Styling:** Plain CSS with BEM-like class names. Theme via CSS custom properties in `:root` and `@media (prefers-color-scheme: dark)`. No CSS modules, CSS-in-JS, or Tailwind. Color variables follow `--color-{category}-{variant}` naming.
- **State management:** All state in `App.tsx` via `useState`/`useCallback`/`useMemo`, passed down as props. Theme preference persisted to `localStorage` key `themeMode`.
- **IPC pattern:** `ipcMain.handle` for renderer-to-main requests; `webContents.send` + `ipcRenderer.on` for main-to-renderer pushes. All listeners return unsubscribe functions for React `useEffect` cleanup.
- **No default exports** except `App.tsx`.

## Key Commands

```bash
npm run dev           # Vite dev server + Electron with hot reload
npm run build         # tsc && vite build && electron-builder (full production build)
npm run build:vite    # tsc && vite build (bundle only, no packaging)
npm test              # Run tests with Vitest (single run)
npm run test:watch    # Run tests in watch mode
npm run release       # Tag, build, sign, notarize, publish to GitHub Releases
npm run site:dev      # Astro dev server for the marketing site
npm run site:build    # Build the marketing site
```

## Testing

Tests use **Vitest** (configured automatically through the Vite config). Test files live alongside the source files they test, using the `.test.ts` suffix.

```
src/utils/filterParser.test.ts   # Filter parser and matcher unit tests (54 tests)
```

Run `npm test` before committing to make sure nothing is broken. When adding new utility functions, write tests. Component tests are not set up yet (no jsdom/happy-dom environment or React Testing Library).

### Writing Tests

- Test files go next to the source file: `foo.ts` -> `foo.test.ts`
- Use `describe`/`it`/`expect` from Vitest
- For testing against HAR entries, build minimal fakes with just the fields your test needs (see `makeEntry()` helper in `filterParser.test.ts` for the pattern)
- No HAR fixture files are needed for unit tests -- construct data inline

## Keyboard Shortcuts

The app supports keyboard navigation, implemented across `RequestTable.tsx` (table-scoped) and `App.tsx` (global document listener).

### Table-scoped (when request table has focus)

| Shortcut | Action |
|---|---|
| Up / k | Select previous entry |
| Down / j | Select next entry |
| Cmd+Up / Home | Select first entry |
| Cmd+Down / End | Select last entry |
| Enter / Space | Toggle detail panel for selected entry |

### Global

| Shortcut | Action |
|---|---|
| Escape | Close detail panel and return focus to table; blur filter input |
| / | Focus the toolbar filter input |
| Cmd+F | Focus the toolbar filter (unless focus is in the detail panel) |

**Focus model:** The table container (`div.request-table-container`) has `tabIndex={0}` and handles its own `onKeyDown`. When focus moves elsewhere (detail panel, filter input), table shortcuts stop firing. This is intentional -- arrow keys in the detail panel scroll content, not the entry list. Escape returns focus to the table.

**Gotcha with Escape:** When Escape is pressed inside an input within the detail panel (e.g., the Source tab search input), the global handler defers to the detail panel's own Escape handling. Only a second Escape (or Escape from a non-input element) closes the panel.

## Filter Syntax

The toolbar search input supports Chrome DevTools-style structured filters via `src/utils/filterParser.ts`. The parser (`parseFilterQuery`) tokenizes the input and the matcher (`matchEntry`) tests entries against all tokens.

### Supported filters

| Filter | Example | What it matches |
|---|---|---|
| (plain text) | `api` | URL or entry name substring |
| `domain:` | `domain:*.example.com` | Request domain (wildcard supported) |
| `method:` | `method:POST` | HTTP method |
| `status-code:` | `status-code:4xx` | Status code (exact or range like `4xx`) |
| `mime-type:` | `mime-type:json` | Response MIME type substring |
| `larger-than:` | `larger-than:1k` | Transfer size threshold (supports `k`, `M`) |
| `scheme:` | `scheme:https` | URL scheme |
| `has-response-header:` | `has-response-header:x-custom` | Presence of a response header |
| `url:` | `url:/api/v2` | URL substring (explicit) |

- Multiple filters are AND'd together
- Prefix any filter with `-` to negate it: `-domain:analytics.com`
- Quoted values supported: `domain:"my site.com"`
- Toolbar button filters (content type, method, status) are separate and AND'd with the text filters

### How it fits together

`App.tsx` parses `filter.search` into tokens with `useMemo`, then in the `filteredEntries` computation, calls `matchEntry(tokens, entry)` before applying the toolbar button filters. The old substring-only search is fully replaced by the parser -- plain text tokens produce the same behavior as before.

## Architecture Decisions / Patterns to Preserve

- **No external state library.** All state lives in `App.tsx` and flows down as props. Don't introduce Redux, Zustand, Jotai, etc. without good reason.
- **No virtualization.** The request table renders all rows as real DOM elements. This is fine for typical HAR files (hundreds to low thousands of entries). If performance becomes an issue with very large files, virtualization would be the right fix, but it adds complexity to keyboard navigation and scroll-into-view logic.
- **Pure utilities for testability.** Business logic that can be tested without React (parsing, filtering, formatting) belongs in `src/utils/` as pure functions. Keep components thin.
- **CSS custom properties for theming.** All colors go through `--color-*` variables defined in `global.css`. Don't use hardcoded color values in component styles.

## Release Process

The `npm run release` script (`scripts/release.sh`):
1. Loads `.env` for Apple signing credentials and `GH_TOKEN`
2. Reads version from `package.json`, creates git tag `v{VERSION}` if needed
3. Pushes commits and tag to origin
4. Runs `tsc && vite build && electron-builder --mac --publish always`
5. electron-builder signs, notarizes (via `scripts/notarize.js`), and uploads DMG + ZIP to GitHub Releases

Required `.env` variables (see `.env.example`): `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, `GH_TOKEN`.

## App Icon

The source icon is `images/netscope.png` (2048x2048 RGBA). The macOS `.icns` at `build/icon.icns` is generated from it using `sips` + `iconutil`. Site favicons in `site/public/` are also derived from this source image. If the icon changes, regenerate all derived files.

## Important Notes

- The app is **macOS-only** (arm64 targets). electron-builder config only defines `mac` targets.
- `contextIsolation: true` and `nodeIntegration: false` -- the renderer cannot access Node.js APIs directly.
- The marketing site is a separate Astro project in `site/`, deployed to Netlify (configured in `netlify.toml` at the repo root).
- When bumping versions, update `version` in `package.json` and run `npm install --package-lock-only` to sync `package-lock.json`. The release script handles tagging.

## Keeping This File Up to Date

When you make changes to the project, update this file to reflect them. Specifically:
- New commands or scripts: add to Key Commands
- New keyboard shortcuts: add to the Keyboard Shortcuts table
- New filter types: add to the Filter Syntax table
- New test files or testing patterns: add to the Testing section
- Architecture changes (new state, new process, new IPC): update Architecture section
- New directories or significant files: update Directory Structure
- Update `docs/` when features change (especially `docs/features.md` and `docs/architecture.md`)
