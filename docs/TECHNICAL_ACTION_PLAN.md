# 📋 Plano de Ação Técnico - Executive-QA-View
## Análise de Gap, Reestruturação Modular e Esteira de Testes

**Autor:** SDET Senior Specialist  
**Data:** 05/02/2026  
**Versão:** 2.0.0  
**Projeto:** Studio QA - Cliente EBV - CNPJ Alfa Numérico

---

## Sumário Executivo

Este documento apresenta um plano técnico detalhado para evoluir o projeto Executive-QA-View, cobrindo:
1. Análise de Gap entre schema atual e campos da planilha
2. Proposta de reestruturação modular para escalabilidade
3. Implementação da lógica de `date_history` e novos campos
4. Especificação do Módulo de Esteira de Testes (QA-Pipeline)

---

# 🔍 ETAPA 1: Análise de Gap e Correções

## 1.1 Mapeamento: Schema SQL vs Planilha "Dash"

### Campos Existentes e Alinhados ✅

| Campo Planilha (Dash) | Coluna BD | Tipo TS | Status |
|----------------------|-----------|---------|--------|
| Produto (Frente) | `product` | `string` | ✅ OK |
| Gherkin | `gherkin` | `OK\|NOK\|''` | ✅ OK |
| Conhecimento Fluxo | `flow_knowledge` | `OK\|NOK\|''` | ✅ OK |
| Fora Escopo | `out_of_scope` | `boolean` | ✅ OK |
| Resp. QA | `responsible_qa` | `string` | ✅ OK |
| Data Acionamento | `contact_date` | `string (ISO)` | ✅ OK |
| Data Agenda | `date` | `string (ISO)` | ✅ OK |
| Histórico de Datas | `date_history` | `JSON string[]` | ✅ OK |
| Status Agenda | `status` | `enum` | ✅ OK |
| Stakeholder | `responsible` | `string` | ✅ OK |
| Função | `role` | `string` | ✅ OK |
| Tech Lead | `tech_lead_name` | `string` | ✅ OK |
| Aprovação Email | `approval_requested_email` | `SIM\|NÃO\|''` | ✅ OK |
| Aprovado Cliente | `approved_by_client` | `SIM\|NÃO\|''` | ✅ OK |
| Dias Bloqueados | `days_blocked` | `integer` | ✅ OK |
| Prioridade | `priority` | `string` | ✅ OK |
| Evidenciamento Axis | `evidenciamento_axis` | `string` | ✅ OK |
| Insumos p/ Testes | `insumos_para_testes` | `string` | ✅ OK |
| Acionamento | `acionamento` | `string` | ✅ OK |

### Campos Faltantes ou com Gap 🔴

| Campo Planilha | Status | Ação Requerida |
|---------------|--------|----------------|
| **Status Esteira** | ❌ Não existe | Criar coluna `test_pipeline_status` |
| **Validação Gherkin** | ❌ Não existe | Criar coluna `gherkin_validation_result` |
| **Data Última Execução** | ❌ Não existe | Criar coluna `last_test_execution` |
| **Link Evidências** | ❌ Não existe | Criar coluna `evidence_url` |
| **Confirmação Uso Esteira** | ❌ Não existe | Criar coluna `pipeline_confirmation_log` |

## 1.2 Correlação: Status Agenda ↔ Escalation

### Regra de Negócio Identificada

```
SE status_agenda = 'Bloqueada' OU status_agenda = 'Inefetiva'
   → Campos de Escalation DEVEM ser habilitados
   → days_blocked deve ser > 0 ou calculado automaticamente
   
SE status_agenda muda para 'Inefetiva'
   → Data atual (date) deve ser movida para date_history[]
   → Nova data deve ser solicitada ao usuário
   
SE status_agenda = 'Realizada'
   → Campos de Escalation DEVEM ser desabilitados
   → date_history pode ser mantido para histórico
```

### Gap Identificado: Fluxo de Escalation Incompleto

**Problema:** O campo `escalation_reason` aceita texto livre, mas a aba "Base" define opções fixas:
- Agenda Indisponível
- Sem retorno
- Não Compareceu nas agendas
- Agenda Inefetiva

**Solução:** Criar constraint ou validação no frontend + enum no TypeScript.

## 1.3 Script SQL de Correções

```sql
-- ===========================================
-- MIGRATION v2.0.0: Adicionar colunas faltantes
-- ===========================================

-- Campos para Módulo Esteira de Testes
ALTER TABLE qa_spreadsheet_data 
ADD COLUMN IF NOT EXISTS test_pipeline_status TEXT 
  DEFAULT 'Não Iniciado'
  CHECK (test_pipeline_status IN ('Não Iniciado', 'Aguardando Gherkin', 'Gherkin Validado', 'Em Execução', 'Concluído', 'Falhou'));

ALTER TABLE qa_spreadsheet_data 
ADD COLUMN IF NOT EXISTS gherkin_validation_result JSONB 
  DEFAULT '{"isValid": false, "errors": [], "validatedAt": null}';

ALTER TABLE qa_spreadsheet_data 
ADD COLUMN IF NOT EXISTS last_test_execution TIMESTAMPTZ;

ALTER TABLE qa_spreadsheet_data 
ADD COLUMN IF NOT EXISTS evidence_url TEXT;

ALTER TABLE qa_spreadsheet_data 
ADD COLUMN IF NOT EXISTS pipeline_confirmation_log JSONB 
  DEFAULT '[]';

-- Constraint para escalation_reason (opções fixas da aba Base)
-- NOTA: Aplicar apenas se deseja forçar valores da aba Base
-- Caso contrário, validar apenas no frontend
ALTER TABLE qa_spreadsheet_data 
DROP CONSTRAINT IF EXISTS chk_escalation_reason;

ALTER TABLE qa_spreadsheet_data 
ADD CONSTRAINT chk_escalation_reason 
CHECK (
  escalation_reason IS NULL 
  OR escalation_reason = '' 
  OR escalation_reason IN (
    'Agenda Indisponível',
    'Sem retorno',
    'Não Compareceu nas agendas',
    'Agenda Inefetiva'
  )
);

-- Índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_qa_pipeline_status ON qa_spreadsheet_data(test_pipeline_status);
CREATE INDEX IF NOT EXISTS idx_qa_last_execution ON qa_spreadsheet_data(last_test_execution);

-- Comentários para documentação
COMMENT ON COLUMN qa_spreadsheet_data.test_pipeline_status IS 'Status atual na esteira de testes automatizados';
COMMENT ON COLUMN qa_spreadsheet_data.gherkin_validation_result IS 'Resultado da validação do Gherkin (JSON)';
COMMENT ON COLUMN qa_spreadsheet_data.pipeline_confirmation_log IS 'Log de confirmações de uso da esteira (JSON array)';
COMMENT ON COLUMN qa_spreadsheet_data.evidence_url IS 'URL para as evidências de teste (screenshots, videos)';
```

