
import { SpreadsheetRow } from './types';

// =============================================
// OPÇÕES DA ABA "BASE" DA PLANILHA
// =============================================

// Coluna A/B - OK/NOK (Gherkin, Fluxo)
export const OK_NOK_OPTIONS = ['', 'OK', 'NOK'] as const;

// Coluna C - Status Agenda
export const STATUS_AGENDA_OPTIONS = ['Pendente', 'Realizada', 'Inefetiva', 'Bloqueada'] as const;

// Coluna D - Prioridade
export const PRIORITY_OPTIONS = ['Baixa', 'Media', 'Alta'] as const;

// Coluna E - Status Escalation  
export const ESCALATION_STATUS_OPTIONS = ['', 'Aberto', 'Resolvido', 'Em Andamento', 'Aguardando Cliente'] as const;

// Coluna G - Evidenciamento Axis (NOVO)
export const EVIDENCIAMENTO_AXIS_OPTIONS = [
  '',
  'Ambiente Liberado',
  'Bloqueado - bug no Amb',
  'Evidencias Disponibilizadas',
  'Evidencias QA - OK',
  'Impactado - Sem Insumos'
] as const;

// Coluna I - Acionamento (NOVO)
export const ACIONAMENTO_OPTIONS = [
  '',
  'Responsável QA',
  'Responsável Lider Tecnico',
  'GP - Necessário Envolver Áreas',
  'Impactado - Sem Insumos',
  'Área Envolvida - Comprometida'
] as const;

// Coluna K - Motivo Bloqueio (Escalada) - opções sugeridas
export const MOTIVO_BLOQUEIO_OPTIONS = [
  '',
  'Agenda Indisponível',
  'Sem retorno',
  'Não Compareceu nas agendas',
  'Agenda Inefetiva'
] as const;

// Coluna B - SIM/NÃO (Aprovações)
export const SIM_NAO_OPTIONS = ['', 'SIM', 'NÃO'] as const;

