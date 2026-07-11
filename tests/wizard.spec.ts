import { test, expect } from '@playwright/test';

test.describe('Quote Generation Wizard Scenarios', () => {
  // Common mock setup for AI and matching endpoints
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/ai/extract', async (route) => {
      await new Promise(r => setTimeout(r, 100)); // short delay
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          provider: 'Mock',
          extraction: {
            intervention_type: 'remplacement_chauffe_eau',
            sections: [
              {
                section_label: 'Chauffe-eau',
                description_verbatim: 'Remplacement chauffe eau 200L',
                articles: [
                  { label: 'Chauffe-eau 200L', quantity: 1, unit: 'pce', confidence: 0.9, material_type: 'appliance', dimension: null }
                ]
              }
            ]
          }
        })
      });
    });

    await page.route('**/api/config', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          config: {
            labour_rates: { "GenA\"ve": 145 }
          }
        })
      });
    });
  });

  test('Scenario 1: Complete standard plumbing quote successfully', async ({ page }) => {
    await page.route('**/api/catalogue/match', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            matched: [
              {
                aiArticle: { label: 'Chauffe-eau 200L' },
                matchConfidence: 0.95,
                supplierCode: 'NSB',
                catalogueArticle: {
                  reference: 'CE-200-NSB',
                  description: 'Chauffe-eau A(c)lectrique 200L mural',
                  unit: 'pce',
                  unit_price: 850
                }
              }
            ],
            missing: []
          }
        })
      });
    });

    await page.goto('/quotes/new');
    
    // Step 1: Description
    const textarea = page.locator('textarea');
    await textarea.fill('Remplacement dun chauffe-eau de 200 litres suite a une fuite.');
    await page.locator('.btn-12').click();

    // Step 2: Processing (should be quick because of mock)
    // Wait for the review step to be visible
    await expect(page.locator('text=Chauffe-eau A(c)lectrique 200L')).toBeVisible();

    // Step 3: Review
    await page.getByText('Continuer vers financier').click();

    // Step 4: Financials
    await expect(page.locator('.financial-summary')).toContainText('850.00');

    // Submit quote (mock the /api/quotes endpoint)
    await page.route('**/api/quotes', async (route) => {
      await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
    });
    
    await page.locator('.action_has.has_saved').click();
    
    // Wait for redirect to /quotes
    await page.waitForURL('**/quotes*');
  });

  test('Scenario 2: Quote with missing items shows warning', async ({ page }) => {
    // Override match to return a missing item
    await page.route('**/api/catalogue/match', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            matched: [],
            missing: [
              {
                aiArticle: { label: 'Chauffe-eau 200L' }
              }
            ]
          }
        })
      });
    });

    await page.goto('/quotes/new');
    
    // Step 1: Description
    const textarea = page.locator('textarea');
    await textarea.fill('Remplacement dun chauffe-eau de 200 litres introuvable.');
    await page.locator('.btn-12').click();

    // Step 2 & 3: Review
    // Wait for the missing item warning label
    await expect(page.locator('.missing-label')).toBeVisible();
    await expect(page.locator('text=Chauffe-eau 200L')).toBeVisible();

    await page.getByText('Continuer vers financier').click();

    // Step 4: Financials should also show warning
    await expect(page.locator('.missing-warning')).toBeVisible();
  });

  test('Scenario 3: Modify quantities and prices in step 3 affects total', async ({ page }) => {
    await page.route('**/api/catalogue/match', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            matched: [
              {
                aiArticle: { label: 'Chauffe-eau 200L' },
                matchConfidence: 0.95,
                supplierCode: 'NSB',
                catalogueArticle: {
                  reference: 'CE-200-NSB',
                  description: 'Chauffe-eau A(c)lectrique',
                  unit: 'pce',
                  unit_price: 100
                }
              }
            ],
            missing: []
          }
        })
      });
    });

    await page.goto('/quotes/new');
    const textarea = page.locator('textarea');
    await textarea.fill('Remplacement dun chauffe-eau de 200 litres suite a une fuite.');
    await page.locator('.btn-12').click();

    await expect(page.locator('text=Chauffe-eau A(c)lectrique')).toBeVisible();

    const row = page.locator('.item-row').first();
    const qtyInput = page.locator('input[type="number"]').first();
    await qtyInput.fill('2'); // Change quantity to 2
    
    await page.getByText('Continuer vers financier').click();

    // In financials, 2 * 100 = 200 for materials
    await expect(page.locator('.financial-summary')).toContainText('200.00');
  });

  test('Scenario 4: Modify margins and labour hours in financials updates final cost', async ({ page }) => {
    await page.route('**/api/catalogue/match', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            matched: [
              {
                aiArticle: { label: 'Chauffe-eau 200L' },
                matchConfidence: 0.95,
                supplierCode: 'NSB',
                catalogueArticle: {
                  reference: 'CE-200-NSB',
                  description: 'Chauffe-eau A(c)lectrique',
                  unit: 'pce',
                  unit_price: 100
                }
              }
            ],
            missing: []
          }
        })
      });
    });

    await page.goto('/quotes/new');
    const textarea = page.locator('textarea');
    await textarea.fill('Remplacement dun chauffe-eau de 200 litres suite a une fuite.');
    await page.locator('.btn-12').click();

    await expect(page.locator('text=Chauffe-eau A(c)lectrique')).toBeVisible();
    await page.getByText('Continuer vers financier').click();

    // Step 4: Financials
    // Find labour hours input and change it
    const labourHoursInput = page.locator('.param-group').filter({ hasText: 'Heures de travail' }).locator('input');
    await labourHoursInput.fill('10'); // 10 hours * 145 = 1450
    
    const marginInput = page.locator('.param-group').filter({ hasText: 'Marge' }).locator('input');
    await marginInput.fill('50'); // 50% of 100 = 50. Total material = 150.
    
    // Total HT = 1450 + 150 + 45 (travel) = 1645. Let's verify.
    // Wait for react to update
    await page.waitForTimeout(500);
    await expect(page.locator('.financial-summary')).toContainText('645.00');
  });

  test('Scenario 5: Description validation - Submit button is disabled for short texts', async ({ page }) => {
    await page.goto('/quotes/new');
    
    const textarea = page.locator('textarea');
    const submitBtn = page.locator('.btn-12');

    // Initially disabled because length < 10
    await expect(submitBtn).toBeDisabled();

    // Fill with less than 10 characters
    await textarea.fill('Short');
    await expect(submitBtn).toBeDisabled();

    // Fill with 10+ characters
    await textarea.fill('Remplacement de tuyau complet');
    await expect(submitBtn).toBeEnabled();
  });

  test('Scenario 6: Template selection populates description and enables submission', async ({ page }) => {
    await page.goto('/quotes/new');
    
    // Find a template card and click it
    const templateCard = page.locator('.template-card').first();
    await templateCard.click();

    // Textarea should not be empty
    const textarea = page.locator('textarea');
    const val = await textarea.inputValue();
    expect(val.length).toBeGreaterThan(10);

    // Button should be enabled
    const submitBtn = page.locator('.btn-12');
    await expect(submitBtn).toBeEnabled();
  });

  test('Scenario 7: Navigating back from step 3 (Review) to step 1 (Description) retains data', async ({ page }) => {
    await page.route('**/api/catalogue/match', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          result: {
            matched: [],
            missing: [{ aiArticle: { label: 'Tuyau 12mm' } }]
          }
        })
      });
    });

    await page.goto('/quotes/new');
    const textarea = page.locator('textarea');
    await textarea.fill('Remplacement tuyau 12mm.');
    await page.locator('.btn-12').click();

    // Wait for Step 3
    await expect(page.locator('.missing-label')).toBeVisible();

    // Wait for the button with the arrow left icon and click it
    await page.locator('button', { has: page.locator('svg.lucide-arrow-left') }).click();
    
    // Check if textarea still has the description
    const val = await textarea.inputValue();
    expect(val).toBe('Remplacement tuyau 12mm.');
  });
});