## 1.4 Atualizações no TypeScript (types.ts)

```typescript
// Novos tipos para Esteira de Testes
export type TestPipelineStatus = 
  | 'Não Iniciado' 
  | 'Aguardando Gherkin' 
  | 'Gherkin Validado' 
  | 'Em Execução' 
  | 'Concluído' 
  | 'Falhou';

export interface GherkinValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validatedAt: string | null;
  validatedBy: 'manual' | 'automated';
}

export interface PipelineConfirmationEntry {
  timestamp: string;
  action: 'gherkin_validated' | 'test_started' | 'test_passed' | 'test_failed' | 'evidence_uploaded';
  details: string;
  executedBy: string;
}

// Atualização da interface SpreadsheetRow
export interface SpreadsheetRow {
  // ... campos existentes ...
  
  // NOVOS - Módulo Esteira de Testes
  testPipelineStatus?: TestPipelineStatus;
  gherkinValidationResult?: GherkinValidationResult;
  lastTestExecution?: string;
  evidenceUrl?: string;
  pipelineConfirmationLog?: PipelineConfirmationEntry[];
}

// Enum para motivos de bloqueio (aba Base)
export const ESCALATION_REASONS = [
  'Agenda Indisponível',
  'Sem retorno',
  'Não Compareceu nas agendas',
  'Agenda Inefetiva'
] as const;

export type EscalationReason = typeof ESCALATION_REASONS[number];
```

---

# 🏗️ ETAPA 2: Reestruturação Modular

## 2.1 Arquitetura Proposta

```
studio-qa-executive-view/
├── src/
│   ├── modules/
│   │   ├── data-engine/           # Module: Data-Engine
│   │   │   ├── README.md
│   │   │   ├── index.ts
│   │   │   ├── parsers/
│   │   │   │   ├── excelParser.ts
│   │   │   │   ├── csvParser.ts
│   │   │   │   └── aiScanner.ts
│   │   │   ├── sync/
│   │   │   │   ├── supabaseSync.ts
│   │   │   │   ├── localStorageSync.ts
│   │   │   │   └── conflictResolver.ts
│   │   │   ├── mappers/
│   │   │   │   ├── dbToApp.ts
│   │   │   │   └── appToDb.ts
│   │   │   └── validators/
│   │   │       ├── dataValidator.ts
│   │   │       └── sanitizer.ts
│   │   │
│   │   ├── executive-dash/        # Module: Executive-Dash
│   │   │   ├── README.md
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── MiniPill.tsx
│   │   │   │   ├── EscalationTable.tsx
│   │   │   │   └── EffectivenessGrid.tsx
│   │   │   ├── calculators/
│   │   │   │   ├── frontsCompleteness.ts
│   │   │   │   ├── effectivenessMetrics.ts
│   │   │   │   ├── escalationsFilter.ts
│   │   │   │   └── riskLevel.ts
│   │   │   └── exporters/
│   │   │       └── imageExporter.ts
│   │   │
│   │   ├── config-base/           # Module: Config-Base
│   │   │   ├── README.md
│   │   │   ├── index.ts
│   │   │   ├── dropdowns/
│   │   │   │   ├── statusOptions.ts
│   │   │   │   ├── priorityOptions.ts
│   │   │   │   ├── evidenciamentoOptions.ts
│   │   │   │   ├── insumosOptions.ts
│   │   │   │   ├── acionamentoOptions.ts
│   │   │   │   └── escalationOptions.ts
│   │   │   ├── rules/
│   │   │   │   ├── escalationRules.ts
│   │   │   │   ├── dateHistoryRules.ts
│   │   │   │   └── completenessRules.ts
│   │   │   └── validators/
│   │   │       └── businessRuleValidator.ts
│   │   │
│   │   └── qa-pipeline/           # Module: QA-Pipeline (Esteira)
│   │       ├── README.md
│   │       ├── index.ts
│   │       ├── gherkin/
│   │       │   ├── gherkinValidator.ts
│   │       │   ├── gherkinParser.ts
│   │       │   └── gherkinTemplates.ts
│   │       ├── execution/
│   │       │   ├── testRunner.ts
│   │       │   ├── statusTracker.ts
│   │       │   └── resultCollector.ts
│   │       ├── evidence/
│   │       │   ├── evidenceManager.ts
│   │       │   └── screenshotCapture.ts
│   │       └── logging/
│   │           ├── pipelineLogger.ts
│   │           └── confirmationGenerator.ts
│   │
│   ├── views/                     # Views (já existentes, refatoradas)
│   │   ├── SpreadsheetView.tsx
│   │   ├── ExecutivePanelView.tsx
│   │   ├── MapaStakeholdersView.tsx
│   │   └── LogbookView.tsx
│   │
│   ├── shared/                    # Compartilhado entre módulos
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── spreadsheet.types.ts
│   │   │   ├── pipeline.types.ts
│   │   │   └── config.types.ts
│   │   ├── hooks/
│   │   │   ├── useSpreadsheetData.ts
│   │   │   ├── useSyncStatus.ts
│   │   │   └── usePipelineStatus.ts
│   │   └── utils/
│   │       ├── dateUtils.ts
│   │       ├── uuidGenerator.ts
│   │       └── sanitizer.ts
│   │
│   ├── App.tsx                    # Orquestrador principal
│   └── main.tsx                   # Entry point
│
├── tests/
│   ├── unit/
│   │   ├── data-engine/
│   │   ├── executive-dash/
│   │   ├── config-base/
│   │   └── qa-pipeline/
│   ├── integration/
│   │   └── modules/
│   └── e2e/
│       └── flows/
│
├── docs/
│   ├── DOCUMENTATION.md
│   ├── FEATURE_MAP.md
│   ├── TECHNICAL_ACTION_PLAN.md   # Este documento
│   └── modules/
│       ├── DATA_ENGINE.md
│       ├── EXECUTIVE_DASH.md
│       ├── CONFIG_BASE.md
│       └── QA_PIPELINE.md
│
└── [config files]
```

## 2.2 README Técnico de Cada Módulo

### 📦 Module: Data-Engine

```markdown
# 📦 Data-Engine Module

## Responsabilidade
Motor de dados responsável pelo parse de planilhas, sincronização com banco de dados e resolução de conflitos.

## Componentes

### Parsers
- `excelParser.ts`: Importação de arquivos .xlsx/.xls/.csv
- `csvParser.ts`: Parser dedicado para CSV
- `aiScanner.ts`: Integração com Google Gemini para OCR de dashboards

### Sync
- `supabaseSync.ts`: CRUD operations + Realtime subscriptions
- `localStorageSync.ts`: Backup local e modo offline
- `conflictResolver.ts`: Resolução de conflitos de sincronização

### Mappers
- `dbToApp.ts`: Conversão snake_case → camelCase
- `appToDb.ts`: Conversão camelCase → snake_case

### Validators
- `dataValidator.ts`: Validação de tipos e constraints
- `sanitizer.ts`: XSS/SQL Injection protection

## Interfaces Públicas

\`\`\`typescript
// data-engine/index.ts
export { parseExcel, parseCSV, scanWithAI } from './parsers';
export { syncToSupabase, syncFromSupabase, syncToLocal } from './sync';
export { mapFromDB, mapToDB } from './mappers';
export { validateRow, sanitizeInput } from './validators';
\`\`\`

## Dependências
- xlsx: Excel parsing
- @google/genai: AI OCR
- @supabase/supabase-js: Database
- dompurify: XSS protection
```

