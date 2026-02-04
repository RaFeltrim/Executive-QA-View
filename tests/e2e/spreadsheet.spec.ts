import { test, expect } from '@playwright/test';

/**
 * E2E Tests - SpreadsheetView
 * Tests for CRUD operations and data management
 */

test.describe('SpreadsheetView - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    // Ensure we're on Spreadsheet view
    await page.getByRole('button', { name: /Visão Planilha/i }).click();
  });

  test('SP-TC-001: Should add a new row', async ({ page }) => {
    // Count initial rows
    const initialRows = await page.locator('tbody tr').count();
    
    // Click "Nova Linha"
    await page.getByRole('button', { name: /Nova Linha/i }).click();
    
    // Verify row was added
    const newRows = await page.locator('tbody tr').count();
    expect(newRows).toBe(initialRows + 1);
  });

  test('SP-TC-002: Should edit a text field', async ({ page }) => {
    // Add a new row first
    await page.getByRole('button', { name: /Nova Linha/i }).click();
    
    // Find the first product input and edit it
    const productInput = page.locator('tbody tr').first().locator('input[type="text"]').first();
    await productInput.fill('Cadastro PJ Test');
    
    // Verify the value was set
    await expect(productInput).toHaveValue('Cadastro PJ Test');
  });

  test('SP-TC-003: Should delete a row', async ({ page }) => {
    // Add a new row first
    await page.getByRole('button', { name: /Nova Linha/i }).click();
    const initialRows = await page.locator('tbody tr').count();
    
    // Click delete button on first row
    await page.locator('tbody tr').first().getByRole('button').click();
    
    // Verify row was removed
    const finalRows = await page.locator('tbody tr').count();
    expect(finalRows).toBe(initialRows - 1);
  });

  test('SP-TC-004: Should change status via dropdown', async ({ page }) => {
    // Add a new row
    await page.getByRole('button', { name: /Nova Linha/i }).click();
    
    // Find status select (11th column)
    const statusSelect = page.locator('tbody tr').first().locator('select').first();
    
    // Change to "Realizada"
    await statusSelect.selectOption('Realizada');
    
    // Verify the change
    await expect(statusSelect).toHaveValue('Realizada');
  });

  test('SP-TC-005: Should toggle out of scope checkbox', async ({ page }) => {
    await page.getByRole('button', { name: /Nova Linha/i }).click();
    
    // Find checkbox in first row
    const checkbox = page.locator('tbody tr').first().locator('input[type="checkbox"]');
    
    // Initially should be unchecked
    await expect(checkbox).not.toBeChecked();
    
    // Click to check
    await checkbox.check();
    await expect(checkbox).toBeChecked();
  });

  test('SP-TC-006: Escalation fields should be disabled when not blocked', async ({ page }) => {
    await page.getByRole('button', { name: /Nova Linha/i }).click();
    
    // Set days blocked to 0
    const daysInput = page.locator('tbody tr').first().locator('input[type="number"]');
    await daysInput.fill('0');
    
    // Escalation fields should have opacity-30 (disabled state)
    // This is indicated by the bg-red-50/30 class on the td
    const escalationCell = page.locator('tbody tr').first().locator('td.bg-red-50\\/30').first();
    await expect(escalationCell).toBeVisible();
  });
});

test.describe('SpreadsheetView - Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('SP-TC-007: Should have export button visible', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /Exportar Excel/i });
    await expect(exportBtn).toBeVisible();
  });

  test('SP-TC-008: Should have import button visible', async ({ page }) => {
    const importLabel = page.getByText('Importar Excel');
    await expect(importLabel).toBeVisible();
  });

  test('SP-TC-009: Should have AI scan button visible', async ({ page }) => {
    const scanLabel = page.getByText('Escanear IA');
    await expect(scanLabel).toBeVisible();
  });

  test('SP-TC-010: Should trigger download on export click', async ({ page }) => {
    // Listen for download event
    const downloadPromise = page.waitForEvent('download');
    
    await page.getByRole('button', { name: /Exportar Excel/i }).click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('StudioQA_Export');
    expect(download.suggestedFilename()).toContain('.xlsx');
  });
});

test.describe('SpreadsheetView - Sync Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('SP-TC-011: Should have sync button', async ({ page }) => {
    const syncBtn = page.getByRole('button', { name: /Sincronizar/i });
    await expect(syncBtn).toBeVisible();
  });

  test('SP-TC-012: Should have update data button', async ({ page }) => {
    const updateBtn = page.getByRole('button', { name: /Atualizar Dados/i });
    await expect(updateBtn).toBeVisible();
  });
});

test.describe('SpreadsheetView - Table Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('SP-TC-013: Should display all column headers', async ({ page }) => {
    const expectedHeaders = [
      'Produto (Frente)',
      'Gherkin',
      'Ambiente',
      'Fluxo',
      'Massa',
      'Fora Escopo',
      'Resp. QA',
      'Stakeholder',
      'Função',
      'Tech Lead',
      'Status Agenda',
      'Acionamento',
      'Data Agenda',
      'Aprovação Solicitada por email',
      'Aprovado Pelo Cliente',
      'Dias Bloq.',
      'Motivo Bloqueio (Escalada)',
      'Prioridade',
      'Responsável Escalation',
      'Status Escalation',
      'OBS Escalation',
      'Observações',
      'Excluir'
    ];

    for (const header of expectedHeaders) {
      await expect(page.getByRole('columnheader', { name: header })).toBeVisible();
    }
  });

  test('SP-TC-014: Should have horizontal scroll for wide table', async ({ page }) => {
    // Table should have min-width that triggers scroll
    const table = page.locator('table');
    const tableBox = await table.boundingBox();
    expect(tableBox?.width).toBeGreaterThan(1000);
  });
});
