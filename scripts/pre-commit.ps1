# Pre-commit script para verificação de qualidade de código (Windows)
# Este script deve ser executado antes de cada commit

param(
    [switch]$Force
)

Write-Host "🔍 Iniciando verificação de qualidade de código..." -ForegroundColor Green

# Mudar para o diretório do frontend
Set-Location frontend

# Verificar se há arquivos não commitados
$unstagedFiles = git status --porcelain
if ($unstagedFiles) {
    Write-Host "⚠️  Há arquivos não commitados. Verificando apenas arquivos modificados..." -ForegroundColor Yellow
    $filesToCheck = git diff --cached --name-only --diff-filter=ACM | Where-Object { $_ -match '\.(ts|tsx)$' }
} else {
    Write-Host "📁 Verificando todos os arquivos TypeScript..." -ForegroundColor Blue
    $filesToCheck = "src/**/*.{ts,tsx}"
}

# Executar ESLint
Write-Host "🔧 Executando ESLint..." -ForegroundColor Cyan
if ($filesToCheck) {
    npx eslint $filesToCheck --max-warnings 0
} else {
    npx eslint . --ext .ts,.tsx --max-warnings 0
}

# Verificar TypeScript
Write-Host "📝 Verificando TypeScript..." -ForegroundColor Cyan
npx tsc --noEmit

# Verificar Prettier
Write-Host "🎨 Verificando formatação..." -ForegroundColor Cyan
npx prettier --check .

# Executar testes (apenas se houver)
if (Test-Path "package.json") {
    $packageJson = Get-Content "package.json" | ConvertFrom-Json
    if ($packageJson.scripts.test) {
        Write-Host "🧪 Executando testes..." -ForegroundColor Cyan
        npm test -- --watchAll=false --passWithNoTests
    }
}

Write-Host "✅ Verificação de qualidade concluída com sucesso!" -ForegroundColor Green
Write-Host "🚀 Pronto para commit!" -ForegroundColor Green 