### 📊 Module: Executive-Dash

```markdown
# 📊 Executive-Dash Module

## Responsabilidade
Renderização de componentes visuais do painel executivo, cálculos de métricas e exportação de relatórios.

## Componentes

### Components (React)
- `KPICard.tsx`: Card de métrica com ícone e valor
- `ProgressBar.tsx`: Barra de progresso percentual
- `MiniPill.tsx`: Indicador visual OK/NOK
- `EscalationTable.tsx`: Tabela de itens em escalation
- `EffectivenessGrid.tsx`: Grid de efetividade por stakeholder

### Calculators (Pure Functions)
- `frontsCompleteness.ts`: Cálculo de completude por frente
- `effectivenessMetrics.ts`: Métricas de efetividade de agendas
- `escalationsFilter.ts`: Filtro de itens bloqueados
- `riskLevel.ts`: Cálculo de nível de risco do projeto

### Exporters
- `imageExporter.ts`: Geração de PNG do dashboard

## Interfaces Públicas

\`\`\`typescript
// executive-dash/index.ts
export { 
  KPICard, ProgressBar, MiniPill, 
  EscalationTable, EffectivenessGrid 
} from './components';
export { 
  calculateFrontsCompleteness,
  calculateEffectiveness,
  filterEscalations,
  calculateRiskLevel 
} from './calculators';
export { exportToImage } from './exporters';
\`\`\`
```

### ⚙️ Module: Config-Base

```markdown
# ⚙️ Config-Base Module

## Responsabilidade
Gerenciamento centralizado das regras de negócio e opções de dropdowns definidas na aba "Base" da planilha.

## Componentes

### Dropdowns (Constantes)
- `statusOptions.ts`: Pendente, Realizada, Inefetiva, Bloqueada
- `priorityOptions.ts`: Baixa, Media, Alta
- `evidenciamentoOptions.ts`: Ambiente Liberado, Bloqueado - bug, etc.
- `insumosOptions.ts`: Responsável QA, GP Necessário, etc.
- `acionamentoOptions.ts`: Opções de tipo de acionamento
- `escalationOptions.ts`: Motivos de bloqueio/escalada

### Rules (Business Logic)
- `escalationRules.ts`: Quando habilitar/desabilitar campos de escalation
- `dateHistoryRules.ts`: Quando mover data para histórico
- `completenessRules.ts`: Critérios para cálculo de completude

### Validators
- `businessRuleValidator.ts`: Validação de regras de negócio

## Interfaces Públicas

\`\`\`typescript
// config-base/index.ts
export {
  STATUS_OPTIONS, PRIORITY_OPTIONS,
  EVIDENCIAMENTO_OPTIONS, INSUMOS_OPTIONS,
  ACIONAMENTO_OPTIONS, ESCALATION_REASONS
} from './dropdowns';
export {
  shouldEnableEscalation,
  shouldMoveToHistory,
  calculateCompleteness
} from './rules';
export { validateBusinessRules } from './validators';
\`\`\`
```

### 🧪 Module: QA-Pipeline

```markdown
# 🧪 QA-Pipeline Module (Esteira de Testes)

## Responsabilidade
Módulo dedicado à validação de Gherkin, rastreamento de execução de testes e geração de logs de confirmação.

## Componentes

### Gherkin
- `gherkinValidator.ts`: Validação sintática e semântica de Gherkin
- `gherkinParser.ts`: Parser de cenários Gherkin
- `gherkinTemplates.ts`: Templates padrão de cenários

### Execution
- `testRunner.ts`: Orquestrador de execução de testes
- `statusTracker.ts`: Rastreamento de status (Em execução, Passou, Falhou)
- `resultCollector.ts`: Coleta e agregação de resultados

### Evidence
- `evidenceManager.ts`: Gerenciamento de evidências (URLs, metadados)
- `screenshotCapture.ts`: Captura automatizada de screenshots

### Logging
- `pipelineLogger.ts`: Logger estruturado de eventos da esteira
- `confirmationGenerator.ts`: Gerador de logs de confirmação de uso

## Interfaces Públicas

\`\`\`typescript
// qa-pipeline/index.ts
export { validateGherkin, parseGherkin, getGherkinTemplate } from './gherkin';
export { runTests, getExecutionStatus, collectResults } from './execution';
export { uploadEvidence, getEvidenceUrl } from './evidence';
export { logPipelineEvent, generateConfirmation } from './logging';
\`\`\`
```

---

# 📅 ETAPA 3: Implementação das Alterações da Planilha

## 3.1 Lógica de `date_history`

### Especificação Funcional

O campo `date_history` armazena um histórico de datas de agenda que foram marcadas como "Inefetivas". Quando uma agenda não é realizada conforme planejado:

1. A data original é movida para o array `date_history`
2. Uma nova data pode ser definida no campo `date`
3. O histórico permite visualizar quantas vezes uma agenda foi remarcada

### Fluxo de Atualização

```typescript
// src/modules/config-base/rules/dateHistoryRules.ts

export interface DateHistoryUpdate {
  currentDate: string;
  newDate: string;
  history: string[];
  shouldAddToHistory: boolean;
}

/**
 * Determina se a data atual deve ser movida para o histórico
 */
export const shouldMoveToHistory = (
  currentStatus: string,
  newStatus: string,
  currentDate: string
): boolean => {
  // Mover para histórico quando status muda para 'Inefetiva'
  // e existe uma data definida
  return (
    newStatus === 'Inefetiva' &&
    currentStatus !== 'Inefetiva' &&
    currentDate &&
    currentDate.trim() !== ''
  );
};

/**
 * Processa atualização de data com histórico
 */
export const processDateHistoryUpdate = (
  currentDate: string,
  currentHistory: string[],
  newStatus: string,
  previousStatus: string
): DateHistoryUpdate => {
  const shouldAdd = shouldMoveToHistory(previousStatus, newStatus, currentDate);
  
  return {
    currentDate: shouldAdd ? '' : currentDate,
    newDate: '',
    history: shouldAdd 
      ? [...currentHistory, currentDate].filter((d, i, arr) => arr.indexOf(d) === i) // Remove duplicatas
      : currentHistory,
    shouldAddToHistory: shouldAdd
  };
};

/**
 * Limpa histórico quando agenda é realizada
 */
export const shouldClearHistory = (newStatus: string): boolean => {
  return newStatus === 'Realizada';
};
```

