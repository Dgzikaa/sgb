#!/bin/bash

# Pre-commit script para verificação de qualidade de código
# Este script deve ser executado antes de cada commit

set -e

echo "🔍 Iniciando verificação de qualidade de código..."

# Mudar para o diretório do frontend
cd frontend

# Verificar se há arquivos não commitados
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  Há arquivos não commitados. Verificando apenas arquivos modificados..."
    FILES_TO_CHECK=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | tr '\n' ' ')
else
    echo "📁 Verificando todos os arquivos TypeScript..."
    FILES_TO_CHECK="src/**/*.{ts,tsx}"
fi

# Executar ESLint
echo "🔧 Executando ESLint..."
if [ -n "$FILES_TO_CHECK" ]; then
    npx eslint $FILES_TO_CHECK --max-warnings 0
else
    npx eslint . --ext .ts,.tsx --max-warnings 0
fi

# Verificar TypeScript
echo "📝 Verificando TypeScript..."
npx tsc --noEmit

# Verificar Prettier
echo "🎨 Verificando formatação..."
npx prettier --check .

# Executar testes (apenas se houver)
if [ -f "package.json" ] && grep -q '"test"' package.json; then
    echo "🧪 Executando testes..."
    npm test -- --watchAll=false --passWithNoTests
fi

echo "✅ Verificação de qualidade concluída com sucesso!"
echo "🚀 Pronto para commit!" 