import { test, expect, FIXTURES, openHarFileViaIPC } from "./helpers";

test.describe("File opening", () => {
  test("loads a small HAR file and shows the request table", async ({
    electronApp,
    firstWindow,
  }) => {
    await openHarFileViaIPC(electronApp, firstWindow, FIXTURES.example);

    // The welcome screen should disappear
    const welcomeScreen = firstWindow.locator(".welcome-screen");
    await expect(welcomeScreen).not.toBeVisible({ timeout: 5000 });

    // The request table should be visible
    const table = firstWindow.locator(".request-table");
    await expect(table).toBeVisible();

    // example.com has 1 entry
    const rows = firstWindow.locator(".request-table tbody tr");
    await expect(rows).toHaveCount(1);
  });

  test("loads github.com HAR with many entries", async ({
    electronApp,
    firstWindow,
  }) => {
    await openHarFileViaIPC(electronApp, firstWindow, FIXTURES.github);

    const table = firstWindow.locator(".request-table");
    await expect(table).toBeVisible();

    // github.com has 146 entries
    const rows = firstWindow.locator(".request-table tbody tr");
    const count = await rows.count();
    expect(count).toBe(146);
  });

  test("loads google.com HAR without errors", async ({
    electronApp,
    firstWindow,
  }) => {
    await openHarFileViaIPC(electronApp, firstWindow, FIXTURES.google);

    const table = firstWindow.locator(".request-table");
    await expect(table).toBeVisible();

    // google.com has 48 entries
    const rows = firstWindow.locator(".request-table tbody tr");
    const count = await rows.count();
    expect(count).toBe(48);
  });

  test("shows the summary bar after loading a file", async ({
    electronApp,
    firstWindow,
  }) => {
    await openHarFileViaIPC(electronApp, firstWindow, FIXTURES.github);

    const summaryBar = firstWindow.locator(".summary-bar");
    await expect(summaryBar).toBeVisible();

    // Summary should mention requests
    const text = await summaryBar.textContent();
    expect(text).toContain("requests");
  });

  test("displays the toolbar with filter input after loading", async ({
    electronApp,
    firstWindow,
  }) => {
    await openHarFileViaIPC(electronApp, firstWindow, FIXTURES.github);

    const toolbar = firstWindow.locator(".toolbar");
    await expect(toolbar).toBeVisible();

    const filterInput = firstWindow.locator(".toolbar-search input");
    await expect(filterInput).toBeVisible();
  });
});
