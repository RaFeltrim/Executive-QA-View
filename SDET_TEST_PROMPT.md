# 🤖 SDET Automation Test Plan - Studio QA
## Prompt para Claude Pro com Playwright MCP

---

## Configuração Inicial

### Passo 1: Configurar Claude Desktop com MCP

Copie o arquivo `claude_desktop_config.json` para:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`

Conteúdo:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--headed"]
    }
  }
}
```

### Passo 2: Iniciar a Aplicação

```bash
cd "C:\Users\Rafael Feltrim\Downloads\studio-qa---cliente-ebv---projeto-cnpj-alfa-numerico_v1"
npm run dev
```

A aplicação estará disponível em `http://localhost:5173` (Vite) ou `http://localhost:3000`.

---

## PROMPT COMPLETO PARA CLAUDE PRO

Cole o prompt abaixo no Claude Pro após configurar o MCP:

---

```
Persona: Atue como um Engenheiro de SDET (Software Development Engineer in Test) especializado em Automação Complexa e RPA.

Task Principal: Você deve realizar um ciclo completo de testes exploratórios e de regressão no ambiente http://localhost:5173 (ou http://localhost:3000).

## ETAPA 1: Reconhecimento e Mapeamento

1. Use browser_navigate para acessar http://localhost:5173
2. Use browser_snapshot para capturar o DOM completo
3. Mapeie TODOS os elementos interativos:
   - Botões (button)
   - Inputs (input, textarea)
   - Seletores (select)
   - Checkboxes (input[type="checkbox"])
   - Links (a)
   - Tabs/Abas de navegação
   - Modais
   - Tabelas

4. Gere um dicionário de mapeamento (Page Object Model):

```typescript
const PAGE_OBJECTS = {
  sidebar: {
    spreadsheet: 'button[aria-label="Visão Planilha"]',
    executive: 'button[aria-label="Painel Executivo"]',
    stakeholders: 'button[aria-label="Mapa Stakeholders"]',
    logbook: 'button[aria-label="Diário de Bordo"]'
  },
  spreadsheet: {
    addRow: 'button:has-text("Nova Linha")',
    updateData: 'button:has-text("Atualizar Dados")',
    exportExcel: 'button:has-text("Exportar Excel")',
    syncBtn: 'button:has-text("Sincronizar")',
    table: 'table',
    rows: 'tbody tr',
    deleteBtn: 'button[aria-label="Excluir"]'
  },
  inputs: {
    product: 'input[placeholder*="Produto"]',
    stakeholder: 'input[placeholder*="Stakeholder"]',
    dateFields: 'input[type="date"]',
    selectStatus: 'select'
  }
};
```

## ETAPA 2: Análise de Projeto

Para cada aba, documente:
- Propósito da aba
- Elementos principais
- Fluxos de usuário
- Possíveis pontos de falha

### Abas para analisar:
1. **Visão Planilha** - CRUD de dados, backoffice
2. **Painel Executivo** - Dashboard com métricas/KPIs
3. **Mapa Stakeholders** - Visualização de responsáveis
4. **Diário de Bordo** - Timeline de atividades

## ETAPA 3: Stress Test de Usuário (25 Testes por Aba = 100 Total)

### 3.1 Visão Planilha (25 testes)

Execute os seguintes testes em sequência:

**Input Fuzzing (10 testes):**
1. Campo Produto vazio → Tentar salvar
2. Campo Produto com 1000 caracteres
3. Campo Produto com caracteres especiais: `<script>alert('xss')</script>`
4. Campo Produto com emojis: `🚀📊💾`
5. Campo Stakeholder com SQL injection: `'; DROP TABLE users;--`
6. Campo Data com formato inválido: `99/99/9999`
7. Campo Data com valor futuro distante: `01/01/2099`
8. Campo Dias Bloqueados com valor negativo: `-5`
9. Campo Dias Bloqueados com valor muito alto: `99999`
10. Campo Observações com 10.000 caracteres

**Fluxo de Navegação (5 testes):**
11. Adicionar linha → Navegar para outra aba → Voltar → Verificar persistência
12. Editar campo → Recarregar página → Verificar salvamento
13. Navegar rapidamente entre todas as abas 10 vezes
14. Abrir modal → Fechar com ESC → Verificar estado
15. Scroll até o fim da tabela → Adicionar linha → Verificar posição

**Edge Cases (10 testes):**
16. Adicionar 50 linhas rapidamente em sequência
17. Excluir todas as linhas → Verificar estado vazio
18. Clicar em "Atualizar Dados" sem conexão (simular offline)
19. Importar arquivo não-Excel (.txt)
20. Exportar Excel com 0 registros
21. Alterar status para "Bloqueada" sem preencher motivo
22. Preencher campos de escalation sem estar bloqueado
23. Marcar como "Fora de Escopo" → Verificar cálculos
24. Duplicar mesma linha 10 vezes
25. Tentar excluir linha durante sincronização

### 3.2 Painel Executivo (25 testes)

**Renderização (10 testes):**
26. Verificar se todos os 4 KPI cards estão visíveis
27. Verificar se barras de progresso renderizam corretamente
28. Verificar se lista de escalations carrega
29. Verificar se tabela de efetividade mostra stakeholders
30. Verificar cores dos status (verde/amarelo/vermelho)
31. Verificar responsividade em diferentes viewports
32. Verificar overflow de texto longo nos cards
33. Verificar cálculo de completude (0%, 50%, 100%)
34. Verificar contador de frentes ativas
35. Verificar nível de risco dinâmico

**Exportação (5 testes):**
36. Exportar painel como PNG
37. Verificar qualidade da imagem exportada
38. Exportar com diferentes resoluções de tela
39. Exportar painel com muitos dados
40. Exportar painel vazio

