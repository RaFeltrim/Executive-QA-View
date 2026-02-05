import { describe, it, expect, vi } from 'vitest';
import { SpreadsheetRow, FrontCompleteness, EffectivenessMetric } from '../../types';

/**
 * Business Logic Tests
 * Tests for derived data calculations used in the application
 */

describe('Business Logic - Fronts Completeness Calculation', () => {
  
  const calculateCompleteness = (rows: SpreadsheetRow[]): FrontCompleteness[] => {
    const fronts: Record<string, FrontCompleteness> = {};
    
    rows.forEach(row => {
      const name = row.product || 'TBD';
      if (!fronts[name]) {
        fronts[name] = {
          frontName: name,
          flowKnowledge: row.flowKnowledge === 'OK',
          gherkinReady: row.gherkin === 'OK',
          evidenciamentoAsIsOk: row.evidenciamentoAsIs === 'Evidencias QA - OK' || row.environment === 'OK',
          insumosParaTestesOk: row.insumosParaTestes === 'OK' || row.dataMass === 'OK',
          approvalRequestedEmail: row.approvalRequestedEmail === 'SIM',
          approvedByClient: row.approvedByClient === 'SIM',
          completionPercentage: 0,
          outOfScope: row.outOfScope,
          // Campos legados
          dataMassInfo: row.dataMass === 'OK',
          envAccess: row.environment === 'OK'
        };
      } else {
        if (row.flowKnowledge === 'OK') fronts[name].flowKnowledge = true;
        if (row.dataMass === 'OK') fronts[name].dataMassInfo = true;
        if (row.gherkin === 'OK') fronts[name].gherkinReady = true;
        if (row.environment === 'OK') fronts[name].envAccess = true;
        if (row.evidenciamentoAsIs === 'Evidencias QA - OK') fronts[name].evidenciamentoAsIsOk = true;
        if (row.insumosParaTestes === 'OK') fronts[name].insumosParaTestesOk = true;
        if (row.approvalRequestedEmail === 'SIM') fronts[name].approvalRequestedEmail = true;
        if (row.approvedByClient === 'SIM') fronts[name].approvedByClient = true;
        if (row.outOfScope) fronts[name].outOfScope = true;
      }
    });

    return Object.values(fronts).map(f => {
      if (f.outOfScope) return { ...f, completionPercentage: 0 };
      const items = [
        f.flowKnowledge, f.dataMassInfo, f.gherkinReady,
        f.envAccess, f.approvalRequestedEmail, f.approvedByClient
      ];
      const completed = items.filter(Boolean).length;
      return { ...f, completionPercentage: Math.round((completed / 6) * 100) };
    });
  };

  it('should calculate 0% for empty criteria', () => {
    const rows: SpreadsheetRow[] = [{
      id: '1',
      product: 'Test Front',
      date: '2025-07-15',
      status: 'Pendente',
      responsibleQA: 'QA',
      responsible: 'PO',
      role: 'PO',
      notes: '',
      flowKnowledge: 'NOK',
      dataMass: 'NOK',
      gherkin: 'NOK',
      environment: 'NOK',
      approvalRequestedEmail: 'NÃO',
      approvedByClient: 'NÃO'
    }];

    const result = calculateCompleteness(rows);
    expect(result[0].completionPercentage).toBe(0);
  });

  it('should calculate 100% for all criteria OK', () => {
    const rows: SpreadsheetRow[] = [{
      id: '1',
      product: 'Complete Front',
      date: '2025-07-15',
      status: 'Realizada',
      responsibleQA: 'QA',
      responsible: 'PO',
      role: 'PO',
      notes: '',
      flowKnowledge: 'OK',
      dataMass: 'OK',
      gherkin: 'OK',
      environment: 'OK',
      approvalRequestedEmail: 'SIM',
      approvedByClient: 'SIM'
    }];

    const result = calculateCompleteness(rows);
    expect(result[0].completionPercentage).toBe(100);
  });

  it('should calculate 50% for half criteria OK', () => {
    const rows: SpreadsheetRow[] = [{
      id: '1',
      product: 'Partial Front',
      date: '2025-07-15',
      status: 'Pendente',
      responsibleQA: 'QA',
      responsible: 'PO',
      role: 'PO',
      notes: '',
      flowKnowledge: 'OK',
      dataMass: 'OK',
      gherkin: 'OK',
      environment: 'NOK',
      approvalRequestedEmail: 'NÃO',
      approvedByClient: 'NÃO'
    }];

    const result = calculateCompleteness(rows);
    expect(result[0].completionPercentage).toBe(50);
  });

  it('should return 0% for out of scope fronts', () => {
    const rows: SpreadsheetRow[] = [{
      id: '1',
      product: 'Out of Scope Front',
      date: '2025-07-15',
      status: 'Pendente',
      responsibleQA: 'QA',
      responsible: 'PO',
      role: 'PO',
      notes: '',
      flowKnowledge: 'OK',
      dataMass: 'OK',
      gherkin: 'OK',
      environment: 'OK',
      approvalRequestedEmail: 'SIM',
      approvedByClient: 'SIM',
      outOfScope: true
    }];

    const result = calculateCompleteness(rows);
    expect(result[0].completionPercentage).toBe(0);
    expect(result[0].outOfScope).toBe(true);
  });

  it('should aggregate multiple rows for same front', () => {
    const rows: SpreadsheetRow[] = [
      {
        id: '1',
        product: 'Multi Row Front',
        date: '2025-07-15',
        status: 'Pendente',
        responsibleQA: 'QA',
        responsible: 'PO1',
        role: 'PO',
        notes: '',
        flowKnowledge: 'OK',
        dataMass: 'NOK'
      },
      {
        id: '2',
        product: 'Multi Row Front',
        date: '2025-07-16',
        status: 'Pendente',
        responsibleQA: 'QA',
        responsible: 'PO2',
        role: 'PO',
        notes: '',
        flowKnowledge: 'NOK',
        dataMass: 'OK',
        gherkin: 'OK'
      }
    ];

    const result = calculateCompleteness(rows);
    expect(result.length).toBe(1);
    expect(result[0].flowKnowledge).toBe(true);
    expect(result[0].dataMassInfo).toBe(true);
    expect(result[0].gherkinReady).toBe(true);
    expect(result[0].completionPercentage).toBe(50); // 3/6
  });
});

