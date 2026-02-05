# 📋 CONTEXTO COMPLETO DO PROJETO - Studio QA EBV

> **Documento para onboarding de IA/LLMs** - Contém todas as informações relevantes para entender o projeto.

---

## 🎯 VISÃO GERAL

| Campo | Valor |
|-------|-------|
| **Nome** | Studio QA - Cliente EBV - Projeto CNPJ Alfa Numérico |
| **Versão** | 1.1.0 |
| **Status** | Em Produção |
| **Data Atual** | 05 de Fevereiro de 2026 |
| **Cliente** | EBV |

### Propósito
Sistema de gestão de qualidade corporativo para mapeamento de stakeholders e controle de frentes de trabalho de QA no projeto CNPJ Alfa Numérico.

### Funcionalidades Principais
- ✅ Gestão de mapeamento de stakeholders
- ✅ Controle de frentes de trabalho de QA
- ✅ Monitoramento de escalations e bloqueios
- ✅ Painel executivo com métricas em tempo real
- ✅ Diário de bordo para acompanhamento de atividades
- ✅ Sincronização em tempo real via Supabase

---

## 🛠️ STACK TECNOLÓGICA

| Categoria | Tecnologia | Versão |
|-----------|------------|--------|
| **Frontend** | React | 19.2.4 |
| **Linguagem** | TypeScript | 5.8.2 |
| **Build Tool** | Vite | 6.x |
| **Backend/DB** | Supabase (PostgreSQL) | 2.45.0 |
| **Testes E2E** | Playwright | 1.48.0 |
| **Testes Unit** | Vitest | 2.1.8 |
| **Estilização** | TailwindCSS | (inline classes) |
| **IA** | Google Gemini | @google/genai 1.39.0 |
| **Export Excel** | xlsx | 0.18.5 |
| **Export Imagem** | html-to-image | 1.11.11 |
| **Ícones** | Lucide React | 0.563.0 |
| **Sanitização** | DOMPurify | 3.3.1 |

---

## 📁 ESTRUTURA DO PROJETO

```
studio-qa---cliente-ebv---projeto-cnpj-alfa-numerico_v1/
├── App.tsx                    # Componente principal (1828 linhas) - TODA a lógica da aplicação
├── index.tsx                  # Entry point React
├── index.html                 # HTML template
├── types.ts                   # Interfaces e tipos TypeScript
├── constants.tsx              # Constantes e opções de dropdown
├── supabaseClient.ts          # Cliente Supabase (conexão)
├── supabaseService.ts         # Camada de serviço (CRUD operations)
├── supabase-schema.sql        # Schema completo do banco de dados
├── package.json               # Dependências e scripts
├── tsconfig.json              # Configuração TypeScript
├── vite.config.ts             # Configuração Vite
├── vitest.config.ts           # Configuração Vitest
├── playwright.config.ts       # Configuração Playwright
├── eslint.config.js           # Configuração ESLint
├── vercel.json                # Deploy Vercel
├── docs/
│   ├── DOCUMENTATION.md       # Documentação técnica completa (1192 linhas)
│   ├── FEATURE_MAP.md         # Mapeamento detalhado de funcionalidades (514 linhas)
│   ├── PLAYWRIGHT_MCP.md      # Documentação MCP Playwright
│   ├── RELATORIO_CORPORATIVO.md
│   └── TECHNICAL_ACTION_PLAN.md
├── tests/
│   ├── setup.ts               # Setup global de testes
│   ├── e2e/                   # Testes E2E Playwright
│   │   ├── executivePanel.spec.ts  # 55 testes do Painel Executivo ✅
│   │   ├── spreadsheet.spec.ts     # Testes da Planilha
│   │   ├── logbook.spec.ts         # Testes do Diário de Bordo
│   │   ├── navigation.spec.ts      # Testes de Navegação
│   │   └── stakeholderMap.spec.ts  # Testes do Mapa Stakeholders
│   ├── unit/                  # Testes unitários Vitest
│   │   ├── businessLogic.test.ts
│   │   ├── supabaseService.test.ts
│   │   └── types.test.ts
│   └── mcp/                   # Testes MCP
│       ├── mcp-e2e.spec.ts
│       └── mcp-helpers.ts
├── src/
│   └── modules/
│       └── qa-pipeline/       # Módulo de pipeline QA
│           ├── index.ts
│           ├── README.md
│           ├── execution/statusTracker.ts
│           ├── gherkin/gherkinValidator.ts
│           ├── logging/confirmationGenerator.ts
│           └── types/pipeline.types.ts
├── scripts/
│   ├── migration-v2.0.0.sql
│   └── pre-migration-cleanup.sql
└── test-reports/              # Relatórios de testes gerados
```

---

## 🏗️ ARQUITETURA DA APLICAÇÃO

### Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/TypeScript)                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  SpreadsheetView │  │ ExecutivePanel  │  │  StakeholderMap │     │
│  │   (Base de Dados)│  │ (Visão Executiva)│  │ (Mapa Frentes)  │     │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘     │
│           │                    │                    │               │
│           └────────────────────┼────────────────────┘               │
│                                │                                    │
│                    ┌───────────┴───────────┐                        │
│                    │   App State Manager   │                        │
│                    │   (React Hooks/State) │                        │
│                    └───────────┬───────────┘                        │
└────────────────────────────────┼────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   supabaseService.ts    │
                    │  (Camada de Serviço)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   supabaseClient.ts     │
                    │  (Cliente Supabase)     │
                    └────────────┬────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE (Backend)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  PostgreSQL DB  │  │   Realtime      │  │  Row Level      │     │
│  │ (qa_spreadsheet │  │   Subscriptions │  │  Security (RLS) │     │
│  │     _data)      │  │                 │  │                 │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Views/Abas Principais

| Aba | Identificador | Componente | Propósito |
|-----|---------------|------------|-----------|
| **Visão Planilha** | `spreadsheet` | `SpreadsheetView` | Backoffice principal - CRUD de dados |
| **Painel Executivo** | `executive` | `ExecutivePanelView` | Dashboard executivo com KPIs e métricas |
| **Mapa Stakeholders** | `stakeholders` | `MapaStakeholdersView` | Visualização frentes x stakeholders |
| **Diário de Bordo** | `logbook` | `LogbookView` | Timeline de atividades por QA |

### Fluxo de Dados

```
User Action → Event Handler → State Update → UI Render
                    ↓
              Supabase Sync (Realtime)
                    ↓
              localStorage Backup (Offline-First)
```

### Padrão de Comunicação
1. **Offline-First**: Dados são salvos localmente (localStorage) como backup
2. **Real-time Sync**: Sincronização automática via Supabase Realtime
3. **Fallback Gracioso**: Funciona em modo offline com dados locais

---

## 📊 MODELO DE DADOS PRINCIPAL

### Interface `SpreadsheetRow` (TypeScript)

```typescript
interface SpreadsheetRow {
  id: string;
  
  // Metadata & Tracking
  contactDate?: string;        // Data Acionamento - inicia contagem de dias bloqueados
  date: string;                // Data Agenda (atual)
  dateHistory?: string[];      // Histórico de datas anteriores (inefetivas - aparecem riscadas)
  status: string;              // Status Agenda: Pendente | Realizada | Inefetiva | Bloqueada
  responsibleQA: string;       // Resp. QA
  
  // Product / Front Details
  product: string;             // Produto (Frente)
  flowKnowledge?: 'OK' | 'NOK' | '';  // Conhecimento Fluxo
  gherkin?: 'OK' | 'NOK' | '';        // Gherkin
  outOfScope?: boolean;               // Fora Escopo
  
  // Novos campos da planilha atualizada (2026)
  evidenciamentoAsIs?: string; // Evidenciamento As Is: Ambiente Liberado, Bloqueado - bug no Amb, etc.
  insumosParaTestes?: string;  // Insumos para Testes: Responsável QA, Responsável Lider Tecnico, etc.
  acionamento?: string;        // Acionamento: Responsável QA, GP - Necessário Envolver Áreas, etc.
  
  // Campos legados (mantidos para retrocompatibilidade)
  dataMass?: 'OK' | 'NOK' | '';      // @deprecated - usar insumosParaTestes
  environment?: 'OK' | 'NOK' | '';   // @deprecated - usar evidenciamentoAsIs
  
  // Stakeholder Details
  responsible: string;         // Nome do Stakeholder
  role: string;                // Função do Stakeholder
  techLeadName?: string;       // Tech Lead (para o Mapa)

  // Approval Details
  approvalRequestedEmail?: 'SIM' | 'NÃO' | '';  // Aprovação Solicitada por email
  approvedByClient?: 'SIM' | 'NÃO' | '';        // Aprovado Pelo Cliente
  
  // Blockage & Escalation
  blockedSinceDate?: string;   // Data em que o status foi alterado para "Bloqueada"
  daysBlocked?: number;        // Dias Bloqueado (calculado automaticamente - DIAS ÚTEIS)
  priority?: string;           // Prioridade: Baixa | Media | Alta
  escalationReason?: string;   // Motivo do Bloqueio / Escalada
  escalationResponsible?: string;  // Responsável pelo Escalation
  escalationStatus?: string;   // Status do Escalation
  escalationObs?: string;      // OBS do Escalation
  notes: string;               // Observações Gerais
}
```

### Tabela Supabase: `qa_spreadsheet_data`