### Implementação no supabaseService.ts

```typescript
// Adicionar ao supabaseService.ts

/**
 * Atualiza linha com lógica de date_history
 */
export const updateRowWithDateHistory = async (
  id: string, 
  updates: Partial<SpreadsheetRow>,
  currentRow: SpreadsheetRow
): Promise<void> => {
  const dbUpdates: any = {};
  
  // Verificar se precisa atualizar date_history
  if (updates.status !== undefined && updates.status !== currentRow.status) {
    const historyUpdate = processDateHistoryUpdate(
      currentRow.date,
      currentRow.dateHistory || [],
      updates.status,
      currentRow.status
    );
    
    if (historyUpdate.shouldAddToHistory) {
      dbUpdates.date_history = JSON.stringify(historyUpdate.history);
      dbUpdates.date = ''; // Limpa data atual para nova entrada
    }
    
    if (shouldClearHistory(updates.status)) {
      dbUpdates.date_history = '[]';
    }
  }
  
  // Mapear demais campos...
  // ... (código existente de mapeamento)
  
  const { error } = await supabase
    .from(QA_TABLE)
    .update(dbUpdates)
    .eq('id', id);
  
  if (error) throw error;
};
```

## 3.2 Mapeamento Aba Base → Aba Dash

### Estrutura de Validação

```typescript
// src/modules/config-base/validators/businessRuleValidator.ts

import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  EVIDENCIAMENTO_AXIS_OPTIONS,
  INSUMOS_OPTIONS,
  ACIONAMENTO_OPTIONS,
  ESCALATION_REASONS
} from '../dropdowns';

export interface ValidationResult {
  isValid: boolean;
  field: string;
  value: any;
  allowedValues?: readonly string[];
  message: string;
}

export const validateFieldAgainstBase = (
  field: keyof SpreadsheetRow,
  value: any
): ValidationResult => {
  const validations: Record<string, readonly string[]> = {
    status: STATUS_OPTIONS,
    priority: PRIORITY_OPTIONS,
    evidenciamentoAxis: EVIDENCIAMENTO_AXIS_OPTIONS,
    insumosParaTestes: INSUMOS_OPTIONS,
    acionamento: ACIONAMENTO_OPTIONS,
    escalationReason: ESCALATION_REASONS
  };
  
  const allowedValues = validations[field];
  
  if (!allowedValues) {
    return { isValid: true, field, value, message: 'Campo sem validação de lista' };
  }
  
  const isValid = allowedValues.includes(value) || value === '' || value === null;
  
  return {
    isValid,
    field,
    value,
    allowedValues,
    message: isValid 
      ? 'Valor válido' 
      : `Valor "${value}" não está na lista permitida`
  };
};

export const validateRowAgainstBase = (row: Partial<SpreadsheetRow>): ValidationResult[] => {
  const fieldsToValidate: (keyof SpreadsheetRow)[] = [
    'status', 'priority', 'evidenciamentoAxis',
    'insumosParaTestes', 'acionamento', 'escalationReason'
  ];
  
  return fieldsToValidate
    .filter(field => row[field] !== undefined)
    .map(field => validateFieldAgainstBase(field, row[field]));
};
```

## 3.3 Fluxo Completo de Insert/Update

```typescript
// src/modules/data-engine/sync/supabaseSync.ts

import { validateRowAgainstBase } from '../../config-base/validators/businessRuleValidator';
import { processDateHistoryUpdate } from '../../config-base/rules/dateHistoryRules';
import { mapToDB, mapFromDB } from '../mappers';

/**
 * Inserir nova linha com validação de regras de negócio
 */
export const insertRowWithValidation = async (row: SpreadsheetRow): Promise<SpreadsheetRow> => {
  // 1. Validar contra aba Base
  const validations = validateRowAgainstBase(row);
  const invalidFields = validations.filter(v => !v.isValid);
  
  if (invalidFields.length > 0) {
    console.warn('Campos com valores inválidos:', invalidFields);
    // Opção: throw error ou apenas log warning
  }
  
  // 2. Garantir defaults corretos
  const preparedRow: SpreadsheetRow = {
    ...row,
    id: row.id || generateUUID(),
    dateHistory: row.dateHistory || [],
    status: row.status || 'Pendente',
    priority: row.priority || 'Media',
    daysBlocked: row.daysBlocked || 0,
    testPipelineStatus: row.testPipelineStatus || 'Não Iniciado',
    pipelineConfirmationLog: row.pipelineConfirmationLog || []
  };
  
  // 3. Persistir
  const { data, error } = await supabase
    .from(QA_TABLE)
    .insert(mapToDB(preparedRow))
    .select()
    .single();
  
  if (error) throw error;
  return mapFromDB(data);
};

/**
 * Atualizar linha com lógica de date_history e validação
 */
export const updateRowWithBusinessLogic = async (
  id: string,
  updates: Partial<SpreadsheetRow>,
  currentRow: SpreadsheetRow
): Promise<void> => {
  // 1. Validar updates contra aba Base
  const validations = validateRowAgainstBase(updates);
  const invalidFields = validations.filter(v => !v.isValid);
  
  if (invalidFields.length > 0) {
    console.warn('Updates com valores inválidos:', invalidFields);
  }
  
  // 2. Processar lógica de date_history
  let processedUpdates = { ...updates };
  
  if (updates.status && updates.status !== currentRow.status) {
    const historyResult = processDateHistoryUpdate(
      currentRow.date,
      currentRow.dateHistory || [],
      updates.status,
      currentRow.status
    );
    
    if (historyResult.shouldAddToHistory) {
      processedUpdates.dateHistory = historyResult.history;
      // Nota: não limpar date automaticamente - deixar usuário definir nova data
    }
  }
  
  // 3. Calcular dias bloqueados se contactDate mudou
  if (updates.contactDate && updates.contactDate !== currentRow.contactDate) {
    processedUpdates.daysBlocked = calculateDaysBlocked(
      updates.contactDate, 
      updates.status || currentRow.status
    );
  }
  
  // 4. Recalcular dias se status mudou
  if (updates.status && currentRow.contactDate) {
    processedUpdates.daysBlocked = calculateDaysBlocked(
      currentRow.contactDate,
      updates.status
    );
  }
  
  // 5. Persistir
  const dbUpdates = mapPartialToDB(processedUpdates);
  
  const { error } = await supabase
    .from(QA_TABLE)
    .update(dbUpdates)
    .eq('id', id);
  
  if (error) throw error;
};

// Helper para calcular dias bloqueados
const calculateDaysBlocked = (contactDate: string, status: string): number => {
  if (!contactDate || status === 'Realizada') return 0;
  
  const contact = new Date(contactDate);
  const today = new Date();
  const diffTime = today.getTime() - contact.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};
```

