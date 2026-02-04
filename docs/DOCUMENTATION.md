# 📚 Documentação Técnica Detalhada
## Studio QA - Cliente EBV - Projeto CNPJ Alfa Numérico

---

## Sumário

1. [Introdução](#1-introdução)
2. [Arquitetura Técnica](#2-arquitetura-técnica)
3. [Componentes da Aplicação](#3-componentes-da-aplicação)
4. [Sistema de Tipos](#4-sistema-de-tipos)
5. [Camada de Serviços](#5-camada-de-serviços)
6. [Banco de Dados](#6-banco-de-dados)
7. [Integrações Externas](#7-integrações-externas)
8. [Fluxos de Dados](#8-fluxos-de-dados)
9. [Guia de Manutenção](#9-guia-de-manutenção)
10. [Extensibilidade](#10-extensibilidade)

---

## 1. Introdução

### 1.1 Propósito do Documento

Este documento fornece uma documentação técnica completa e detalhada do sistema **Studio QA**, visando facilitar a manutenção, evolução e onboarding de novos desenvolvedores.

### 1.2 Escopo

O documento cobre todos os aspectos técnicos da aplicação:
- Arquitetura de software
- Componentes React
- Sistema de tipos TypeScript
- Integração com Supabase
- Fluxos de dados e estado
- Boas práticas e padrões utilizados

### 1.3 Convenções

| Convenção | Descrição |
|-----------|-----------|
| `camelCase` | Variáveis, funções e propriedades |
| `PascalCase` | Componentes React, Interfaces, Types |
| `snake_case` | Colunas do banco de dados |
| `UPPER_CASE` | Constantes e ENUMs |

---

## 2. Arquitetura Técnica

### 2.1 Visão Geral da Arquitetura

```
┌────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                             │
│                                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│  │ Spreadsheet  │ │  Executive   │ │ Stakeholder  │ │   Logbook    │      │
│  │    View      │ │    Panel     │ │     Map      │ │    View      │      │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘      │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                              STATE MANAGEMENT                               │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                      React Hooks (useState, useMemo, useCallback)│       │
│  │                                                                   │       │
│  │  • spreadsheetData     • isOnline        • syncStatus           │       │
│  │  • activeTab           • isLoading       • isScanning           │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                              BUSINESS LOGIC                                 │
│                                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐               │
│  │ Derived Data   │  │  Event         │  │  Data          │               │
│  │ (useMemo)      │  │  Handlers      │  │  Transformers  │               │
│  │                │  │                │  │                │               │
│  │ • fronts       │  │ • updateRow    │  │ • mapFromDB    │               │
│  │ • effectiveness│  │ • addRow       │  │ • mapToDB      │               │
│  │ • escalations  │  │ • deleteRow    │  │                │               │
│  │ • stakeholder  │  │ • handleImport │  │                │               │
│  │   Map          │  │ • handleScan   │  │                │               │
│  └────────────────┘  └────────────────┘  └────────────────┘               │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                              DATA ACCESS LAYER                              │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                      supabaseService.ts                          │       │
│  │                                                                   │       │
│  │  • fetchAllData()     • updateRow()       • upsertBatch()       │       │
│  │  • insertRow()        • deleteRow()       • subscribeToChanges()│       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                             │
├────────────────────────────────────────────────────────────────────────────┤
│                              EXTERNAL SERVICES                              │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                     │
│  │   Supabase   │  │   Google     │  │   Local      │                     │
│  │   (Database) │  │   Gemini AI  │  │   Storage    │                     │
│  └──────────────┘  └──────────────┘  └──────────────┘                     │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Padrões de Projeto Utilizados

| Padrão | Aplicação |
|--------|-----------|
| **Component-Based Architecture** | Toda a UI é dividida em componentes reutilizáveis |
| **Container/Presenter** | App.tsx gerencia estado, subcomponentes apresentam dados |
| **Repository Pattern** | supabaseService.ts encapsula acesso ao banco |
| **Observer Pattern** | Realtime subscriptions do Supabase |
| **Adapter Pattern** | mapFromDB/mapToDB para conversão de dados |

### 2.3 Fluxo de Dados

```
┌─────────┐     ┌─────────┐     ┌──────────┐     ┌──────────┐
│  User   │────▶│  Event  │────▶│  State   │────▶│   UI     │
│ Action  │     │ Handler │     │  Update  │     │  Render  │
└─────────┘     └─────────┘     └──────────┘     └──────────┘
                     │
                     ▼
              ┌─────────────┐
              │  Supabase   │
              │    Sync     │
              └─────────────┘
                     │
                     ▼
              ┌─────────────┐
              │ localStorage │
              │   Backup     │
              └─────────────┘
```

---

## 3. Componentes da Aplicação

### 3.1 Hierarquia de Componentes

```
App (Root)
├── Sidebar
│   └── SidebarItem
├── Header
└── Main Content
    ├── SpreadsheetView
    │   ├── EditableInput
    │   ├── EditableSelect
    │   └── EditableBoolSelect
    ├── ExecutivePanelView
    │   └── MiniPill
    ├── MapaStakeholdersView
    └── LogbookView
```

### 3.2 Componente Principal: App.tsx

#### 3.2.1 Estado Principal

```typescript
// Estados de UI
const [activeTab, setActiveTab] = useState<'executive' | 'logbook' | 'spreadsheet' | 'stakeholders'>('spreadsheet');
const [isScanning, setIsScanning] = useState(false);
const [isUpdating, setIsUpdating] = useState(false);
const [isLoading, setIsLoading] = useState(true);

// Estados de Dados
const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetRow[]>([]);

// Estados de Conexão
const [isOnline, setIsOnline] = useState(true);
const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
```

#### 3.2.2 Ciclo de Vida e Efeitos

| Effect | Propósito | Dependências |
|--------|-----------|--------------|
| `loadData` | Carrega dados iniciais (Supabase ou localStorage) | `checkSupabaseConnection` |
| `subscribeToChanges` | Configura realtime listeners | `isOnline`, `reloadFromSupabase` |
| `persistence` | Salva backup no localStorage | `spreadsheetData` |

#### 3.2.3 Dados Derivados (useMemo)

```typescript
// Completude das frentes
const frontsCompleteness = useMemo(() => {
  // Calcula % de completude por frente
  // Campos: flowKnowledge, dataMass, gherkin, environment, approvalRequestedEmail, approvedByClient
}, [spreadsheetData]);

// Métricas de efetividade
const effectivenessData = useMemo(() => {
  // Agrupa agendas por stakeholder
  // Contabiliza: Realizadas, Pendentes, Inefetivas
}, [spreadsheetData]);

// Lista de escalations
const escalations = useMemo(() => {
  // Filtra registros com daysBlocked > 0 ou status === 'Bloqueada'
}, [spreadsheetData]);

// Mapa de stakeholders
const stakeholderMap = useMemo(() => {
  // Agrupa frentes com seus POs e Tech Leads
}, [spreadsheetData]);

// Métricas executivas
const executiveMetrics = useMemo(() => ({
  activeFronts: frontsCompleteness.filter(f => !f.outOfScope).length,
  mappedStakeholders: effectivenessData.length,
  status: 'Em Andamento',
  riskLevel: escalations.length > 3 ? 'Risco Alto' : 'Risco Controlado',
  goLiveDate: '01.JUL.2026'
}), [frontsCompleteness, effectivenessData, escalations]);
```

### 3.3 SpreadsheetView

#### Responsabilidades
- Exibição tabular dos dados
- Edição inline de campos
- Adição/remoção de linhas
- Import/Export Excel
- Scan de imagens com IA

#### Props Interface
```typescript
interface SpreadsheetViewProps {
  data: SpreadsheetRow[];
  onEdit: (id: string, field: keyof SpreadsheetRow, value: any) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onScan: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isScanning: boolean;
  onUpdateAndSave: () => void;
  isUpdating: boolean;
  onExcelImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isOnline: boolean;
  onReload: () => void;
}
```

#### Colunas da Tabela

| Coluna | Campo | Tipo | Editável |
|--------|-------|------|----------|
| Produto (Frente) | product | text | ✅ |
| Gherkin | gherkin | select (OK/NOK) | ✅ |
| Ambiente | environment | select (OK/NOK) | ✅ |
| Fluxo | flowKnowledge | select (OK/NOK) | ✅ |
| Massa | dataMass | select (OK/NOK) | ✅ |
| Fora Escopo | outOfScope | checkbox | ✅ |
| Resp. QA | responsibleQA | text | ✅ |
| Stakeholder | responsible | text | ✅ |
| Função | role | text | ✅ |
| Tech Lead | techLeadName | text | ✅ |
| Status Agenda | status | select | ✅ |
| Acionamento | contactDate | date | ✅ |
| Data Agenda | date | date | ✅ |
| Aprovação Solicitada | approvalRequestedEmail | select (SIM/Não) | ✅ |
| Aprovado pelo Cliente | approvedByClient | select (SIM/Não) | ✅ |
| Dias Bloq. | daysBlocked | number | ✅ |
| Motivo Bloqueio | escalationReason | text | ✅ |
| Prioridade | priority | select | ✅ |
| Resp. Escalation | escalationResponsible | text | ⚠️ Condicional |
| Status Escalation | escalationStatus | select | ⚠️ Condicional |
| OBS Escalation | escalationObs | text | ⚠️ Condicional |
| Observações | notes | text | ✅ |

> ⚠️ Campos de escalation só são editáveis quando `daysBlocked > 0` ou `status === 'Bloqueada'`

### 3.4 ExecutivePanelView

#### Seções

1. **Header com Métricas**
   - Frentes Ativas
   - Stakeholders Mapeados
   - Status do Projeto
   - Nível de Risco

2. **Plenitude Técnica**
   - Progress bar por frente
   - Pills de status (Fluxo, Massa, Gherkin, Ambiente, Email, Aprovação)

3. **Efetividade de Agendas**
   - Tabela por stakeholder
   - Contagem de agendas por status

4. **Monitoramento de Escalations**
   - Lista de bloqueios ativos
   - Informações de responsável e status

#### Funcionalidade de Exportação
```typescript
const handleExport = () => {
  htmlToImage.toPng(exportRef.current, { 
    quality: 1, 
    backgroundColor: '#f8fafc',
    pixelRatio: 2
  }).then((dataUrl) => {
    // Download automático da imagem
  });
};
```

### 3.5 MapaStakeholdersView

#### Estrutura
- Grid 3 colunas
- Cards por frente contendo:
  - Status (Ativo/Mapeado/Pendente)
  - Nome da Frente
  - PO responsável
  - Tech Lead

### 3.6 LogbookView

#### Seções

1. **Resumo de Status**
   - Contadores coloridos por status

2. **Timeline de Atividades Recentes**
   - Últimas 15 atividades ordenadas por data
   - Indicador visual de status

3. **Agrupamento por QA**
   - Progress bar de realizadas
   - Contadores por status

---

## 4. Sistema de Tipos

### 4.1 Enums

```typescript
export enum TaskStatus {
  PENDING = 'Pendente',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluído',
  BLOCKED = 'Bloqueado'
}
```

### 4.2 Interfaces Principais

#### SpreadsheetRow
```typescript
export interface SpreadsheetRow {
  // Identificação única
  id: string;
  
  // Metadata & Tracking
  contactDate?: string;      // Data de acionamento
  date: string;              // Data da agenda
  status: string;            // Status: Pendente | Realizada | Inefetiva | Bloqueada
  responsibleQA: string;     // QA responsável
  
  // Detalhes do Produto/Frente
  product: string;           // Nome da frente
  flowKnowledge?: 'OK' | 'NOK' | '';    // Conhecimento do fluxo
  dataMass?: 'OK' | 'NOK' | '';         // Massa de dados
  gherkin?: 'OK' | 'NOK' | '';          // Gherkin pronto
  environment?: 'OK' | 'NOK' | '';      // Acesso ao ambiente
  outOfScope?: boolean;      // Fora de escopo
  
  // Detalhes do Stakeholder
  responsible: string;       // Nome do stakeholder
  role: string;              // Função
  techLeadName?: string;     // Tech Lead
  
  // Aprovações
  approvalRequestedEmail?: 'SIM' | 'Não' | '';
  approvedByClient?: 'SIM' | 'Não' | '';
  
  // Bloqueio & Escalation
  daysBlocked?: number;
  priority?: string;         // Alta | Media | Baixa
  escalationReason?: string;
  escalationResponsible?: string;
  escalationStatus?: string;
  escalationObs?: string;
  notes: string;
}
```

#### EffectivenessMetric
```typescript
export interface EffectivenessMetric {
  person: string;                    // Nome do stakeholder
  conductedAgendas: number;          // Agendas realizadas
  pendingAgendas: number;            // Agendas pendentes
  ineffectiveAgendas: number;        // Agendas inefetivas
  incompleteAgendas: number;         // Agendas incompletas
  status: 'Critical' | 'Warning' | 'On Track';
}
```

#### FrontCompleteness
```typescript
export interface FrontCompleteness {
  frontName: string;
  flowKnowledge: boolean;
  dataMassInfo: boolean;
  gherkinReady: boolean;
  envAccess: boolean;
  approvalRequestedEmail: boolean;
  approvedByClient: boolean;
  completionPercentage: number;      // 0-100
  outOfScope?: boolean;
}
```

#### EscalationItem
```typescript
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
```

#### FrontStakeholderMapping
```typescript
export interface FrontStakeholderMapping {
  frontName: string;
  po: StakeholderRef;
  techLead: StakeholderRef;
  status: 'Ativo' | 'Mapeado' | 'Pendente';
}

export interface StakeholderRef {
  name: string;
  role: string;
}
```

---

## 5. Camada de Serviços

### 5.1 supabaseClient.ts

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const QA_TABLE = 'qa_spreadsheet_data';
```

### 5.2 supabaseService.ts

#### Mapeamento de Campos

| App (camelCase) | DB (snake_case) |
|-----------------|-----------------|
| contactDate | contact_date |
| responsibleQA | responsible_qa |
| flowKnowledge | flow_knowledge |
| dataMass | data_mass |
| outOfScope | out_of_scope |
| techLeadName | tech_lead_name |
| approvalRequestedEmail | approval_requested_email |
| approvedByClient | approved_by_client |
| daysBlocked | days_blocked |
| escalationReason | escalation_reason |
| escalationResponsible | escalation_responsible |
| escalationStatus | escalation_status |
| escalationObs | escalation_obs |

#### Funções Disponíveis

##### fetchAllData
```typescript
export const fetchAllData = async (): Promise<SpreadsheetRow[]> => {
  const { data, error } = await supabase
    .from(QA_TABLE)
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return (data || []).map(mapFromDB);
};
```

##### insertRow
```typescript
export const insertRow = async (row: SpreadsheetRow): Promise<SpreadsheetRow> => {
  const { data, error } = await supabase
    .from(QA_TABLE)
    .insert(mapToDB(row))
    .select()
    .single();
  
  if (error) throw error;
  return mapFromDB(data);
};
```

##### updateRow
```typescript
export const updateRow = async (id: string, updates: Partial<SpreadsheetRow>): Promise<void> => {
  // Mapeia apenas campos alterados
  const dbUpdates = mapPartialToDB(updates);
  
  const { error } = await supabase
    .from(QA_TABLE)
    .update(dbUpdates)
    .eq('id', id);
  
  if (error) throw error;
};
```

##### deleteRow
```typescript
export const deleteRow = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from(QA_TABLE)
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
```

##### upsertBatch
```typescript
export const upsertBatch = async (rows: SpreadsheetRow[]): Promise<void> => {
  const dbRows = rows.map(mapToDB);
  
  const { error } = await supabase
    .from(QA_TABLE)
    .upsert(dbRows, { onConflict: 'id' });
  
  if (error) throw error;
};
```

##### subscribeToChanges
```typescript
export const subscribeToChanges = (
  onInsert: (row: SpreadsheetRow) => void,
  onUpdate: (row: SpreadsheetRow) => void,
  onDelete: (id: string) => void,
  onBulkChange?: () => void
) => {
  // Detecta bulk operations (muitos deletes em sequência)
  // Retorna função de unsubscribe
};
```

---

## 6. Banco de Dados

### 6.1 Schema SQL

```sql
CREATE TABLE IF NOT EXISTS qa_spreadsheet_data (
  -- Identificação
  id TEXT PRIMARY KEY,
  
  -- Metadata & Tracking
  contact_date TEXT,
  date TEXT,
  status TEXT DEFAULT 'Pendente',
  responsible_qa TEXT,
  
  -- Product / Front Details
  product TEXT,
  flow_knowledge TEXT,
  data_mass TEXT,
  gherkin TEXT,
  environment TEXT,
  out_of_scope BOOLEAN DEFAULT FALSE,
  
  -- Stakeholder Details
  responsible TEXT,
  role TEXT,
  tech_lead_name TEXT,
  
  -- Approval Details
  approval_requested_email TEXT,
  approved_by_client TEXT,
  
  -- Blockage & Escalation
  days_blocked INTEGER DEFAULT 0,
  priority TEXT DEFAULT 'Media',
  escalation_reason TEXT,
  escalation_responsible TEXT,
  escalation_status TEXT,
  escalation_obs TEXT,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Índices

```sql
CREATE INDEX IF NOT EXISTS idx_qa_product ON qa_spreadsheet_data(product);
CREATE INDEX IF NOT EXISTS idx_qa_status ON qa_spreadsheet_data(status);
CREATE INDEX IF NOT EXISTS idx_qa_responsible ON qa_spreadsheet_data(responsible);
```

### 6.3 Row Level Security

```sql
ALTER TABLE qa_spreadsheet_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to qa_spreadsheet_data" ON qa_spreadsheet_data
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 6.4 Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE qa_spreadsheet_data;
```

### 6.5 Trigger de Updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_qa_spreadsheet_data_updated_at
  BEFORE UPDATE ON qa_spreadsheet_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 7. Integrações Externas

### 7.1 Google Gemini AI

#### Configuração
```typescript
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_GEMINI_API_KEY 
});
```

#### Uso para Scan de Imagens
```typescript
const handleAIScan = async (event) => {
  const file = event.target.files?.[0];
  
  // Converter para base64
  const base64Data = await fileToBase64(file);
  
  // Enviar para Gemini
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: [{
      parts: [
        { inlineData: { data: base64Data, mimeType: file.type } },
        { text: `Extraia as frentes de trabalho...` }
      ]
    }],
    config: {
      responseMimeType: "application/json"
    }
  });
  
  // Processar resultado
  const extractedData = JSON.parse(response.text || '[]');
};
```

### 7.2 XLSX (Import/Export Excel)

#### Importação
```typescript
const handleExcelImport = (event) => {
  const file = event.target.files?.[0];
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const workbook = XLSX.read(data, { type: 'array' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(worksheet);
    
    // Mapear colunas
    const mappedData = json.map(mapExcelRowToSpreadsheetRow);
  };
  reader.readAsArrayBuffer(file);
};
```

#### Exportação
```typescript
const handleExcelExport = () => {
  const exportData = data.map(row => ({
    'Produto (Frente)': row.product,
    // ... outros campos
  }));
  
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'QA Data');
  XLSX.writeFile(workbook, `StudioQA_Export_${date}.xlsx`);
};
```

### 7.3 html-to-image

```typescript
import * as htmlToImage from 'html-to-image';

const handleExport = () => {
  htmlToImage.toPng(exportRef.current, { 
    quality: 1, 
    backgroundColor: '#f8fafc',
    pixelRatio: 2  // Alta resolução
  }).then((dataUrl) => {
    const link = document.createElement('a');
    link.download = 'EBV-Executive-Panel.png';
    link.href = dataUrl;
    link.click();
  });
};
```

---

## 8. Fluxos de Dados

### 8.1 Fluxo de Carregamento Inicial

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE CARREGAMENTO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. App monta                                                   │
│     │                                                           │
│     ▼                                                           │
│  2. useEffect executa loadData()                                │
│     │                                                           │
│     ▼                                                           │
│  3. checkSupabaseConnection()                                   │
│     │                                                           │
│     ├──── Online ────▶ fetchAllData()                          │
│     │                    │                                      │
│     │                    ├── Dados existem ──▶ setSpreadsheetData│
│     │                    │                                      │
│     │                    └── DB vazio ──▶ Carregar localStorage │
│     │                                       ou INITIAL_DATA     │
│     │                                       + upsertBatch()     │
│     │                                                           │
│     └──── Offline ───▶ Carregar localStorage                   │
│                         ou INITIAL_DATA                         │
│                                                                  │
│  4. setIsLoading(false)                                         │
│                                                                  │
│  5. Configurar Realtime subscriptions                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Fluxo de Edição de Campo

```
┌─────────────────────────────────────────────────────────────────┐
│                     FLUXO DE EDIÇÃO                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Usuário edita campo na tabela                               │
│     │                                                           │
│     ▼                                                           │
│  2. onChange dispara onEdit(id, field, value)                   │
│     │                                                           │
│     ▼                                                           │
│  3. updateRow atualiza estado local                             │
│     setSpreadsheetData(prev => prev.map(...))                   │
│     │                                                           │
│     ├──── Online ────▶ dbUpdateRow(id, {[field]: value})       │
│     │                    │                                      │
│     │                    └──▶ Supabase atualiza DB              │
│     │                         │                                 │
│     │                         └──▶ Realtime notifica outros     │
│     │                                                           │
│     └──── Offline ───▶ Dados ficam apenas no estado            │
│                                                                  │
│  4. useEffect de persistência salva no localStorage             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Fluxo de Importação Excel

```
┌─────────────────────────────────────────────────────────────────┐
│                   FLUXO DE IMPORTAÇÃO EXCEL                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Usuário seleciona arquivo .xlsx                             │
│     │                                                           │
│     ▼                                                           │
│  2. FileReader lê como ArrayBuffer                              │
│     │                                                           │
│     ▼                                                           │
│  3. XLSX.read() parseia workbook                                │
│     │                                                           │
│     ▼                                                           │
│  4. XLSX.utils.sheet_to_json() extrai dados                     │
│     │                                                           │
│     ▼                                                           │
│  5. Mapear colunas do Excel para SpreadsheetRow                 │
│     │                                                           │
│     ▼                                                           │
│  6. Confirmar substituição com usuário                          │
│     │                                                           │
│     ▼                                                           │
│  7. setSpreadsheetData(mappedData)                              │
│     │                                                           │
│     ▼                                                           │
│  8. localStorage.setItem('ebv_qa_data', JSON.stringify(...))    │
│     │                                                           │
│     ├──── Online ────▶ deleteAllRows()                         │
│     │                   insertBatch(mappedData)                 │
│     │                                                           │
│     └──── Offline ───▶ Dados apenas locais                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Guia de Manutenção

### 9.1 Adicionando Novos Campos

#### Passo 1: Atualizar Interface TypeScript
```typescript
// types.ts
export interface SpreadsheetRow {
  // ... campos existentes
  novoCampo?: string;
}
```

#### Passo 2: Atualizar Schema do Banco
```sql
ALTER TABLE qa_spreadsheet_data ADD COLUMN novo_campo TEXT;
```

#### Passo 3: Atualizar Mapeamentos
```typescript
// supabaseService.ts
const mapFromDB = (row: any): SpreadsheetRow => ({
  // ... campos existentes
  novoCampo: row.novo_campo || ''
});

const mapToDB = (row: SpreadsheetRow): any => ({
  // ... campos existentes
  novo_campo: row.novoCampo
});

// Atualizar updateRow para mapear o novo campo
if (updates.novoCampo !== undefined) dbUpdates.novo_campo = updates.novoCampo;
```

#### Passo 4: Adicionar Coluna na Tabela
```tsx
// App.tsx - SpreadsheetView
<th className="...">Novo Campo</th>

<td className="...">
  <EditableInput 
    value={row.novoCampo || ''} 
    onChange={(v) => onEdit(row.id, 'novoCampo', v)} 
  />
</td>
```

#### Passo 5: Atualizar Import/Export Excel
```typescript
// Importação
novoCampo: row['Novo Campo'] || row['novoCampo'] || ''

// Exportação
'Novo Campo': row.novoCampo
```

### 9.2 Adicionando Nova Visualização (Aba)

#### Passo 1: Atualizar Tipo de Tab
```typescript
const [activeTab, setActiveTab] = useState<
  'executive' | 'logbook' | 'spreadsheet' | 'stakeholders' | 'novaAba'
>('spreadsheet');
```

#### Passo 2: Adicionar Item no Sidebar
```tsx
<SidebarItem id="novaAba" icon={<IconComponent size={20} />} label="Nova Aba" />
```

#### Passo 3: Criar Componente
```tsx
const NovaAbaView: React.FC<{ data: SpreadsheetRow[] }> = ({ data }) => {
  return (
    <div>
      {/* Implementação */}
    </div>
  );
};
```

#### Passo 4: Adicionar Renderização Condicional
```tsx
{activeTab === 'novaAba' && <NovaAbaView data={spreadsheetData} />}
```

### 9.3 Atualizando Dependências

```bash
# Verificar versões desatualizadas
npm outdated

# Atualizar uma dependência específica
npm update nome-pacote

# Atualizar todas as dependências
npm update

# Atualizar para major versions (cuidado!)
npm install nome-pacote@latest
```

### 9.4 Debug e Logs

```typescript
// Adicionar logs em funções críticas
console.log('[supabaseService] fetchAllData iniciado');
console.log('[supabaseService] fetchAllData resultado:', data);
console.error('[supabaseService] Erro:', error);
```

---

## 10. Extensibilidade

### 10.1 Pontos de Extensão

| Área | Como Estender |
|------|---------------|
| **Novos Campos** | Seguir guia na seção 9.1 |
| **Novas Visualizações** | Seguir guia na seção 9.2 |
| **Novos Filtros** | Adicionar useMemo com lógica de filtro |
| **Novas Métricas** | Adicionar cálculos em useMemo |
| **Novas Integrações** | Criar arquivo de serviço separado |

### 10.2 Considerações de Performance

1. **useMemo**: Usar para cálculos derivados pesados
2. **useCallback**: Usar para funções passadas como props
3. **Paginação**: Considerar para datasets muito grandes
4. **Debounce**: Adicionar em campos de busca/filtro

### 10.3 Testes Recomendados

```typescript
// Exemplo de estrutura de testes
describe('SpreadsheetRow', () => {
  it('deve mapear corretamente de DB para App', () => {
    const dbRow = { id: '1', product: 'Test', flow_knowledge: 'OK' };
    const result = mapFromDB(dbRow);
    expect(result.flowKnowledge).toBe('OK');
  });
});

describe('frontsCompleteness', () => {
  it('deve calcular 100% quando todos os campos são OK', () => {
    // ...
  });
});
```

---

## Apêndice A: Glossário

| Termo | Definição |
|-------|-----------|
| **Frente** | Área/módulo do projeto (ex: Portal Transacional) |
| **Stakeholder** | Pessoa responsável por uma frente |
| **PO** | Product Owner |
| **TL** | Tech Lead |
| **Gherkin** | Formato de especificação de cenários de teste |
| **Escalation** | Processo de escalonamento de bloqueios |
| **Massa de Dados** | Dados necessários para execução de testes |

---

## Apêndice B: Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Sim (para sync) |
| `VITE_SUPABASE_ANON_KEY` | Chave anônima do Supabase | Sim (para sync) |
| `VITE_GEMINI_API_KEY` | API Key do Google Gemini | Não (para scan IA) |

---

<div align="center">

**Documentação Técnica - Studio QA**

Versão 1.0 | Fevereiro 2026

</div>
