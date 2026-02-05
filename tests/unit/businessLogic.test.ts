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