---

# 🧪 ETAPA 4: Módulo de Esteira de Testes (QA-Pipeline)

## 4.1 Especificação Completa

### Objetivo
Criar um módulo dedicado para gerenciar o ciclo de vida dos testes automatizados, desde a validação do Gherkin até a geração de evidências e confirmação de uso.

### Fluxo da Esteira

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FLUXO DA ESTEIRA DE TESTES                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌──────────┐    ┌──────────────┐    ┌──────────────┐                 │
│   │ Gherkin  │───▶│  Validação   │───▶│  Aprovação   │                 │
│   │ Criado   │    │   Gherkin    │    │    QA Lead   │                 │
│   └──────────┘    └──────────────┘    └──────────────┘                 │
│                          │                    │                         │
│                          ▼                    ▼                         │
│                   ┌──────────────┐    ┌──────────────┐                 │
│                   │   Erros?     │    │  Aprovado?   │                 │
│                   └──────────────┘    └──────────────┘                 │
│                     │        │          │        │                     │
│                    SIM      NÃO        SIM      NÃO                    │
│                     │        │          │        │                     │
│                     ▼        ▼          ▼        ▼                     │
│              ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│              │ Retornar│ │ Agendar │ │ Executar│ │ Retornar│          │
│              │ p/Autor │ │ Execução│ │  Testes │ │ p/Ajuste│          │
│              └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│                                           │                            │
│                                           ▼                            │
│                                    ┌──────────────┐                    │
│                                    │   Passou?    │                    │
│                                    └──────────────┘                    │
│                                      │        │                        │
│                                     SIM      NÃO                       │
│                                      │        │                        │
│                                      ▼        ▼                        │
│                               ┌─────────┐ ┌─────────┐                  │
│                               │ Gerar   │ │ Analisar│                  │
│                               │Evidência│ │  Falha  │                  │
│                               └─────────┘ └─────────┘                  │
│                                      │        │                        │
│                                      ▼        ▼                        │
│                               ┌─────────┐ ┌─────────┐                  │
│                               │ Atualizar│ │Re-executa│                │
│                               │Dashboard│ │ou Escalar│                 │
│                               └─────────┘ └─────────┘                  │
│                                      │                                 │
│                                      ▼                                 │
│                               ┌──────────────┐                         │
│                               │  Confirmar   │                         │
│                               │ Uso Esteira  │                         │
│                               └──────────────┘                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## 4.2 Validador de Gherkin

```typescript
// src/modules/qa-pipeline/gherkin/gherkinValidator.ts

export interface GherkinValidationError {
  line: number;
  type: 'syntax' | 'semantic' | 'best-practice';
  severity: 'error' | 'warning';
  message: string;
  suggestion?: string;
}

export interface GherkinValidationResult {
  isValid: boolean;
  errors: GherkinValidationError[];
  warnings: GherkinValidationError[];
  metrics: {
    scenarioCount: number;
    stepCount: number;
    hasBackground: boolean;
    hasExamples: boolean;
  };
  validatedAt: string;
}

// Keywords padrão do Gherkin (PT-BR e EN)
const GHERKIN_KEYWORDS = {
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
};

/**
 * Valida a sintaxe e estrutura de um texto Gherkin
 */
export const validateGherkin = (gherkinText: string): GherkinValidationResult => {
  const errors: GherkinValidationError[] = [];
  const warnings: GherkinValidationError[] = [];
  
  if (!gherkinText || gherkinText.trim() === '') {
    return {
      isValid: false,
      errors: [{
        line: 0,
        type: 'syntax',
        severity: 'error',
        message: 'Gherkin vazio ou não fornecido'
      }],
      warnings: [],
      metrics: { scenarioCount: 0, stepCount: 0, hasBackground: false, hasExamples: false },
      validatedAt: new Date().toISOString()
    };
  }
  
  const lines = gherkinText.split('\n');
  let hasFeature = false;
  let hasScenario = false;
  let inScenario = false;
  let hasGivenInScenario = false;
  let hasThenInScenario = false;
  let scenarioCount = 0;
  let stepCount = 0;
  let hasBackground = false;
  let hasExamples = false;
  
  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    const lineNumber = index + 1;
    
    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith('#')) return;
    
    // Check Feature
    if (GHERKIN_KEYWORDS.feature.some(kw => trimmedLine.startsWith(kw + ':'))) {
      if (hasFeature) {
        errors.push({
          line: lineNumber,
          type: 'syntax',
          severity: 'error',
          message: 'Múltiplas Features detectadas. Apenas uma Feature por arquivo.'
        });
      }
      hasFeature = true;
    }
    
    // Check Background
    if (GHERKIN_KEYWORDS.background.some(kw => trimmedLine.startsWith(kw + ':'))) {
      hasBackground = true;
    }
    
    // Check Scenario/Scenario Outline
    if (GHERKIN_KEYWORDS.scenario.some(kw => trimmedLine.startsWith(kw + ':')) ||
        GHERKIN_KEYWORDS.scenarioOutline.some(kw => trimmedLine.startsWith(kw + ':'))) {
      
      // Validate previous scenario had required steps
      if (inScenario && !hasGivenInScenario) {
        warnings.push({
          line: lineNumber - 1,
          type: 'best-practice',
          severity: 'warning',
          message: 'Cenário anterior não possui step "Given/Dado"'
        });
      }
      if (inScenario && !hasThenInScenario) {
        errors.push({
          line: lineNumber - 1,
          type: 'semantic',
          severity: 'error',
          message: 'Cenário anterior não possui step "Then/Então" - validação obrigatória'
        });
      }
      
      inScenario = true;
      hasGivenInScenario = false;
      hasThenInScenario = false;
      hasScenario = true;
      scenarioCount++;
    }
    
    // Check Given
    if (GHERKIN_KEYWORDS.given.some(kw => trimmedLine.startsWith(kw + ' '))) {
      hasGivenInScenario = true;
      stepCount++;
    }
    
    // Check When
    if (GHERKIN_KEYWORDS.when.some(kw => trimmedLine.startsWith(kw + ' '))) {
      stepCount++;
      if (!hasGivenInScenario) {
        warnings.push({
          line: lineNumber,
          type: 'best-practice',
          severity: 'warning',
          message: '"When" antes de "Given" - considere adicionar contexto'
        });
      }
    }
    
    // Check Then
    if (GHERKIN_KEYWORDS.then.some(kw => trimmedLine.startsWith(kw + ' '))) {
      hasThenInScenario = true;
      stepCount++;
    }
    
    // Check And/But
    if (GHERKIN_KEYWORDS.and.some(kw => trimmedLine.startsWith(kw + ' ')) ||
        GHERKIN_KEYWORDS.but.some(kw => trimmedLine.startsWith(kw + ' '))) {
      stepCount++;
    }
    
    // Check Examples
    if (GHERKIN_KEYWORDS.examples.some(kw => trimmedLine.startsWith(kw + ':'))) {
      hasExamples = true;
    }
  });
  
  // Final validations
  if (!hasFeature) {
    errors.push({
      line: 1,
      type: 'syntax',
      severity: 'error',
      message: 'Feature/Funcionalidade não declarada',
      suggestion: 'Adicione "Funcionalidade: [Nome]" no início do arquivo'
    });
  }
  
  if (!hasScenario) {
    errors.push({
      line: 1,
      type: 'syntax',
      severity: 'error',
      message: 'Nenhum Cenário declarado',
      suggestion: 'Adicione ao menos um "Cenário: [Nome]"'
    });
  }
  
  // Last scenario validation
  if (inScenario && !hasThenInScenario) {
    errors.push({
      line: lines.length,
      type: 'semantic',
      severity: 'error',
      message: 'Último cenário não possui step "Then/Então"'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      scenarioCount,
      stepCount,
      hasBackground,
      hasExamples
    },
    validatedAt: new Date().toISOString()
  };
};
```

