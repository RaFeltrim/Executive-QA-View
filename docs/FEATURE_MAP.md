# 🗺️ Mapeamento Completo de Funcionalidades
## Studio QA - Cliente EBV - Projeto CNPJ Alfa Numérico

---

## 📋 Índice

1. [Visão Geral das Abas](#1-visão-geral-das-abas)
2. [SpreadsheetView (Visão Planilha)](#2-spreadsheetview-visão-planilha)
3. [ExecutivePanelView (Painel Executivo)](#3-executivepanelview-painel-executivo)
4. [MapaStakeholdersView (Mapa Stakeholders)](#4-mapastakeholdersview-mapa-stakeholders)
5. [LogbookView (Diário de Bordo)](#5-logbookview-diário-de-bordo)
6. [Funcionalidades Globais](#6-funcionalidades-globais)
7. [Matriz de Cobertura de Testes](#7-matriz-de-cobertura-de-testes)

---

## 1. Visão Geral das Abas

| Aba | Identificador | Componente | Propósito Principal |
|-----|---------------|------------|---------------------|
| Visão Planilha | `spreadsheet` | `SpreadsheetView` | CRUD de dados, backoffice principal |
| Painel Executivo | `executive` | `ExecutivePanelView` | Dashboard executivo, métricas |
| Mapa Stakeholders | `stakeholders` | `MapaStakeholdersView` | Visualização de frentes x stakeholders |
| Diário de Bordo | `logbook` | `LogbookView` | Timeline de atividades, acompanhamento |

---

## 2. SpreadsheetView (Visão Planilha)

### 2.1 Descrição
**Backoffice principal** da aplicação onde todos os dados são gerenciados. É a fonte de verdade que alimenta as demais views.

### 2.2 Funcionalidades Detalhadas

#### 2.2.1 Gerenciamento de Registros (CRUD)

| ID | Funcionalidade | Descrição | Trigger | Componente |
|----|----------------|-----------|---------|------------|
| SP-001 | Adicionar Linha | Cria novo registro com valores default | Botão "Nova Linha" | `addRow()` |
| SP-002 | Editar Campo | Edição inline de qualquer campo | Alteração em input/select | `updateRow()` |
| SP-003 | Excluir Linha | Remove registro com confirmação | Botão trash icon | `deleteRowHandler()` |
| SP-004 | Persistência Local | Backup automático em localStorage | Mudança de estado | `useEffect` |
| SP-005 | Sync Supabase | Sincronização em tempo real | Automático | `dbUpdateRow()` |

#### 2.2.2 Campos Editáveis

| Campo | Tipo | Opções/Formato | Validação |
|-------|------|----------------|-----------|
| Produto (Frente) | `EditableInput` | Texto livre | - |
| Gherkin | `EditableSelect` | OK / NOK / - | - |
| Ambiente | `EditableSelect` | OK / NOK / - | - |
| Fluxo | `EditableSelect` | OK / NOK / - | - |
| Massa | `EditableSelect` | OK / NOK / - | - |
| Fora Escopo | `Checkbox` | true/false | - |
| Resp. QA | `EditableInput` | Texto livre | - |
| Stakeholder | `EditableInput` | Texto livre | - |
| Função | `EditableInput` | Texto livre | - |
| Tech Lead | `EditableInput` | Texto livre | - |
| Status Agenda | `Select` | Pendente/Realizada/Inefetiva/Bloqueada | - |
| Acionamento | `Date` | YYYY-MM-DD | - |
| Data Agenda | `Date` | YYYY-MM-DD | - |
| Aprovação Email | `EditableBoolSelect` | SIM / Não / - | - |
| Aprovado Cliente | `EditableBoolSelect` | SIM / Não / - | - |
| Dias Bloq. | `Number` | >= 0 | - |
| Motivo Bloqueio | `EditableInput` | Texto livre | - |
| Prioridade | `Select` | Baixa/Média/Alta | - |
| Resp. Escalation | `EditableInput` | Texto | Desabilitado se não bloqueado |
| Status Escalation | `Select` | Aberto/Resolvido/Em andamento/Aguardando | Desabilitado se não bloqueado |
| OBS Escalation | `EditableInput` | Texto | Desabilitado se não bloqueado |
| Observações | `EditableInput` | Texto livre | - |

#### 2.2.3 Import/Export

| ID | Funcionalidade | Descrição | Formato | Handler |
|----|----------------|-----------|---------|---------|
| SP-006 | Exportar Excel | Gera arquivo .xlsx com todos os dados | Excel (.xlsx) | `handleExcelExport()` |
| SP-007 | Importar Excel | Carrega dados de planilha externa | Excel (.xlsx, .xls, .csv) | `handleExcelImport()` |
| SP-008 | Escanear IA | Extrai dados de imagem via Gemini AI | Imagem (png, jpg) | `handleAIScan()` |

#### 2.2.4 Sincronização

| ID | Funcionalidade | Descrição | Status Visual |
|----|----------------|-----------|---------------|
| SP-009 | Atualizar Dados | Force sync para Supabase | Botão "Atualizar Dados" |
| SP-010 | Sincronizar | Reload dados do servidor | Botão "Sincronizar" |
| SP-011 | Status Online | Indicador de conexão | Cloud verde/cinza |
| SP-012 | Sync Status | Estado da sincronização | Badge (Sincronizado/Sincronizando/Erro) |

### 2.3 Regras de Negócio

1. **Campos de Escalation**: Só habilitados quando `daysBlocked > 0` OU `status === 'Bloqueada'`
2. **Fora de Escopo**: Linha recebe opacidade 60% e é excluída de cálculos
3. **Import Excel**: Confirmação obrigatória, substitui todos os dados existentes
4. **Scan IA**: Dados extraídos são ADICIONADOS aos existentes (não substitui)

### 2.4 Cenários de Teste

```gherkin
Feature: SpreadsheetView - Gerenciamento de Dados

  Scenario: SP-TC-001 - Adicionar nova linha
    Given estou na aba "Visão Planilha"
    When clico no botão "Nova Linha"
    Then uma nova linha é adicionada no topo da tabela
    And a linha possui status "Pendente" por padrão

  Scenario: SP-TC-002 - Editar campo de texto
    Given existe uma linha na planilha
    When edito o campo "Produto (Frente)" para "Cadastro PJ"
    Then o valor é salvo automaticamente
    And o localStorage é atualizado

  Scenario: SP-TC-003 - Excluir linha
    Given existe uma linha com id "123"
    When clico no ícone de lixeira da linha
    Then a linha é removida da tabela
    And o registro é deletado do Supabase

  Scenario: SP-TC-004 - Exportar para Excel
    Given existem 5 registros na planilha
    When clico no botão "Exportar Excel"
    Then um arquivo .xlsx é baixado
    And o arquivo contém todos os 5 registros

  Scenario: SP-TC-005 - Campos de escalation desabilitados
    Given existe uma linha com status "Pendente" e dias bloqueados = 0
    Then os campos "Resp. Escalation", "Status Escalation" e "OBS Escalation" estão desabilitados

  Scenario: SP-TC-006 - Habilitar campos de escalation
    Given existe uma linha com status "Pendente"
    When altero "Dias Bloq." para 5
    Then os campos de escalation são habilitados
```

---

## 3. ExecutivePanelView (Painel Executivo)

### 3.1 Descrição
**Dashboard executivo** com métricas consolidadas, cards de KPIs, gráficos de evolução e monitoramento de escalations.

### 3.2 Funcionalidades Detalhadas

#### 3.2.1 Métricas Principais (KPIs)

| ID | Métrica | Cálculo | Visual |
|----|---------|---------|--------|
| EP-001 | Frentes Ativas | Count de frentes sem `outOfScope` | Card azul (#00529b) |
| EP-002 | Stakeholders | Count de pessoas únicas em effectiveness | Card verde (#6aa84f) |
| EP-003 | Status Projeto | Sempre "EM ANDAMENTO" | Card com borda |
| EP-004 | Nível de Risco | "Risco Alto" se escalations > 3 | Vermelho/Verde |

#### 3.2.2 Plenitude Técnica (Evolução por Frente)

| ID | Funcionalidade | Descrição | Campos Avaliados |
|----|----------------|-----------|------------------|
| EP-005 | Cálculo Completude | Percentual de evolução por frente | 6 campos booleanos |
| EP-006 | Progress Bar | Barra visual de progresso | 0-100% |
| EP-007 | Mini Pills | Indicadores visuais por critério | Verde = OK, Cinza = NOK |
| EP-008 | Fora de Escopo | Indicador especial para itens excluídos | Ícone Slash, opacidade |

**Critérios de Completude:**
1. Fluxo (`flowKnowledge === 'OK'`)
2. Massa (`dataMass === 'OK'`)
3. Gherkin (`gherkin === 'OK'`)
4. Ambiente (`environment === 'OK'`)
5. Email Solicitado (`approvalRequestedEmail === 'SIM'`)
6. Aprovado Cliente (`approvedByClient === 'SIM'`)

**Fórmula:** `completionPercentage = (critérios_OK / 6) * 100`

#### 3.2.3 Agenda & Stakeholders

| ID | Funcionalidade | Descrição | Métricas |
|----|----------------|-----------|----------|
| EP-009 | Tabela Efetividade | Resumo por stakeholder | Realizada/Pendente/Inefetiva |
| EP-010 | Status Automático | Cálculo de status do stakeholder | Critical/Warning/On Track |

**Regras de Status:**
- `Critical`: ineffectiveAgendas > 1
- `Warning`: pendingAgendas > 2
- `On Track`: demais casos

#### 3.2.4 Escalation Monitoring

| ID | Funcionalidade | Descrição | Campos |
|----|----------------|-----------|--------|
| EP-011 | Lista Escalations | Itens bloqueados ou com dias > 0 | QA, Frente, Stakeholder, Dias, Prioridade |
| EP-012 | Responsável | Exibe responsável pelo escalation | Campo `escalationResponsible` |
| EP-013 | Status | Status atual do escalation | Campo `escalationStatus` |
| EP-014 | Observações | Notas sobre o escalation | Campo `escalationObs` |

#### 3.2.5 Exportação

| ID | Funcionalidade | Descrição | Formato |
|----|----------------|-----------|---------|
| EP-015 | Exportar Imagem | Gera PNG do painel completo | PNG (2x resolução) |

### 3.3 Dados Derivados (useMemo)

```typescript
// frontsCompleteness - Aggregação por frente
// effectivenessData - Aggregação por stakeholder  
// escalations - Filter de itens bloqueados
// executiveMetrics - KPIs consolidados
```

### 3.4 Cenários de Teste

```gherkin
Feature: ExecutivePanelView - Dashboard Executivo

  Scenario: EP-TC-001 - Exibir métricas corretas
    Given existem 10 frentes no sistema
    And 2 frentes estão marcadas como "Fora de Escopo"
    Then o card "Frentes Ativas" exibe "8"

  Scenario: EP-TC-002 - Calcular completude da frente
    Given existe uma frente "Cadastro PJ"
    And a frente tem Fluxo=OK, Massa=OK, Gherkin=NOK, Ambiente=OK, Email=SIM, Aprovado=Não
    Then a completude da frente é 66%

  Scenario: EP-TC-003 - Identificar escalations
    Given existe um registro com status "Bloqueada" e dias = 5
    Then o registro aparece na seção "Escalation - Monitoramento"

  Scenario: EP-TC-004 - Exportar painel como imagem
    Given estou no Painel Executivo
    When clico em "Exportar Imagem"
    Then um arquivo PNG é baixado
    And o arquivo contém o painel completo

  Scenario: EP-TC-005 - Nível de risco alto
    Given existem 4 escalations no sistema
    Then o card de status exibe "Risco Alto"
    And o card tem borda vermelha
```

---

## 4. MapaStakeholdersView (Mapa Stakeholders)

### 4.1 Descrição
**Visualização de cards** mostrando o mapeamento entre frentes de trabalho e seus stakeholders (PO e Tech Lead).

### 4.2 Funcionalidades Detalhadas

| ID | Funcionalidade | Descrição | Dados |
|----|----------------|-----------|-------|
| MS-001 | Card de Frente | Exibe informações da frente | frontName, po, techLead |
| MS-002 | Status Badge | Indicador de status da frente | Ativo/Mapeado/Pendente |
| MS-003 | Info PO | Nome e função do Product Owner | `responsible` + `role` |
| MS-004 | Info Tech Lead | Nome do Tech Lead | `techLeadName` |

### 4.3 Regras de Status

| Status | Condição |
|--------|----------|
| `Ativo` | `status === 'Realizada'` |
| `Pendente` | `status === 'Pendente'` |
| `Mapeado` | Demais casos |

### 4.4 Dados Derivados

```typescript
const stakeholderMap = useMemo(() => {
  // Agrupa por produto (frente)
  // Extrai primeiro PO e TL encontrados
  // Retorna array de FrontStakeholderMapping
}, [spreadsheetData]);
```

### 4.5 Cenários de Teste

```gherkin
Feature: MapaStakeholdersView - Mapa de Stakeholders

  Scenario: MS-TC-001 - Exibir card de frente
    Given existe uma frente "Cadastro PJ" com stakeholder "João Silva"
    When acesso a aba "Mapa Stakeholders"
    Then vejo um card com título "Cadastro PJ"
    And o card exibe "PO: João Silva"

  Scenario: MS-TC-002 - Status ativo
    Given existe uma frente com status "Realizada"
    Then o badge do card exibe "Ativo"

  Scenario: MS-TC-003 - Exibir Tech Lead
    Given existe uma frente com Tech Lead "Maria Santos"
    Then o card exibe "TL: Maria Santos"
```

---

## 5. LogbookView (Diário de Bordo)

### 5.1 Descrição
**Timeline de atividades** com resumo por QA, contador de status e histórico cronológico das ações realizadas.

### 5.2 Funcionalidades Detalhadas

#### 5.2.1 Resumo por Status

| ID | Funcionalidade | Descrição | Visual |
|----|----------------|-----------|--------|
| LB-001 | Counter Realizadas | Total de agendas realizadas | Badge verde |
| LB-002 | Counter Pendentes | Total de agendas pendentes | Badge azul |
| LB-003 | Counter Inefetivas | Total de agendas inefetivas | Badge âmbar |
| LB-004 | Counter Bloqueadas | Total de agendas bloqueadas | Badge vermelho |

#### 5.2.2 Timeline de Atividades

| ID | Funcionalidade | Descrição | Ordenação |
|----|----------------|-----------|-----------|
| LB-005 | Lista Recentes | Últimas 15 atividades com data | Data DESC |
| LB-006 | Indicator Visual | Bullet colorido por status | Verde/Vermelho/Âmbar/Azul |
| LB-007 | Info Detalhada | Data, QA, Produto, Stakeholder, Notas | - |

#### 5.2.3 Resumo por QA

| ID | Funcionalidade | Descrição | Visual |
|----|----------------|-----------|--------|
| LB-008 | Agrupamento QA | Cards por responsável QA | Lista de cards |
| LB-009 | Mini Counters | Realizadas/Pendentes/Bloqueadas por QA | Badges inline |
| LB-010 | Progress Bar | Percentual de realizadas | Barra verde |

### 5.3 Dados Derivados

```typescript
// activitiesByQA - Agrupamento por responsável
// recentActivities - Top 15 ordenado por data
// statusSummary - Contadores por status
```

### 5.4 Cenários de Teste

```gherkin
Feature: LogbookView - Diário de Bordo

  Scenario: LB-TC-001 - Exibir contadores corretos
    Given existem 5 agendas realizadas e 3 pendentes
    Then o counter "Realizadas" exibe "5"
    And o counter "Pendentes" exibe "3"

  Scenario: LB-TC-002 - Timeline ordenada por data
    Given existem atividades em 01/01, 15/01 e 10/01
    Then a timeline exibe as atividades na ordem: 15/01, 10/01, 01/01

  Scenario: LB-TC-003 - Agrupar por QA
    Given existem 3 atividades do QA "Rafa" e 2 do QA "David"
    Then vejo cards para "Rafa" e "David"
    And o card "Rafa" mostra 3 atividades

  Scenario: LB-TC-004 - Limitar a 15 atividades
    Given existem 20 atividades com data
    Then a timeline exibe apenas 15 atividades
```

---

## 6. Funcionalidades Globais

### 6.1 Sidebar Navigation

| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| GL-001 | Navegação por Tabs | Alterna entre as 4 views |
| GL-002 | Active State | Highlight visual da aba ativa |
| GL-003 | Branding | Logo, cliente, projeto |

### 6.2 Header

| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| GL-004 | Título Dinâmico | Exibe nome da aba ativa |
| GL-005 | Status Conexão | Ícone online/offline |
| GL-006 | Sync Status Badge | Estado da sincronização |
| GL-007 | Data Atual | Exibe data formatada PT-BR |

### 6.3 Loading State

| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| GL-008 | Overlay Loading | Tela de carregamento inicial |
| GL-009 | Spinner | Ícone animado de loading |

### 6.4 Persistência

| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| GL-010 | localStorage Backup | Salva dados localmente |
| GL-011 | Supabase Sync | Sincronização com banco |
| GL-012 | Realtime Subscription | Updates em tempo real |
| GL-013 | Offline Mode | Funciona sem conexão |

---

## 7. Matriz de Cobertura de Testes

### 7.1 Testes Unitários

| Componente | Funcionalidades | Prioridade |
|------------|-----------------|------------|
| `types.ts` | Validação de interfaces | Alta |
| `supabaseService.ts` | CRUD operations | Alta |
| `EditableInput` | Renderização, onChange | Média |
| `EditableSelect` | Renderização, opções | Média |
| `EditableBoolSelect` | Renderização, valores | Média |
| `MiniPill` | Estados active/inactive | Baixa |

### 7.2 Testes de Integração

| View | Cenários | Prioridade |
|------|----------|------------|
| SpreadsheetView | CRUD completo, Import/Export | Alta |
| ExecutivePanelView | Cálculos, Exportação | Alta |
| MapaStakeholdersView | Renderização cards | Média |
| LogbookView | Timeline, Agrupamentos | Média |

### 7.3 Testes E2E

| Fluxo | Descrição | Prioridade |
|-------|-----------|------------|
| Navegação | Alternar entre todas as abas | Alta |
| CRUD Planilha | Adicionar, editar, excluir linha | Alta |
| Sincronização | Online/Offline transitions | Alta |
| Import Excel | Importar arquivo válido | Alta |
| Export Excel | Exportar e validar conteúdo | Média |
| Export Imagem | Gerar PNG do painel | Média |

---

## 📊 Resumo de Cobertura

| Categoria | Total | Críticos | Médios | Baixos |
|-----------|-------|----------|--------|--------|
| SpreadsheetView | 12 | 6 | 4 | 2 |
| ExecutivePanelView | 15 | 4 | 8 | 3 |
| MapaStakeholdersView | 4 | 1 | 2 | 1 |
| LogbookView | 10 | 2 | 5 | 3 |
| Global | 13 | 4 | 6 | 3 |
| **TOTAL** | **54** | **17** | **25** | **12** |

---

*Documento gerado em: Julho 2025*  
*Autor: QA SDET Specialist*  
*Versão: 1.0.0*
