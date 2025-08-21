# Script PowerShell para corrigir problemas de performance do Supabase
# Uso: .\fix_supabase.ps1 -Senha "SUA_SENHA_POSTGRES"

param(
    [Parameter(Mandatory=$true)]
    [string]$Senha
)

$DB_URL = "postgresql://postgres:$Senha@db.uqtgsvujwcbymjmvkjhy.supabase.co:5432/postgres"

Write-Host "🚀 Iniciando correções de performance do Supabase..." -ForegroundColor Green

# Verificar se psql está disponível
try {
    psql --version | Out-Null
    Write-Host "✅ PostgreSQL client encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL client não encontrado. Instalando..." -ForegroundColor Red
    Write-Host "Execute: winget install PostgreSQL.PostgreSQL" -ForegroundColor Yellow
    exit 1
}

# Verificar se o arquivo existe
if (!(Test-Path "database/migrations/fix_supabase_performance_issues.sql")) {
    Write-Host "❌ Arquivo de migração não encontrado!" -ForegroundColor Red
    Write-Host "Certifique-se de estar na pasta raiz do projeto (F:\Zykor)" -ForegroundColor Yellow
    exit 1
}

# Parte 1: Executar migração principal
Write-Host "📊 Executando correções críticas..." -ForegroundColor Cyan
try {
    psql $DB_URL -f "database/migrations/fix_supabase_performance_issues.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Correções aplicadas com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro ao aplicar correções" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Erro na conexão com o banco: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Verificação
Write-Host "🔍 Verificando índices criados..." -ForegroundColor Cyan
$verificacao = @"
SELECT COUNT(*) as indices_criados
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%_bar_id';
"@

psql $DB_URL -c $verificacao

Write-Host ""
Write-Host "🎉 Correções críticas aplicadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📈 Próximos passos opcionais:" -ForegroundColor Yellow
Write-Host "1. .\scripts\optimize_rls.ps1 -Senha '$Senha'" -ForegroundColor White
Write-Host "2. .\scripts\remove_unused_indexes.ps1 -Senha '$Senha'" -ForegroundColor White
Write-Host ""
Write-Host "⚡ Sua performance deve estar significativamente melhor agora!" -ForegroundColor Green
