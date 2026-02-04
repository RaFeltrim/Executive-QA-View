# 🤖 Playwright MCP - Guia de Integração

## O que é o Playwright MCP?

O **Playwright MCP** (Model Context Protocol) é uma ferramenta que permite que agentes de IA controlem um navegador web de forma programática. Isso possibilita automação de testes E2E, web scraping inteligente e interações complexas com aplicações web.

## 📦 Instalação

O pacote já está instalado no projeto:

```bash
npm install @playwright/mcp --save-dev
```

## 🚀 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run mcp:start` | Inicia o servidor MCP (headless) |
| `npm run mcp:start:headed` | Inicia o servidor MCP com browser visível |
| `npm run mcp:start:debug` | Inicia em modo debug com browser visível |
| `npm run test:e2e:mcp` | Executa testes E2E específicos do MCP |

## 📁 Estrutura de Arquivos

```
project/
├── mcp.config.json           # Configuração do MCP Server
├── playwright-mcp.config.ts  # Configuração TypeScript detalhada
└── tests/
    └── mcp/
        ├── mcp-helpers.ts    # Utilitários e helpers
        └── mcp-e2e.spec.ts   # Testes E2E (25 cenários)
```

## 🔧 Configuração

### mcp.config.json

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false",
        "PLAYWRIGHT_BROWSER": "chromium"
      }
    }
  }
}
```

### Variáveis de Ambiente

| Variável | Descrição | Default |
|----------|-----------|---------|
| `PLAYWRIGHT_HEADLESS` | Executar sem UI | `true` |
| `PLAYWRIGHT_BROWSER` | Browser a usar | `chromium` |
| `BASE_URL` | URL da aplicação | `http://localhost:5173` |

## 🧪 Testes Implementados

Os **25 cenários de teste** estão organizados por área:

### SpreadsheetView (10 testes)
- TC-001 a TC-008: CRUD, Import/Export, Sync

### ExecutivePanelView (4 testes)
- TC-009 a TC-012: KPIs, Completude, Escalations, Export

### MapaStakeholdersView (2 testes)
- TC-013 a TC-014: Cards, Agrupamento

### LogbookView (2 testes)
- TC-015 a TC-016: Timeline, Agrupamento

### Navigation (1 teste)
- TC-017: Navegação entre abas

### Synchronization (3 testes)
- TC-018 a TC-020: Online, Persistência, Realtime

### Bug Fixes v1.1.0 (5 testes)
- TC-021 a TC-025: Regressão dos bugs corrigidos

## 🎯 Executando os Testes

```bash
# Iniciar a aplicação primeiro
npm run dev

# Em outro terminal, executar os testes MCP
npm run test:e2e:mcp

# Ou com UI do Playwright
npm run test:e2e:ui
```

## 🛠️ Helpers Disponíveis

O arquivo `mcp-helpers.ts` fornece métodos úteis:

```typescript
// Navegação
await mcpHelpers.navigateToTab('executive');

// CRUD
await mcpHelpers.addNewRow();
await mcpHelpers.fillEditableField(0, 'product', 'Novo Produto');
await mcpHelpers.selectDropdownValue(0, 'status', 'Realizada');
await mcpHelpers.deleteRow(0);

// Export/Import
const download = await mcpHelpers.exportToExcel();
await mcpHelpers.importExcel('./data.xlsx');

// Sync
await mcpHelpers.updateData();
const status = await mcpHelpers.getSyncStatus();

// Utilitários
const count = await mcpHelpers.getRowCount();
const isOnline = await mcpHelpers.isOnline();
await mcpHelpers.takeScreenshot('test-name');
```

## 🔐 Segurança

O MCP está configurado com:

- **URLs Permitidas**: Apenas localhost e Supabase
- **Ações Bloqueadas**: `page.evaluate` está bloqueado por segurança
- **Timeouts**: 30s navegação, 10s ação, 5s assertion

## 📊 Relatórios

Os resultados são salvos em:

```
test-reports/
├── screenshots/     # Screenshots dos testes
├── traces/         # Traces do Playwright
└── videos/         # Vídeos (se habilitado)
```

## 🤝 Integração com Claude/Copilot

O MCP Server pode ser usado com agentes de IA:

```bash
# Inicia o servidor MCP
npm run mcp:start:headed

# O agente pode então enviar comandos como:
# - browser_navigate: Navegar para URL
# - browser_click: Clicar em elemento
# - browser_fill: Preencher campo
# - browser_screenshot: Capturar tela
```

---

*Documentação criada em: Fevereiro 2026*
*Versão: 1.1.0*
