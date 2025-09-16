/**
 * Script para sincronizar retroativamente o dia 05/09/2025 do ContaHub
 * Data que está faltando na tabela contahub_fatporhora
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function syncRetroativo05092025() {
  console.log('🔄 Iniciando sync retroativo para 05/09/2025...');
  
  try {
    // Chamar a Edge Function de sync automático do ContaHub para essa data específica
    const { data, error } = await supabase.functions.invoke('contaazul-sync-automatico', {
      body: {
        action: 'sync_specific_date',
        date: '2025-09-05',
        bar_id: 3,
        force: true
      }
    });

    if (error) {
      console.error('❌ Erro ao chamar Edge Function:', error);
      return;
    }

    console.log('✅ Resposta da Edge Function:', data);

    // Verificar se os dados foram inseridos
    const { data: verificacao, error: errorVerificacao } = await supabase
      .from('contahub_periodo')
      .select('COUNT(*)')
      .eq('bar_id', 3)
      .eq('dt_gerencial', '2025-09-05');

    if (errorVerificacao) {
      console.error('❌ Erro ao verificar dados:', errorVerificacao);
      return;
    }

    console.log('📊 Registros inseridos para 05/09/2025:', verificacao);

    // Verificar se o contahub_fatporhora foi gerado
    const { data: fatPorHora, error: errorFatPorHora } = await supabase
      .from('contahub_fatporhora')
      .select('COUNT(*)')
      .eq('bar_id', 3)
      .eq('vd_dtgerencial', '2025-09-05');

    if (errorFatPorHora) {
      console.error('❌ Erro ao verificar fatporhora:', errorFatPorHora);
      return;
    }

    console.log('⏰ Registros de faturamento por hora para 05/09/2025:', fatPorHora);

    if (fatPorHora && fatPorHora[0].count > 0) {
      console.log('🎉 Sync retroativo concluído com sucesso!');
      console.log('✅ Agora 05/09/2025 deve aparecer no gráfico semanal');
    } else {
      console.log('⚠️ Dados do período foram inseridos, mas fatporhora pode precisar ser processado');
    }

  } catch (error) {
    console.error('💥 Erro geral no sync retroativo:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  syncRetroativo05092025();
}

module.exports = { syncRetroativo05092025 };
