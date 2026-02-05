/**
 * ===========================================
 * QA-PIPELINE MODULE - PUBLIC EXPORTS
 * Studio QA - Cliente EBV - Projeto CNPJ Alfa Numérico
 * ===========================================
 * 
 * Ponto de entrada do módulo de Esteira de Testes.
 * Exporta todas as funções e tipos públicos.
 */

// =============================================
// TYPES
// =============================================
export type {
  TestPipelineStatus,
  PipelineStage,
  GherkinValidationResult,
  GherkinValidationError,
  GherkinMetrics,
  ExecutionStatus,
  StageHistoryEntry,
  StatusTransitionResult,
  PipelineConfirmation,
  PipelineConfirmationSummary,
  PipelineConfirmationDetails,
  PipelineConfirmationEntry,
  PipelineAction,
  EvidenceType,
  EvidenceMetadata
} from './types/pipeline.types';

export {
  ALLOWED_STAGE_TRANSITIONS,
  STAGE_TO_STATUS_MAP,
  GHERKIN_KEYWORDS
} from './types/pipeline.types';

// =============================================
// GHERKIN VALIDATION
// =============================================
export {
  validateGherkin,
  extractScenarios,
  countSteps
} from './gherkin/gherkinValidator';

// =============================================
// EXECUTION STATUS TRACKING
// =============================================
export {
  canTransition,
  createExecutionStatus,
  updateExecutionStatus,
  resetExecutionStatus,
  canRetry,
  calculateDuration,
  getStageDurations,
  isCompleted,
  isFailed,
  isRunning,
  getStatusSummary
} from './execution/statusTracker';

// =============================================
// CONFIRMATION & LOGGING
// =============================================
export {
  generateConfirmation,
  formatConfirmationLog,
  createLogEntry,
  generateConsolidatedReport
} from './logging/confirmationGenerator';

// =============================================
// CONVENIENCE FUNCTIONS
// =============================================

/**
 * Inicia o pipeline para um item (função de conveniência)
 */
export const initializePipeline = (rowId: string) => {
  const { createExecutionStatus } = require('./execution/statusTracker');
  return createExecutionStatus(rowId);
};

/**
 * Valida e avança o pipeline após validação do Gherkin
 */
export const processGherkinValidation = async (
  rowId: string,
  gherkinText: string,
  currentStatus?: import('./types/pipeline.types').ExecutionStatus
) => {
  const { validateGherkin } = require('./gherkin/gherkinValidator');
  const { createExecutionStatus, updateExecutionStatus } = require('./execution/statusTracker');
  
  const status = currentStatus || createExecutionStatus(rowId);
  const validationResult = validateGherkin(gherkinText);
  
  if (validationResult.isValid) {
    return {
      status: updateExecutionStatus(status, 'gherkin_validated', 'Gherkin válido'),
      validation: validationResult
    };
  }
  
  return {
    status: updateExecutionStatus(status, 'awaiting_gherkin', 'Gherkin inválido - correção necessária'),
    validation: validationResult
  };
};
