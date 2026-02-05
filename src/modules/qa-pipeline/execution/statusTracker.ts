/**
 * ===========================================
 * RASTREADOR DE STATUS DA ESTEIRA
 * Studio QA - Módulo QA-Pipeline
 * ===========================================
 * 
 * Gerencia o status de execução dos itens na esteira de testes,
 * controlando transições de stage e mantendo histórico.
 */

import {
  PipelineStage,
  ExecutionStatus,
  StatusTransitionResult,
  StageHistoryEntry,
  ALLOWED_STAGE_TRANSITIONS
} from '../types/pipeline.types';

// Função auxiliar para gerar UUID (será movida para shared/utils)
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Verifica se uma transição de stage é permitida
 * 
 * @param current - Stage atual
 * @param target - Stage de destino
 * @returns Resultado da verificação
 * 
 * @example
 * ```typescript
 * const result = canTransition('awaiting_gherkin', 'gherkin_validating');
 * if (result.allowed) {
 *   // Pode avançar
 * }
 * ```
 */
export const canTransition = (
  current: PipelineStage, 
  target: PipelineStage
): StatusTransitionResult => {
  const allowedTransitions = ALLOWED_STAGE_TRANSITIONS[current];
  const allowed = allowedTransitions?.includes(target) ?? false;
  
  return {
    allowed,
    newStage: allowed ? target : undefined,
    reason: allowed 
      ? `✅ Transição ${current} → ${target} permitida`
      : `❌ Transição ${current} → ${target} não permitida. Transições válidas: ${allowedTransitions?.join(', ') || 'nenhuma'}`
  };
};

/**
 * Cria um novo status de execução para um item
 * 
 * @param rowId - ID do registro na planilha
 * @param initialStage - Stage inicial (default: 'awaiting_gherkin')
 * @returns Novo ExecutionStatus
 */
export const createExecutionStatus = (
  rowId: string,
  initialStage: PipelineStage = 'awaiting_gherkin'
): ExecutionStatus => {
  const now = new Date().toISOString();
  
  return {
    rowId,
    currentStage: initialStage,
    stageHistory: [{
      stage: initialStage,
      timestamp: now,
      details: 'Status inicial criado'
    }],
    lastUpdated: now,
    retryCount: 0,
    maxRetries: 3
  };
};

/**
 * Atualiza o status de execução para um novo stage
 * 
 * @param currentStatus - Status atual
 * @param newStage - Novo stage
 * @param details - Detalhes da transição (opcional)
 * @returns Status atualizado ou status atual se transição inválida
 */
export const updateExecutionStatus = (
  currentStatus: ExecutionStatus,
  newStage: PipelineStage,
  details?: string
): ExecutionStatus => {
  const transition = canTransition(currentStatus.currentStage, newStage);
  
  if (!transition.allowed) {
    console.warn(`[StatusTracker] Transição inválida: ${transition.reason}`);
    return currentStatus;
  }
  
  const now = new Date().toISOString();
  
  // Incrementar retry se voltando de failed para fila
  const isRetry = newStage === 'queued_for_execution' && currentStatus.currentStage === 'failed';
  
  const newHistoryEntry: StageHistoryEntry = {
    stage: newStage,
    timestamp: now,
    details: details || `Transição para ${newStage}`
  };
  
  return {
    ...currentStatus,
    currentStage: newStage,
    stageHistory: [...currentStatus.stageHistory, newHistoryEntry],
    lastUpdated: now,
    retryCount: isRetry ? currentStatus.retryCount + 1 : currentStatus.retryCount
  };
};

/**
 * Reseta o status de execução para o início
 * 
 * @param currentStatus - Status atual
 * @param reason - Motivo do reset
 * @returns Status resetado
 */
