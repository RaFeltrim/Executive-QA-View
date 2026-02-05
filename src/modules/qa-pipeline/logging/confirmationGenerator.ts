/**
 * ===========================================
 * GERADOR DE CONFIRMAÇÃO DE USO DA ESTEIRA
 * Studio QA - Módulo QA-Pipeline
 * ===========================================
 * 
 * Gera logs de confirmação de uso da esteira de testes,
 * permitindo rastreabilidade e compliance.
 */

import {
  PipelineConfirmation,
  PipelineConfirmationSummary,
  PipelineConfirmationDetails,
  ExecutionStatus,
  GherkinValidationResult,
  PipelineAction,
  PipelineConfirmationEntry
} from '../types/pipeline.types';
import { calculateDuration, isCompleted, isFailed } from '../execution/statusTracker';

// Função auxiliar para gerar UUID
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Gera uma confirmação de uso da esteira
 * 
 * @param rowId - ID do registro
 * @param executionStatus - Status de execução
 * @param gherkinResult - Resultado da validação do Gherkin (opcional)
 * @param evidenceUrl - URL da evidência (opcional)
 * @returns Confirmação completa
 */
export const generateConfirmation = (
  rowId: string,
  executionStatus: ExecutionStatus,
  gherkinResult?: GherkinValidationResult,
  evidenceUrl?: string
): PipelineConfirmation => {
  const now = new Date().toISOString();
  const type = determineConfirmationType(executionStatus);
  
  const summary: PipelineConfirmationSummary = {
    gherkinValidated: executionStatus.currentStage !== 'awaiting_gherkin',
    testsExecuted: ['passed', 'failed', 'completed', 'evidence_pending'].includes(executionStatus.currentStage),
    testsPassed: ['passed', 'completed', 'evidence_pending'].includes(executionStatus.currentStage),
    evidenceProvided: !!evidenceUrl,
    totalDuration: calculateDuration(executionStatus)
  };
  
  const details: PipelineConfirmationDetails = {};
  
  // Adicionar detalhes do Gherkin
  if (gherkinResult && gherkinResult.validatedAt) {
    details.gherkinValidation = {
      scenarioCount: gherkinResult.metrics.scenarioCount,
      stepCount: gherkinResult.metrics.stepCount,
      validatedAt: gherkinResult.validatedAt
    };
  }
  
  // Adicionar detalhes de execução
  const executionStages = executionStatus.stageHistory.filter(
    h => ['executing', 'passed', 'failed'].includes(h.stage)
  );
  
  if (executionStages.length > 0) {
    const started = executionStages.find(s => s.stage === 'executing');
    const completed = executionStages.find(s => s.stage === 'passed' || s.stage === 'failed');
    
    if (started && completed) {
      details.testExecution = {
        startedAt: started.timestamp,
        completedAt: completed.timestamp,
        passedScenarios: completed.stage === 'passed' 
          ? (gherkinResult?.metrics.scenarioCount || 1) 
          : 0,
        failedScenarios: completed.stage === 'failed' 
          ? (gherkinResult?.metrics.scenarioCount || 1) 
          : 0
      };
    }
  }
  
  // Adicionar detalhes de evidência
  if (evidenceUrl) {
    details.evidence = {
      url: evidenceUrl,
      uploadedAt: now,
      type: detectEvidenceType(evidenceUrl)
    };
  }
  
  return {
    id: generateUUID(),
    rowId,
    timestamp: now,
    type,
    summary,
    details,
    message: generateMessage(type, executionStatus, summary),
    generatedBy: 'system'
  };
};

/**
 * Determina o tipo de confirmação baseado no status
 */
const determineConfirmationType = (
  status: ExecutionStatus
): PipelineConfirmation['type'] => {
  if (isCompleted(status)) return 'completion';
  if (isFailed(status)) return 'failure';
  if (status.currentStage === 'awaiting_gherkin') return 'skip';
  return 'usage';
};

/**
 * Detecta o tipo de evidência pela URL
 */
const detectEvidenceType = (url: string): 'screenshot' | 'video' | 'report' => {
  const lower = url.toLowerCase();
  if (lower.match(/\.(mp4|webm|avi|mov)$/)) return 'video';
  if (lower.match(/\.(html|pdf|json)$/)) return 'report';
  return 'screenshot';
};

/**
 * Gera a mensagem formatada da confirmação
 */
const generateMessage = (
  type: PipelineConfirmation['type'],
  status: ExecutionStatus,
  summary: PipelineConfirmationSummary
): string => {
  const durationSec = (summary.totalDuration / 1000).toFixed(1);
  
  const messages: Record<PipelineConfirmation['type'], string> = {
    usage: `✅ Esteira de Testes utilizada. Stage: ${status.currentStage}. Duração: ${durationSec}s`,
    completion: `🎉 Ciclo de testes concluído com sucesso! Gherkin: ${summary.gherkinValidated ? 'OK' : 'Pendente'}, Testes: ${summary.testsPassed ? 'PASSOU' : 'N/A'}, Evidência: ${summary.evidenceProvided ? 'OK' : 'Pendente'}. Duração total: ${durationSec}s`,
    failure: `❌ Falha após ${status.retryCount} tentativa(s). Stage final: ${status.currentStage}. Requer análise manual.`,
    skip: `⏭️ Item não processado pela esteira (aguardando Gherkin).`
  };
  
  return messages[type];
};

