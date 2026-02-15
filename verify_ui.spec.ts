import { test, expect } from '@playwright/test';

test('verify equalizer 2d config form', async ({ page }) => {
  await page.goto('http://localhost:3002/');

  // Select Equalizer 2D
  await page.click('[data-testid="visualizer-select"]');
  await page.click('text="Equalizer 2D"');

  // Wait for config form
  await page.waitForSelector('text="Effect Configuration"');

  // Take screenshot
  await page.screenshot({ path: 'equalizer2d_ui.png' });
});
