/**
 * ===========================================
 * VALIDADOR DE GHERKIN
 * Studio QA - Módulo QA-Pipeline
 * ===========================================
 * 
 * Valida sintaxe, semântica e boas práticas de arquivos Gherkin.
 * Suporta keywords em Português (PT-BR) e Inglês (EN).
 */

import {
  GherkinValidationResult,
  GherkinValidationError,
  GherkinMetrics,
  GHERKIN_KEYWORDS
} from '../types/pipeline.types';

/**
 * Valida a sintaxe e estrutura de um texto Gherkin
 * 
 * @param gherkinText - Texto Gherkin a ser validado
 * @returns Resultado completo da validação
 * 
 * @example
 * ```typescript
 * const result = validateGherkin(`
 *   Funcionalidade: Login
 *   Cenário: Login válido
 *     Dado que estou na página de login
 *     Quando preencho minhas credenciais
 *     Então devo ver o dashboard
 * `);
 * 
 * if (result.isValid) {
 *   console.log('Gherkin válido!');
 * }
 * ```
 */
export const validateGherkin = (gherkinText: string): GherkinValidationResult => {
  const errors: GherkinValidationError[] = [];
  const warnings: GherkinValidationError[] = [];
  
  // Validação de entrada vazia
  if (!gherkinText || gherkinText.trim() === '') {
    return createEmptyResult('Gherkin vazio ou não fornecido');
  }
  
  const lines = gherkinText.split('\n');
  const state = createValidationState();
  
  // Processar cada linha
  lines.forEach((line, index) => {
    processLine(line, index + 1, state, errors, warnings);
  });
  
  // Validações finais
  performFinalValidations(state, lines.length, errors, warnings);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      scenarioCount: state.scenarioCount,
      stepCount: state.stepCount,
      hasBackground: state.hasBackground,
      hasExamples: state.hasExamples
    },
    validatedAt: new Date().toISOString(),
    validatedBy: 'automated'
  };
};

// =============================================
// TIPOS E HELPERS INTERNOS
// =============================================

interface ValidationState {
  hasFeature: boolean;
  hasScenario: boolean;
  inScenario: boolean;
  hasGivenInScenario: boolean;
  hasWhenInScenario: boolean;
  hasThenInScenario: boolean;
  scenarioCount: number;
  stepCount: number;
  hasBackground: boolean;
  hasExamples: boolean;
  lastScenarioLine: number;
}

const createValidationState = (): ValidationState => ({
  hasFeature: false,
  hasScenario: false,
  inScenario: false,
  hasGivenInScenario: false,
  hasWhenInScenario: false,
  hasThenInScenario: false,
  scenarioCount: 0,
  stepCount: 0,
  hasBackground: false,
  hasExamples: false,
  lastScenarioLine: 0
});

const createEmptyResult = (message: string): GherkinValidationResult => ({
  isValid: false,
  errors: [{
    line: 0,
    type: 'syntax',
    severity: 'error',
    message
  }],
  warnings: [],
  metrics: { scenarioCount: 0, stepCount: 0, hasBackground: false, hasExamples: false },
  validatedAt: new Date().toISOString(),
  validatedBy: 'automated'
});

/**
 * Verifica se uma linha começa com uma keyword
 */
const startsWithKeyword = (line: string, keywords: readonly string[]): boolean => {
  const trimmed = line.trim();
  return keywords.some(kw => 
    trimmed.startsWith(kw + ':') || trimmed.startsWith(kw + ' ')
  );
};

/**
 * Processa uma única linha do Gherkin
 */
const processLine = (
  line: string,
  lineNumber: number,
  state: ValidationState,
  errors: GherkinValidationError[],
  warnings: GherkinValidationError[]
): void => {
  const trimmedLine = line.trim();
  
  // Skip linhas vazias e comentários
  if (!trimmedLine || trimmedLine.startsWith('#')) return;
  
  // Check Feature
  if (startsWithKeyword(trimmedLine, GHERKIN_KEYWORDS.feature)) {
    if (state.hasFeature) {
      errors.push({
        line: lineNumber,
        type: 'syntax',
        severity: 'error',
        message: 'Múltiplas Features detectadas. Apenas uma Feature por arquivo.',
        suggestion: 'Remova Features duplicadas ou separe em arquivos diferentes.'
      });
    }
    state.hasFeature = true;
    return;
  }
  
  // Check Background
  if (startsWithKeyword(trimmedLine, GHERKIN_KEYWORDS.background)) {
    state.hasBackground = true;
    state.inScenario = false;
    return;
  }
  
  // Check Scenario/Scenario Outline
  if (startsWithKeyword(trimmedLine, GHERKIN_KEYWORDS.scenario) ||
      startsWithKeyword(trimmedLine, GHERKIN_KEYWORDS.scenarioOutline)) {
    
    // Validar cenário anterior
    validatePreviousScenario(state, lineNumber - 1, errors, warnings);
    
    // Iniciar novo cenário
    state.inScenario = true;
    state.hasGivenInScenario = false;
    state.hasWhenInScenario = false;
    state.hasThenInScenario = false;
    state.hasScenario = true;
    state.scenarioCount++;
    state.lastScenarioLine = lineNumber;
    return;
  }
  
  // Check Given
  if (startsWithKeyword(trimmedLine, GHERKIN_KEYWORDS.given)) {
    state.hasGivenInScenario = true;
    state.stepCount++;
    return;
  }
  
  // Check When
  if (startsWithKeyword(trimmedLine, GHERKIN_KEYWORDS.when)) {
    state.hasWhenInScenario = true;
    state.stepCount++;
    
    if (!state.hasGivenInScenario && state.inScenario) {
      warnings.push({
        line: lineNumber,
        type: 'best-practice',
        severity: 'warning',
        message: '"When" antes de "Given" - considere adicionar contexto inicial.',
        suggestion: 'Adicione um step "Dado que..." antes do "Quando".'
      });
    }
    return;
  }
  
  // Check Then
  if (startsWithKeyword(trimmedLine, GHERKIN_KEYWORDS.then)) {
    state.hasThenInScenario = true;
    state.stepCount++;
    return;
  }
  
  // Check And/But
  if (startsWithKeyword(trimmedLine, GHERKIN_KEYWORDS.and) ||
      startsWithKeyword(trimmedLine, GHERKIN_KEYWORDS.but)) {
    state.stepCount++;
    return;
  }
  
  // Check Examples
  if (startsWithKeyword(trimmedLine, GHERKIN_KEYWORDS.examples)) {
    state.hasExamples = true;
    return;
  }
};

