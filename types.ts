
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
  contactDate?: string; // Data Acionamento
  date: string; // Data Agenda
  status: string; // Status Agenda: Realizada, Inefetiva, Pendente, Bloqueada
  responsibleQA: string; // Resp. QA
  
  // Product / Front Details
  product: string; // Stakeholder / Produto (Frente)
  flowKnowledge?: 'OK' | 'NOK' | ''; // Conhecimento Fluxo
  dataMass?: 'OK' | 'NOK' | ''; // Massa de Dados
  gherkin?: 'OK' | 'NOK' | ''; // Gherkin
  environment?: 'OK' | 'NOK' | ''; // Ambiente
  outOfScope?: boolean; // Fora Escopo
  
  // Stakeholder Details
  responsible: string; // Stakeholder Name
  role: string; // Funcao do Stakeholder
  techLeadName?: string; // Tech Lead (for the Map)

  // Approval Details
  approvalRequestedEmail?: 'SIM' | 'Não' | ''; // Aprovação Solicitada por email
  approvedByClient?: 'SIM' | 'Não' | ''; // Aprovado Pelo Cliente
  
  // Blockage & Escalation
  daysBlocked?: number; // Dias Bloqueado
  priority?: string; // Prioridade
  escalationReason?: string; // Motivo do Bloqueio / Escalada
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
  dataMassInfo: boolean;
  gherkinReady: boolean;
  envAccess: boolean;
  approvalRequestedEmail: boolean;
  approvedByClient: boolean;
  completionPercentage: number;
  outOfScope?: boolean;
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
