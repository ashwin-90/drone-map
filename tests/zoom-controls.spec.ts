import { test, expect } from '@playwright/test';

test('zoom buttons change zoom level correctly', async ({ page }) => {
  // 1. Open the app
  await page.goto('/');

  // 2. Ensure map loads
  const map = page.locator('.leaflet-container');
  await expect(map).toBeVisible();

  // 3. Read initial zoom
  const zoomRow = page.locator('text=Zoom level').locator('xpath=..');
  const initialZoomText = await zoomRow.textContent();
  const initialZoom = initialZoomText ? parseInt(initialZoomText.replace(/\D+/g, ''), 10) : 0;

  // 4. Click "+" zoom button
  const zoomInButton = page.locator('.leaflet-control-zoom-in');
  await zoomInButton.click();

  // 5. Wait for zoom to increase
  await expect(async () => {
    const zoomText = await zoomRow.textContent();
    const newZoom = zoomText ? parseInt(zoomText.replace(/\D+/g, ''), 10) : 0;
    expect(newZoom).toBeGreaterThan(initialZoom);
  }).toPass({ timeout: 3000 });


  // 6. Store zoom after + to compare with later
  const increasedZoomText = await zoomRow.textContent();
  const increasedZoom = increasedZoomText ? parseInt(increasedZoomText.replace(/\D+/g, ''), 10) : 0;

  // 7. Click "-" zoom button
  const zoomOutButton = page.locator('.leaflet-control-zoom-out');
  await zoomOutButton.click();


  // 8. Wait for zoom to decrease back
  await expect(async () => {
    const zoomText = await zoomRow.textContent();
    const loweredZoom = zoomText ? parseInt(zoomText.replace(/\D+/g, ''), 10) : 0;
    expect(loweredZoom).toBeLessThan(increasedZoom);
  }).toPass({ timeout: 3000 });
});