/**
 * Valida o cenário anterior quando um novo é iniciado
 */
const validatePreviousScenario = (
  state: ValidationState,
  lineNumber: number,
  errors: GherkinValidationError[],
  warnings: GherkinValidationError[]
): void => {
  if (!state.inScenario) return;
  
  if (!state.hasGivenInScenario) {
    warnings.push({
      line: state.lastScenarioLine,
      type: 'best-practice',
      severity: 'warning',
      message: 'Cenário não possui step "Given/Dado" - contexto ausente.',
      suggestion: 'Adicione um step "Dado que..." para estabelecer o contexto inicial.'
    });
  }
  
  if (!state.hasThenInScenario) {
    errors.push({
      line: state.lastScenarioLine,
      type: 'semantic',
      severity: 'error',
      message: 'Cenário não possui step "Then/Então" - validação obrigatória.',
      suggestion: 'Todo cenário deve ter pelo menos um step "Então..." para validar o resultado.'
    });
  }
};

/**
 * Executa validações finais após processar todas as linhas
 */
const performFinalValidations = (
  state: ValidationState,
  totalLines: number,
  errors: GherkinValidationError[],
  warnings: GherkinValidationError[]
): void => {
  // Validar Feature
  if (!state.hasFeature) {
    errors.push({
      line: 1,
      type: 'syntax',
      severity: 'error',
      message: 'Feature/Funcionalidade não declarada.',
      suggestion: 'Adicione "Funcionalidade: [Nome da Feature]" no início do arquivo.'
    });
  }
  
  // Validar pelo menos um Scenario
  if (!state.hasScenario) {
    errors.push({
      line: 1,
      type: 'syntax',
      severity: 'error',
      message: 'Nenhum Cenário declarado.',
      suggestion: 'Adicione ao menos um "Cenário: [Nome do Cenário]".'
    });
  }
  
  // Validar último cenário
  if (state.inScenario) {
    if (!state.hasThenInScenario) {
      errors.push({
        line: state.lastScenarioLine,
        type: 'semantic',
        severity: 'error',
        message: 'Último cenário não possui step "Then/Então".',
        suggestion: 'Adicione um step de validação ao final do cenário.'
      });
    }
    
    if (!state.hasGivenInScenario) {
      warnings.push({
        line: state.lastScenarioLine,
        type: 'best-practice',
        severity: 'warning',
        message: 'Último cenário não possui step "Given/Dado".'
      });
    }
  }
  
  // Warning para muitos cenários em um arquivo
  if (state.scenarioCount > 10) {
    warnings.push({
      line: 1,
      type: 'best-practice',
      severity: 'warning',
      message: `Arquivo possui ${state.scenarioCount} cenários. Considere dividir em múltiplos arquivos.`,
      suggestion: 'Recomendado: máximo de 10 cenários por arquivo para melhor manutenibilidade.'
    });
  }
};

/**
 * Extrai apenas os cenários de um texto Gherkin
 */
export const extractScenarios = (gherkinText: string): string[] => {
  const scenarios: string[] = [];
  const lines = gherkinText.split('\n');
  let currentScenario: string[] = [];
  let inScenario = false;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (startsWithKeyword(trimmed, GHERKIN_KEYWORDS.scenario) ||
        startsWithKeyword(trimmed, GHERKIN_KEYWORDS.scenarioOutline)) {
      if (inScenario && currentScenario.length > 0) {
        scenarios.push(currentScenario.join('\n'));
      }
      currentScenario = [line];
      inScenario = true;
    } else if (inScenario) {
      // Parar se encontrar outro bloco principal
      if (startsWithKeyword(trimmed, GHERKIN_KEYWORDS.feature) ||
          startsWithKeyword(trimmed, GHERKIN_KEYWORDS.background)) {
        scenarios.push(currentScenario.join('\n'));
        currentScenario = [];
        inScenario = false;
      } else {
        currentScenario.push(line);
      }
    }
  });
  
  // Adicionar último cenário
  if (inScenario && currentScenario.length > 0) {
    scenarios.push(currentScenario.join('\n'));
  }
  
  return scenarios;
};

/**
 * Conta steps em um texto Gherkin
 */
export const countSteps = (gherkinText: string): number => {
  const lines = gherkinText.split('\n');
  let count = 0;
  
  const stepKeywords = [
    ...GHERKIN_KEYWORDS.given,
    ...GHERKIN_KEYWORDS.when,
    ...GHERKIN_KEYWORDS.then,
    ...GHERKIN_KEYWORDS.and,
    ...GHERKIN_KEYWORDS.but
  ];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (stepKeywords.some(kw => trimmed.startsWith(kw + ' '))) {
      count++;
    }
  });
  
  return count;
};
