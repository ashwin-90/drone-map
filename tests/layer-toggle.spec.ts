import { test, expect } from '@playwright/test';

test('street / satellite buttons switch the basemap', async ({ page }) => {
  // 1. Open the app (baseURL set in playwright.config.ts)
  await page.goto('/');

  // 2. Wait for map to appear
  const map = page.locator('.leaflet-container');
  await expect(map).toBeVisible();

  // Leaflet attribution control
  const attribution = page.locator('.leaflet-control-attribution');

  // 3. Click the "Street" button and expect OpenStreetMap attribution
  const streetButton = page.getByRole('button', { name: 'Street' });
  await streetButton.click();

  await expect(async () => {
    const text = (await attribution.textContent()) || '';
    expect(text).toMatch(/OpenStreetMap/i);
  }).toPass({ timeout: 5000 });

  // 4. Click the "Satellite" button and expect Esri attribution
  const satelliteButton = page.getByRole('button', { name: 'Satellite' });
  await satelliteButton.click();

  await expect(async () => {
    const text = (await attribution.textContent()) || '';
    expect(text).toMatch(/Esri/i);
  }).toPass({ timeout: 5000 });
});
