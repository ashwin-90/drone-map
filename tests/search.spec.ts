import { test, expect } from '@playwright/test';

test('searching a city updates the map position', async ({ page }) => {
  // 1. Open your app (baseURL is set to http://localhost:5173 in playwright.config.ts)
  await page.goto('/');

  // 2. Wait for the Leaflet map to be visible
  const map = page.locator('.leaflet-container');
  await expect(map).toBeVisible();

  // 3. Read initial zoom level from the stats panel ("Zoom level")
  const zoomRow = page.locator('text=Zoom level').locator('xpath=..');
  const initialZoomText = await zoomRow.textContent();
  const initialZoom = initialZoomText ? parseInt(initialZoomText.replace(/\D+/g, ''), 10) : 0;

  // 4. Type a city (Pune) and press Enter
  const searchInput = page.getByPlaceholder('Search city...');
  await searchInput.fill('Pune');
  await searchInput.press('Enter');

  // 5. Wait until "Searching…" disappears (search finished)
  await expect(page.getByText(/Searching/i)).toHaveCount(0, { timeout: 10000 });

  // 6. Wait up to 5 seconds for the zoom level to become greater than before
  await expect(async () => {
    const currentZoomText = await zoomRow.textContent();
    const parsedZoom = currentZoomText
      ? parseInt(currentZoomText.replace(/\D+/g, ''), 10)
      : 0;

    expect(parsedZoom).toBeGreaterThan(initialZoom);
  }).toPass({ timeout: 5000 });

  // 7. Check that a "Selected: ..." label is visible after search
  await expect(page.getByText(/Selected:/i)).toBeVisible();
});
