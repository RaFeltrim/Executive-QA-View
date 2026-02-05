/**
 * ===========================================
 * TIPOS DO MÓDULO QA-PIPELINE (ESTEIRA DE TESTES)
 * Studio QA - Cliente EBV - Projeto CNPJ Alfa Numérico
 * Versão: 2.0.0
 * ===========================================
 */

// =============================================
// TIPOS DE STATUS DA ESTEIRA
// =============================================

/**
 * Status possíveis de um item na esteira de testes
 */
export type TestPipelineStatus = 
  | 'Não Iniciado'       // Estado inicial
  | 'Aguardando Gherkin' // Gherkin pendente de criação/validação
  | 'Gherkin Validado'   // Gherkin aprovado, pronto para execução
  | 'Em Execução'        // Testes em andamento
  | 'Concluído'          // Testes finalizados com sucesso
  | 'Falhou';            // Testes falharam

/**
 * Estágios internos do pipeline (mais granular que TestPipelineStatus)
 */
export type PipelineStage = 
  | 'awaiting_gherkin'
  | 'gherkin_validating'
  | 'gherkin_validated'
  | 'awaiting_approval'
  | 'approved'
  | 'queued_for_execution'
  | 'executing'
  | 'passed'
  | 'failed'
  | 'evidence_pending'
  | 'completed';

// =============================================
// INTERFACES DE VALIDAÇÃO GHERKIN
// =============================================

/**
 * Erro detectado durante validação do Gherkin
 */
export interface GherkinValidationError {
  /** Número da linha onde o erro foi encontrado */
  line: number;
  /** Tipo de erro */
  type: 'syntax' | 'semantic' | 'best-practice';
  /** Severidade do erro */
  severity: 'error' | 'warning';
  /** Mensagem descritiva do erro */
  message: string;
  /** Sugestão de correção (opcional) */
  suggestion?: string;
}

/**
 * Métricas extraídas do Gherkin
 */
export interface GherkinMetrics {
  /** Número de cenários no arquivo */
  scenarioCount: number;
  /** Número total de steps (Given/When/Then/And/But) */
  stepCount: number;
  /** Se possui Background/Contexto */
  hasBackground: boolean;
  /** Se possui Examples (Scenario Outline) */
  hasExamples: boolean;
}

/**
 * Resultado completo da validação do Gherkin
 */
export interface GherkinValidationResult {
  /** Se o Gherkin é válido (sem erros críticos) */
  isValid: boolean;
  /** Lista de erros encontrados */
  errors: GherkinValidationError[];
  /** Lista de warnings (não impedem execução) */
  warnings: GherkinValidationError[];
  /** Métricas do arquivo Gherkin */
  metrics: GherkinMetrics;
  /** Timestamp da validação */
  validatedAt: string | null;
  /** Quem/o que executou a validação */
  validatedBy?: 'manual' | 'automated';
}

// =============================================
// INTERFACES DE EXECUÇÃO
// =============================================

/**
 * Entrada no histórico de stages
 */
export interface StageHistoryEntry {
  /** Stage alcançado */
  stage: PipelineStage;
  /** Quando o stage foi alcançado */
  timestamp: string;
  /** Detalhes adicionais (opcional) */
  details?: string;
}

/**
 * Status de execução de um item na esteira
 */
export interface ExecutionStatus {
  /** ID do registro na planilha */
  rowId: string;
  /** Stage atual */
  currentStage: PipelineStage;
  /** Histórico de stages */
  stageHistory: StageHistoryEntry[];
  /** Última atualização */
  lastUpdated: string;
  /** Duração total da execução em ms (opcional) */
  executionDuration?: number;
  /** Número de tentativas de re-execução */
  retryCount: number;
  /** Máximo de tentativas permitidas */
  maxRetries: number;
}

/**
 * Resultado de uma transição de stage
 */
export interface StatusTransitionResult {
  /** Se a transição é permitida */
  allowed: boolean;
  /** Novo stage (se permitido) */
  newStage?: PipelineStage;
  /** Razão (sucesso ou falha) */
  reason?: string;
}

// =============================================
// INTERFACES DE LOGGING E CONFIRMAÇÃO
// =============================================

/**
 * Ações que podem ser logadas no pipeline
 */
export type PipelineAction = 
  | 'gherkin_created'
  | 'gherkin_validated'
  | 'gherkin_rejected'
  | 'test_queued'
  | 'test_started'
  | 'test_passed'
  | 'test_failed'
  | 'evidence_uploaded'
  | 'evidence_approved'
  | 'pipeline_completed'
  | 'pipeline_reset';

/**
 * Entrada individual no log de confirmação
 */
export interface PipelineConfirmationEntry {
  /** Timestamp do evento */
  timestamp: string;
  /** Ação realizada */
  action: PipelineAction;
  /** Detalhes da ação */
  details: string;
  /** Quem executou a ação */
  executedBy: string;
}