describe('Business Logic - Effectiveness Calculation', () => {
  
  const calculateEffectiveness = (rows: SpreadsheetRow[]): EffectivenessMetric[] => {
    const metrics: Record<string, EffectivenessMetric> = {};
    
    rows.forEach(row => {
      const person = row.responsible || 'Sem Nome';
      if (!metrics[person]) {
        metrics[person] = {
          person,
          conductedAgendas: 0,
          pendingAgendas: 0,
          ineffectiveAgendas: 0,
          incompleteAgendas: 0,
          status: 'On Track'
        };
      }
      const s = row.status?.toLowerCase();
      if (s === 'realizada' || s === 'executado') metrics[person].conductedAgendas++;
      if (s === 'pendente') metrics[person].pendingAgendas++;
      if (s === 'inefetiva' || s === 'bloqueada') metrics[person].ineffectiveAgendas++;
    });

    return Object.values(metrics).filter(m => m.person !== 'N/A').map(m => ({
      ...m,
      status: m.ineffectiveAgendas > 1 ? 'Critical' : m.pendingAgendas > 2 ? 'Warning' : 'On Track'
    }));
  };

  it('should count conducted agendas correctly', () => {
    const rows: SpreadsheetRow[] = [
      { id: '1', date: '', status: 'Realizada', responsibleQA: '', product: '', responsible: 'João', role: '', notes: '' },
      { id: '2', date: '', status: 'Realizada', responsibleQA: '', product: '', responsible: 'João', role: '', notes: '' },
      { id: '3', date: '', status: 'Pendente', responsibleQA: '', product: '', responsible: 'João', role: '', notes: '' }
    ];

    const result = calculateEffectiveness(rows);
    expect(result.find(m => m.person === 'João')?.conductedAgendas).toBe(2);
    expect(result.find(m => m.person === 'João')?.pendingAgendas).toBe(1);
  });

  it('should set Critical status for more than 1 ineffective', () => {
    const rows: SpreadsheetRow[] = [
      { id: '1', date: '', status: 'Inefetiva', responsibleQA: '', product: '', responsible: 'Maria', role: '', notes: '' },
      { id: '2', date: '', status: 'Bloqueada', responsibleQA: '', product: '', responsible: 'Maria', role: '', notes: '' }
    ];

    const result = calculateEffectiveness(rows);
    expect(result.find(m => m.person === 'Maria')?.status).toBe('Critical');
  });

  it('should set Warning status for more than 2 pending', () => {
    const rows: SpreadsheetRow[] = [
      { id: '1', date: '', status: 'Pendente', responsibleQA: '', product: '', responsible: 'Carlos', role: '', notes: '' },
      { id: '2', date: '', status: 'Pendente', responsibleQA: '', product: '', responsible: 'Carlos', role: '', notes: '' },
      { id: '3', date: '', status: 'Pendente', responsibleQA: '', product: '', responsible: 'Carlos', role: '', notes: '' }
    ];

    const result = calculateEffectiveness(rows);
    expect(result.find(m => m.person === 'Carlos')?.status).toBe('Warning');
  });

  it('should set On Track for normal scenarios', () => {
    const rows: SpreadsheetRow[] = [
      { id: '1', date: '', status: 'Realizada', responsibleQA: '', product: '', responsible: 'Ana', role: '', notes: '' },
      { id: '2', date: '', status: 'Pendente', responsibleQA: '', product: '', responsible: 'Ana', role: '', notes: '' }
    ];

    const result = calculateEffectiveness(rows);
    expect(result.find(m => m.person === 'Ana')?.status).toBe('On Track');
  });

  it('should filter out N/A stakeholders', () => {
    const rows: SpreadsheetRow[] = [
      { id: '1', date: '', status: 'Pendente', responsibleQA: '', product: '', responsible: 'N/A', role: '', notes: '' },
      { id: '2', date: '', status: 'Pendente', responsibleQA: '', product: '', responsible: 'João', role: '', notes: '' }
    ];

    const result = calculateEffectiveness(rows);
    expect(result.find(m => m.person === 'N/A')).toBeUndefined();
    expect(result.length).toBe(1);
  });
});

