import { test, expect, FIXTURES, openHarFileViaIPC } from "./helpers";

test.describe("Request table interaction", () => {
  test.beforeEach(async ({ electronApp, firstWindow }) => {
    await openHarFileViaIPC(electronApp, firstWindow, FIXTURES.github);
  });

  test("clicking a row opens the detail panel", async ({ firstWindow }) => {
    const firstRow = firstWindow.locator(".request-table tbody tr").first();
    await firstRow.click();

    const detailPanel = firstWindow.locator(".detail-panel");
    await expect(detailPanel).toBeVisible({ timeout: 2000 });
  });

  test("clicking a column header sorts the table", async ({ firstWindow }) => {
    // Click the Status header
    const statusHeader = firstWindow.locator("th.col-status");
    await statusHeader.click();

    // Should show a sort arrow
    const sortArrow = statusHeader.locator(".sort-arrow");
    await expect(sortArrow).toBeVisible();
  });

  test("keyboard navigation with j/k selects entries", async ({
    firstWindow,
  }) => {
    // Focus the table container
    const tableContainer = firstWindow.locator(".request-table-container");
    await tableContainer.focus();

    // Press j to select the first entry
    await firstWindow.keyboard.press("j");
    await firstWindow.waitForTimeout(100);

    const firstRow = firstWindow.locator(".request-table tbody tr").first();
    await expect(firstRow).toHaveClass(/selected/);

    // Press j again to move to second
    await firstWindow.keyboard.press("j");
    await firstWindow.waitForTimeout(100);

    const secondRow = firstWindow.locator(".request-table tbody tr").nth(1);
    await expect(secondRow).toHaveClass(/selected/);

    // Press k to go back
    await firstWindow.keyboard.press("k");
    await firstWindow.waitForTimeout(100);

    await expect(firstRow).toHaveClass(/selected/);
  });
});
