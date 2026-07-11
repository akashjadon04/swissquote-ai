import { test, expect } from '@playwright/test';

test.describe('SwissQuote AI E2E Tests', () => {
  // Use a longer timeout for the whole test file in case of cold starts
  test.setTimeout(60000);

  test('1. Dashboard loads successfully and displays stats', async ({ page }) => {
    await page.goto('/');
    
    // Check TopBar title (French)
    await expect(page.locator('h1').filter({ hasText: 'Tableau de bord' })).toBeVisible({ timeout: 15000 });
    
    // Check quick actions exist
    await expect(page.getByText('Nouveau devis').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Catalogue').first()).toBeVisible();
  });

  test('2. Dashboard navigate to Catalogue via Quick Action', async ({ page }) => {
    await page.goto('/');
    
    // Click on catalogue link
    await page.click('a[href="/catalogue"]');
    
    // Verify navigation
    await expect(page).toHaveURL(/\/catalogue/, { timeout: 15000 });
    await expect(page.locator('h1').filter({ hasText: 'Catalogue articles' })).toBeVisible({ timeout: 15000 });
  });

  test('3. Dashboard navigate to New Quote via Quick Action', async ({ page }) => {
    await page.goto('/');
    
    // Click on new quote link
    await page.click('a[href="/quotes/new"]');
    
    // Verify navigation
    await expect(page).toHaveURL(/\/quotes\/new/, { timeout: 15000 });
  });

  test('4. Catalogue page loads articles', async ({ page }) => {
    await page.goto('/catalogue');
    
    await expect(page.locator('.ql-count')).toBeVisible({ timeout: 15000 });
    
    const emptyState = page.getByText('Aucun article trouvé');
    const tableRows = page.locator('.cat-row');
    
    await expect(emptyState.or(tableRows.first())).toBeVisible({ timeout: 15000 });
  });

  test('5. Catalogue page filter by supplier', async ({ page }) => {
    await page.goto('/catalogue');
    
    const select = page.locator('select.ql-filter-select').first();
    await select.selectOption('NSB');
    
    await page.waitForTimeout(2000);
    
    const rows = page.locator('.cat-row');
    if (await rows.count() > 0) {
      await expect(rows.first().locator('.ql-supplier-badge')).toHaveText('NSB', { timeout: 15000 });
    }
  });

  test('6. Catalogue page search functionality', async ({ page }) => {
    await page.goto('/catalogue');
    
    const searchInput = page.locator('.ql-search-input');
    await searchInput.fill('tube');
    
    await page.waitForTimeout(2000);
    
    await expect(page.locator('.ql-search-clear')).toBeVisible({ timeout: 15000 });
  });

  test('7. Quote Creation Wizard loads', async ({ page }) => {
    await page.goto('/quotes/new');
    
    // The main container or top bar
    const mainTitle = page.locator('h2');
    await expect(mainTitle.filter({ hasText: 'Description des travaux' })).toBeVisible({ timeout: 15000 });
  });
});

