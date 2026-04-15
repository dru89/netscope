import { contextBridge, ipcRenderer, webUtils } from "electron";

export interface HarFileData {
  filePath: string;
  content: string;
  fileName: string;
}

// Expose the platform to CSS so styles can adapt to the OS
// (e.g., titlebar padding is only needed on macOS).
// Deferred to DOMContentLoaded to ensure documentElement is available.
document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.dataset.platform = process.platform;
});

contextBridge.exposeInMainWorld("electronAPI", {
  openFileDialog: (): Promise<HarFileData | null> =>
    ipcRenderer.invoke("open-file-dialog"),
  readHarFile: (filePath: string): Promise<HarFileData | null> =>
    ipcRenderer.invoke("read-har-file", filePath),
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),
  getNativeTheme: (): Promise<"dark" | "light"> =>
    ipcRenderer.invoke("get-native-theme"),
  setThemeMode: (mode: "system" | "light" | "dark"): Promise<void> =>
    ipcRenderer.invoke("set-theme-mode", mode),
  signalReady: (): void => {
    ipcRenderer.send("renderer-ready");
  },
  showRequestContextMenu: (data: unknown): void => {
    ipcRenderer.send("show-request-context-menu", data);
  },
  onContextMenuSort: (
    callback: (sort: { field: string; direction: string }) => void,
  ) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      sort: { field: string; direction: string },
    ) => callback(sort);
    ipcRenderer.on("context-menu-sort", handler);
    return () => ipcRenderer.removeListener("context-menu-sort", handler);
  },
  onHarFileOpened: (callback: (data: HarFileData) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: HarFileData) =>
      callback(data);
    ipcRenderer.on("har-file-opened", handler);
    return () => ipcRenderer.removeListener("har-file-opened", handler);
  },
  onThemeChanged: (callback: (theme: "dark" | "light") => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      theme: "dark" | "light",
    ) => callback(theme);
    ipcRenderer.on("theme-changed", handler);
    return () => ipcRenderer.removeListener("theme-changed", handler);
  },
});
