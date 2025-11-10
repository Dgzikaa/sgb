#!/bin/bash

echo "🚀 Fazendo deploy da correção da Edge Function nibo-sync..."
echo ""

# Verificar se está no diretório correto
if [ ! -d "backend/supabase/functions/nibo-sync" ]; then
  echo "❌ Erro: Não encontrou a pasta backend/supabase/functions/nibo-sync"
  echo "Execute este script da raiz do projeto"
  exit 1
fi

cd backend

echo "📦 Deploy da Edge Function..."
npx supabase functions deploy nibo-sync --project-ref uqtgsvujwcbymjmvkjhy --no-verify-jwt

echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📝 Próximos passos:"
echo "  1. Testar a sincronização: node ../scripts/test-nibo-sync.js"
echo "  2. Verificar se os dados de novembro foram sincronizados"
echo "  3. Verificar se apareceram no planejamento comercial"

