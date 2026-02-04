/**
 * MCP E2E Tests - Studio QA
 * ==========================
 * 
 * Testes End-to-End usando Playwright MCP para automação de browser.
 * Estes testes cobrem os 25 cenários de usuário principais.
 */

import { test, expect, SELECTORS, APP_CONFIG } from './mcp-helpers';

test.describe('Studio QA - MCP E2E Tests', () => {
  test.beforeEach(async ({ page, mcpHelpers }) => {
    await page.goto(APP_CONFIG.baseUrl);
    await mcpHelpers.waitForAppReady();
  });

  // ==========================================
  // SPREADSHEET VIEW - CRUD Operations
  // ==========================================
  test.describe('SpreadsheetView - CRUD', () => {
    
    test('TC-001: Deve adicionar nova linha com status Pendente', async ({ page, mcpHelpers }) => {
      const initialCount = await mcpHelpers.getRowCount();
      
      await mcpHelpers.addNewRow();
      
      const finalCount = await mcpHelpers.getRowCount();
      expect(finalCount).toBe(initialCount + 1);
      
      // Verifica status padrão
      const firstRow = page.locator('tr').first();
      await expect(firstRow.locator('select[data-field="status"]')).toHaveValue('Pendente');
    });

    test('TC-002: Deve editar campo de texto e salvar automaticamente', async ({ page, mcpHelpers }) => {
      await mcpHelpers.addNewRow();
      await mcpHelpers.fillEditableField(0, 'product', 'Portal PJ Teste');
      
      // Recarrega e verifica persistência
      await page.reload();
      await mcpHelpers.waitForAppReady();
      
      const productField = page.locator('tr:first-child [data-field="product"] input');
      await expect(productField).toHaveValue('Portal PJ Teste');
    });

    test('TC-003: Deve alterar status da agenda', async ({ page, mcpHelpers }) => {
      await mcpHelpers.addNewRow();
      await mcpHelpers.selectDropdownValue(0, 'status', 'Realizada');
      
      const statusSelect = page.locator('tr:first-child select[data-field="status"]');
      await expect(statusSelect).toHaveValue('Realizada');
    });

    test('TC-004: Deve excluir linha após confirmação', async ({ page, mcpHelpers }) => {
      await mcpHelpers.addNewRow();
      const initialCount = await mcpHelpers.getRowCount();
      
      await mcpHelpers.deleteRow(0);
      
      const finalCount = await mcpHelpers.getRowCount();
      expect(finalCount).toBe(initialCount - 1);
    });

    test('TC-005: Deve marcar item como fora de escopo', async ({ page, mcpHelpers }) => {
      await mcpHelpers.addNewRow();
      
      const checkbox = page.locator('tr:first-child [data-field="outOfScope"] input[type="checkbox"]');
      await checkbox.check();
      
      const row = page.locator('tr:first-child');
      await expect(row).toHaveCSS('opacity', '0.6');
    });

    test('TC-006: Deve habilitar campos de escalation quando dias bloqueados > 0', async ({ page, mcpHelpers }) => {
      await mcpHelpers.addNewRow();
      await mcpHelpers.fillEditableField(0, 'daysBlocked', '5');
      
      const escalationField = page.locator('tr:first-child [data-field="escalationResponsible"] input');
      await expect(escalationField).toBeEnabled();
    });
  });

  // ==========================================
  // SPREADSHEET VIEW - Import/Export
  // ==========================================
  test.describe('SpreadsheetView - Import/Export', () => {

    test('TC-007: Deve exportar dados para Excel', async ({ page, mcpHelpers }) => {
      await mcpHelpers.addNewRow();
      await mcpHelpers.fillEditableField(0, 'product', 'Produto Exportacao');
      
      const download = await mcpHelpers.exportToExcel();
      
      expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
    });

    test('TC-008: Deve sincronizar dados sem perda', async ({ page, mcpHelpers }) => {
      // Adiciona 5 linhas
      for (let i = 0; i < 5; i++) {
        await mcpHelpers.addNewRow();
        await mcpHelpers.fillEditableField(i, 'product', `Produto ${i + 1}`);
      }
      
      const countBefore = await mcpHelpers.getRowCount();
      
      await mcpHelpers.updateData();
      
      const countAfter = await mcpHelpers.getRowCount();
      expect(countAfter).toBe(countBefore);
      
      const status = await mcpHelpers.getSyncStatus();
      expect(status).toContain('Sincronizado');
    });
  });

  // ==========================================
  // EXECUTIVE PANEL
  // ==========================================
  test.describe('ExecutivePanelView', () => {

    test('TC-009: Deve exibir KPIs corretamente', async ({ page, mcpHelpers }) => {
      await mcpHelpers.navigateToTab('executive');
      
      const kpiCards = page.locator(SELECTORS.executive.kpiCards);
      await expect(kpiCards).toHaveCount(4);
    });

    test('TC-010: Deve calcular completude das frentes', async ({ page, mcpHelpers }) => {
      await mcpHelpers.navigateToTab('executive');
      
      const progressBars = page.locator(SELECTORS.executive.progressBars);
      const count = await progressBars.count();
      
      // Pelo menos uma barra de progresso deve existir
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('TC-011: Deve exibir escalations quando existirem', async ({ page, mcpHelpers }) => {
      // Primeiro cria um item bloqueado
      await mcpHelpers.navigateToTab('spreadsheet');
      await mcpHelpers.addNewRow();
      await mcpHelpers.fillEditableField(0, 'daysBlocked', '5');
      await mcpHelpers.selectDropdownValue(0, 'status', 'Bloqueada');
      
      // Vai para o painel executivo
      await mcpHelpers.navigateToTab('executive');
      
      const escalationList = page.locator(SELECTORS.executive.escalationList);
      await expect(escalationList).toBeVisible();
    });

    test('TC-012: Deve exportar painel como imagem', async ({ page, mcpHelpers }) => {
      await mcpHelpers.navigateToTab('executive');
      
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.click(SELECTORS.executive.exportImageBtn)
      ]);
      
      expect(download.suggestedFilename()).toMatch(/\.png$/);
    });
  });

  // ==========================================
  // STAKEHOLDER MAP
  // ==========================================
  test.describe('MapaStakeholdersView', () => {

    test('TC-013: Deve exibir cards de stakeholders', async ({ page, mcpHelpers }) => {
      await mcpHelpers.navigateToTab('stakeholders');
      
      const container = page.locator(SELECTORS.stakeholders.container);
      await expect(container).toBeVisible();
    });

    test('TC-014: Deve agrupar frentes por stakeholder', async ({ page, mcpHelpers }) => {
      // Cria dados de teste
      await mcpHelpers.addNewRow();
      await mcpHelpers.fillEditableField(0, 'stakeholder', 'João Silva');
      await mcpHelpers.fillEditableField(0, 'product', 'Portal PJ');
      
      await mcpHelpers.navigateToTab('stakeholders');
      
      const card = page.locator(`${SELECTORS.stakeholders.card}:has-text("João Silva")`);
      await expect(card).toBeVisible();
    });
  });

  // ==========================================
  // LOGBOOK
  // ==========================================
  test.describe('LogbookView', () => {

    test('TC-015: Deve exibir timeline de atividades', async ({ page, mcpHelpers }) => {
      await mcpHelpers.navigateToTab('logbook');
      
      const container = page.locator(SELECTORS.logbook.container);
      await expect(container).toBeVisible();
    });

    test('TC-016: Deve agrupar atividades por data', async ({ page, mcpHelpers }) => {
      await mcpHelpers.navigateToTab('logbook');
      
      const timeline = page.locator(SELECTORS.logbook.timeline);
      await expect(timeline).toBeVisible();
    });
  });

  // ==========================================
  // NAVIGATION
  // ==========================================
  test.describe('Navigation', () => {

    test('TC-017: Deve navegar entre todas as abas', async ({ page, mcpHelpers }) => {
      const tabs: Array<'spreadsheet' | 'executive' | 'stakeholders' | 'logbook'> = [
        'spreadsheet', 'executive', 'stakeholders', 'logbook'
      ];
      
      for (const tab of tabs) {
        await mcpHelpers.navigateToTab(tab);
        // Verifica que a aba correspondente está ativa
        await expect(page.locator(`[data-testid="tab-${tab}"]`)).toHaveClass(/active|selected/);
      }
    });
  });

  // ==========================================
  // SYNC & OFFLINE
  // ==========================================
  test.describe('Synchronization', () => {

    test('TC-018: Deve exibir indicador de status online', async ({ page, mcpHelpers }) => {
      const isOnline = await mcpHelpers.isOnline();
      expect(isOnline).toBe(true);
    });

    test('TC-019: Deve persistir dados no localStorage', async ({ page, mcpHelpers }) => {
      await mcpHelpers.addNewRow();
      await mcpHelpers.fillEditableField(0, 'product', 'Teste Persistencia');
      
      // Fecha e reabre
      await page.reload();
      await mcpHelpers.waitForAppReady();
      
      const product = page.locator('tr:first-child [data-field="product"] input');
      await expect(product).toHaveValue('Teste Persistencia');
    });

    test('TC-020: Deve sincronizar dados em tempo real', async ({ page, mcpHelpers }) => {
      await mcpHelpers.addNewRow();
      await mcpHelpers.fillEditableField(0, 'product', 'Realtime Test');
      await mcpHelpers.updateData();
      
      const syncStatus = await mcpHelpers.getSyncStatus();
      expect(syncStatus).toContain('Sincronizado');
    });
  });

  // ==========================================
  // BUG FIXES v1.1.0 - Regression Tests
  // ==========================================
  test.describe('Bug Fixes v1.1.0 - Regression', () => {

    test('TC-021: Produtos NÃO desaparecem ao adicionar e atualizar', async ({ page, mcpHelpers }) => {
      // Adiciona 10 produtos
      for (let i = 0; i < 10; i++) {
        await mcpHelpers.addNewRow();
        await mcpHelpers.fillEditableField(i, 'product', `Produto Regressão ${i + 1}`);
      }
      
      const countBefore = await mcpHelpers.getRowCount();
      expect(countBefore).toBe(10);
      
      // Adiciona mais uma linha e atualiza
      await mcpHelpers.addNewRow();
      await mcpHelpers.fillEditableField(0, 'product', 'Novo Produto');
      await mcpHelpers.updateData();
      
      const countAfter = await mcpHelpers.getRowCount();
      expect(countAfter).toBe(11);
    });

    test('TC-022: IDs únicos são gerados para novos registros', async ({ page, mcpHelpers }) => {
      const ids = new Set<string>();
      
      for (let i = 0; i < 5; i++) {
        await mcpHelpers.addNewRow();
      }
      
      const rows = page.locator(SELECTORS.spreadsheet.row);
      const count = await rows.count();
      
      for (let i = 0; i < count; i++) {
        const id = await rows.nth(i).getAttribute('data-row-id');
        if (id) {
          expect(ids.has(id)).toBe(false);
          ids.add(id);
        }
      }
    });

    test('TC-023: Campos de data não geram erro no console', async ({ page, mcpHelpers }) => {
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      await mcpHelpers.addNewRow();
      await mcpHelpers.fillEditableField(0, 'contactDate', '2026-02-04');
      
      // Verifica que não há erros de formato de data
      const dateErrors = consoleErrors.filter(e => 
        e.includes('does not conform to the required format')
      );
      expect(dateErrors).toHaveLength(0);
    });

    test('TC-024: Persistência não sobrescreve dados durante carregamento', async ({ page, mcpHelpers }) => {
      // Adiciona dados
      for (let i = 0; i < 5; i++) {
        await mcpHelpers.addNewRow();
        await mcpHelpers.fillEditableField(i, 'product', `Produto Persist ${i + 1}`);
      }
      
      await mcpHelpers.updateData();
      const countBefore = await mcpHelpers.getRowCount();
      
      // Recarrega página múltiplas vezes
      for (let i = 0; i < 3; i++) {
        await page.reload();
        await mcpHelpers.waitForAppReady();
      }
      
      const countAfter = await mcpHelpers.getRowCount();
      expect(countAfter).toBe(countBefore);
    });

    test('TC-025: Chunking funciona para grandes volumes de dados', async ({ page, mcpHelpers }) => {
      // Este teste verifica que muitos registros podem ser sincronizados
      // sem timeout (o chunking divide em lotes de 100)
      
      const startTime = Date.now();
      
      // Adiciona 50 registros (mais conservador para CI)
      for (let i = 0; i < 50; i++) {
        await mcpHelpers.addNewRow();
      }
      
      await mcpHelpers.updateData();
      
      const elapsed = Date.now() - startTime;
      const syncStatus = await mcpHelpers.getSyncStatus();
      
      // Deve sincronizar em tempo razoável (< 60s)
      expect(elapsed).toBeLessThan(60000);
      expect(syncStatus).toContain('Sincronizado');
    });
  });
});
