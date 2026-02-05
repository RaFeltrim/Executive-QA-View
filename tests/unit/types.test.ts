import { describe, it, expect, vi } from 'vitest';
import {
  SpreadsheetRow,
  EffectivenessMetric,
  FrontCompleteness,
  EscalationItem,
  FrontStakeholderMapping,
  StakeholderRef,
  TaskStatus
} from '../../types';

describe('Types - SpreadsheetRow', () => {
  it('should have all required fields', () => {
    const validRow: SpreadsheetRow = {
      id: 'test-1',
      date: '2025-07-15',
      status: 'Pendente',
      responsibleQA: 'Rafa',
      product: 'Cadastro PJ',
      responsible: 'João Silva',
      role: 'PO',
      notes: 'Teste'
    };

    expect(validRow.id).toBe('test-1');
    expect(validRow.product).toBe('Cadastro PJ');
    expect(validRow.status).toBe('Pendente');
  });

  it('should accept all status values', () => {
    const statuses = ['Pendente', 'Realizada', 'Inefetiva', 'Bloqueada'];
    
    statuses.forEach(status => {
      const row: SpreadsheetRow = {
        id: 'test',
        date: '2025-07-15',
        status,
        responsibleQA: 'QA',
        product: 'Test',
        responsible: 'Test',
        role: 'PO',
        notes: ''
      };
      expect(row.status).toBe(status);
    });
  });

  it('should accept optional fields', () => {
    const row: SpreadsheetRow = {
      id: 'test-2',
      date: '2025-07-15',
      status: 'Pendente',
      responsibleQA: 'Rafa',
      product: 'Cadastro PJ',
      responsible: 'João Silva',
      role: 'PO',
      notes: 'Teste',
      // Optional fields
      contactDate: '2025-07-10',
      flowKnowledge: 'OK',
      dataMass: 'NOK',
      gherkin: 'OK',
      environment: '',
      outOfScope: false,
      techLeadName: 'Maria Tech',
      approvalRequestedEmail: 'SIM',
      approvedByClient: 'NÃO',
      daysBlocked: 5,
      priority: 'Alta',
      escalationReason: 'Aguardando ambiente',
      escalationResponsible: 'Gerente',
      escalationStatus: 'Aberto',
      escalationObs: 'Em análise'
    };

    expect(row.flowKnowledge).toBe('OK');
    expect(row.dataMass).toBe('NOK');
    expect(row.daysBlocked).toBe(5);
    expect(row.escalationStatus).toBe('Aberto');
  });

  it('should handle empty optional string fields', () => {
    const row: SpreadsheetRow = {
      id: 'test-3',
      date: '',
      status: 'Pendente',
      responsibleQA: '',
      product: '',
      responsible: '',
      role: '',
      notes: '',
      flowKnowledge: '',
      dataMass: '',
      gherkin: ''
    };

    expect(row.flowKnowledge).toBe('');
    expect(row.date).toBe('');
  });
});

describe('Types - EffectivenessMetric', () => {
  it('should have correct structure', () => {
    const metric: EffectivenessMetric = {
      person: 'João Silva',
      conductedAgendas: 5,
      pendingAgendas: 2,
      ineffectiveAgendas: 1,
      incompleteAgendas: 0,
      status: 'On Track'
    };

    expect(metric.person).toBe('João Silva');
    expect(metric.conductedAgendas).toBe(5);
    expect(metric.status).toBe('On Track');
  });

  it('should accept all status types', () => {
    const statuses: Array<'Critical' | 'Warning' | 'On Track'> = ['Critical', 'Warning', 'On Track'];
    
    statuses.forEach(status => {
      const metric: EffectivenessMetric = {
        person: 'Test',
        conductedAgendas: 0,
        pendingAgendas: 0,
        ineffectiveAgendas: 0,
        incompleteAgendas: 0,
        status
      };
      expect(metric.status).toBe(status);
    });
  });
});

