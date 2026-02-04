# 📊 Studio QA - Cliente EBV - Projeto CNPJ Alfa Numérico

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Status](https://img.shields.io/badge/status-Em%20Produção-green.svg)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-3178C6.svg)
![Supabase](https://img.shields.io/badge/Supabase-2.45.0-3ECF8E.svg)

**Sistema de Gestão de Qualidade para Mapeamento de Stakeholders e Controle de Frentes de Trabalho**

</div>

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Instalação e Configuração](#-instalação-e-configuração)
- [Funcionalidades](#-funcionalidades)
- [Modelo de Dados](#-modelo-de-dados)
- [Integração Supabase](#-integração-supabase)
- [Guia de Uso](#-guia-de-uso)
- [Manutenção](#-manutenção)
- [Troubleshooting](#-troubleshooting)
- [Changelog](#-changelog)
- [Contato e Suporte](#-contato-e-suporte)

---

## 🎯 Visão Geral

O **Studio QA** é uma aplicação web corporativa desenvolvida para o cliente **EBV** no contexto do projeto **CNPJ Alfa Numérico**. O sistema oferece uma solução completa para:

- ✅ Gestão de mapeamento de stakeholders
- ✅ Controle de frentes de trabalho de QA
- ✅ Monitoramento de escalations e bloqueios
- ✅ Painel executivo com métricas em tempo real
- ✅ Diário de bordo para acompanhamento de atividades
- ✅ Sincronização em tempo real via Supabase

### Público-Alvo

| Perfil | Uso Principal |
|--------|---------------|
| **Analistas QA** | Gerenciamento diário de agendas e stakeholders |
| **Gestores de Projeto** | Visão executiva e monitoramento de riscos |
| **Tech Leads** | Acompanhamento de frentes técnicas |
| **Stakeholders** | Consulta de status e aprovações |

---

## 🏗 Arquitetura do Sistema

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

### Padrão de Comunicação

1. **Offline-First**: Dados são salvos localmente (localStorage) como backup
2. **Real-time Sync**: Sincronização automática via Supabase Realtime
3. **Fallback Gracioso**: Funciona em modo offline com dados locais

---

## 🛠 Tecnologias Utilizadas

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 19.2.4 | Framework UI |
| **TypeScript** | 5.8.2 | Tipagem estática |
| **Vite** | 6.2.0 | Build tool e dev server |
| **Tailwind CSS** | CDN | Estilização |
| **Lucide React** | 0.563.0 | Ícones |

### Backend/Infraestrutura
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Supabase** | 2.45.0 | BaaS (Database + Realtime) |
| **PostgreSQL** | - | Banco de dados |

### Utilitários
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **xlsx** | 0.18.5 | Import/Export Excel |
| **html-to-image** | 1.11.11 | Exportação de painéis |
| **@google/genai** | 1.39.0 | IA para scan de imagens |

---

## 📁 Estrutura do Projeto

```
studio-qa---cliente-ebv---projeto-cnpj-alfa-numerico_v1/
│
├── 📄 App.tsx                    # Componente principal da aplicação
├── 📄 index.tsx                  # Entry point React
├── 📄 index.html                 # Template HTML
│
├── 📄 types.ts                   # Definições de tipos TypeScript
├── 📄 constants.tsx              # Dados iniciais e constantes
│
├── 📄 supabaseClient.ts          # Configuração do cliente Supabase
├── 📄 supabaseService.ts         # Serviços de acesso ao banco
├── 📄 supabase-schema.sql        # Schema do banco de dados
│
├── 📄 vite.config.ts             # Configuração do Vite
├── 📄 tsconfig.json              # Configuração TypeScript
├── 📄 package.json               # Dependências do projeto
├── 📄 metadata.json              # Metadados do projeto
│
├── 📄 README.md                  # Este arquivo
├── 📄 DOCUMENTATION.md           # Documentação técnica detalhada
└── 📄 RELATORIO_CORPORATIVO.md   # Relatório executivo do projeto
```

---

## ⚙️ Instalação e Configuração

### Pré-requisitos

- Node.js >= 18.x
- NPM >= 9.x
- Conta no Supabase (para sincronização em nuvem)

### Passo a Passo

#### 1. Clone o Repositório
```bash
git clone <repository-url>
cd studio-qa---cliente-ebv---projeto-cnpj-alfa-numerico_v1
```

#### 2. Instale as Dependências
```bash
npm install
```

#### 3. Configure as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Google AI (para funcionalidade de scan)
VITE_GEMINI_API_KEY=sua-chave-gemini
```

#### 4. Configure o Banco de Dados
Execute o script SQL no console do Supabase:
```bash
# Copie o conteúdo de supabase-schema.sql e execute no SQL Editor do Supabase
```

#### 5. Inicie o Servidor de Desenvolvimento
```bash
npm run dev
```
O aplicativo estará disponível em `http://localhost:3000`

### Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Gera build de produção |
| `npm run preview` | Preview do build de produção |

---

## 🚀 Funcionalidades

### 1. Visão Planilha (Base de Dados)
- ✏️ Edição inline de todos os campos
- ➕ Adição de novas linhas
- 🗑️ Exclusão de registros
- 📥 Importação de Excel
- 📤 Exportação para Excel
- 🤖 Scan de imagens com IA (Gemini)
- 🔄 Sincronização em tempo real

### 2. Painel Executivo
- 📊 Métricas consolidadas (Frentes Ativas, Stakeholders)
- 📈 Plenitude técnica por frente
- 👥 Efetividade de agendas por stakeholder
- ⚠️ Monitoramento de escalations
- 🖼️ Exportação como imagem PNG

### 3. Mapa de Stakeholders
- 🗺️ Visualização de frentes x stakeholders
- 👤 Identificação de POs e Tech Leads
- 🏷️ Status de mapeamento

### 4. Diário de Bordo QA
- 📅 Timeline de atividades recentes
- 👥 Agrupamento por responsável QA
- 📊 Resumo de status

---

## 📊 Modelo de Dados

### Entidade Principal: `SpreadsheetRow`

```typescript
interface SpreadsheetRow {
  // Identificação
  id: string;
  
  // Tracking
  contactDate?: string;        // Data de acionamento
  date: string;                // Data da agenda
  status: string;              // Pendente | Realizada | Inefetiva | Bloqueada
  responsibleQA: string;       // Responsável QA
  
  // Produto/Frente
  product: string;             // Nome da frente
  flowKnowledge?: 'OK' | 'NOK' | '';   // Conhecimento do fluxo
  dataMass?: 'OK' | 'NOK' | '';        // Massa de dados
  gherkin?: 'OK' | 'NOK' | '';         // Gherkin
  environment?: 'OK' | 'NOK' | '';     // Ambiente
  outOfScope?: boolean;        // Fora de escopo
  
  // Stakeholder
  responsible: string;         // Nome do stakeholder
  role: string;                // Função
  techLeadName?: string;       // Tech Lead
  
  // Aprovações
  approvalRequestedEmail?: 'SIM' | 'Não' | '';
  approvedByClient?: 'SIM' | 'Não' | '';
  
  // Escalation
  daysBlocked?: number;        // Dias bloqueado
  priority?: string;           // Alta | Media | Baixa
  escalationReason?: string;   // Motivo
  escalationResponsible?: string;
  escalationStatus?: string;
  escalationObs?: string;
  notes: string;               // Observações gerais
}
```

---

## 🔌 Integração Supabase

### Configuração da Tabela

O schema completo está em `supabase-schema.sql`. Principais características:

- **RLS (Row Level Security)**: Habilitado para controle de acesso
- **Realtime**: Habilitado para sincronização automática
- **Índices**: Otimizados para consultas frequentes
- **Triggers**: Atualização automática de `updated_at`

### Funções de Serviço

| Função | Descrição |
|--------|-----------|
| `fetchAllData()` | Busca todos os registros |
| `insertRow(row)` | Insere novo registro |
| `updateRow(id, updates)` | Atualiza registro existente |
| `deleteRow(id)` | Remove registro |
| `upsertBatch(rows)` | Upsert em lote |
| `deleteAllRows()` | Limpa toda a tabela |
| `subscribeToChanges()` | Assina mudanças em tempo real |

---

## 📖 Guia de Uso

### Fluxo de Trabalho Típico

1. **Acessar Visão Planilha** - Gerenciar dados base
2. **Importar/Cadastrar** - Via Excel ou manualmente
3. **Editar registros** - Inline na tabela
4. **Salvar/Sincronizar** - Botão "Atualizar Dados"
5. **Verificar Painel** - Visão executiva
6. **Tratar Escalations** - Monitorar bloqueios
7. **Exportar** - Excel ou imagem PNG

### Dicas de Produtividade

1. **Importação em Massa**: Use o Excel para cadastrar múltiplos registros
2. **Scan IA**: Upload de screenshots de dashboards para extração automática
3. **Sincronização**: Mantenha a conexão online para sync em tempo real
4. **Backup**: Dados são salvos localmente automaticamente

---

## 🔧 Manutenção

### Logs e Monitoramento

- Erros são logados no console do navegador
- Status de conexão visível no header (Online/Offline)
- Indicador de sincronização (Sincronizado/Sincronizando/Erro)

### Backup de Dados

Dados são automaticamente salvos em:
- **localStorage**: `ebv_qa_data`
- **Supabase**: Tabela `qa_spreadsheet_data`

### Atualização de Dependências

```bash
# Verificar atualizações
npm outdated

# Atualizar dependências
npm update
```

---

## ❓ Troubleshooting

### Problemas Comuns

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| Dados não sincronizam | Conexão offline | Verificar internet e credenciais Supabase |
| Importação Excel falha | Formato incorreto | Verificar colunas do template |
| Scan IA não funciona | API Key inválida | Verificar VITE_GEMINI_API_KEY |
| Tela em branco | Erro de build | Verificar console e reinstalar dependências |

### Limpeza de Cache

```bash
# Limpar localStorage (no console do navegador)
localStorage.removeItem('ebv_qa_data')

# Reinstalar dependências
rm -rf node_modules
npm install
```

---

## 📝 Changelog

### v1.0.0 (2026-02-04)
- ✨ Release inicial
- 🎨 Interface completa com 4 visualizações
- 🔌 Integração Supabase com Realtime
- 📥 Import/Export Excel
- 🤖 Scan de imagens com Gemini AI
- 📊 Painel executivo com exportação

---

## 📞 Contato e Suporte

### Equipe de Desenvolvimento

| Nome | Função | Contato |
|------|--------|---------|
| QA Automation | Desenvolvimento | - |

### Links Úteis

- **Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
- **Documentação React**: [https://react.dev](https://react.dev)
- **Vite**: [https://vitejs.dev](https://vitejs.dev)

---

<div align="center">

**Studio QA - Cliente EBV - Projeto CNPJ Alfa Numérico**

© 2026 - Todos os direitos reservados

</div>
