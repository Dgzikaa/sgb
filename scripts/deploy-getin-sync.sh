#!/bin/bash

# Script para deploy da Edge Function de sincronização contínua do Getin

echo "🚀 Deploy da Edge Function - Getin Sync Continuous"
echo "=================================================="

# Verificar se está no diretório correto
if [ ! -d "backend/supabase/functions/getin-sync-continuous" ]; then
    echo "❌ Erro: Diretório da função não encontrado"
    echo "   Execute este script na raiz do projeto"
    exit 1
fi

# Verificar se o Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    echo "❌ Erro: Supabase CLI não encontrado"
    echo "   Instale com: npm install -g supabase"
    exit 1
fi

# Verificar se está logado no Supabase
if ! supabase projects list &> /dev/null; then
    echo "❌ Erro: Não está logado no Supabase"
    echo "   Execute: supabase login"
    exit 1
fi

echo "✅ Pré-requisitos verificados"

# Fazer deploy da função
echo "📦 Fazendo deploy da função..."
cd backend

if supabase functions deploy getin-sync-continuous; then
    echo "✅ Deploy concluído com sucesso!"
    
    # Obter URL da função
    PROJECT_REF=$(supabase projects list --format json | jq -r '.[0].id' 2>/dev/null || echo "your-project")
    FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/getin-sync-continuous"
    
    echo ""
    echo "🔗 URL da função: $FUNCTION_URL"
    echo ""
    echo "🧪 Para testar:"
    echo "   curl -X POST $FUNCTION_URL"
    echo ""
    echo "⏰ Para automatizar (cron job):"
    echo "   0 */4 * * * curl -X POST $FUNCTION_URL"
    echo ""
    echo "📊 Para monitorar logs:"
    echo "   supabase functions logs getin-sync-continuous"
    
else
    echo "❌ Erro no deploy"
    exit 1
fi

cd ..

echo ""
echo "🎉 Deploy concluído! A função está pronta para rodar de 4 em 4 horas."