describe('Types - FrontCompleteness', () => {
  it('should calculate completion percentage', () => {
    const front: FrontCompleteness = {
      frontName: 'Cadastro PJ',
      flowKnowledge: true,
      gherkinReady: false,
      evidenciamentoAxisOk: true,
      insumosParaTestesOk: true,
      approvalRequestedEmail: true,
      approvedByClient: false,
      completionPercentage: 66, // 4/6 * 100
      outOfScope: false,
      // Campos legados
      dataMassInfo: true,
      envAccess: true
    };

    expect(front.frontName).toBe('Cadastro PJ');
    expect(front.completionPercentage).toBe(66);
  });

  it('should handle out of scope fronts', () => {
    const front: FrontCompleteness = {
      frontName: 'Legacy System',
      flowKnowledge: false,
      gherkinReady: false,
      evidenciamentoAxisOk: false,
      insumosParaTestesOk: false,
      approvalRequestedEmail: false,
      approvedByClient: false,
      completionPercentage: 0,
      outOfScope: true,
      // Campos legados
      dataMassInfo: false,
      envAccess: false
    };

    expect(front.outOfScope).toBe(true);
    expect(front.completionPercentage).toBe(0);
  });

  it('should reach 100% completion', () => {
    const front: FrontCompleteness = {
      frontName: 'Complete Front',
      flowKnowledge: true,
      gherkinReady: true,
      evidenciamentoAxisOk: true,
      insumosParaTestesOk: true,
      approvalRequestedEmail: true,
      approvedByClient: true,
      completionPercentage: 100,
      // Campos legados
      dataMassInfo: true,
      envAccess: true
    };

    expect(front.completionPercentage).toBe(100);
  });
});

describe('Types - EscalationItem', () => {
  it('should have correct structure', () => {
    const escalation: EscalationItem = {
      id: 'esc-1',
      qa: 'Rafa',
      product: 'Cadastro PJ',
      stakeholder: 'João Silva',
      reason: 'Ambiente não disponível',
      daysBlocked: 10,
      priority: 'Alta'
    };

    expect(escalation.daysBlocked).toBe(10);
    expect(escalation.priority).toBe('Alta');
  });

  it('should accept optional fields', () => {
    const escalation: EscalationItem = {
      id: 'esc-2',
      qa: 'David',
      product: 'Consulta CNPJ',
      stakeholder: 'Maria Santos',
      reason: 'Dados de teste indisponíveis',
      daysBlocked: 5,
      priority: 'Média',
      responsible: 'Tech Lead',
      status: 'Em andamento',
      obs: 'Aguardando deploy'
    };

    expect(escalation.responsible).toBe('Tech Lead');
    expect(escalation.status).toBe('Em andamento');
    expect(escalation.obs).toBe('Aguardando deploy');
  });
});

describe('Types - FrontStakeholderMapping', () => {
  it('should map front to stakeholders', () => {
    const po: StakeholderRef = { name: 'João Silva', role: 'PO' };
    const techLead: StakeholderRef = { name: 'Maria Santos', role: 'TL' };

    const mapping: FrontStakeholderMapping = {
      frontName: 'Cadastro PJ',
      po,
      techLead,
      status: 'Ativo'
    };

    expect(mapping.frontName).toBe('Cadastro PJ');
    expect(mapping.po.name).toBe('João Silva');
    expect(mapping.techLead.name).toBe('Maria Santos');
    expect(mapping.status).toBe('Ativo');
  });

  it('should accept all status values', () => {
    const statuses: Array<'Ativo' | 'Mapeado' | 'Pendente'> = ['Ativo', 'Mapeado', 'Pendente'];
    
    statuses.forEach(status => {
      const mapping: FrontStakeholderMapping = {
        frontName: 'Test',
        po: { name: 'Test', role: 'PO' },
        techLead: { name: 'Test', role: 'TL' },
        status
      };
      expect(mapping.status).toBe(status);
    });
  });
});

describe('Types - TaskStatus Enum', () => {
  it('should have correct values', () => {
    expect(TaskStatus.PENDING).toBe('Pendente');
    expect(TaskStatus.IN_PROGRESS).toBe('Em Andamento');
    expect(TaskStatus.COMPLETED).toBe('Concluído');
    expect(TaskStatus.BLOCKED).toBe('Bloqueado');
  });
});
