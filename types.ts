
export enum TaskStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluído',
  BLOCKED = 'Bloqueado'
}

export interface QATask {
  id: string;
  owner: 'Rafa' | 'David' | 'Mauricio';
  description: string;
  status: TaskStatus;
  notes?: string;
}

export interface SpreadsheetRow {
  id: string;
  // Metadata & Tracking
  contactDate?: string; // Data Acionamento - inicia contagem de dias bloqueados
  date: string; // Data Agenda (atual)
  dateHistory?: string[]; // Histórico de datas anteriores (inefetivas - aparecem riscadas)
  status: string; // Status Agenda: Realizada, Inefetiva, Pendente, Bloqueada
  responsibleQA: string; // Resp. QA
  
  // Product / Front Details
  product: string; // Stakeholder / Produto (Frente)
  flowKnowledge?: 'OK' | 'NOK' | ''; // Conhecimento Fluxo
  gherkin?: 'OK' | 'NOK' | ''; // Gherkin
  outOfScope?: boolean; // Fora Escopo
  
  // Novos campos da planilha atualizada
  evidenciamentoAsIs?: string; // Evidenciamento As Is: Ambiente Liberado, Bloqueado - bug no Amb, Evidencias Disponibilizadas, Evidencias QA - OK, Impactado - Sem Insumos
  insumosParaTestes?: string; // Insumos para Testes: Responsável QA, Responsável Lider Tecnico, etc.
  acionamento?: string; // Acionamento: Responsável QA, GP - Necessário Envolver Áreas, etc.
  
  // Campos legados (mantidos para retrocompatibilidade)
  dataMass?: 'OK' | 'NOK' | ''; // @deprecated - usar insumosParaTestes
  environment?: 'OK' | 'NOK' | ''; // @deprecated - usar evidenciamentoAsIs
  
  // Stakeholder Details
  responsible: string; // Stakeholder Name
  role: string; // Funcao do Stakeholder
  techLeadName?: string; // Tech Lead (for the Map)

  // Approval Details
  approvalRequestedEmail?: 'SIM' | 'NÃO' | ''; // Aprovação Solicitada por email
  approvedByClient?: 'SIM' | 'NÃO' | ''; // Aprovado Pelo Cliente
  
  // Blockage & Escalation
  daysBlocked?: number; // Dias Bloqueado (calculado automaticamente a partir de contactDate)
  priority?: string; // Prioridade: Baixa, Media, Alta
  escalationReason?: string; // Motivo do Bloqueio / Escalada (opções fixas da aba Base)
  escalationResponsible?: string; // Responsável pelo Escalation
  escalationStatus?: string; // Status do Escalation
  escalationObs?: string; // OBS do Escalation
  notes: string; // Observacoes Gerais
}

export interface EffectivenessMetric {
  person: string;
  conductedAgendas: number;
  pendingAgendas: number;
  ineffectiveAgendas: number;
  incompleteAgendas: number;
  status: 'Critical' | 'Warning' | 'On Track';
}

export interface FrontCompleteness {
  frontName: string;
  flowKnowledge: boolean;
  gherkinReady: boolean;
  evidenciamentoAsIsOk: boolean; // Novo: substitui envAccess
  insumosParaTestesOk: boolean; // Novo: substitui dataMassInfo
  approvalRequestedEmail: boolean;
  approvedByClient: boolean;
  completionPercentage: number;
  outOfScope?: boolean;
  // Campos legados para retrocompatibilidade
  dataMassInfo?: boolean; // @deprecated
  envAccess?: boolean; // @deprecated
}

export interface EscalationItem {
  id: string;
  qa: string;
  product: string;
  stakeholder: string;
  reason: string;
  daysBlocked: number;
  priority: 'Alta' | 'Média';
  responsible?: string;
  status?: string;
  obs?: string;
}

export interface StakeholderRef {
  name: string;
  role: string;
}

export interface FrontStakeholderMapping {
  frontName: string;
  po: StakeholderRef;
  techLead: StakeholderRef;
  status: 'Ativo' | 'Mapeado' | 'Pendente';
}