**Edge Cases (10 testes):**
41. Atualizar dados na planilha → Verificar atualização no painel
42. Adicionar escalation → Verificar lista atualizada
43. Remover escalation → Verificar lista atualizada
44. Verificar painel com 0 registros
45. Verificar painel com 500 registros
46. Scroll infinito se houver muitos itens
47. Verificar tooltips e hover states
48. Verificar animações de transição
49. Verificar acessibilidade (tab navigation)
50. Verificar contrast ratio de cores

### 3.3 Mapa Stakeholders (25 testes)

**Renderização (15 testes):**
51. Verificar se cards de stakeholders aparecem
52. Verificar agrupamento correto por stakeholder
53. Verificar se frentes estão listadas nos cards
54. Verificar cores de status nos cards
55. Verificar layout responsivo dos cards
56. Verificar hover effects nos cards
57. Verificar se cards vazios são tratados
58. Verificar ordenação dos cards
59. Verificar se dados de contato aparecem
60. Verificar se função do stakeholder aparece
61. Verificar se Tech Lead aparece
62. Verificar truncamento de nomes longos
63. Verificar cards com múltiplas frentes
64. Verificar cards com uma única frente
65. Verificar espaçamento entre cards

**Edge Cases (10 testes):**
66. Criar stakeholder com nome de 200 caracteres
67. Criar 50 stakeholders diferentes
68. Stakeholder com 20 frentes associadas
69. Stakeholder sem nenhuma frente
70. Verificar performance com muitos cards
71. Remover stakeholder → Verificar atualização
72. Alterar nome de stakeholder → Verificar merge
73. Verificar comportamento com scroll longo
74. Verificar lazy loading se aplicável
75. Verificar memória com muitos re-renders

### 3.4 Diário de Bordo (25 testes)

**Renderização (15 testes):**
76. Verificar se timeline renderiza
77. Verificar agrupamento por data
78. Verificar ordenação cronológica
79. Verificar formato de data brasileiro
80. Verificar se atividades estão listadas
81. Verificar ícones de tipo de atividade
82. Verificar cores de status
83. Verificar descrições das atividades
84. Verificar responsáveis exibidos
85. Verificar timestamps
86. Verificar filtros de período (se houver)
87. Verificar busca de atividades (se houver)
88. Verificar paginação (se houver)
89. Verificar loading state
90. Verificar empty state

**Edge Cases (10 testes):**
91. Timeline com 1000 entradas
92. Timeline vazia
93. Filtrar por data inexistente
94. Atividade com descrição de 5000 caracteres
95. Múltiplas atividades no mesmo minuto
96. Atividades de datas muito antigas (2020)
97. Atividades de datas futuras
98. Verificar scroll virtual se aplicável
99. Verificar memory leaks em atualizações
100. Verificar sincronização realtime de atividades

## OUTPUT ESPERADO

Ao final da execução, gere:

### 1. Relatório de Mapeamento
```markdown
## Elementos Mapeados

| Seletor | Tipo | Localização | Status |
|---------|------|-------------|--------|
| button.add-row | Button | SpreadsheetView | ✅ Encontrado |
| input#product | Input | SpreadsheetView | ✅ Encontrado |
...
```

### 2. Log de Execução
```markdown
## Resultados dos Testes

### Visão Planilha (25/25)
- ✅ Teste 1: Passou
- ❌ Teste 2: Falhou - Campo aceita 1000 chars sem validação
- ✅ Teste 3: Passou - XSS sanitizado
...

### Resumo
- Total: 100
- Passou: 92
- Falhou: 8
- Taxa de Sucesso: 92%
```

### 3. Bug Report Detalhado
```markdown
## BUG-001: Campo aceita entrada excessiva

**Severidade:** Média
**Componente:** SpreadsheetView
**Seletor:** input[data-field="product"]

**Expected:** Campo deve limitar entrada a 255 caracteres
**Actual:** Campo aceita 1000+ caracteres sem validação

**Passos para Reproduzir:**
1. Navegar para Visão Planilha
2. Clicar em "Nova Linha"
3. Inserir 1000 caracteres no campo Produto
4. Observar que não há validação

**Screenshot:** [anexar se possível]
**Console Errors:** Nenhum
**Network Errors:** Nenhum
```

## COMANDOS MCP A USAR

Durante a execução, use os seguintes comandos:

- `browser_navigate` - Navegar para URLs
- `browser_click` - Clicar em elementos
- `browser_type` - Digitar em campos
- `browser_snapshot` - Capturar estado do DOM
- `browser_screenshot` - Capturar screenshot
- `browser_wait` - Aguardar elemento/condição
- `browser_select` - Selecionar opção em dropdown
- `browser_hover` - Passar mouse sobre elemento
- `browser_scroll` - Rolar página
- `browser_press_key` - Pressionar tecla

## DICAS DE EXECUÇÃO

1. **Sempre aguarde o carregamento** antes de interagir
2. **Capture screenshots** em cada falha
3. **Documente erros de console** (browser_console)
4. **Verifique network errors** em cada ação crítica
5. **Use seletores robustos** (data-testid, aria-label)
6. **Execute testes em ordem** para manter estado consistente

Boa execução! 🚀
```

---

## Execução Rápida

Se preferir uma execução mais rápida, use este prompt resumido:

```
Você é um SDET. Use o Playwright MCP para:

1. Acessar http://localhost:5173
2. Mapear todos os elementos do DOM
3. Executar 25 testes em cada uma das 4 abas (Planilha, Executivo, Stakeholders, Logbook)
4. Testar: inputs inválidos, navegação rápida, edge cases
5. Gerar relatório com: elementos mapeados, resultados dos testes, bugs encontrados

Comece acessando a aplicação e mapeando os elementos.
```