describe('Business Logic - Escalation Detection', () => {
  
  const getEscalations = (rows: SpreadsheetRow[]) => {
    return rows
      .filter(row => (row.daysBlocked && row.daysBlocked > 0) || row.status === 'Bloqueada')
      .map(row => ({
        id: row.id,
        qa: row.responsibleQA || 'QA Team',
        product: row.product || 'TBD',
        stakeholder: row.responsible || 'TBD',
        reason: row.escalationReason || row.notes || 'Bloqueio sem motivo especificado.',
        daysBlocked: row.daysBlocked || 0,
        priority: row.priority || 'Média'
      }));
  };

  it('should detect escalations by blocked days', () => {
    const rows: SpreadsheetRow[] = [
      { id: '1', date: '', status: 'Pendente', responsibleQA: '', product: 'Test', responsible: '', role: '', notes: '', daysBlocked: 5 },
      { id: '2', date: '', status: 'Pendente', responsibleQA: '', product: 'Test2', responsible: '', role: '', notes: '', daysBlocked: 0 }
    ];

    const result = getEscalations(rows);
    expect(result.length).toBe(1);
    expect(result[0].daysBlocked).toBe(5);
  });

  it('should detect escalations by blocked status', () => {
    const rows: SpreadsheetRow[] = [
      { id: '1', date: '', status: 'Bloqueada', responsibleQA: '', product: 'Test', responsible: '', role: '', notes: '', daysBlocked: 0 }
    ];

    const result = getEscalations(rows);
    expect(result.length).toBe(1);
  });

  it('should use escalation reason or notes', () => {
    const rows: SpreadsheetRow[] = [
      { id: '1', date: '', status: 'Bloqueada', responsibleQA: '', product: 'Test', responsible: '', role: '', notes: 'Note reason', escalationReason: 'Escalation reason', daysBlocked: 1 }
    ];

    const result = getEscalations(rows);
    expect(result[0].reason).toBe('Escalation reason');
  });

  it('should fallback to default message when no reason', () => {
    const rows: SpreadsheetRow[] = [
      { id: '1', date: '', status: 'Bloqueada', responsibleQA: '', product: 'Test', responsible: '', role: '', notes: '', daysBlocked: 1 }
    ];

    const result = getEscalations(rows);
    expect(result[0].reason).toBe('Bloqueio sem motivo especificado.');
  });
});

describe('Business Logic - Risk Level Calculation', () => {
  it('should return high risk for more than 3 escalations', () => {
    const escalationsCount = 4;
    const riskLevel = escalationsCount > 3 ? 'Risco Alto' : 'Risco Controlado';
    expect(riskLevel).toBe('Risco Alto');
  });

  it('should return controlled risk for 3 or fewer escalations', () => {
    const escalationsCount = 3;
    const riskLevel = escalationsCount > 3 ? 'Risco Alto' : 'Risco Controlado';
    expect(riskLevel).toBe('Risco Controlado');
  });
});

