import { test, expect, FIXTURES, openHarFileViaIPC } from "./helpers";

test.describe("App launch", () => {
  test("shows the welcome screen on startup", async ({ firstWindow }) => {
    // The welcome screen should be visible when no file is loaded
    const welcomeScreen = firstWindow.locator(".welcome-screen");
    await expect(welcomeScreen).toBeVisible({ timeout: 5000 });
  });

  test("exposes window.electronAPI in the renderer", async ({
    firstWindow,
  }) => {
    // This is the regression test for the preload crash (v3.1.0 bug).
    // If the preload script fails, electronAPI will be undefined.
    const hasAPI = await firstWindow.evaluate(() => {
      return typeof window.electronAPI !== "undefined";
    });
    expect(hasAPI).toBe(true);
  });

  test("electronAPI has all expected methods", async ({ firstWindow }) => {
    const methods = await firstWindow.evaluate(() => {
      if (!window.electronAPI) return [];
      return Object.keys(window.electronAPI).sort();
    });
    expect(methods).toContain("openFileDialog");
    expect(methods).toContain("readHarFile");
    expect(methods).toContain("getPathForFile");
    expect(methods).toContain("getNativeTheme");
    expect(methods).toContain("setThemeMode");
    expect(methods).toContain("signalReady");
    expect(methods).toContain("showRequestContextMenu");
    expect(methods).toContain("onContextMenuSort");
    expect(methods).toContain("onHarFileOpened");
    expect(methods).toContain("onThemeChanged");
  });

  test("sets the data-platform attribute on documentElement", async ({
    firstWindow,
  }) => {
    // Wait briefly for DOMContentLoaded handler in preload
    await firstWindow.waitForTimeout(500);
    const platform = await firstWindow.evaluate(() => {
      return document.documentElement.dataset.platform;
    });
    // Should be one of the valid Node.js platform values
    expect(["darwin", "win32", "linux"]).toContain(platform);
  });
});
