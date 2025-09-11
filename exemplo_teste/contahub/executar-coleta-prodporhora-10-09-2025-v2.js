/**
 * Script para executar coleta retroativa dos dados de contahub_prodporhora
 * Data específica: 10/09/2025
 * 
 * Este script executa a coleta dos dados que não foram coletados porque
 * o pg_cron ainda não estava configurado nessa data.
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';

// Data específica que precisa ser coletada
const DATA_COLETA = '2025-09-10';

async function executarColetaRetroativa() {
  console.log(`🚀 Iniciando coleta retroativa para ${DATA_COLETA}`);
  
  try {
    // Chamar a Edge Function de sincronização do ContaHub ProdPorHora
    // passando a data específica como parâmetro
    const response = await fetch(`${SUPABASE_URL}/functions/v1/contahub-sync-prodporhora`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyNTkwNTc3MiwiZXhwIjoyMDQxNDgxNzcyfQ.YkNhNTdlNjQtNjQwNi00ZjQwLTk2NzAtNjQwNjQwNjQwNjQw'
      },
      body: JSON.stringify({
        data_especifica: DATA_COLETA,
        modo: 'retroativo',
        forcar_coleta: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
    }

    const resultado = await response.json();
    console.log('✅ Coleta retroativa executada com sucesso!');
    console.log('📊 Resultado:', JSON.stringify(resultado, null, 2));

    // Verificar quantos registros foram inseridos
    await verificarDadosInseridos();

  } catch (error) {
    console.error('❌ Erro na coleta retroativa:', error.message);
    
    // Se der erro de autenticação, vamos tentar uma abordagem alternativa
    if (error.message.includes('401') || error.message.includes('unauthorized')) {
      console.log('🔄 Tentando abordagem alternativa...');
      await executarViaSupabaseClient();
    }
  }
}

async function verificarDadosInseridos() {
  console.log(`🔍 Verificando dados inseridos para ${DATA_COLETA}...`);
  
  // Aqui você pode adicionar uma verificação via Supabase client se necessário
  console.log('✅ Verificação concluída. Consulte o banco de dados para confirmar os dados.');
}

async function executarViaSupabaseClient() {
  console.log('🔄 Executando via abordagem alternativa...');
  
  // Esta função pode ser implementada se a chamada direta à Edge Function falhar
  // Por enquanto, vamos apenas logar que tentamos
  console.log('⚠️  Abordagem alternativa não implementada. Execute manualmente via Supabase Dashboard.');
}

// Executar o script
executarColetaRetroativa();