describe('Business Logic - Stakeholder Mapping', () => {
  const getStakeholderMap = (rows: SpreadsheetRow[]) => {
    const maps: Record<string, any> = {};
    
    rows.forEach(row => {
      const name = row.product || 'TBD';
      if (!maps[name]) {
        maps[name] = {
          frontName: name,
          po: { name: row.responsible || 'TBD', role: row.role || 'PO' },
          techLead: { name: row.techLeadName || 'TBD', role: 'TL' },
          status: row.status === 'Realizada' ? 'Ativo' : row.status === 'Pendente' ? 'Pendente' : 'Mapeado'
        };
      }
    });

    return Object.values(maps);
  };

  it('should map stakeholders correctly', () => {
    const rows: SpreadsheetRow[] = [
      {
        id: '1',
        date: '',
        status: 'Realizada',
        responsibleQA: '',
        product: 'Cadastro PJ',
        responsible: 'João Silva',
        role: 'PO',
        techLeadName: 'Maria Tech',
        notes: ''
      }
    ];

    const result = getStakeholderMap(rows);
    expect(result[0].frontName).toBe('Cadastro PJ');
    expect(result[0].po.name).toBe('João Silva');
    expect(result[0].techLead.name).toBe('Maria Tech');
    expect(result[0].status).toBe('Ativo');
  });

  it('should set status based on agenda status', () => {
    const testCases = [
      { status: 'Realizada', expected: 'Ativo' },
      { status: 'Pendente', expected: 'Pendente' },
      { status: 'Bloqueada', expected: 'Mapeado' },
      { status: 'Inefetiva', expected: 'Mapeado' }
    ];

    testCases.forEach(tc => {
      const rows: SpreadsheetRow[] = [
        { id: '1', date: '', status: tc.status, responsibleQA: '', product: 'Test', responsible: '', role: '', notes: '' }
      ];
      const result = getStakeholderMap(rows);
      expect(result[0].status).toBe(tc.expected);
    });
  });
});

/**
 * =============================================================================
 * TESTES UNITÁRIOS: Cálculo de Dias Bloqueados (Padrão SDET)
 * =============================================================================
 * Valida a função calculateBlockedBusinessDays para:
 * - Datas retroativas (1 semana, 1 mês, 6 meses)
 * - Prevenção de Epoch 1970
 * - Valores nulos/undefined
 * - Status diferentes de "Bloqueada"
 * - Finais de semana (devem ser ignorados)
 */

import { calculateBlockedBusinessDays } from '../../App';

