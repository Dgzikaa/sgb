# setup-sgb.ps1
Write-Host "=== SGB_V2 - Script de Setup Inicial ===" -ForegroundColor Cyan

# 1. Checar se está na pasta correta
if (!(Test-Path "./frontend") -or !(Test-Path "./backend")) {
    Write-Host "ERRO: Execute este script na raiz da pasta SGB_V2 (onde estão as pastas frontend e backend)." -ForegroundColor Red
    exit 1
}

# 2. Checar Node.js
if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: Node.js não encontrado. Instale o Node.js antes de continuar: https://nodejs.org/" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Node.js encontrado: $(node -v)" -ForegroundColor Green
}

# 3. Checar npx
if (!(Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: npx não encontrado. Instale o Node.js (inclui npx) antes de continuar." -ForegroundColor Red
    exit 1
} else {
    Write-Host "npx encontrado: $(npx -v)" -ForegroundColor Green
}

# 4. Checar Deno
if (!(Get-Command deno -ErrorAction SilentlyContinue)) {
    Write-Host "ERRO: Deno não encontrado. Instale o Deno: https://deno.com/manual/getting_started/installation" -ForegroundColor Red
    exit 1
} else {
    Write-Host "Deno encontrado: $(deno --version | Select-String 'deno')"
}

# 5. Instalar dependências do frontend
Write-Host "`n--- Instalando dependências do FRONTEND ---" -ForegroundColor Yellow
cd ./frontend
if (Test-Path "node_modules") {
    Write-Host "node_modules já existe, pulando instalação." -ForegroundColor Gray
} else {
    npx install
}
cd ..

# 6. Instalar dependências do backend (se necessário)
Write-Host "`n--- Instalando dependências do BACKEND ---" -ForegroundColor Yellow
cd ./backend
if (Test-Path "node_modules") {
    Write-Host "node_modules já existe, pulando instalação." -ForegroundColor Gray
} else {
    npx install
}
cd ..

# 7. Dicas finais
Write-Host "`n=== SETUP FINALIZADO! ===" -ForegroundColor Cyan
Write-Host "Comandos úteis para rodar o projeto:" -ForegroundColor White
Write-Host "  - FRONTEND: cd frontend; npx next dev" -ForegroundColor Green
Write-Host "  - BACKEND (Edge Functions): cd backend/supabase/functions; deno task dev (ou conforme docs)" -ForegroundColor Green
Write-Host "  - Lint: npx eslint ."
Write-Host "  - Build: npx next build" -ForegroundColor Green
Write-Host "\nLembre-se de NÃO sincronizar node_modules pelo Drive. Sempre rode este script ao baixar o projeto em um novo PC." -ForegroundColor Yellow 