import {
  test as base,
  _electron,
  type ElectronApplication,
  type Page,
} from "@playwright/test";
import path from "path";
import fs from "fs";

const FIXTURES_DIR = path.resolve(__dirname, "../fixtures");
const ROOT_DIR = path.resolve(__dirname, "../..");
const MAIN_JS = path.join(ROOT_DIR, "dist-electron/main.js");

export const FIXTURES = {
  example: path.join(FIXTURES_DIR, "www.example.com.har"),
  github: path.join(FIXTURES_DIR, "github.com.har"),
  google: path.join(FIXTURES_DIR, "www.google.com.har"),
};

/**
 * Custom test fixture that launches the Electron app and provides
 * the ElectronApplication and its first window Page.
 *
 * Before the first test run, the app must be built with `make build`
 * so that dist-electron/main.js exists.
 */
export const test = base.extend<{
  electronApp: ElectronApplication;
  firstWindow: Page;
}>({
  electronApp: async ({}, use) => {
    // Verify the app has been built
    if (!fs.existsSync(MAIN_JS)) {
      throw new Error(
        `dist-electron/main.js not found. Run "make build" before running E2E tests.`,
      );
    }

    const app = await _electron.launch({
      args: [MAIN_JS],
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        // Skip auto-update checks during tests
        NODE_ENV: "test",
      },
    });

    await use(app);
    await app.close();
  },

  firstWindow: async ({ electronApp }, use) => {
    const window = await electronApp.firstWindow();
    // Wait for the renderer to be fully loaded
    await window.waitForLoadState("domcontentloaded");
    await use(window);
  },
});

/**
 * Open a HAR fixture file in the app by sending it through IPC,
 * simulating the main process sending a file to the renderer.
 */
export async function openHarFile(
  electronApp: ElectronApplication,
  page: Page,
  fixturePath: string,
): Promise<void> {
  const resolved = path.resolve(fixturePath);
  const content = fs.readFileSync(resolved, "utf-8");
  const fileName = path.basename(resolved);

  // Send the file content to the renderer via IPC, same as sendFileToWindow
  await page.evaluate(
    ({ content, fileName, filePath }) => {
      // Dispatch the same event that the main process sends
      window.dispatchEvent(
        new CustomEvent("__test_har_file", {
          detail: { content, fileName, filePath },
        }),
      );
    },
    { content, fileName, filePath: resolved },
  );

  // Wait a moment for React to process the state update
  await page.waitForTimeout(100);
}

/**
 * Open a HAR file by evaluating in the Electron main process,
 * which sends the file through the real IPC channel.
 */
export async function openHarFileViaIPC(
  electronApp: ElectronApplication,
  page: Page,
  fixturePath: string,
): Promise<void> {
  const resolved = path.resolve(fixturePath);
  const content = fs.readFileSync(resolved, "utf-8");
  const fileName = path.basename(resolved);

  // Send the file data to the renderer via the main process.
  // We read the file in the test process (Node.js) and pass the content
  // as a serializable argument, avoiding require() in the Electron context.
  await electronApp.evaluate(
    async ({ BrowserWindow }, { fileContent, fName, filePath }) => {
      const win = BrowserWindow.getAllWindows()[0];
      if (win) {
        win.webContents.send("har-file-opened", {
          filePath,
          content: fileContent,
          fileName: fName,
        });
      }
    },
    { fileContent: content, fName: fileName, filePath: resolved },
  );

  // Wait for the request table to appear (indicates the file was loaded)
  await page.waitForSelector(".request-table", { timeout: 10000 });
}

export { expect } from "@playwright/test";