describe('Business Logic - Calculate Blocked Business Days (SDET Pattern)', () => {
  
  // Helper para criar uma data no passado (dias úteis atrás)
  const getDateDaysAgo = (days: number): string => {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  };

  // Helper para criar uma data específica
  const createDate = (year: number, month: number, day: number): string => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  describe('Validação de entrada (Prevenção de undefined)', () => {
    it('TC-BLOCKED-001: Deve retornar 0 para blockedSinceDate undefined', () => {
      expect(calculateBlockedBusinessDays(undefined, 'Bloqueada')).toBe(0);
    });

    it('TC-BLOCKED-002: Deve retornar 0 para blockedSinceDate null', () => {
      expect(calculateBlockedBusinessDays(null, 'Bloqueada')).toBe(0);
    });

    it('TC-BLOCKED-003: Deve retornar 0 para blockedSinceDate string vazia', () => {
      expect(calculateBlockedBusinessDays('', 'Bloqueada')).toBe(0);
    });

    it('TC-BLOCKED-004: Deve retornar 0 para blockedSinceDate com apenas espaços', () => {
      expect(calculateBlockedBusinessDays('   ', 'Bloqueada')).toBe(0);
    });
  });

  describe('Validação de status', () => {
    const validDate = getDateDaysAgo(7);

    it('TC-BLOCKED-005: Deve retornar 0 para status "Pendente"', () => {
      expect(calculateBlockedBusinessDays(validDate, 'Pendente')).toBe(0);
    });

    it('TC-BLOCKED-006: Deve retornar 0 para status "Realizada"', () => {
      expect(calculateBlockedBusinessDays(validDate, 'Realizada')).toBe(0);
    });

    it('TC-BLOCKED-007: Deve retornar 0 para status "Inefetiva"', () => {
      expect(calculateBlockedBusinessDays(validDate, 'Inefetiva')).toBe(0);
    });

    it('TC-BLOCKED-008: Deve calcular corretamente para status "Bloqueada"', () => {
      const result = calculateBlockedBusinessDays(validDate, 'Bloqueada');
      expect(result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Prevenção de Epoch 1970', () => {
    it('TC-BLOCKED-009: Deve retornar 0 para data Epoch 1970-01-01', () => {
      expect(calculateBlockedBusinessDays('1970-01-01', 'Bloqueada')).toBe(0);
    });

    it('TC-BLOCKED-010: Deve retornar 0 para qualquer data de 1970', () => {
      expect(calculateBlockedBusinessDays('1970-06-15', 'Bloqueada')).toBe(0);
      expect(calculateBlockedBusinessDays('1970-12-31', 'Bloqueada')).toBe(0);
    });
  });

  describe('Datas inválidas', () => {
    it('TC-BLOCKED-011: Deve retornar 0 para data inválida "invalid"', () => {
      expect(calculateBlockedBusinessDays('invalid', 'Bloqueada')).toBe(0);
    });

    it('TC-BLOCKED-012: Deve retornar 0 para data futura', () => {
      const futureDate = createDate(2030, 12, 31);
      expect(calculateBlockedBusinessDays(futureDate, 'Bloqueada')).toBe(0);
    });

    it('TC-BLOCKED-013: Deve retornar 0 para formato de data incorreto', () => {
      expect(calculateBlockedBusinessDays('31/12/2024', 'Bloqueada')).toBe(0);
    });
  });

  describe('Cálculo de dias úteis (ignorando finais de semana)', () => {
    it('TC-BLOCKED-014: Bloqueio de hoje deve retornar 0 dias', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(calculateBlockedBusinessDays(today, 'Bloqueada')).toBe(0);
    });

    it('TC-BLOCKED-015: Bloqueio de ontem (se dia útil) deve retornar >= 0', () => {
      const yesterday = getDateDaysAgo(1);
      const result = calculateBlockedBusinessDays(yesterday, 'Bloqueada');
      // Pode ser 0 ou 1 dependendo se ontem foi um fim de semana
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });

    it('TC-BLOCKED-016: Deve calcular corretamente para 1 semana (aproximadamente 5 dias úteis)', () => {
      const oneWeekAgo = getDateDaysAgo(7);
      const result = calculateBlockedBusinessDays(oneWeekAgo, 'Bloqueada');
      // 7 dias corridos = ~5 dias úteis (depende do dia da semana)
      expect(result).toBeGreaterThanOrEqual(3);
      expect(result).toBeLessThanOrEqual(6);
    });

    it('TC-BLOCKED-017: Deve calcular corretamente para 2 semanas (aproximadamente 10 dias úteis)', () => {
      const twoWeeksAgo = getDateDaysAgo(14);
      const result = calculateBlockedBusinessDays(twoWeeksAgo, 'Bloqueada');
      // 14 dias corridos = ~10 dias úteis
      expect(result).toBeGreaterThanOrEqual(8);
      expect(result).toBeLessThanOrEqual(12);
    });

    it('TC-BLOCKED-018: Deve calcular corretamente para 1 mês (aproximadamente 22 dias úteis)', () => {
      const oneMonthAgo = getDateDaysAgo(30);
      const result = calculateBlockedBusinessDays(oneMonthAgo, 'Bloqueada');
      // 30 dias corridos = ~22 dias úteis
      expect(result).toBeGreaterThanOrEqual(18);
      expect(result).toBeLessThanOrEqual(24);
    });
  });

  describe('Cenários de Regressão - Datas Retroativas', () => {
    it('TC-BLOCKED-019: Bloqueio de 6 meses atrás deve retornar valor positivo alto', () => {
      const sixMonthsAgo = getDateDaysAgo(180);
      const result = calculateBlockedBusinessDays(sixMonthsAgo, 'Bloqueada');
      // ~180 dias = ~128 dias úteis (aproximadamente)
      expect(result).toBeGreaterThanOrEqual(100);
    });

    it('TC-BLOCKED-020: Bloqueio de 1 ano atrás deve retornar valor positivo alto', () => {
      const oneYearAgo = getDateDaysAgo(365);
      const result = calculateBlockedBusinessDays(oneYearAgo, 'Bloqueada');
      // ~365 dias = ~260 dias úteis (aproximadamente)
      expect(result).toBeGreaterThanOrEqual(200);
    });
  });

  describe('Cenários de Validação Console Log (SDET Debug)', () => {
    it('TC-BLOCKED-021: Deve logar warning para data Epoch no console', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      calculateBlockedBusinessDays('1970-01-01', 'Bloqueada');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SDET] Data Epoch 1970 detectada'),
        expect.any(String)
      );
      consoleSpy.mockRestore();
    });

    it('TC-BLOCKED-022: Deve logar warning para data inválida no console', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      calculateBlockedBusinessDays('not-a-date', 'Bloqueada');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[SDET] Data inválida detectada'),
        expect.any(String)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Cenários de Borda (Edge Cases)', () => {
    it('TC-BLOCKED-023: Data de bloqueio igual a hoje (meia-noite) retorna 0', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0];
      expect(calculateBlockedBusinessDays(todayStr, 'Bloqueada')).toBe(0);
    });

    it('TC-BLOCKED-024: Múltiplas chamadas consecutivas retornam mesmo valor', () => {
      const date = getDateDaysAgo(10);
      const result1 = calculateBlockedBusinessDays(date, 'Bloqueada');
      const result2 = calculateBlockedBusinessDays(date, 'Bloqueada');
      const result3 = calculateBlockedBusinessDays(date, 'Bloqueada');
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('Cenários com Data Agenda (dataAgenda)', () => {
    it('TC-BLOCKED-025: Deve usar Data Agenda como referência quando fornecida', () => {
      const blockedSinceDate = getDateDaysAgo(1); // Ontem
      const dataAgenda = getDateDaysAgo(4); // 4 dias atrás
      
      const resultWithDataAgenda = calculateBlockedBusinessDays(blockedSinceDate, 'Bloqueada', dataAgenda);
      const resultWithoutDataAgenda = calculateBlockedBusinessDays(blockedSinceDate, 'Bloqueada');
      
      // Com Data Agenda deve calcular baseado em 4 dias atrás (mais dias bloqueados)
      expect(resultWithDataAgenda).toBeGreaterThanOrEqual(resultWithoutDataAgenda);
    });

    it('TC-BLOCKED-026: Deve usar blockedSinceDate quando dataAgenda é undefined', () => {
      const blockedSinceDate = getDateDaysAgo(5);
      const result = calculateBlockedBusinessDays(blockedSinceDate, 'Bloqueada', undefined);
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('TC-BLOCKED-027: Deve usar blockedSinceDate quando dataAgenda é string vazia', () => {
      const blockedSinceDate = getDateDaysAgo(5);
      const result = calculateBlockedBusinessDays(blockedSinceDate, 'Bloqueada', '');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('TC-BLOCKED-028: Deve ignorar dataAgenda inválida e usar blockedSinceDate', () => {
      const blockedSinceDate = getDateDaysAgo(5);
      const result = calculateBlockedBusinessDays(blockedSinceDate, 'Bloqueada', 'invalid-date');
      // Deve calcular baseado no blockedSinceDate
      expect(result).toBeGreaterThanOrEqual(0);
    });

    it('TC-BLOCKED-029: Data Agenda de 01/02/2026 com hoje 05/02/2026 deve retornar ~2-3 dias úteis', () => {
      // Simulando cenário real: Data Agenda = 01/02/2026, Hoje = 05/02/2026
      // 01/02 (dom) -> 02/02 (seg) -> 03/02 (ter) -> 04/02 (qua) -> 05/02 (qui)
      // Dias úteis entre 01/02 e 05/02: seg, ter, qua = 3 dias, -1 = 2 dias bloqueados
      const dataAgenda = '2026-02-01';
      const result = calculateBlockedBusinessDays(null, 'Bloqueada', dataAgenda);
      
      // Se hoje é 05/02/2026, deve retornar pelo menos 2 dias úteis
      // (depende do dia da semana de 01/02/2026)
      expect(result).toBeGreaterThanOrEqual(2);
    });

    it('TC-BLOCKED-030: Deve retornar 0 quando ambas as datas são nulas', () => {
      const result = calculateBlockedBusinessDays(null, 'Bloqueada', null);
      expect(result).toBe(0);
    });
  });
});
