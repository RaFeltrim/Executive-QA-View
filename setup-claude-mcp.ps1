# Script para configurar o Claude Desktop com Playwright MCP
# Execute como Administrador se necessário

$configPath = "$env:APPDATA\Claude"
$configFile = "$configPath\claude_desktop_config.json"

# Criar diretório se não existir
if (-not (Test-Path $configPath)) {
    New-Item -ItemType Directory -Path $configPath -Force
    Write-Host "✅ Diretório criado: $configPath" -ForegroundColor Green
}

# Configuração do MCP
$mcpConfig = @{
    mcpServers = @{
        playwright = @{
            command = "npx"
            args = @("@playwright/mcp@latest", "--headed")
        }
    }
} | ConvertTo-Json -Depth 4

# Salvar configuração
$mcpConfig | Out-File -FilePath $configFile -Encoding UTF8
Write-Host "✅ Configuração salva em: $configFile" -ForegroundColor Green

# Verificar
Write-Host ""
Write-Host "📋 Configuração atual:" -ForegroundColor Cyan
Get-Content $configFile

Write-Host ""
Write-Host "🚀 Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Feche o Claude Desktop completamente"
Write-Host "2. Inicie a aplicação: npm run dev"
Write-Host "3. Abra o Claude Desktop novamente"
Write-Host "4. O MCP 'playwright' deve aparecer disponível"
Write-Host ""
Write-Host "📝 Cole o prompt do arquivo SDET_TEST_PROMPT.md no Claude Pro"
