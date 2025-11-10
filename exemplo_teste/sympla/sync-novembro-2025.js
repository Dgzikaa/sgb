#!/usr/bin/env node

/**
 * 🎪 SYNC SYMPLA - NOVEMBRO 2025
 * 
 * Atualiza dados do Sympla que estão 1 mês desatualizados
 * Última sync: 12/10/2025
 * Objetivo: Sincronizar Novembro 2025
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function syncSympla() {
  console.log('🎪 INICIANDO SYNC SYMPLA - NOVEMBRO 2025');
  console.log('📅 Sincronizando todos os eventos disponíveis...');

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada!');
    console.error('   Configure: export SUPABASE_SERVICE_ROLE_KEY="sua-chave"');
    process.exit(1);
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/sympla-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        force_full_sync: false // Sync incremental
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro ao sincronizar Sympla:', data);
      process.exit(1);
    }

    console.log('\n✅ Sympla sincronizado com sucesso!');
    console.log(`   Eventos processados: ${data.data?.eventos_processados || 0}`);
    console.log(`   Participantes: ${data.data?.participantes_sincronizados || 0}`);
    console.log(`   Check-ins: ${data.data?.checkins_sincronizados || 0}`);
    console.log(`   Pedidos: ${data.data?.pedidos_sincronizados || 0}`);
    console.log(`   Tempo: ${data.data?.execution_time_ms || 0}ms`);

    console.log('\n✅ Sync concluído! Dados do Sympla atualizados.');
    console.log('   Aguarde ~30s para recarregar a página de Visão Geral.');
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
    process.exit(1);
  }
}

syncSympla();

