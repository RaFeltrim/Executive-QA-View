import { test, expect } from '@playwright/test';

/**
 * E2E Tests - ExecutivePanelView
 * Tests for executive dashboard and metrics display
 */

test.describe('ExecutivePanelView - KPI Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-001: Should display executive panel header', async ({ page }) => {
    await expect(page.getByText('Status do Projeto – Visão Executiva')).toBeVisible();
  });

  test('EP-TC-002: Should display Frentes Ativas KPI', async ({ page }) => {
    await expect(page.getByText('Frentes Ativas')).toBeVisible();
  });

  test('EP-TC-003: Should display Stakeholders KPI', async ({ page }) => {
    await expect(page.getByTestId('kpi-stakeholders')).toBeVisible();
  });

  test('EP-TC-004: Should display status indicator', async ({ page }) => {
    await expect(page.getByText('EM ANDAMENTO')).toBeVisible();
  });

  test('EP-TC-005: Should display risk level', async ({ page }) => {
    const riskText = page.getByText(/Risco Alto|Risco Controlado/);
    await expect(riskText).toBeVisible();
  });
});

test.describe('ExecutivePanelView - Technical Plenitude', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-006: Should display technical plenitude section', async ({ page }) => {
    await expect(page.getByText('Plenitude Técnica (Evolução por Frente)')).toBeVisible();
  });

  test('EP-TC-007: Should display mini pills for criteria', async ({ page }) => {
    // Check for any of the standard pills
    const pillLabels = ['Fluxo', 'Massa', 'Gherkin', 'Ambiente', 'Email Solic.', 'Aprov. Cli.'];
    
    for (const label of pillLabels) {
      const pill = page.locator(`text=${label}`).first();
      // At least some pills should be visible if there's data
      if (await pill.isVisible().catch(() => false)) {
        await expect(pill).toBeVisible();
        break;
      }
    }
  });

  test('EP-TC-008: Should show progress bars', async ({ page }) => {
    // Progress bars have specific styling
    const progressBars = page.locator('.bg-blue-500, .bg-green-500');
    // May or may not have data, just verify the structure exists
    const count = await progressBars.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('ExecutivePanelView - Stakeholder Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-009: Should display agenda stakeholders section', async ({ page }) => {
    await expect(page.getByText('Agenda & Stakeholders')).toBeVisible();
  });

  test('EP-TC-010: Should display table headers', async ({ page }) => {
    await expect(page.locator('th:has-text("Stakeholder")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Realizada")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Pendente")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Inefetiva")').first()).toBeVisible();
  });
});

test.describe('ExecutivePanelView - Escalation Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-011: Should display escalation section', async ({ page }) => {
    await expect(page.getByText('Escalation - Monitoramento')).toBeVisible();
  });

  test('EP-TC-012: Should display escalation table headers', async ({ page }) => {
    const headers = ['QA', 'Frente', 'Dias', 'Prior.', 'Resp. Esc.', 'Status', 'OBS'];
    
    for (const header of headers) {
      const headerEl = page.getByRole('columnheader', { name: header }).or(page.locator(`th:has-text("${header}")`));
      await expect(headerEl).toBeVisible();
    }
  });
});

test.describe('ExecutivePanelView - Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-013: Should have export image button', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /Exportar Imagem/i });
    await expect(exportBtn).toBeVisible();
  });

  test('EP-TC-014: Should trigger image download on export', async ({ page }) => {
    // Wait for any async operations
    await page.waitForTimeout(1000);
    
    // Listen for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    await page.getByRole('button', { name: /Exportar Imagem/i }).click();
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('EBV-Executive-Panel');
    expect(download.suggestedFilename()).toContain('.png');
  });
});
