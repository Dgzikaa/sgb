#!/bin/bash

# Script para corrigir problemas de performance do Supabase
# Uso: ./fix_supabase.sh [SENHA_DO_POSTGRES]

if [ -z "$1" ]; then
    echo "❌ Erro: Forneça a senha do postgres"
    echo "Uso: ./fix_supabase.sh [SENHA_DO_POSTGRES]"
    exit 1
fi

SENHA="$1"
DB_URL="postgresql://postgres:${SENHA}@db.uqtgsvujwcbymjmvkjhy.supabase.co:5432/postgres"

echo "🚀 Iniciando correções de performance do Supabase..."

# Parte 1: Foreign Keys (CRÍTICO)
echo "📊 Parte 1: Adicionando índices para Foreign Keys..."
psql "$DB_URL" -f database/migrations/fix_supabase_performance_issues.sql

if [ $? -eq 0 ]; then
    echo "✅ Parte 1 concluída com sucesso!"
else
    echo "❌ Erro na Parte 1. Parando execução."
    exit 1
fi

# Verificação
echo "🔍 Verificando índices criados..."
psql "$DB_URL" -c "
SELECT COUNT(*) as indices_criados
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%_bar_id';
"

echo "🎉 Correções críticas aplicadas com sucesso!"
echo ""
echo "📈 Próximos passos opcionais:"
echo "1. Executar: psql \"$DB_URL\" -f database/migrations/optimize_rls_policies.sql"
echo "2. Executar: psql \"$DB_URL\" -f database/migrations/remove_unused_indexes.sql"
echo ""
echo "⚡ Sua performance deve estar significativamente melhor agora!"