```sql
CREATE TABLE qa_spreadsheet_data (
  id TEXT PRIMARY KEY,
  contact_date TEXT,
  date TEXT,
  date_history TEXT DEFAULT '[]',  -- JSON array
  status TEXT DEFAULT 'Pendente',
  responsible_qa TEXT,
  product TEXT,
  flow_knowledge TEXT,
  gherkin TEXT,
  out_of_scope BOOLEAN DEFAULT FALSE,
  evidenciamento_as_is TEXT,
  insumos_para_testes TEXT,
  acionamento TEXT,
  data_mass TEXT,
  environment TEXT,
  responsible TEXT,
  role TEXT,
  tech_lead_name TEXT,
  approval_requested_email TEXT,
  approved_by_client TEXT,
  blocked_since_date DATE,
  days_blocked INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'Media',
  escalation_reason TEXT,
  escalation_responsible TEXT,
  escalation_status TEXT,
  escalation_obs TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ⚙️ FUNCIONALIDADES DETALHADAS

### 1. SpreadsheetView (Backoffice Principal)

| ID | Funcionalidade | Descrição |
|----|----------------|-----------|
| SP-001 | Adicionar Linha | Cria novo registro com valores default |
| SP-002 | Editar Campo | Edição inline de qualquer campo |
| SP-003 | Excluir Linha | Remove registro com confirmação |
| SP-004 | Persistência Local | Backup automático em localStorage |
| SP-005 | Sync Supabase | Sincronização em tempo real |
| SP-006 | Exportar Excel | Gera arquivo .xlsx com todos os dados |
| SP-007 | Importar Excel | Carrega dados de planilha externa |
| SP-008 | Escanear IA | Extrai dados de imagem via Gemini AI |

### 2. ExecutivePanelView (Painel Executivo)

**KPIs Principais (3 cards):**
- **Frentes Ativas**: Contagem de frentes não fora de escopo
- **Stakeholders**: Total de stakeholders mapeados
- **Status/Risco**: Indicador visual (Risco Alto se > 3 escalations)

**Plenitude Técnica (6 critérios com mini-pills):**
- Fluxo | Gherkin | Evidenc. As Is | Insumos | Email Solic. | Aprov. Cli.

**Tabela Agenda & Stakeholders:**
- Colunas: Stakeholder | Realizada | Pendente | Inefetiva

**Monitoramento de Escalations (8 colunas):**
- QA | Frente | Stakeholder | Dias | Prior. | Resp. Esc. | Status | OBS

**Exportar Imagem:**
- Botão para gerar PNG do painel completo

### 3. Cálculo de Dias Bloqueados (Regra de Negócio Crítica)

```typescript
// Função exportada: calculateBlockedBusinessDays
// Calcula dias ÚTEIS desde Data Agenda quando status = "Bloqueada"
// 
// IGNORA:
// - Sábados e Domingos
// - Feriados Nacionais Brasileiros (2025-2026)
//
// Recálculo automático a cada 60 segundos
```

**Feriados 2026 inclusos no sistema:**
| Data | Feriado |
|------|---------|
| 01/01 | Confraternização Universal |
| 16/02 | Carnaval (Segunda) |
| 17/02 | Carnaval (Terça) |
| 18/02 | Quarta-feira de Cinzas |
| 03/04 | Sexta-feira Santa |
| 21/04 | Tiradentes |
| 01/05 | Dia do Trabalho |
| 04/06 | Corpus Christi |
| 07/09 | Independência do Brasil |
| 12/10 | Nossa Senhora Aparecida |
| 02/11 | Finados |
| 15/11 | Proclamação da República |
| 25/12 | Natal |

---

## 🧪 COBERTURA DE TESTES

### Testes E2E (Playwright) - Painel Executivo: 55 testes

| Categoria | Quantidade | Testes |
|-----------|------------|--------|
| Estrutura Principal | 3 | EP-TC-000 a EP-TC-002 |
| KPI Cards | 6 | EP-TC-003 a EP-TC-008 |
| Plenitude Técnica | 10 | EP-TC-009 a EP-TC-018 |
| Agenda & Stakeholders | 8 | EP-TC-019 a EP-TC-026 |
| Escalation Monitoring | 11 | EP-TC-027 a EP-TC-037 |
| Export Functionality | 5 | EP-TC-038 a EP-TC-042 |
| Layout & Visual | 5 | EP-TC-043 a EP-TC-047 |
| Responsive Data | 3 | EP-TC-048 a EP-TC-050 |
| Accessibility | 4 | EP-TC-051 a EP-TC-054 |

**Importante:** Todos os 55 testes são E2E reais (0 mocks). Testam a aplicação com dados reais do Supabase/localStorage.

### Scripts de Teste

```bash
# Testes E2E
npm run test:e2e              # Todos os testes E2E (todos os browsers)
npm run test:e2e:ui           # UI interativa Playwright
npm run test:e2e:mcp          # Testes MCP