/**
 * Formata a confirmação para exibição em log
 * 
 * @param confirmation - Confirmação a formatar
 * @returns String formatada
 */
export const formatConfirmationLog = (confirmation: PipelineConfirmation): string => {
  const divider = '═'.repeat(55);
  const thinDivider = '─'.repeat(55);
  
  const lines = [
    divider,
    '📋 CONFIRMAÇÃO DE USO DA ESTEIRA DE TESTES',
    divider,
    `ID:        ${confirmation.id}`,
    `Item:      ${confirmation.rowId}`,
    `Data/Hora: ${formatDateTime(confirmation.timestamp)}`,
    `Tipo:      ${confirmation.type.toUpperCase()}`,
    '',
    thinDivider,
    '📊 RESUMO',
    thinDivider,
    `  • Gherkin Validado:    ${formatBoolean(confirmation.summary.gherkinValidated)}`,
    `  • Testes Executados:   ${formatBoolean(confirmation.summary.testsExecuted)}`,
    `  • Testes Passaram:     ${formatBoolean(confirmation.summary.testsPassed)}`,
    `  • Evidência Fornecida: ${formatBoolean(confirmation.summary.evidenceProvided)}`,
    `  • Duração Total:       ${(confirmation.summary.totalDuration / 1000).toFixed(2)}s`,
  ];
  
  // Adicionar detalhes do Gherkin se disponível
  if (confirmation.details.gherkinValidation) {
    lines.push(
      '',
      thinDivider,
      '📝 GHERKIN',
      thinDivider,
      `  • Cenários:   ${confirmation.details.gherkinValidation.scenarioCount}`,
      `  • Steps:      ${confirmation.details.gherkinValidation.stepCount}`,
      `  • Validado:   ${formatDateTime(confirmation.details.gherkinValidation.validatedAt)}`
    );
  }
  
  // Adicionar detalhes de execução se disponível
  if (confirmation.details.testExecution) {
    lines.push(
      '',
      thinDivider,
      '🧪 EXECUÇÃO',
      thinDivider,
      `  • Início:    ${formatDateTime(confirmation.details.testExecution.startedAt)}`,
      `  • Término:   ${formatDateTime(confirmation.details.testExecution.completedAt)}`,
      `  • Passou:    ${confirmation.details.testExecution.passedScenarios} cenário(s)`,
      `  • Falhou:    ${confirmation.details.testExecution.failedScenarios} cenário(s)`
    );
  }
  
  // Adicionar detalhes de evidência se disponível
  if (confirmation.details.evidence) {
    lines.push(
      '',
      thinDivider,
      '📷 EVIDÊNCIA',
      thinDivider,
      `  • Tipo:      ${confirmation.details.evidence.type}`,
      `  • Upload:    ${formatDateTime(confirmation.details.evidence.uploadedAt)}`,
      `  • URL:       ${confirmation.details.evidence.url}`
    );
  }
  
  lines.push(
    '',
    divider,
    `💬 ${confirmation.message}`,
    divider
  );
  
  return lines.join('\n');
};

/**
 * Cria uma entrada de log individual
 * 
 * @param action - Ação realizada
 * @param details - Detalhes da ação
 * @param executedBy - Quem executou
 * @returns Entrada de log
 */
export const createLogEntry = (
  action: PipelineAction,
  details: string,
  executedBy: string = 'system'
): PipelineConfirmationEntry => ({
  timestamp: new Date().toISOString(),
  action,
  details,
  executedBy
});

/**
 * Formata data/hora para exibição
 */
const formatDateTime = (isoString: string): string => {
  try {
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return isoString;
  }
};

/**
 * Formata booleano para exibição
 */
const formatBoolean = (value: boolean): string => {
  return value ? '✅ Sim' : '❌ Não';
};

/**
 * Gera relatório consolidado de múltiplas confirmações
 * 
 * @param confirmations - Array de confirmações
 * @returns Relatório formatado
 */
export const generateConsolidatedReport = (
  confirmations: PipelineConfirmation[]
): string => {
  const total = confirmations.length;
  const completed = confirmations.filter(c => c.type === 'completion').length;
  const failed = confirmations.filter(c => c.type === 'failure').length;
  const skipped = confirmations.filter(c => c.type === 'skip').length;
  const inProgress = confirmations.filter(c => c.type === 'usage').length;
  
  const avgDuration = confirmations.reduce(
    (sum, c) => sum + c.summary.totalDuration, 0
  ) / Math.max(total, 1);
  
  const divider = '═'.repeat(55);
  
  return [
    divider,
    '📊 RELATÓRIO CONSOLIDADO DA ESTEIRA DE TESTES',
    divider,
    '',
    `Total de Itens:       ${total}`,
    `  ✅ Concluídos:      ${completed} (${((completed/total)*100).toFixed(1)}%)`,
    `  ❌ Falharam:        ${failed} (${((failed/total)*100).toFixed(1)}%)`,
    `  ⏭️ Pulados:         ${skipped} (${((skipped/total)*100).toFixed(1)}%)`,
    `  🔄 Em Andamento:    ${inProgress} (${((inProgress/total)*100).toFixed(1)}%)`,
    '',
    `Duração Média:        ${(avgDuration/1000).toFixed(2)}s`,
    `Taxa de Sucesso:      ${((completed/(total-skipped))*100).toFixed(1)}%`,
    '',
    divider
  ].join('\n');
};