export const INITIAL_SPREADSHEET_DATA: SpreadsheetRow[] = [
  // Frentes Principais (Plenitude das Frentes)
  { id: 'f-1', product: 'Orquestrador BAU', flowKnowledge: 'OK', gherkin: 'OK', evidenciamentoAxis: 'Ambiente Liberado', insumosParaTestes: 'Responsável QA', acionamento: 'Responsável QA', outOfScope: false, responsibleQA: 'Mauricio', responsible: 'Danyla Andrade', role: 'PO', techLeadName: 'TL BAU', status: 'Pendente', date: '2026-02-10', contactDate: '2026-02-01', notes: 'Aguardando massa', approvalRequestedEmail: '', approvedByClient: '' },
  { id: 'f-2', product: 'Grupo Econômico', flowKnowledge: 'OK', gherkin: 'OK', evidenciamentoAxis: 'Evidencias QA - OK', insumosParaTestes: 'Responsável QA', acionamento: 'Responsável QA', outOfScope: false, responsibleQA: 'Mauricio', responsible: 'Débora Souza', role: 'PO', techLeadName: 'TL Grupo', status: 'Realizada', date: '2026-02-05', contactDate: '2026-01-28', notes: 'Checklist completo', approvalRequestedEmail: 'SIM', approvedByClient: 'SIM' },
  { id: 'f-3', product: 'Portal Transacional', flowKnowledge: 'OK', gherkin: 'OK', evidenciamentoAxis: 'Evidencias QA - OK', insumosParaTestes: 'Responsável QA', acionamento: 'Responsável QA', outOfScope: false, responsibleQA: 'Rafa', responsible: 'Geovani Marassi', role: 'PO', techLeadName: 'TL Portal', status: 'Realizada', date: '2026-02-03', contactDate: '2026-01-25', notes: 'Validado', approvalRequestedEmail: 'SIM', approvedByClient: 'SIM' },
  { id: 'f-4', product: 'Bluebox', flowKnowledge: 'OK', gherkin: 'OK', evidenciamentoAxis: 'Impactado - Sem Insumos', insumosParaTestes: 'Impactado - Sem Insumos', acionamento: 'Impactado - Sem Insumos', outOfScope: false, responsibleQA: 'David', responsible: 'Stakeholder Blue', role: 'PO', techLeadName: 'TL Blue', status: 'Pendente', date: '2026-02-12', contactDate: '2026-02-02', notes: 'Massa pendente', approvalRequestedEmail: '', approvedByClient: '' },
  { id: 'f-5', product: 'Portal Gestor', outOfScope: true, responsibleQA: 'QA Team', responsible: 'N/A', role: '', techLeadName: '', status: 'Realizada', date: '', contactDate: '', notes: 'Confirmado fora de escopo', approvalRequestedEmail: '', approvedByClient: '' },
  { id: 'f-6', product: 'Acerta Negativo', outOfScope: true, responsibleQA: 'QA Team', responsible: 'N/A', role: '', techLeadName: '', status: 'Realizada', date: '', contactDate: '', notes: 'Confirmado fora de escopo', approvalRequestedEmail: '', approvedByClient: '' },

  // Escalations (Baseado na imagem)
  { id: 'e-1', product: 'Feature Store', responsible: 'FABIO PERICO', role: 'PO', techLeadName: '', escalationReason: 'Não participou da reunião de massa de dados. Bloqueado por falta de alinhamento.', responsibleQA: 'Time QA', daysBlocked: 7, priority: 'Alta', status: 'Bloqueada', date: '2026-02-15', contactDate: '2026-02-08', notes: '', approvalRequestedEmail: '', approvedByClient: '', escalationResponsible: 'Gerente X', escalationStatus: 'Aberto', escalationObs: 'Aguardando retorno', acionamento: 'GP - Necessário Envolver Áreas' },
  { id: 'e-2', product: 'Roadmap de Dados', responsible: 'LEONARDO BALDUINO / AGATHA', role: 'PO', techLeadName: '', escalationReason: 'Reality Check: O time de Dados exige um Roadmap de Produto.', responsibleQA: 'Time QA', daysBlocked: 5, priority: 'Alta', status: 'Bloqueada', date: '2026-02-16', contactDate: '2026-02-10', notes: '', approvalRequestedEmail: '', approvedByClient: '', escalationResponsible: 'Gerente Y', escalationStatus: 'Em Andamento', escalationObs: 'Reunião agendada', acionamento: 'Área Envolvida - Comprometida' },
  { id: 'e-3', product: 'Retorno Tarefas', responsible: 'DANYLA ANDRADE', role: 'PO', techLeadName: '', escalationReason: 'Aguardando retorno sobre tarefas de Danyla.', responsibleQA: 'Rafa', daysBlocked: 4, priority: 'Media', status: 'Pendente', date: '2026-02-17', contactDate: '2026-02-12', notes: '', approvalRequestedEmail: '', approvedByClient: '', acionamento: 'Responsável Lider Tecnico' },
  { id: 'e-4', product: 'AS400 Migration', responsible: 'ANDERSON DE OLIVEIRA (AS400)', role: 'TL', techLeadName: 'Anderson', escalationReason: 'Falta na reunião do dia 19/jan.', responsibleQA: 'David', daysBlocked: 3, priority: 'Media', status: 'Inefetiva', date: '2026-01-19', contactDate: '2026-01-15', notes: '', approvalRequestedEmail: '', approvedByClient: '', acionamento: 'Responsável Lider Tecnico' },

  // Agendas para bater os números da imagem:
  // Leonardo Balduino (4 Realizada, 3 Pendente, 2 Inefetiva)
  ...Array(4).fill(null).map((_, i) => ({ id: `leo-r-${i}`, product: 'Sync Leonardo', responsible: 'Leonardo Balduino', role: '', techLeadName: '', status: 'Realizada', date: '2026-02-01', contactDate: '', responsibleQA: 'Mauricio', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),
  ...Array(3).fill(null).map((_, i) => ({ id: `leo-p-${i}`, product: 'Sync Leonardo', responsible: 'Leonardo Balduino', role: '', techLeadName: '', status: 'Pendente', date: '2026-02-20', contactDate: '', responsibleQA: 'Mauricio', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),
  ...Array(2).fill(null).map((_, i) => ({ id: `leo-i-${i}`, product: 'Sync Leonardo', responsible: 'Leonardo Balduino', role: '', techLeadName: '', status: 'Inefetiva', date: '2026-02-10', contactDate: '', responsibleQA: 'Mauricio', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),
  
  // Agatha Gonçalves (3 Realizada, 2 Pendente, 1 Inefetiva)
  ...Array(3).fill(null).map((_, i) => ({ id: `aga-r-${i}`, product: 'Sync Agatha', responsible: 'Agatha Gonçalves', role: '', techLeadName: '', status: 'Realizada', date: '2026-02-02', contactDate: '', responsibleQA: 'David', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),
  ...Array(2).fill(null).map((_, i) => ({ id: `aga-p-${i}`, product: 'Sync Agatha', responsible: 'Agatha Gonçalves', role: '', techLeadName: '', status: 'Pendente', date: '2026-02-18', contactDate: '', responsibleQA: 'David', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),
  ...Array(1).fill(null).map((_, i) => ({ id: `aga-i-${i}`, product: 'Sync Agatha', responsible: 'Agatha Gonçalves', role: '', techLeadName: '', status: 'Inefetiva', date: '2026-02-08', contactDate: '', responsibleQA: 'David', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),

  // Fabio Perico (2 Realizada, 2 Pendente, 2 Inefetiva)
  ...Array(2).fill(null).map((_, i) => ({ id: `fab-r-${i}`, product: 'Sync Fabio', responsible: 'Fabio Perico', role: '', techLeadName: '', status: 'Realizada', date: '2026-02-03', contactDate: '', responsibleQA: 'Rafa', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),
  ...Array(2).fill(null).map((_, i) => ({ id: `fab-p-${i}`, product: 'Sync Fabio', responsible: 'Fabio Perico', role: '', techLeadName: '', status: 'Pendente', date: '2026-02-19', contactDate: '', responsibleQA: 'Rafa', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),
  ...Array(2).fill(null).map((_, i) => ({ id: `fab-i-${i}`, product: 'Sync Fabio', responsible: 'Fabio Perico', role: '', techLeadName: '', status: 'Inefetiva', date: '2026-02-09', contactDate: '', responsibleQA: 'Rafa', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),

  // Danyla Andrade (5 Realizada, 1 Pendente, 0 Inefetiva)
  ...Array(5).fill(null).map((_, i) => ({ id: `dan-r-${i}`, product: 'Sync Danyla', responsible: 'Danyla Andrade', role: '', techLeadName: '', status: 'Realizada', date: '2026-02-04', contactDate: '', responsibleQA: 'Rafa', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),
  ...Array(1).fill(null).map((_, i) => ({ id: `dan-p-${i}`, product: 'Sync Danyla', responsible: 'Danyla Andrade', role: '', techLeadName: '', status: 'Pendente', date: '2026-02-21', contactDate: '', responsibleQA: 'Rafa', notes: '', approvalRequestedEmail: '', approvedByClient: '' })),
] as SpreadsheetRow[];
