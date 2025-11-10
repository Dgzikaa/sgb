#!/usr/bin/env node

/**
 * 🚀 SYNC YUZER - SETEMBRO A NOVEMBRO 2025
 * 
 * Atualiza dados do Yuzer que estão 3 meses desatualizados
 * Última sync: 11/08/2025
 * Objetivo: Sincronizar Set, Out, Nov 2025
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const BAR_ID = 3; // Ordinário Bar

// Períodos para sincronizar (01 até último dia de cada mês)
const PERIODOS = [
  { mes: 'Setembro 2025', start: '01.09.2025', end: '30.09.2025' },
  { mes: 'Outubro 2025', start: '01.10.2025', end: '31.10.2025' },
  { mes: 'Novembro 2025', start: '01.11.2025', end: '10.11.2025' } // Até hoje
];

async function syncYuzerPeriodo(periodo) {
  console.log(`\n🎯 Sincronizando ${periodo.mes}...`);
  console.log(`   Período: ${periodo.start} até ${periodo.end}`);

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/yuzer-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({
        bar_id: BAR_ID,
        start_date: periodo.start,
        end_date: periodo.end,
        automated: false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Erro ao sincronizar ${periodo.mes}:`, data);
      return { success: false, periodo: periodo.mes, error: data };
    }

    console.log(`✅ ${periodo.mes} sincronizado com sucesso!`);
    console.log(`   Eventos: ${data.data?.eventos_processados || 0}`);
    console.log(`   Produtos: ${data.data?.produtos_inseridos || 0}`);
    console.log(`   Tempo: ${data.data?.execution_time_ms || 0}ms`);

    return { success: true, periodo: periodo.mes, data };
  } catch (error) {
    console.error(`❌ Erro na requisição para ${periodo.mes}:`, error.message);
    return { success: false, periodo: periodo.mes, error: error.message };
  }
}

async function main() {
  console.log('🚀 INICIANDO SYNC YUZER - SET/OUT/NOV 2025');
  console.log(`📅 Total de períodos: ${PERIODOS.length}`);
  console.log(`🏢 Bar: Ordinário Bar (ID: ${BAR_ID})`);

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ ERRO: SUPABASE_SERVICE_ROLE_KEY não encontrada!');
    console.error('   Configure: export SUPABASE_SERVICE_ROLE_KEY="sua-chave"');
    process.exit(1);
  }

  const resultados = [];

  // Sincronizar cada período sequencialmente
  for (const periodo of PERIODOS) {
    const resultado = await syncYuzerPeriodo(periodo);
    resultados.push(resultado);
    
    // Aguardar 2 segundos entre cada sync para não sobrecarregar
    if (periodo !== PERIODOS[PERIODOS.length - 1]) {
      console.log('   ⏳ Aguardando 2s antes do próximo sync...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO FINAL DO SYNC');
  console.log('='.repeat(60));

  const sucessos = resultados.filter(r => r.success).length;
  const falhas = resultados.filter(r => !r.success).length;

  console.log(`\n✅ Sucesso: ${sucessos}/${resultados.length}`);
  console.log(`❌ Falhas: ${falhas}/${resultados.length}`);

  if (falhas > 0) {
    console.log('\n❌ Períodos com falha:');
    resultados
      .filter(r => !r.success)
      .forEach(r => {
        console.log(`   • ${r.periodo}: ${JSON.stringify(r.error)}`);
      });
  }

  console.log('\n✅ Sync concluído! Dados do Yuzer atualizados.');
  console.log('   Aguarde ~30s para recarregar a página de Visão Geral.');
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

