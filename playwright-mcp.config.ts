/**
 * Playwright MCP Server Configuration
 * ====================================
 * 
 * Este arquivo configura o servidor MCP do Playwright para automação de browser.
 * O MCP (Model Context Protocol) permite que agentes de IA controlem o browser
 * de forma programática através de uma API padronizada.
 * 
 * @see https://github.com/anthropics/anthropic-mcp
 * @see https://github.com/playwright-community/mcp
 */

import { PlaywrightMCPConfig } from '@playwright/mcp';

const config: PlaywrightMCPConfig = {
  // Configurações do Browser
  browser: {
    type: 'chromium',
    headless: process.env.CI === 'true',
    viewport: {
      width: 1920,
      height: 1080
    },
    timeout: 30000
  },

  // Configurações do Servidor MCP
  server: {
    port: 3100,
    host: 'localhost'
  },

  // Configurações de Captura
  screenshot: {
    path: './test-reports/screenshots',
    fullPage: true
  },

  // Configurações de Trace
  trace: {
    enabled: true,
    path: './test-reports/traces'
  },

  // Configurações de Video
  video: {
    enabled: false,
    path: './test-reports/videos'
  },

  // URLs Permitidas (Whitelist)
  allowedUrls: [
    'http://localhost:*',
    'https://localhost:*',
    'http://127.0.0.1:*',
    'https://*.supabase.co/*'
  ],

  // Ações Bloqueadas (Segurança)
  blockedActions: [
    'page.evaluate', // Bloquear execução de código arbitrário
  ],

  // Timeouts
  timeouts: {
    navigation: 30000,
    action: 10000,
    assertion: 5000
  }
};

export default config;
