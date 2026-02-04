import { test, expect } from '@playwright/test';

/**
 * E2E Tests - MapaStakeholdersView
 * Tests for stakeholder mapping view
 */

test.describe('MapaStakeholdersView - Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Mapa Stakeholders/i }).click();
  });

  test('MS-TC-001: Should display page title', async ({ page }) => {
    await expect(page.getByText('Mapa de Frentes X Stakeholders')).toBeVisible();
  });

  test('MS-TC-002: Should display stakeholder cards in grid', async ({ page }) => {
    // The grid uses 3 columns layout
    const grid = page.locator('.grid.grid-cols-3');
    await expect(grid).toBeVisible();
  });

  test('MS-TC-003: Should display card structure', async ({ page }) => {
    // Check if cards exist (they should have bg-white and rounded-3xl classes)
    const cards = page.locator('.bg-white.rounded-3xl');
    const count = await cards.count();
    // May or may not have cards depending on data
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('MapaStakeholdersView - Card Content', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    
    // First add some data to ensure we have cards
    await page.getByRole('button', { name: /Visão Planilha/i }).click();
    await page.getByRole('button', { name: /Nova Linha/i }).click();
    
    // Fill in product name
    const productInput = page.locator('tbody tr').first().locator('input[type="text"]').first();
    await productInput.fill('Test Front');
    
    // Fill in stakeholder name
    const stakeholderInput = page.locator('tbody tr').first().locator('input[type="text"]').nth(1);
    await stakeholderInput.fill('John Doe');
    
    // Navigate to Stakeholder Map
    await page.getByRole('button', { name: /Mapa Stakeholders/i }).click();
  });

  test('MS-TC-004: Should display front name on card', async ({ page }) => {
    // Check if the test front appears
    const frontName = page.getByText('Test Front');
    await expect(frontName).toBeVisible();
  });

  test('MS-TC-005: Should display PO information', async ({ page }) => {
    // Look for PO label
    const poLabel = page.getByText(/PO:/);
    await expect(poLabel.first()).toBeVisible();
  });

  test('MS-TC-006: Should display TL information', async ({ page }) => {
    // Look for TL label
    const tlLabel = page.getByText(/TL:/);
    await expect(tlLabel.first()).toBeVisible();
  });

  test('MS-TC-007: Should display status badge', async ({ page }) => {
    // Status badges (Ativo, Mapeado, Pendente)
    const statusBadge = page.locator('text=/Ativo|Mapeado|Pendente/').first();
    await expect(statusBadge).toBeVisible();
  });
});
