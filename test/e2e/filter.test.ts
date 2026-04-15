import { test, expect, FIXTURES, openHarFileViaIPC } from "./helpers";

test.describe("Filtering", () => {
  test.beforeEach(async ({ electronApp, firstWindow }) => {
    await openHarFileViaIPC(electronApp, firstWindow, FIXTURES.github);
  });

  test("typing in filter input reduces visible entries", async ({
    firstWindow,
  }) => {
    const rows = firstWindow.locator(".request-table tbody tr");
    const totalCount = await rows.count();
    expect(totalCount).toBe(146);

    // Type a filter that should match fewer entries
    const filterInput = firstWindow.locator(".toolbar-search input");
    await filterInput.fill("method:POST");

    // Wait for React to re-render
    await firstWindow.waitForTimeout(200);

    const filteredCount = await rows.count();
    expect(filteredCount).toBeLessThan(totalCount);
    expect(filteredCount).toBeGreaterThan(0);
  });

  test("domain filter narrows results", async ({ firstWindow }) => {
    const filterInput = firstWindow.locator(".toolbar-search input");
    await filterInput.fill("domain:github.com");
    await firstWindow.waitForTimeout(200);

    const rows = firstWindow.locator(".request-table tbody tr");
    const filteredCount = await rows.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThan(146);
  });

  test("negated filter excludes matching entries", async ({ firstWindow }) => {
    const rows = firstWindow.locator(".request-table tbody tr");

    // First, count entries matching github.com
    const filterInput = firstWindow.locator(".toolbar-search input");
    await filterInput.fill("domain:github.com");
    await firstWindow.waitForTimeout(200);
    const matchingCount = await rows.count();

    // Now negate — should get the complement
    await filterInput.fill("-domain:github.com");
    await firstWindow.waitForTimeout(200);
    const negatedCount = await rows.count();

    expect(matchingCount + negatedCount).toBe(146);
  });

  test("clearing filter restores all entries", async ({ firstWindow }) => {
    const rows = firstWindow.locator(".request-table tbody tr");
    const filterInput = firstWindow.locator(".toolbar-search input");

    await filterInput.fill("method:POST");
    await firstWindow.waitForTimeout(200);
    const filteredCount = await rows.count();
    expect(filteredCount).toBeLessThan(146);

    await filterInput.fill("");
    await firstWindow.waitForTimeout(200);
    const restoredCount = await rows.count();
    expect(restoredCount).toBe(146);
  });

  test("toolbar count shows filtered / total format", async ({
    firstWindow,
  }) => {
    const filterInput = firstWindow.locator(".toolbar-search input");
    await filterInput.fill("method:POST");
    await firstWindow.waitForTimeout(200);

    const countText = await firstWindow.locator(".toolbar-count").textContent();
    // Should show "X / 146 requests" format
    expect(countText).toMatch(/\d+ \/ 146 requests/);
  });
});
