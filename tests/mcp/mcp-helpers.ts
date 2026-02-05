/**
 * MCP Playwright Test Utilities
 * ==============================
 * 
 * Utilitários para testes automatizados usando o Playwright MCP Server.
 * Estes helpers facilitam a escrita de testes E2E com suporte a MCP.
 */

import { test as baseTest, expect, Page, BrowserContext } from '@playwright/test';

/**
 * Configuração base da aplicação
 */
export const APP_CONFIG = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  timeout: 30000,
  retries: 2
};

/**
 * Seletores principais da aplicação
 */
export const SELECTORS = {
  // Sidebar Navigation
  sidebar: {
    container: '[data-testid="sidebar"]',
    spreadsheet: '[data-testid="tab-spreadsheet"]',
    executive: '[data-testid="tab-executive"]',
    stakeholders: '[data-testid="tab-stakeholders"]',
    logbook: '[data-testid="tab-logbook"]'
  },
  
  // SpreadsheetView
  spreadsheet: {
    table: '[data-testid="spreadsheet-table"]',
    addRowBtn: 'button:has-text("Nova Linha")',
    updateBtn: 'button:has-text("Atualizar Dados")',
    syncBtn: 'button:has-text("Sincronizar")',
    exportBtn: 'button:has-text("Exportar Excel")',
    importInput: 'input[type="file"][accept*=".xlsx"]',
    row: 'tr[data-row-id]',
    deleteBtn: '[data-testid="delete-row"]'
  },
  
  // ExecutivePanel
  executive: {
    container: '[data-testid="executive-panel"]',
    kpiCards: '[data-testid="kpi-card"]',
    progressBars: '[data-testid="progress-bar"]',
    escalationList: '[data-testid="escalation-list"]',
    exportImageBtn: 'button:has-text("Exportar Imagem")'
  },
  
  // StakeholderMap
  stakeholders: {
    container: '[data-testid="stakeholder-map"]',
    card: '[data-testid="stakeholder-card"]'
  },
  
  // Logbook
  logbook: {
    container: '[data-testid="logbook"]',
    timeline: '[data-testid="timeline"]',
    entry: '[data-testid="timeline-entry"]'
  },
  
  // Global
  global: {
    syncStatus: '[data-testid="sync-status"]',
    onlineIndicator: '[data-testid="online-indicator"]',
    loadingSpinner: '[data-testid="loading"]'
  }
};

/**
 * Fixture customizado com helpers MCP
 */
export const test = baseTest.extend<{
  mcpHelpers: MCPHelpers;
}>({
  mcpHelpers: async ({ page }, use) => {
    const helpers = new MCPHelpers(page);
    await use(helpers);
  }
});

/**
 * Classe de helpers para operações MCP
 */
export class MCPHelpers {
  constructor(private page: Page) {}

  /**
   * Navega para uma aba específica
   */
  async navigateToTab(tab: 'spreadsheet' | 'executive' | 'stakeholders' | 'logbook') {
    const selectorMap = {
      spreadsheet: SELECTORS.sidebar.spreadsheet,
      executive: SELECTORS.sidebar.executive,
      stakeholders: SELECTORS.sidebar.stakeholders,
      logbook: SELECTORS.sidebar.logbook
    };
    
    await this.page.click(selectorMap[tab]);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Adiciona uma nova linha na planilha
   */
  async addNewRow() {
    await this.navigateToTab('spreadsheet');
    await this.page.click(SELECTORS.spreadsheet.addRowBtn);
    await this.page.waitForTimeout(500); // Aguarda animação
  }

  /**
   * Preenche um campo editável
   */
  async fillEditableField(rowIndex: number, fieldName: string, value: string) {
    const selector = `tr:nth-child(${rowIndex + 1}) [data-field="${fieldName}"] input`;
    await this.page.fill(selector, value);
    await this.page.keyboard.press('Tab'); // Trigger blur/save
  }

  /**
   * Seleciona um valor em um dropdown
   */
  async selectDropdownValue(rowIndex: number, fieldName: string, value: string) {
    const selector = `tr:nth-child(${rowIndex + 1}) [data-field="${fieldName}"] select`;
    await this.page.selectOption(selector, value);
  }

  /**
   * Exclui uma linha pelo índice
   */
  async deleteRow(rowIndex: number) {
    const deleteBtn = `tr:nth-child(${rowIndex + 1}) ${SELECTORS.spreadsheet.deleteBtn}`;
    await this.page.click(deleteBtn);
    
    // Confirma exclusão se houver dialog
    this.page.once('dialog', dialog => dialog.accept());
  }

  /**
   * Exporta dados para Excel
   */
  async exportToExcel() {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.page.click(SELECTORS.spreadsheet.exportBtn)
    ]);
    return download;
  }

  /**
   * Importa arquivo Excel
   */
  async importExcel(filePath: string) {
    const fileInput = this.page.locator(SELECTORS.spreadsheet.importInput);
    await fileInput.setInputFiles(filePath);
    
    // Confirma importação se houver dialog
    this.page.once('dialog', dialog => dialog.accept());
  }

  /**
   * Atualiza dados (sync para Supabase)
   */
  async updateData() {
    await this.page.click(SELECTORS.spreadsheet.updateBtn);
    await this.page.waitForSelector(SELECTORS.global.syncStatus + ':has-text("Sincronizado")', {
      timeout: 10000
    });
  }

  /**
   * Verifica status de sincronização
   */
  async getSyncStatus(): Promise<string> {
    const status = await this.page.textContent(SELECTORS.global.syncStatus);
    return status || 'Unknown';
  }

  /**
   * Conta linhas na planilha
   */
  async getRowCount(): Promise<number> {
    const rows = await this.page.$$(SELECTORS.spreadsheet.row);
    return rows.length;
  }

  /**
   * Captura screenshot com nome automático
   */
  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({
      path: `./test-reports/screenshots/${name}-${timestamp}.png`,
      fullPage: true
    });
  }

  /**
   * Aguarda aplicação estar pronta
   */
  async waitForAppReady() {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForSelector(SELECTORS.global.loadingSpinner, { state: 'hidden' }).catch(() => {});
  }

  /**
   * Verifica se está online
   */
  async isOnline(): Promise<boolean> {
    const indicator = await this.page.$(SELECTORS.global.onlineIndicator);
    if (!indicator) return false;
    const className = await indicator.getAttribute('class');
    return className?.includes('online') || className?.includes('green') || false;
  }
}

/**
 * Re-exporta expect para uso nos testes
 */
export { expect };

/**
 * Helper para criar contexto de teste isolado
 */
export async function createIsolatedContext(browser: BrowserContext) {
  // browser aqui é na verdade um BrowserContext do Playwright test,
  // que não tem newContext. Use a página do contexto existente.
  // Para testes que precisam de um contexto isolado, use o fixture browser diretamente.
  return browser;
}
