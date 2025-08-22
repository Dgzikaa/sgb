#!/usr/bin/env pwsh

# Script para limpar cache corrompido do Next.js
Write-Host "🧹 Limpando cache do Next.js..." -ForegroundColor Yellow

# Ir para diretório do frontend
Set-Location "frontend"

# Parar qualquer processo na porta 3000
Write-Host "🔄 Parando servidor Next.js..." -ForegroundColor Blue
try {
    $process = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.OwningProcess -Force
        Write-Host "✅ Servidor parado" -ForegroundColor Green
    }
} catch {
    Write-Host "ℹ️  Nenhum servidor rodando na porta 3000" -ForegroundColor Gray
}

# Tentar remover .next com diferentes métodos
Write-Host "🗑️  Removendo cache .next..." -ForegroundColor Blue

if (Test-Path ".next") {
    try {
        # Método 1: Remover atributos readonly
        Get-ChildItem -Path ".next" -Recurse -Force | ForEach-Object {
            $_.Attributes = $_.Attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)
        }
        Remove-Item -Path ".next" -Recurse -Force
        Write-Host "✅ Cache .next removido com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Falha no método 1, tentando método 2..." -ForegroundColor Yellow
        
        try {
            # Método 2: Usar robocopy para limpar
            robocopy "." ".next_temp" /MIR /XD ".next" > $null
            Remove-Item -Path ".next" -Recurse -Force
            Write-Host "✅ Cache removido com robocopy" -ForegroundColor Green
        } catch {
            Write-Host "❌ Erro ao remover cache. Tente executar como administrador." -ForegroundColor Red
            Write-Host "💡 Ou execute: takeown /f .next /r /d y && icacls .next /grant administrators:F /t" -ForegroundColor Cyan
        }
    }
} else {
    Write-Host "ℹ️  Cache .next não existe" -ForegroundColor Gray
}

# Limpar node_modules se necessário
if ($args -contains "--full") {
    Write-Host "🧹 Limpeza completa: removendo node_modules..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Remove-Item -Path "node_modules" -Recurse -Force
        Write-Host "✅ node_modules removido" -ForegroundColor Green
    }
    
    Write-Host "📦 Reinstalando dependências..." -ForegroundColor Blue
    npm install
}

# Criar diretório .next limpo
New-Item -ItemType Directory -Path ".next" -Force > $null
Write-Host "📁 Diretório .next recriado" -ForegroundColor Green

# Voltar ao diretório raiz
Set-Location ".."

Write-Host "🎉 Limpeza concluída! Você pode executar 'npm run dev' agora." -ForegroundColor Green
Write-Host "💡 Para limpeza completa use: .\scripts\limpar-cache.ps1 --full" -ForegroundColor Cyan