# Testes Unitários
npm run test                  # Vitest run
npm run test:watch            # Vitest watch mode
npm run test:coverage         # Cobertura de código
npm run test:ui               # Vitest UI
```

---

## 🔌 INTEGRAÇÕES EXTERNAS

### 1. Supabase
- **Tabela:** `qa_spreadsheet_data`
- **Realtime:** Habilitado (INSERT, UPDATE, DELETE)
- **RLS:** Policy "Allow all access" (acesso público)
- **Trigger:** Auto-update de `updated_at`

### 2. Google Gemini AI
- **Uso:** Extração de dados de imagens (OCR inteligente)
- **Modelo:** gemini-2.0-flash
- **Endpoint:** Scan de planilhas fotografadas → dados estruturados

### 3. localStorage
- **Chave:** `ebv_qa_data`
- **Uso:** Backup offline-first, fallback quando Supabase indisponível

---

## 📝 CONVENÇÕES DO PROJETO

| Convenção | Uso | Exemplo |
|-----------|-----|---------|
| `camelCase` | Variáveis, funções, props | `spreadsheetData`, `handleExport` |
| `PascalCase` | Componentes, Interfaces, Types | `SpreadsheetView`, `SpreadsheetRow` |
| `snake_case` | Colunas do banco de dados | `responsible_qa`, `days_blocked` |
| `UPPER_CASE` | Constantes, ENUMs | `STATUS_AGENDA_OPTIONS`, `FERIADOS_BRASIL` |
| `data-testid` | Seletores para testes E2E | `data-testid="kpi-frentes"` |

---

## 🎨 PADRÃO VISUAL (TailwindCSS)

| Elemento | Classes/Valores |
|----------|-----------------|
| **Cor Corporativa Azul** | `#004e92`, `#00529b`, `text-[#004e92]` |
| **Verde Sucesso** | `#6aa84f`, `bg-[#6aa84f]`, `text-green-700` |
| **Vermelho Alerta** | `text-red-600`, `bg-red-50`, `border-red-500` |
| **Âmbar Warning** | `text-amber-500`, `bg-amber-100` |
| **Cards** | `rounded-3xl`, `shadow-2xl`, `border-slate-200` |
| **Containers** | `max-w-7xl mx-auto`, `p-12` |
| **KPI Cards** | `p-8 rounded-3xl`, `text-5xl font-black` |
| **Mini Pills** | `px-2 py-0.5 rounded font-black text-[9px] uppercase` |

---

## 🚀 COMANDOS DE DESENVOLVIMENTO

```bash
# Desenvolvimento
npm run dev          # Inicia servidor Vite (localhost:5173)
npm run build        # Build para produção
npm run preview      # Preview do build

# Qualidade de Código
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run type-check   # TypeScript check (tsc --noEmit)

# Testes
npm run test         # Vitest (unitários)
npm run test:e2e     # Playwright (E2E)

# MCP (Model Context Protocol)
npm run mcp:start         # Inicia servidor MCP
npm run mcp:start:headed  # MCP com browser visível
npm run mcp:start:debug   # MCP em modo debug
```

---

## 📌 ESTADO ATUAL (05/02/2026)

### ✅ Funcionando
- 55 testes E2E passando no Painel Executivo (100%)
- Sincronização Supabase Realtime
- Cálculo automático de dias bloqueados (dias úteis + feriados BR)
- Exportação de imagem PNG do painel executivo
- Importação/Exportação Excel
- Scan de imagem via Google Gemini AI
- Backup offline-first (localStorage)

### 🧪 Cobertura de Testes
- **Painel Executivo:** 55 testes E2E (100% real, 0 mocks)
- **Tipos:** 0 mocks - todos os testes usam dados reais

### 🔧 Variáveis de Ambiente Necessárias
```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx
VITE_GEMINI_API_KEY=xxx
```

---

## 👥 PÚBLICO-ALVO

| Perfil | Uso Principal |
|--------|---------------|
| **Analistas QA** | Gerenciamento diário de agendas e stakeholders |
| **Gestores de Projeto** | Visão executiva e monitoramento de riscos |
| **Tech Leads** | Acompanhamento de frentes técnicas |
| **Stakeholders** | Consulta de status e aprovações |

---

## 📚 DOCUMENTAÇÃO ADICIONAL

- [DOCUMENTATION.md](./DOCUMENTATION.md) - Documentação técnica completa
- [FEATURE_MAP.md](./FEATURE_MAP.md) - Mapeamento de todas as funcionalidades
- [PLAYWRIGHT_MCP.md](./PLAYWRIGHT_MCP.md) - Configuração MCP Playwright
- [README.md](../README.md) - Guia de início rápido

---

**Este documento contém todas as informações necessárias para entender completamente a arquitetura, funcionalidades, padrões e estado atual do projeto Studio QA - Cliente EBV.**