## 4.3 Rastreador de Execução

```typescript
// src/modules/qa-pipeline/execution/statusTracker.ts

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

export interface ExecutionStatus {
  rowId: string;
  currentStage: PipelineStage;
  stageHistory: Array<{
    stage: PipelineStage;
    timestamp: string;
    details?: string;
  }>;
  lastUpdated: string;
  executionDuration?: number; // ms
  retryCount: number;
  maxRetries: number;
}

export interface StatusTransitionResult {
  allowed: boolean;
  newStage?: PipelineStage;
  reason?: string;
}

// Matriz de transições permitidas
const ALLOWED_TRANSITIONS: Record<PipelineStage, PipelineStage[]> = {
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
  'completed': [] // Estado final
};

/**
 * Verifica se uma transição de stage é permitida
 */
export const canTransition = (
  current: PipelineStage, 
  target: PipelineStage
): StatusTransitionResult => {
  const allowed = ALLOWED_TRANSITIONS[current]?.includes(target) ?? false;
  
  return {
    allowed,
    newStage: allowed ? target : undefined,
    reason: allowed 
      ? `Transição ${current} → ${target} permitida`
      : `Transição ${current} → ${target} não permitida. Transições válidas: ${ALLOWED_TRANSITIONS[current]?.join(', ')}`
  };
};

/**
 * Atualiza o status de execução de um item
 */
export const updateExecutionStatus = (
  currentStatus: ExecutionStatus,
  newStage: PipelineStage,
  details?: string
): ExecutionStatus => {
  const transition = canTransition(currentStatus.currentStage, newStage);
  
  if (!transition.allowed) {
    console.warn(`Transição inválida: ${transition.reason}`);
    return currentStatus;
  }
  
  const now = new Date().toISOString();
  
  return {
    ...currentStatus,
    currentStage: newStage,
    stageHistory: [
      ...currentStatus.stageHistory,
      { stage: newStage, timestamp: now, details }
    ],
    lastUpdated: now,
    retryCount: newStage === 'queued_for_execution' && currentStatus.currentStage === 'failed'
      ? currentStatus.retryCount + 1
      : currentStatus.retryCount
  };
};

/**
 * Cria um novo status de execução
 */
export const createExecutionStatus = (rowId: string): ExecutionStatus => ({
  rowId,
  currentStage: 'awaiting_gherkin',
  stageHistory: [{
    stage: 'awaiting_gherkin',
    timestamp: new Date().toISOString(),
    details: 'Status inicial criado'
  }],
  lastUpdated: new Date().toISOString(),
  retryCount: 0,
  maxRetries: 3
});
```

## 4.4 Gerador de Confirmação de Uso da Esteira

```typescript
// src/modules/qa-pipeline/logging/confirmationGenerator.ts

export interface PipelineConfirmation {
  id: string;
  rowId: string;
  timestamp: string;
  type: 'usage' | 'completion' | 'failure' | 'skip';
  summary: {
    gherkinValidated: boolean;
    testsExecuted: boolean;
    testsPassed: boolean;
    evidenceProvided: boolean;
    totalDuration: number; // ms
  };
  details: {
    gherkinValidation?: {
      scenarioCount: number;
      stepCount: number;
      validatedAt: string;
    };
    testExecution?: {
      startedAt: string;
      completedAt: string;
      passedScenarios: number;
      failedScenarios: number;
    };
    evidence?: {
      url: string;
      uploadedAt: string;
      type: 'screenshot' | 'video' | 'report';
    };
  };
  message: string;
  generatedBy: 'system' | 'manual';
}

/**
 * Gera um log de confirmação de uso da esteira
 */
export const generateConfirmation = (
  rowId: string,
  executionStatus: ExecutionStatus,
  gherkinResult?: GherkinValidationResult,
  evidenceUrl?: string
): PipelineConfirmation => {
  const now = new Date().toISOString();
  const type = determineConfirmationType(executionStatus);
  
  const confirmation: PipelineConfirmation = {
    id: generateUUID(),
    rowId,
    timestamp: now,
    type,
    summary: {
      gherkinValidated: executionStatus.currentStage !== 'awaiting_gherkin',
      testsExecuted: ['passed', 'failed', 'completed'].includes(executionStatus.currentStage),
      testsPassed: executionStatus.currentStage === 'passed' || executionStatus.currentStage === 'completed',
      evidenceProvided: !!evidenceUrl,
      totalDuration: calculateDuration(executionStatus)
    },
    details: {},
    message: generateConfirmationMessage(type, executionStatus),
    generatedBy: 'system'
  };
  
  // Add Gherkin details if available
  if (gherkinResult) {
    confirmation.details.gherkinValidation = {
      scenarioCount: gherkinResult.metrics.scenarioCount,
      stepCount: gherkinResult.metrics.stepCount,
      validatedAt: gherkinResult.validatedAt
    };
  }
  
  // Add execution details if available
  const executionStages = executionStatus.stageHistory.filter(
    h => ['executing', 'passed', 'failed'].includes(h.stage)
  );
  if (executionStages.length > 0) {
    const started = executionStages.find(s => s.stage === 'executing');
    const completed = executionStages.find(s => s.stage === 'passed' || s.stage === 'failed');
    
    if (started && completed) {
      confirmation.details.testExecution = {
        startedAt: started.timestamp,
        completedAt: completed.timestamp,
        passedScenarios: completed.stage === 'passed' ? gherkinResult?.metrics.scenarioCount || 0 : 0,
        failedScenarios: completed.stage === 'failed' ? gherkinResult?.metrics.scenarioCount || 0 : 0
      };
    }
  }
  
  // Add evidence details if available
  if (evidenceUrl) {
    confirmation.details.evidence = {
      url: evidenceUrl,
      uploadedAt: now,
      type: 'screenshot'
    };
  }
  
  return confirmation;
};

const determineConfirmationType = (status: ExecutionStatus): PipelineConfirmation['type'] => {
  if (status.currentStage === 'completed') return 'completion';
  if (status.currentStage === 'failed' && status.retryCount >= status.maxRetries) return 'failure';
  if (status.currentStage === 'awaiting_gherkin') return 'skip';
  return 'usage';
};

const calculateDuration = (status: ExecutionStatus): number => {
  if (status.stageHistory.length < 2) return 0;
  
  const first = new Date(status.stageHistory[0].timestamp).getTime();
  const last = new Date(status.stageHistory[status.stageHistory.length - 1].timestamp).getTime();
  
  return last - first;
};

const generateConfirmationMessage = (
  type: PipelineConfirmation['type'],
  status: ExecutionStatus
): string => {
  const messages = {
    usage: `✅ Esteira de Testes utilizada. Stage atual: ${status.currentStage}`,
    completion: `🎉 Ciclo de testes concluído com sucesso!`,
    failure: `❌ Falha após ${status.retryCount} tentativas. Requer análise manual.`,
    skip: `⏭️ Item não processado pela esteira (aguardando Gherkin).`
  };
  
  return messages[type];
};

/**
 * Formata confirmação para exibição no log
 */
export const formatConfirmationLog = (confirmation: PipelineConfirmation): string => {
  const lines = [
    `═══════════════════════════════════════════════════`,
    `📋 CONFIRMAÇÃO DE USO DA ESTEIRA DE TESTES`,
    `═══════════════════════════════════════════════════`,
    `ID: ${confirmation.id}`,
    `Item: ${confirmation.rowId}`,
    `Data/Hora: ${new Date(confirmation.timestamp).toLocaleString('pt-BR')}`,
    `Tipo: ${confirmation.type.toUpperCase()}`,
    ``,
    `📊 RESUMO:`,
    `  • Gherkin Validado: ${confirmation.summary.gherkinValidated ? '✅' : '❌'}`,
    `  • Testes Executados: ${confirmation.summary.testsExecuted ? '✅' : '❌'}`,
    `  • Testes Passaram: ${confirmation.summary.testsPassed ? '✅' : '❌'}`,
    `  • Evidência Fornecida: ${confirmation.summary.evidenceProvided ? '✅' : '❌'}`,
    `  • Duração Total: ${(confirmation.summary.totalDuration / 1000).toFixed(2)}s`,
    ``,
    `💬 ${confirmation.message}`,
    `═══════════════════════════════════════════════════`
  ];
  
  return lines.join('\n');
};
```