export const resetExecutionStatus = (
  currentStatus: ExecutionStatus,
  reason: string
): ExecutionStatus => {
  const now = new Date().toISOString();
  
  return {
    ...currentStatus,
    currentStage: 'awaiting_gherkin',
    stageHistory: [
      ...currentStatus.stageHistory,
      {
        stage: 'awaiting_gherkin',
        timestamp: now,
        details: `Reset: ${reason}`
      }
    ],
    lastUpdated: now,
    retryCount: 0
  };
};

/**
 * Verifica se o item pode ser re-executado
 * 
 * @param status - Status atual
 * @returns Se pode fazer retry
 */
export const canRetry = (status: ExecutionStatus): boolean => {
  return status.currentStage === 'failed' && status.retryCount < status.maxRetries;
};

/**
 * Calcula a duração total desde o início até agora
 * 
 * @param status - Status atual
 * @returns Duração em milissegundos
 */
export const calculateDuration = (status: ExecutionStatus): number => {
  if (status.stageHistory.length < 1) return 0;
  
  const first = new Date(status.stageHistory[0].timestamp).getTime();
  const last = new Date(status.lastUpdated).getTime();
  
  return last - first;
};

/**
 * Obtém o tempo gasto em cada stage
 * 
 * @param status - Status atual
 * @returns Mapa de stage → duração em ms
 */
export const getStageDurations = (status: ExecutionStatus): Map<PipelineStage, number> => {
  const durations = new Map<PipelineStage, number>();
  const history = status.stageHistory;
  
  for (let i = 0; i < history.length; i++) {
    const current = history[i];
    const next = history[i + 1];
    
    const start = new Date(current.timestamp).getTime();
    const end = next 
      ? new Date(next.timestamp).getTime() 
      : new Date(status.lastUpdated).getTime();
    
    const existing = durations.get(current.stage) || 0;
    durations.set(current.stage, existing + (end - start));
  }
  
  return durations;
};

/**
 * Verifica se o pipeline está em estado final
 * 
 * @param status - Status atual
 * @returns Se está em estado final
 */
export const isCompleted = (status: ExecutionStatus): boolean => {
  return status.currentStage === 'completed';
};

/**
 * Verifica se o pipeline falhou sem possibilidade de retry
 * 
 * @param status - Status atual
 * @returns Se falhou definitivamente
 */
export const isFailed = (status: ExecutionStatus): boolean => {
  return status.currentStage === 'failed' && status.retryCount >= status.maxRetries;
};

/**
 * Verifica se o pipeline está em execução ativa
 * 
 * @param status - Status atual
 * @returns Se está em execução
 */
export const isRunning = (status: ExecutionStatus): boolean => {
  const runningStages: PipelineStage[] = [
    'gherkin_validating',
    'queued_for_execution',
    'executing'
  ];
  return runningStages.includes(status.currentStage);
};

/**
 * Obtém um resumo legível do status
 * 
 * @param status - Status atual
 * @returns Resumo formatado
 */
export const getStatusSummary = (status: ExecutionStatus): string => {
  const duration = calculateDuration(status);
  const durationStr = duration > 0 
    ? ` (${(duration / 1000).toFixed(1)}s)` 
    : '';
  
  const stageLabels: Record<PipelineStage, string> = {
    'awaiting_gherkin': '⏳ Aguardando Gherkin',
    'gherkin_validating': '🔍 Validando Gherkin',
    'gherkin_validated': '✅ Gherkin Validado',
    'awaiting_approval': '⏳ Aguardando Aprovação',
    'approved': '✅ Aprovado',
    'queued_for_execution': '📋 Na Fila',
    'executing': '🚀 Executando',
    'passed': '✅ Passou',
    'failed': '❌ Falhou',
    'evidence_pending': '📷 Evidência Pendente',
    'completed': '🎉 Concluído'
  };
  
  let summary = stageLabels[status.currentStage] || status.currentStage;
  summary += durationStr;
  
  if (status.retryCount > 0) {
    summary += ` [Tentativa ${status.retryCount}/${status.maxRetries}]`;
  }
  
  return summary;
};
