# 🧪 QA-Pipeline Module (Esteira de Testes)

## Visão Geral

O módulo **QA-Pipeline** é responsável por gerenciar todo o ciclo de vida dos testes automatizados, desde a validação do Gherkin até a geração de evidências e confirmação de uso da esteira.

## Responsabilidades

1. **Validação de Gherkin**: Verifica sintaxe, semântica e boas práticas
2. **Rastreamento de Execução**: Acompanha o progresso dos testes
3. **Gerenciamento de Evidências**: Upload e vinculação de screenshots/videos
4. **Geração de Confirmações**: Logs de uso da esteira para compliance

## Estrutura de Arquivos

```
qa-pipeline/
├── README.md                 # Este arquivo
├── index.ts                  # Exports públicos
├── types/
│   └── pipeline.types.ts     # Interfaces e tipos
├── gherkin/
│   ├── gherkinValidator.ts   # Validação sintática/semântica
│   ├── gherkinParser.ts      # Parser de cenários
│   └── gherkinTemplates.ts   # Templates padrão
├── execution/
│   ├── testRunner.ts         # Orquestrador de execução
│   ├── statusTracker.ts      # Rastreamento de status
│   └── resultCollector.ts    # Coleta de resultados
├── evidence/
│   ├── evidenceManager.ts    # Gerenciamento de evidências
│   └── screenshotCapture.ts  # Captura automatizada
├── logging/
│   ├── pipelineLogger.ts     # Logger estruturado
│   └── confirmationGenerator.ts # Gerador de confirmações
└── components/
    └── PipelineStatusView.tsx # Componente React
```

## Interfaces Públicas

```typescript
// Exportado via index.ts
export {
  // Gherkin
  validateGherkin,
  parseGherkin,
  getGherkinTemplate,
  
  // Execution
  createExecutionStatus,
  updateExecutionStatus,
  canTransition,
  
  // Evidence
  uploadEvidence,
  getEvidenceUrl,
  
  // Logging
  logPipelineEvent,
  generateConfirmation,
  formatConfirmationLog,
  
  // Components
  PipelineStatusView,
  
  // Types
  type TestPipelineStatus,
  type PipelineStage,
  type GherkinValidationResult,
  type ExecutionStatus,
  type PipelineConfirmation
} from './qa-pipeline';
```

## Fluxo da Esteira

```
┌─────────────────┐
│  Item Criado    │
└────────┬────────┘
         ▼
┌─────────────────┐
│ Aguardando      │ ◄─────────────────────────────────┐
│ Gherkin         │                                   │
└────────┬────────┘                                   │
         ▼                                            │
┌─────────────────┐     ┌─────────────────┐          │
│ Validando       │────▶│ Erros?          │──SIM────►│
│ Gherkin         │     └────────┬────────┘          │
└─────────────────┘              │NÃO                │
                                 ▼                    │
                    ┌─────────────────┐              │
                    │ Gherkin         │              │
                    │ Validado        │              │
                    └────────┬────────┘              │
                             ▼                        │
                    ┌─────────────────┐              │
                    │ Na Fila de      │              │
                    │ Execução        │              │
                    └────────┬────────┘              │
                             ▼                        │
                    ┌─────────────────┐              │
                    │ Executando      │              │
                    │ Testes          │              │
                    └────────┬────────┘              │
                             ▼                        │
                    ┌─────────────────┐              │
                    │ Passou?         │──NÃO────────►│
                    └────────┬────────┘              │
                             │SIM                     │
                             ▼                        │
                    ┌─────────────────┐              │
                    │ Upload          │              │
                    │ Evidências      │              │
                    └────────┬────────┘              │
                             ▼                        │
                    ┌─────────────────┐              │
                    │ Concluído       │              │
                    │ (Confirmação)   │              │
                    └─────────────────┘              │
```

## Uso Básico

### 1. Validar Gherkin

```typescript
import { validateGherkin } from './gherkin/gherkinValidator';

const gherkinText = `
Funcionalidade: Login de Usuário

  Cenário: Login com credenciais válidas
    Dado que estou na página de login
    Quando preencho o email "user@email.com"
    E preencho a senha "123456"
    E clico no botão "Entrar"
    Então devo ver a mensagem "Bem-vindo!"
