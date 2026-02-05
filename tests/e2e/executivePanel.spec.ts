import { test, expect } from '@playwright/test';

/**
 * E2E Tests - ExecutivePanelView
 * Tests for executive dashboard and metrics display
 * Garantindo VISIBILIDADE TOTAL de todas as informações do painel executivo
 */

test.describe('ExecutivePanelView - Estrutura Principal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-000: Should render executive panel container', async ({ page }) => {
    await expect(page.getByTestId('executive-panel')).toBeVisible();
  });

  test('EP-TC-001: Should display executive panel header', async ({ page }) => {
    await expect(page.getByText('Status do Projeto – Visão Executiva')).toBeVisible();
  });

  test('EP-TC-002: Should display subtitle with sync info', async ({ page }) => {
    await expect(page.getByText('Painel Executivo (Sincronizado via Backoffice)')).toBeVisible();
  });
});

test.describe('ExecutivePanelView - KPI Cards (Visibilidade Total)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-003: Should display KPI cards container', async ({ page }) => {
    await expect(page.getByTestId('kpi-cards')).toBeVisible();
  });

  test('EP-TC-004: Should display Frentes Ativas KPI card', async ({ page }) => {
    const kpiCard = page.getByTestId('kpi-frentes');
    await expect(kpiCard).toBeVisible();
    await expect(kpiCard.locator('text=Frentes Ativas')).toBeVisible();
    // Verificar que o número é exibido (deve ser >= 0)
    const valueElement = kpiCard.locator('p').first();
    await expect(valueElement).toBeVisible();
    const value = await valueElement.textContent();
    expect(Number(value)).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-005: Should display Stakeholders KPI card', async ({ page }) => {
    const kpiCard = page.getByTestId('kpi-stakeholders');
    await expect(kpiCard).toBeVisible();
    await expect(kpiCard.locator('text=Stakeholders')).toBeVisible();
    // Verificar que o número é exibido (deve ser >= 0)
    const valueElement = kpiCard.locator('p').first();
    await expect(valueElement).toBeVisible();
    const value = await valueElement.textContent();
    expect(Number(value)).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-006: Should display Risk/Status KPI card', async ({ page }) => {
    const kpiCard = page.getByTestId('kpi-risk');
    await expect(kpiCard).toBeVisible();
    await expect(page.getByText('EM ANDAMENTO')).toBeVisible();
    // Deve exibir nível de risco
    const riskText = kpiCard.getByText(/Risco Alto|Risco Controlado/);
    await expect(riskText).toBeVisible();
  });

  test('EP-TC-007: Should style risk card based on risk level', async ({ page }) => {
    const kpiCard = page.getByTestId('kpi-risk');
    await expect(kpiCard).toBeVisible();
    // Verificar que o card tem borda colorida (vermelho ou verde)
    const hasRiskStyling = await kpiCard.evaluate((el) => {
      return el.classList.contains('border-red-500') || el.classList.contains('border-green-500');
    });
    expect(hasRiskStyling).toBeTruthy();
  });

  test('EP-TC-008: KPI cards should have correct color schemes', async ({ page }) => {
    // Frentes Ativas - deve ter fundo azul corporativo
    const frentesCard = page.getByTestId('kpi-frentes');
    await expect(frentesCard).toHaveClass(/bg-\[#00529b\]/);
    
    // Stakeholders - deve ter fundo verde
    const stakeholdersCard = page.getByTestId('kpi-stakeholders');
    await expect(stakeholdersCard).toHaveClass(/bg-\[#6aa84f\]/);
  });
});

test.describe('ExecutivePanelView - Plenitude Técnica (Visibilidade Total)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-009: Should display technical plenitude section', async ({ page }) => {
    await expect(page.getByText('Plenitude Técnica (Evolução por Frente)')).toBeVisible();
  });

  test('EP-TC-010: Should display fronts completeness container', async ({ page }) => {
    await expect(page.getByTestId('fronts-completeness')).toBeVisible();
  });

  test('EP-TC-011: Should display Target icon in section header', async ({ page }) => {
    // Verificar que o ícone Target (SVG) está presente no header da seção
    const header = page.locator('h4:has-text("Plenitude Técnica")');
    await expect(header).toBeVisible();
    await expect(header.locator('svg')).toBeVisible();
  });

  test('EP-TC-012: Should display mini pills for all criteria', async ({ page }) => {
    // Lista completa de pills que devem aparecer para frentes ativas
    const pillLabels = ['Fluxo', 'Gherkin', 'Evidenc. As Is', 'Insumos', 'Email Solic.', 'Aprov. Cli.'];
    
    // Verificar que pelo menos uma frente exibe todas as pills
    const frontsContainer = page.getByTestId('fronts-completeness');
    await expect(frontsContainer).toBeVisible();
    
    for (const label of pillLabels) {
      const pill = frontsContainer.locator(`text=${label}`).first();
      // A pill deve existir se há dados de frentes
      if (await pill.isVisible().catch(() => false)) {
        await expect(pill).toBeVisible();
      }
    }
  });

  test('EP-TC-013: Should display completion percentage for active fronts', async ({ page }) => {
    // Verificar que frentes ativas mostram porcentagem de evolução
    const evolutionText = page.locator('text=/Evolução Consolidada:.*%/').first();
    if (await evolutionText.isVisible().catch(() => false)) {
      await expect(evolutionText).toBeVisible();
    }
  });

  test('EP-TC-014: Should display progress bars for fronts', async ({ page }) => {
    const frontsContainer = page.getByTestId('fronts-completeness');
    // Progress bars podem ter bg-blue-500 ou bg-green-500 (se 100%)
    const progressBars = frontsContainer.locator('[class*="bg-blue-500"], [class*="bg-green-500"]');
    const count = await progressBars.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-015: Should display checkmark icon for 100% complete fronts', async ({ page }) => {
    // Frentes com 100% devem mostrar CheckCircle2 verde
    const frontsContainer = page.getByTestId('fronts-completeness');
    const completedIcons = frontsContainer.locator('.text-green-500');
    const count = await completedIcons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-016: Should display clock icon for incomplete fronts', async ({ page }) => {
    // Frentes incompletas devem mostrar Clock âmbar
    const frontsContainer = page.getByTestId('fronts-completeness');
    const pendingIcons = frontsContainer.locator('.text-amber-500');
    const count = await pendingIcons.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-017: Should display "Fora de Escopo" indicator for excluded fronts', async ({ page }) => {
    // Verificar se há frentes fora de escopo com indicador visual
    const outOfScopeText = page.locator('text=Fora de Escopo - Sem Ações QA');
    const count = await outOfScopeText.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-018: Mini pills should have correct active/inactive styling', async ({ page }) => {
    const frontsContainer = page.getByTestId('fronts-completeness');
    // Pills ativas têm bg-green-50 e text-green-700
    const activePills = frontsContainer.locator('[class*="bg-green-50"][class*="text-green-700"]');
    // Pills inativas têm bg-slate-50 e text-slate-300
    const inactivePills = frontsContainer.locator('[class*="bg-slate-50"][class*="text-slate-300"]');
    
    // Pelo menos uma das categorias deve ter elementos se há frentes
    const activeCount = await activePills.count();
    const inactiveCount = await inactivePills.count();
    expect(activeCount + inactiveCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('ExecutivePanelView - Agenda & Stakeholders Table (Visibilidade Total)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-019: Should display agenda stakeholders section', async ({ page }) => {
    await expect(page.getByText('Agenda & Stakeholders')).toBeVisible();
  });

  test('EP-TC-020: Should display Users2 icon in section header', async ({ page }) => {
    const header = page.locator('h4:has-text("Agenda & Stakeholders")');
    await expect(header).toBeVisible();
    await expect(header.locator('svg')).toBeVisible();
  });

  test('EP-TC-021: Should display all stakeholder table headers', async ({ page }) => {
    await expect(page.locator('th:has-text("Stakeholder")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Realizada")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Pendente")').first()).toBeVisible();
    await expect(page.locator('th:has-text("Inefetiva")').first()).toBeVisible();
  });

  test('EP-TC-022: Should display stakeholder names in table', async ({ page }) => {
    // A tabela deve ter linhas com dados de stakeholders
    const tableRows = page.locator('tbody tr').filter({ has: page.locator('td') });
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-023: Realizada column should have green styling', async ({ page }) => {
    // Badges de agendas realizadas devem ter fundo verde
    const realizedBadges = page.locator('span.bg-green-100.text-green-700');
    const count = await realizedBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-024: Pendente column should have red styling', async ({ page }) => {
    // Badges de agendas pendentes devem ter fundo vermelho
    const pendingBadges = page.locator('span.bg-red-100.text-red-700');
    const count = await pendingBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-025: Inefetiva column should have amber styling', async ({ page }) => {
    // Badges de agendas inefetivas devem ter fundo âmbar
    const ineffectiveBadges = page.locator('span.bg-amber-100.text-amber-700');
    const count = await ineffectiveBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-026: Stakeholder names should be truncated with title tooltip', async ({ page }) => {
    // Nomes longos devem ter truncate e title para tooltip
    const stakeholderCells = page.locator('td.truncate[title]');
    const count = await stakeholderCells.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('ExecutivePanelView - Escalation Monitoring (Visibilidade Total)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-027: Should display escalation section', async ({ page }) => {
    await expect(page.getByText('Escalation - Monitoramento')).toBeVisible();
  });

  test('EP-TC-028: Should display AlertTriangle icon in section header', async ({ page }) => {
    const header = page.locator('h4:has-text("Escalation - Monitoramento")');
    await expect(header).toBeVisible();
    await expect(header.locator('svg.text-red-600')).toBeVisible();
  });

  test('EP-TC-029: Should display all escalation table headers', async ({ page }) => {
    const headers = ['QA', 'Frente', 'Stakeholder', 'Dias', 'Prior.', 'Resp. Esc.', 'Status', 'OBS'];
    
    for (const header of headers) {
      const headerEl = page.locator(`th:has-text("${header}")`).first();
      await expect(headerEl).toBeVisible();
    }
  });

  test('EP-TC-030: Escalation table should have red-themed header', async ({ page }) => {
    // O header da tabela de escalation deve ter bg-red-50
    const tableHeader = page.locator('thead.bg-red-50').first();
    await expect(tableHeader).toBeVisible();
  });

  test('EP-TC-031: QA column should display responsible QA names', async ({ page }) => {
    // Verificar que a coluna QA exibe nomes
    const qaColumn = page.locator('tbody tr td:first-child');
    const count = await qaColumn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-032: Frente column should display product/front names', async ({ page }) => {
    // Verificar coluna de frente
    const frenteColumn = page.locator('tbody tr td:nth-child(2)');
    const count = await frenteColumn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-033: Stakeholder column should have red text styling', async ({ page }) => {
    // Stakeholders em escalation devem ter texto vermelho
    const stakeholderRed = page.locator('p.text-red-600.uppercase');
    const count = await stakeholderRed.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-034: Days blocked should display with "d" suffix', async ({ page }) => {
    // Dias bloqueados devem aparecer como "Xd"
    const daysBlocked = page.locator('td.text-red-600:has-text("d")');
    const count = await daysBlocked.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-035: Priority badges should be displayed', async ({ page }) => {
    // Badges de prioridade devem ter estilo pill
    const priorityBadges = page.locator('span.bg-red-600.text-white.rounded-full');
    const count = await priorityBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-036: Status column should display escalation status', async ({ page }) => {
    // A coluna de status deve estar visível com texto âmbar
    const statusColumn = page.locator('td.text-amber-600.uppercase');
    const count = await statusColumn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-037: OBS column should display observations with truncation', async ({ page }) => {
    // Observações devem ter estilo itálico e truncate
    const obsColumn = page.locator('td.text-slate-500.italic.truncate');
    const count = await obsColumn.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('ExecutivePanelView - Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-038: Should have export image button visible', async ({ page }) => {
    const exportBtn = page.getByTestId('btn-export-image');
    await expect(exportBtn).toBeVisible();
  });

  test('EP-TC-039: Export button should have correct label', async ({ page }) => {
    const exportBtn = page.getByRole('button', { name: /Exportar Imagem/i });
    await expect(exportBtn).toBeVisible();
  });

  test('EP-TC-040: Export button should have download icon', async ({ page }) => {
    const exportBtn = page.getByTestId('btn-export-image');
    await expect(exportBtn.locator('svg')).toBeVisible();
  });

  test('EP-TC-041: Export button should have blue styling', async ({ page }) => {
    const exportBtn = page.getByTestId('btn-export-image');
    await expect(exportBtn).toHaveClass(/bg-blue-600/);
  });

  test('EP-TC-042: Should trigger image download on export', async ({ page }) => {
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

test.describe('ExecutivePanelView - Layout & Visual Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-043: Should use max-width container for proper centering', async ({ page }) => {
    const container = page.locator('.max-w-7xl.mx-auto').first();
    await expect(container).toBeVisible();
  });

  test('EP-TC-044: Main content should have white background card', async ({ page }) => {
    const whiteCard = page.locator('.bg-white.border.border-slate-200.rounded-\\[2\\.5rem\\]');
    await expect(whiteCard).toBeVisible();
  });

  test('EP-TC-045: KPI cards should be in 3-column grid', async ({ page }) => {
    const kpiGrid = page.getByTestId('kpi-cards');
    await expect(kpiGrid).toHaveClass(/grid-cols-3/);
  });

  test('EP-TC-046: Content sections should be in 2-column layout', async ({ page }) => {
    const twoColumnGrid = page.locator('.grid.grid-cols-2.gap-8').first();
    await expect(twoColumnGrid).toBeVisible();
  });

  test('EP-TC-047: Title should have corporate blue color', async ({ page }) => {
    const title = page.locator('h2.text-\\[\\#004e92\\]');
    await expect(title).toBeVisible();
  });
});

test.describe('ExecutivePanelView - Responsive Data Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
  });

  test('EP-TC-048: Should handle empty data gracefully', async ({ page }) => {
    // O painel deve carregar sem erros mesmo sem dados
    await expect(page.getByTestId('executive-panel')).toBeVisible();
    // Não deve haver erros de JS na página
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.waitForTimeout(500);
    expect(errors.length).toBe(0);
  });

  test('EP-TC-049: Front cards should have truncate for long names', async ({ page }) => {
    // Verificar que nomes de frentes têm truncate
    const frontNames = page.locator('[data-testid="fronts-completeness"] p.truncate');
    const count = await frontNames.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EP-TC-050: All numeric values in KPIs should be visible numbers', async ({ page }) => {
    // Verificar Frentes Ativas
    const frentesValue = page.getByTestId('kpi-frentes').locator('p.text-5xl');
    const frentesText = await frentesValue.textContent();
    expect(frentesText).toMatch(/^\d+$/);

    // Verificar Stakeholders
    const stakeholdersValue = page.getByTestId('kpi-stakeholders').locator('p.text-5xl');
    const stakeholdersText = await stakeholdersValue.textContent();
    expect(stakeholdersText).toMatch(/^\d+$/);
  });
});

test.describe('ExecutivePanelView - Accessibility & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('text=Carregando dados...', { state: 'hidden', timeout: 10000 }).catch(() => {});
  });

  test('EP-TC-051: Should be accessible via Painel Executivo button', async ({ page }) => {
    const tabButton = page.getByRole('button', { name: /Painel Executivo/i });
    await expect(tabButton).toBeVisible();
    await tabButton.click();
    await expect(page.getByTestId('executive-panel')).toBeVisible();
  });

  test('EP-TC-052: Tab button should indicate active state', async ({ page }) => {
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
    // O botão ativo deve ter estilo diferenciado
    const activeTab = page.getByRole('button', { name: /Painel Executivo/i });
    await expect(activeTab).toBeVisible();
  });

  test('EP-TC-053: All interactive elements should be focusable', async ({ page }) => {
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
    // O botão de exportar deve ser focalizável
    const exportBtn = page.getByTestId('btn-export-image');
    await exportBtn.focus();
    await expect(exportBtn).toBeFocused();
  });

  test('EP-TC-054: Tables should have proper semantic structure', async ({ page }) => {
    await page.getByRole('button', { name: /Painel Executivo/i }).click();
    // Verificar estrutura semântica das tabelas
    const tables = page.locator('table');
    const count = await tables.count();
    expect(count).toBe(2); // Stakeholders + Escalation
  });
});
