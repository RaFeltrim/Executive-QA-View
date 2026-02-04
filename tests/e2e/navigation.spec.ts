import { test, expect } from '@playwright/test';

/**
 * E2E Tests - Navigation
 * Tests for navigating between application tabs
 */

test.describe('Navigation - Tab Switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for loading to complete
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('NAV-001: Should display sidebar with all navigation items', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Visão Planilha/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Painel Executivo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Mapa Stakeholders/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Diário de Bordo/i })).toBeVisible();
  });

  test('NAV-002: Should navigate to Executive Panel', async ({ page }) => {
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
    
    await expect(page.getByText('Status do Projeto – Visão Executiva')).toBeVisible();
    await expect(page.getByText('Frentes Ativas')).toBeVisible();
  });

  test('NAV-003: Should navigate to Stakeholder Map', async ({ page }) => {
    await page.getByRole('button', { name: /Mapa Stakeholders/i }).click();
    
    await expect(page.getByText('Mapa de Frentes X Stakeholders')).toBeVisible();
  });

  test('NAV-004: Should navigate to Logbook', async ({ page }) => {
    await page.getByRole('button', { name: /Diário de Bordo/i }).click();
    
    await expect(page.getByText('Diário de Bordo QA')).toBeVisible();
    await expect(page.getByText('Atividades Recentes')).toBeVisible();
  });

  test('NAV-005: Should start on Spreadsheet view by default', async ({ page }) => {
    await expect(page.getByText('Backoffice Diário de Bordo')).toBeVisible();
    await expect(page.getByRole('button', { name: /Nova Linha/i })).toBeVisible();
  });

  test('NAV-006: Should highlight active tab', async ({ page }) => {
    const executiveBtn = page.getByRole('button', { name: /Painel Executivo/i });
    await executiveBtn.click();
    
    // Check that the button has the active class (bg-blue-600)
    await expect(executiveBtn).toHaveClass(/bg-blue-600/);
  });
});

test.describe('Navigation - Header', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('NAV-007: Should display branding information', async ({ page }) => {
    await expect(page.getByText('Studio QA')).toBeVisible();
    await expect(page.getByText('Cliente: EBV')).toBeVisible();
    await expect(page.getByText('Projeto: CNPJ Alfa Numérico')).toBeVisible();
  });

  test('NAV-008: Should display sync status', async ({ page }) => {
    // Should show either online or offline status
    const syncBadge = page.locator('text=/Sincronizado|Modo Offline/');
    await expect(syncBadge).toBeVisible();
  });

  test('NAV-009: Should display current date', async ({ page }) => {
    // Date in PT-BR format (dd/mm/yyyy)
    const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
    const dateText = page.locator('header').getByText(dateRegex);
    await expect(dateText).toBeVisible();
  });
});
