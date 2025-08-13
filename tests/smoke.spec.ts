import { test, expect } from '@playwright/test';

test.describe('Market Data Workbench - Smoke Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    await page.goto('/');

    // Check that the page loads
    await expect(page).toHaveTitle(/Market Data Workbench/);

    // Check for main header
    await expect(page.locator('h1')).toContainText('Market Data Workbench');

    // Check for watchlist component
    await expect(page.locator('[data-testid="watchlist"]')).toBeVisible();

    // Check for welcome section
    await expect(page.locator('text=Welcome')).toBeVisible();

    // Check for settings link
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/');

    // Click settings link
    await page.click('text=Settings');

    // Check we're on settings page
    await expect(page).toHaveURL(/.*\/settings/);

    // Check for settings content
    await expect(page.locator('h1')).toContainText('Settings');

    // Check for main settings sections
    await expect(page.locator('text=Appearance')).toBeVisible();
    await expect(page.locator('text=Data & Performance')).toBeVisible();
    await expect(page.locator('text=Default Indicators')).toBeVisible();
    await expect(page.locator('text=Grid Display')).toBeVisible();

    // Check for action buttons
    await expect(page.locator('button', { hasText: 'Save Settings' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Reset to Defaults' })).toBeVisible();
  });

  test('should display default symbols in watchlist', async ({ page }) => {
    await page.goto('/');

    // Wait for watchlist to load
    await page.waitForSelector('[data-testid="watchlist"]', { timeout: 10000 });

    // Check that some symbols are present (from defaultSymbols) or empty state
    const symbolCount = await page.locator('[data-testid="watchlist"] >> text="symbols"').count();
    if (symbolCount > 0) {
      await expect(page.locator('text=AAPL')).toBeVisible();
    } else {
      await expect(page.locator('text=No symbols in watchlist')).toBeVisible();
    }
  });

  test('should open symbol page when clicking on symbol', async ({ page }) => {
    await page.goto('/');

    // Wait for watchlist to load
    await page.waitForSelector('[data-testid="watchlist"]', { timeout: 10000 });

    // Click on first symbol (AAPL)
    await page.click('text=AAPL');

    // Check we're on symbol page
    await expect(page).toHaveURL(/.*\/symbol\/AAPL/);

    // Check for symbol page content
    await expect(page.locator('h1')).toContainText('AAPL');

    // Check for chart container
    await expect(page.locator('[class*="chart"]')).toBeVisible();

    // Check for order book and trades grids
    await expect(page.locator('text=Order Book')).toBeVisible();
    await expect(page.locator('text=Recent Trades')).toBeVisible();
  });

  test('should load and display chart with indicators', async ({ page }) => {
    await page.goto('/symbol/AAPL');

    // Wait for chart to mount
    await page.waitForTimeout(3000);

    // Check for chart container
    await expect(page.locator('[class*="chart"]')).toBeVisible();

    // Check for indicator controls
    await expect(page.locator('label:has-text("EMA")')).toBeVisible();
    await expect(page.locator('label:has-text("VWAP")')).toBeVisible();
    await expect(page.locator('label:has-text("BB")')).toBeVisible();
    await expect(page.locator('label:has-text("RSI")')).toBeVisible();

    // EMA should be checked by default
    await expect(page.locator('input[type="checkbox"] + span:has-text("EMA")')).toBeChecked();

    // VWAP should be checked by default  
    await expect(page.locator('input[type="checkbox"] + span:has-text("VWAP")')).toBeChecked();
  });

  test('should toggle indicators on/off', async ({ page }) => {
    await page.goto('/symbol/AAPL');

    // Wait for chart to load
    await page.waitForTimeout(3000);

    // Toggle EMA off
    await page.click('label:has-text("EMA") input[type="checkbox"]');

    // Check that EMA is unchecked
    await expect(page.locator('label:has-text("EMA") input[type="checkbox"]')).not.toBeChecked();

    // Toggle Bollinger Bands on
    await page.click('label:has-text("BB") input[type="checkbox"]');

    // Check that BB is checked
    await expect(page.locator('label:has-text("BB") input[type="checkbox"]')).toBeChecked();
  });

  test('should display live data in order book and trades', async ({ page }) => {
    await page.goto('/symbol/AAPL');

    // Wait for grids to load
    await page.waitForTimeout(2000);

    // Check that order book has data
    const orderBookRows = page.locator('[data-testid="order-book-grid"] .ag-row');
    await expect(orderBookRows.first()).toBeVisible();

    // Check that trades grid has data
    const tradesRows = page.locator('[data-testid="trades-grid"] .ag-row');
    await expect(tradesRows.first()).toBeVisible();

    // Wait a bit more for live updates
    await page.waitForTimeout(3000);

    // Check that we have multiple rows (indicating streaming data)
    await expect(orderBookRows).toHaveCount(5, { timeout: 10000 });
    await expect(tradesRows).toHaveCount(1, { timeout: 10000 });
  });

  test('should save and load settings', async ({ page }) => {
    await page.goto('/settings');

    // Change theme to dark
    await page.selectOption('select:near(:text("Theme"))', 'dark');

    // Change chart theme to colorful
    await page.selectOption('select:near(:text("Chart Colors"))', 'colorful');

    // Change update throttle
    await page.fill('input:near(:text("Update Throttle"))', '100');

    // Uncheck EMA default indicator
    await page.uncheck('label:has-text("EMA") input[type="checkbox"]');

    // Check RSI default indicator
    await page.check('label:has-text("RSI") input[type="checkbox"]');

    // Save settings
    await page.click('button:has-text("Save Settings")');

    // Reload page to check if settings persisted
    await page.reload();

    // Check that settings were saved
    await expect(page.locator('select:near(:text("Theme"))')).toHaveValue('dark');
    await expect(page.locator('select:near(:text("Chart Colors"))')).toHaveValue('colorful');
    await expect(page.locator('input:near(:text("Update Throttle"))')).toHaveValue('100');
    await expect(page.locator('label:has-text("EMA") input[type="checkbox"]')).not.toBeChecked();
    await expect(page.locator('label:has-text("RSI") input[type="checkbox"]')).toBeChecked();
  });

  test('should reset settings to defaults', async ({ page }) => {
    await page.goto('/settings');

    // Make some changes first
    await page.selectOption('select:near(:text("Theme"))', 'dark');
    await page.fill('input:near(:text("Update Throttle"))', '200');

    // Reset to defaults
    await page.click('button:has-text("Reset to Defaults")');

    // Check that settings were reset
    await expect(page.locator('select:near(:text("Theme"))')).toHaveValue('light');
    await expect(page.locator('input:near(:text("Update Throttle"))')).toHaveValue('80');
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test navigation to non-existent symbol
    await page.goto('/symbol/INVALID_SYMBOL');

    // Should not crash and should show some content
    await expect(page.locator('h1')).toContainText('INVALID_SYMBOL');

    // Chart should still render (with empty state)
    await expect(page.locator('[class*="chart"]')).toBeVisible();
  });
});