## 4.5 Componente React para Visualização da Esteira

```tsx
// src/modules/qa-pipeline/components/PipelineStatusView.tsx

import React from 'react';
import { CheckCircle2, XCircle, Clock, AlertTriangle, PlayCircle } from 'lucide-react';

interface PipelineStatusViewProps {
  status: ExecutionStatus;
  gherkinResult?: GherkinValidationResult;
  confirmation?: PipelineConfirmation;
}

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; icon: React.ReactNode }> = {
  'awaiting_gherkin': { label: 'Aguardando Gherkin', color: 'bg-slate-100 text-slate-600', icon: <Clock /> },
  'gherkin_validating': { label: 'Validando Gherkin', color: 'bg-blue-100 text-blue-600', icon: <PlayCircle className="animate-spin" /> },
  'gherkin_validated': { label: 'Gherkin Validado', color: 'bg-green-100 text-green-600', icon: <CheckCircle2 /> },
  'awaiting_approval': { label: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-600', icon: <Clock /> },
  'approved': { label: 'Aprovado', color: 'bg-green-100 text-green-600', icon: <CheckCircle2 /> },
  'queued_for_execution': { label: 'Na Fila', color: 'bg-blue-100 text-blue-600', icon: <Clock /> },
  'executing': { label: 'Executando', color: 'bg-blue-200 text-blue-700', icon: <PlayCircle className="animate-pulse" /> },
  'passed': { label: 'Passou', color: 'bg-green-200 text-green-700', icon: <CheckCircle2 /> },
  'failed': { label: 'Falhou', color: 'bg-red-100 text-red-600', icon: <XCircle /> },
  'evidence_pending': { label: 'Evidência Pendente', color: 'bg-yellow-100 text-yellow-600', icon: <AlertTriangle /> },
  'completed': { label: 'Concluído', color: 'bg-emerald-200 text-emerald-700', icon: <CheckCircle2 /> }
};

export const PipelineStatusView: React.FC<PipelineStatusViewProps> = ({ 
  status, 
  gherkinResult, 
  confirmation 
}) => {
  const config = STAGE_CONFIG[status.currentStage];
  
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-800">Status da Esteira</h4>
        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${config.color}`}>
          {config.icon}
          {config.label}
        </span>
      </div>
      
      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {['gherkin_validated', 'approved', 'executing', 'passed', 'completed'].map((stage, idx) => {
          const isCompleted = status.stageHistory.some(h => h.stage === stage);
          const isCurrent = status.currentStage === stage;
          
          return (
            <React.Fragment key={stage}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isCompleted ? 'bg-green-500 text-white' :
                isCurrent ? 'bg-blue-500 text-white' :
                'bg-slate-200 text-slate-400'
              }`}>
                {idx + 1}
              </div>
              {idx < 4 && (
                <div className={`flex-1 h-1 ${isCompleted ? 'bg-green-500' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Gherkin Validation Result */}
      {gherkinResult && (
        <div className="bg-slate-50 rounded-lg p-3 space-y-2">
          <p className="text-sm font-semibold text-slate-700">Validação Gherkin</p>
          <div className="flex gap-4 text-xs">
            <span>📝 {gherkinResult.metrics.scenarioCount} cenários</span>
            <span>📋 {gherkinResult.metrics.stepCount} steps</span>
            <span className={gherkinResult.isValid ? 'text-green-600' : 'text-red-600'}>
              {gherkinResult.isValid ? '✅ Válido' : `❌ ${gherkinResult.errors.length} erros`}
            </span>
          </div>
        </div>
      )}
      
      {/* Retry Info */}
      {status.retryCount > 0 && (
        <div className="flex items-center gap-2 text-amber-600 text-xs">
          <AlertTriangle size={14} />
          Tentativa {status.retryCount} de {status.maxRetries}
        </div>
      )}
      
      {/* Last Update */}
      <p className="text-xs text-slate-400">
        Última atualização: {new Date(status.lastUpdated).toLocaleString('pt-BR')}
      </p>
    </div>
  );
};
```

---

# 📁 ESTRUTURA DE PASTAS FINAL PROPOSTA

```
studio-qa-executive-view/
│
├── src/
│   ├── modules/
│   │   ├── data-engine/
│   │   │   ├── README.md
│   │   │   ├── index.ts
│   │   │   ├── parsers/
│   │   │   │   ├── excelParser.ts
│   │   │   │   ├── csvParser.ts
│   │   │   │   └── aiScanner.ts
│   │   │   ├── sync/
│   │   │   │   ├── supabaseSync.ts
│   │   │   │   ├── localStorageSync.ts
│   │   │   │   └── conflictResolver.ts
│   │   │   ├── mappers/
│   │   │   │   ├── dbToApp.ts
│   │   │   │   └── appToDb.ts
│   │   │   └── validators/
│   │   │       ├── dataValidator.ts
│   │   │       └── sanitizer.ts
│   │   │
│   │   ├── executive-dash/
│   │   │   ├── README.md
│   │   │   ├── index.ts
│   │   │   ├── components/
│   │   │   │   ├── KPICard.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   ├── MiniPill.tsx
│   │   │   │   ├── EscalationTable.tsx
│   │   │   │   └── EffectivenessGrid.tsx
│   │   │   ├── calculators/
│   │   │   │   ├── frontsCompleteness.ts
│   │   │   │   ├── effectivenessMetrics.ts
│   │   │   │   ├── escalationsFilter.ts
│   │   │   │   └── riskLevel.ts
│   │   │   └── exporters/
│   │   │       └── imageExporter.ts
│   │   │
│   │   ├── config-base/
│   │   │   ├── README.md
│   │   │   ├── index.ts
│   │   │   ├── dropdowns/
│   │   │   │   ├── statusOptions.ts
│   │   │   │   ├── priorityOptions.ts
│   │   │   │   ├── evidenciamentoOptions.ts
│   │   │   │   ├── insumosOptions.ts
│   │   │   │   ├── acionamentoOptions.ts
│   │   │   │   └── escalationOptions.ts
│   │   │   ├── rules/
│   │   │   │   ├── escalationRules.ts
│   │   │   │   ├── dateHistoryRules.ts
│   │   │   │   └── completenessRules.ts
│   │   │   └── validators/
│   │   │       └── businessRuleValidator.ts
│   │   │
│   │   └── qa-pipeline/
│   │       ├── README.md
│   │       ├── index.ts
│   │       ├── gherkin/
│   │       │   ├── gherkinValidator.ts
│   │       │   ├── gherkinParser.ts
│   │       │   └── gherkinTemplates.ts
│   │       ├── execution/
│   │       │   ├── testRunner.ts
│   │       │   ├── statusTracker.ts
│   │       │   └── resultCollector.ts
│   │       ├── evidence/
│   │       │   ├── evidenceManager.ts
│   │       │   └── screenshotCapture.ts
│   │       ├── logging/
│   │       │   ├── pipelineLogger.ts
│   │       │   └── confirmationGenerator.ts
│   │       └── components/
│   │           └── PipelineStatusView.tsx
│   │
│   ├── views/
│   │   ├── SpreadsheetView.tsx
│   │   ├── ExecutivePanelView.tsx
│   │   ├── MapaStakeholdersView.tsx
│   │   └── LogbookView.tsx
│   │
│   ├── shared/
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── spreadsheet.types.ts
│   │   │   ├── pipeline.types.ts
│   │   │   └── config.types.ts
│   │   ├── hooks/
│   │   │   ├── useSpreadsheetData.ts
│   │   │   ├── useSyncStatus.ts
│   │   │   └── usePipelineStatus.ts
│   │   └── utils/
│   │       ├── dateUtils.ts
│   │       ├── uuidGenerator.ts
│   │       └── sanitizer.ts
│   │
│   ├── App.tsx
│   └── main.tsx
│
├── tests/
│   ├── unit/
│   │   ├── data-engine/
│   │   │   ├── excelParser.test.ts
│   │   │   ├── supabaseSync.test.ts
│   │   │   └── mappers.test.ts
│   │   ├── executive-dash/
│   │   │   ├── frontsCompleteness.test.ts
│   │   │   └── escalationsFilter.test.ts
│   │   ├── config-base/
│   │   │   ├── businessRuleValidator.test.ts
│   │   │   └── dateHistoryRules.test.ts
│   │   └── qa-pipeline/
│   │       ├── gherkinValidator.test.ts
│   │       ├── statusTracker.test.ts
│   │       └── confirmationGenerator.test.ts
│   ├── integration/
│   │   └── modules/
│   │       └── fullPipelineFlow.test.ts
│   └── e2e/
│       ├── executivePanel.spec.ts
│       ├── logbook.spec.ts
│       ├── navigation.spec.ts
│       ├── spreadsheet.spec.ts
│       └── stakeholderMap.spec.ts
│
└── docs/
    ├── DOCUMENTATION.md
    ├── FEATURE_MAP.md
    ├── TECHNICAL_ACTION_PLAN.md
    └── modules/
        ├── DATA_ENGINE.md
        ├── EXECUTIVE_DASH.md
        ├── CONFIG_BASE.md
        └── QA_PIPELINE.md
```

---

# ✅ CHECKLIST DE IMPLEMENTAÇÃO

## Fase 1: Correções de Gap (Prioridade Alta)
- [ ] Executar migration SQL para adicionar novas colunas
- [ ] Atualizar `types.ts` com novos tipos
- [ ] Atualizar `supabaseService.ts` com mapeamento dos novos campos
- [ ] Atualizar `constants.tsx` com constraint de ESCALATION_REASONS

## Fase 2: Refatoração Modular (Prioridade Média)
- [ ] Criar estrutura de pastas `src/modules/`
- [ ] Extrair parsers para `data-engine/parsers/`
- [ ] Extrair cálculos para `executive-dash/calculators/`
- [ ] Centralizar dropdowns em `config-base/dropdowns/`
- [ ] Criar READMEs para cada módulo

## Fase 3: Lógica de date_history (Prioridade Alta)
- [ ] Implementar `dateHistoryRules.ts`
- [ ] Atualizar `updateRow` em App.tsx
- [ ] Adicionar visualização de histórico na SpreadsheetView
- [ ] Criar testes unitários

## Fase 4: Módulo QA-Pipeline (Prioridade Média-Alta)
- [ ] Implementar `gherkinValidator.ts`
- [ ] Implementar `statusTracker.ts`
- [ ] Implementar `confirmationGenerator.ts`
- [ ] Criar componente `PipelineStatusView.tsx`
- [ ] Integrar na SpreadsheetView
- [ ] Criar testes E2E

---

# 📊 CRONOGRAMA ESTIMADO

| Fase | Duração | Dependências |
|------|---------|--------------|
| Fase 1 - Correções de Gap | 2-3 dias | - |
| Fase 2 - Refatoração | 3-5 dias | Fase 1 |
| Fase 3 - date_history | 1-2 dias | Fase 1 |
| Fase 4 - QA-Pipeline | 4-6 dias | Fases 1, 2 |
| **TOTAL** | **10-16 dias** | |

---

*Documento gerado em: 05/02/2026*  
*Autor: SDET Senior Specialist*  
*Versão: 2.0.0*