/**
 * Resumo de uma confirmação de uso da esteira
 */
export interface PipelineConfirmationSummary {
  /** Se o Gherkin foi validado */
  gherkinValidated: boolean;
  /** Se os testes foram executados */
  testsExecuted: boolean;
  /** Se os testes passaram */
  testsPassed: boolean;
  /** Se evidências foram fornecidas */
  evidenceProvided: boolean;
  /** Duração total do ciclo em ms */
  totalDuration: number;
}

/**
 * Detalhes de uma confirmação de uso da esteira
 */
export interface PipelineConfirmationDetails {
  /** Detalhes da validação do Gherkin */
  gherkinValidation?: {
    scenarioCount: number;
    stepCount: number;
    validatedAt: string;
  };
  /** Detalhes da execução dos testes */
  testExecution?: {
    startedAt: string;
    completedAt: string;
    passedScenarios: number;
    failedScenarios: number;
  };
  /** Detalhes das evidências */
  evidence?: {
    url: string;
    uploadedAt: string;
    type: 'screenshot' | 'video' | 'report';
  };
}

/**
 * Confirmação completa de uso da esteira
 */
export interface PipelineConfirmation {
  /** ID único da confirmação */
  id: string;
  /** ID do registro na planilha */
  rowId: string;
  /** Timestamp da geração */
  timestamp: string;
  /** Tipo de confirmação */
  type: 'usage' | 'completion' | 'failure' | 'skip';
  /** Resumo do uso */
  summary: PipelineConfirmationSummary;
  /** Detalhes do uso */
  details: PipelineConfirmationDetails;
  /** Mensagem formatada */
  message: string;
  /** Quem gerou a confirmação */
  generatedBy: 'system' | 'manual';
}

// =============================================
// INTERFACES DE EVIDÊNCIA
// =============================================

/**
 * Tipos de evidência suportados
 */
export type EvidenceType = 'screenshot' | 'video' | 'report' | 'log' | 'other';

/**
 * Metadados de uma evidência
 */
export interface EvidenceMetadata {
  /** ID único */
  id: string;
  /** ID do registro relacionado */
  rowId: string;
  /** Tipo de evidência */
  type: EvidenceType;
  /** URL da evidência */
  url: string;
  /** Nome do arquivo original */
  fileName: string;
  /** Tamanho em bytes */
  fileSize: number;
  /** MIME type */
  mimeType: string;
  /** Quando foi uploaded */
  uploadedAt: string;
  /** Quem fez upload */
  uploadedBy: string;
  /** Descrição (opcional) */
  description?: string;
}

// =============================================
// CONSTANTES
// =============================================

/**
 * Matriz de transições permitidas entre stages
 */
export const ALLOWED_STAGE_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
  'awaiting_gherkin': ['gherkin_validating'],
  'gherkin_validating': ['gherkin_validated', 'awaiting_gherkin'],
  'gherkin_validated': ['awaiting_approval', 'queued_for_execution'],
  'awaiting_approval': ['approved', 'awaiting_gherkin'],
  'approved': ['queued_for_execution'],
  'queued_for_execution': ['executing'],
  'executing': ['passed', 'failed'],
  'passed': ['evidence_pending', 'completed'],
  'failed': ['queued_for_execution', 'awaiting_gherkin'],
  'evidence_pending': ['completed'],
  'completed': []
};

/**
 * Mapeamento de PipelineStage para TestPipelineStatus (para persistência)
 */
export const STAGE_TO_STATUS_MAP: Record<PipelineStage, TestPipelineStatus> = {
  'awaiting_gherkin': 'Aguardando Gherkin',
  'gherkin_validating': 'Aguardando Gherkin',
  'gherkin_validated': 'Gherkin Validado',
  'awaiting_approval': 'Gherkin Validado',
  'approved': 'Gherkin Validado',
  'queued_for_execution': 'Em Execução',
  'executing': 'Em Execução',
  'passed': 'Concluído',
  'failed': 'Falhou',
  'evidence_pending': 'Concluído',
  'completed': 'Concluído'
};

/**
 * Keywords do Gherkin (PT-BR e EN)
 */
export const GHERKIN_KEYWORDS = {
  feature: ['Feature', 'Funcionalidade', 'Característica'],
  background: ['Background', 'Contexto', 'Cenário de Fundo'],
  scenario: ['Scenario', 'Cenário', 'Exemplo'],
  scenarioOutline: ['Scenario Outline', 'Esquema do Cenário', 'Esquema de Cenário'],
  given: ['Given', 'Dado', 'Dada', 'Dados', 'Dadas'],
  when: ['When', 'Quando'],
  then: ['Then', 'Então', 'Entao'],
  and: ['And', 'E'],
  but: ['But', 'Mas'],
  examples: ['Examples', 'Exemplos', 'Cenários']
} as const;