`;

const result = validateGherkin(gherkinText);

if (result.isValid) {
  console.log('✅ Gherkin válido');
  console.log(`📝 ${result.metrics.scenarioCount} cenários`);
  console.log(`📋 ${result.metrics.stepCount} steps`);
} else {
  console.log('❌ Erros encontrados:');
  result.errors.forEach(err => {
    console.log(`  Linha ${err.line}: ${err.message}`);
  });
}
```

### 2. Rastrear Execução

```typescript
import { 
  createExecutionStatus, 
  updateExecutionStatus,
  canTransition 
} from './execution/statusTracker';

// Criar status inicial
const status = createExecutionStatus('row-123');

// Verificar se pode avançar
const transition = canTransition(status.currentStage, 'gherkin_validating');
if (transition.allowed) {
  const newStatus = updateExecutionStatus(status, 'gherkin_validating');
  console.log(`Stage atualizado: ${newStatus.currentStage}`);
}
```

### 3. Gerar Confirmação

```typescript
import { generateConfirmation, formatConfirmationLog } from './logging/confirmationGenerator';

const confirmation = generateConfirmation(
  'row-123',
  executionStatus,
  gherkinResult,
  'https://storage.example.com/evidence.png'
);

// Log formatado
console.log(formatConfirmationLog(confirmation));
```

## Regras de Negócio

### Transições de Stage

| Stage Atual | Transições Permitidas |
|-------------|----------------------|
| awaiting_gherkin | gherkin_validating |
| gherkin_validating | gherkin_validated, awaiting_gherkin |
| gherkin_validated | awaiting_approval, queued_for_execution |
| awaiting_approval | approved, awaiting_gherkin |
| approved | queued_for_execution |
| queued_for_execution | executing |
| executing | passed, failed |
| passed | evidence_pending, completed |
| failed | queued_for_execution, awaiting_gherkin |
| evidence_pending | completed |
| completed | (estado final) |

### Validação de Gherkin

1. **Obrigatório**: Keyword `Feature/Funcionalidade`
2. **Obrigatório**: Pelo menos um `Scenario/Cenário`
3. **Obrigatório**: Cada cenário deve ter `Then/Então`
4. **Recomendado**: Cada cenário deve ter `Given/Dado`
5. **Warning**: `When` sem `Given` anterior

### Re-execução

- Máximo de **3 tentativas** por padrão
- Após 3 falhas: requer análise manual e reset do Gherkin
- Contador de retry incrementado apenas em transição `failed → queued_for_execution`

## Persistência

Os dados do pipeline são persistidos em 3 colunas:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `test_pipeline_status` | TEXT | Status simplificado para exibição |
| `gherkin_validation_result` | JSONB | Resultado completo da validação |
| `pipeline_confirmation_log` | JSONB | Array de logs de confirmação |

## Integração com SpreadsheetView

O componente `PipelineStatusView` pode ser integrado na SpreadsheetView:

```tsx
import { PipelineStatusView } from './qa-pipeline/components/PipelineStatusView';

// Dentro de uma célula da tabela
<PipelineStatusView 
  status={row.executionStatus}
  gherkinResult={row.gherkinValidationResult}
  confirmation={row.latestConfirmation}
/>
```

## Testes

```bash
# Executar testes unitários
npm run test:unit -- --grep "qa-pipeline"

# Executar testes de integração
npm run test:integration -- --grep "pipeline"
```

## Dependências

- **Nenhuma externa**: Módulo é auto-contido
- **Internas**: 
  - `shared/utils/uuidGenerator` para IDs
  - `shared/utils/dateUtils` para formatação

## Changelog

### v2.0.0 (05/02/2026)
- Criação inicial do módulo
- Validador de Gherkin (PT-BR e EN)
- Rastreador de status com histórico
- Gerador de confirmações
- Componente PipelineStatusView

---

*Autor: SDET Senior Specialist*  
*Última atualização: 05/02/2026*
