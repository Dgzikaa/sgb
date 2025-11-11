#!/bin/bash

###############################################################################
# Script de Deploy - Sincronização de Contagem
# 
# Este script faz o deploy da Edge Function de sincronização automática
# e configura o cron job no Supabase.
###############################################################################

echo "🚀 DEPLOY - SINCRONIZAÇÃO DE CONTAGEM"
echo "======================================"
echo ""

# Verificar se está no diretório correto
if [ ! -d "backend/supabase/functions/sync-contagem-sheets" ]; then
  echo "❌ Erro: Execute este script a partir da raiz do projeto"
  exit 1
fi

# 1. Deploy da Edge Function
echo "📦 Fazendo deploy da Edge Function..."
cd backend
npx supabase functions deploy sync-contagem-sheets --no-verify-jwt

if [ $? -ne 0 ]; then
  echo "❌ Erro ao fazer deploy da Edge Function"
  exit 1
fi

echo "✅ Edge Function deployed com sucesso!"
echo ""

# 2. Instruções para configurar Cron Job
echo "⏰ PRÓXIMO PASSO: Configurar Cron Job"
echo "======================================"
echo ""
echo "Execute os seguintes comandos no Supabase SQL Editor:"
echo ""
echo "-- 1. Ativar extensão pg_cron"
echo "CREATE EXTENSION IF NOT EXISTS pg_cron;"
echo ""
echo "-- 2. Criar cron job (executa todo dia às 18h)"
echo "SELECT cron.schedule("
echo "  'sync-contagem-diaria',"
echo "  '0 18 * * *',"
echo "  \$\$"
echo "  SELECT"
echo "    net.http_post("
echo "      url := 'https://SEU_PROJETO.supabase.co/functions/v1/sync-contagem-sheets',"
echo "      headers := '{\"Content-Type\": \"application/json\", \"Authorization\": \"Bearer ' || current_setting('app.service_role_key') || '\"}' ::jsonb"
echo "    );"
echo "  \$\$"
echo ");"
echo ""
echo "-- 3. Verificar cron jobs ativos"
echo "SELECT * FROM cron.job;"
echo ""
echo "======================================"
echo "✅ Deploy concluído!"
echo ""
echo "📋 Próximos passos:"
echo "1. Configure o cron job no Supabase (comandos acima)"
echo "2. Execute a importação histórica: node exemplo_teste/importar-contagem-sheets.js"
echo "3. Verifique os logs: Supabase Dashboard > Edge Functions > sync-contagem-sheets"
echo ""

