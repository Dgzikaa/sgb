/**
 * DIAGNÓSTICO - Investigar problema na Semana 52
 * 
 * Problema reportado:
 * - Clientes Ativos: 0% variação (manteve 5.026)
 * - Novos Clientes: 0 (zerados)
 * - Dia a dia vindo com clientes ativos zerados
 * - Semanal vindo com novos clientes zerado
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const BAR_ID = 1; // Ordinário
const ANO = 2025;

async function diagnosticar() {
  console.log('🔍 DIAGNÓSTICO - SEMANA 52 (2025)\n');
  console.log('=' .repeat(80));
  
  // 1. VERIFICAR DADOS SALVOS NA TABELA desempenho_semanal
  console.log('\n📊 1. DADOS SALVOS - desempenho_semanal');
  console.log('-'.repeat(80));
  
  const { data: semanas, error: semanasError } = await supabase
    .from('desempenho_semanal')
    .select('*')
    .eq('bar_id', BAR_ID)
    .eq('ano', ANO)
    .in('numero_semana', [50, 51, 52])
    .order('numero_semana', { ascending: true });

  if (semanasError) {
    console.error('❌ Erro ao buscar semanas:', semanasError);
    return;
  }

  if (!semanas || semanas.length === 0) {
    console.log('⚠️  Nenhum dado encontrado para as semanas 50, 51, 52');
    return;
  }

  semanas.forEach(semana => {
    console.log(`\n📅 Semana ${semana.numero_semana} (${semana.data_inicio} até ${semana.data_fim})`);
    console.log(`   💰 Faturamento Total: R$ ${(semana.faturamento_total || 0).toFixed(2)}`);
    console.log(`   👥 Clientes Atendidos: ${semana.clientes_atendidos || 0}`);
    console.log(`   🆕 % Clientes Novos: ${(semana.perc_clientes_novos || 0).toFixed(2)}%`);
    console.log(`   ⭐ Clientes Ativos: ${semana.clientes_ativos || 0}`);
    console.log(`   🎯 Ticket Médio: R$ ${(semana.ticket_medio || 0).toFixed(2)}`);
    console.log(`   📝 Atualizado em: ${semana.atualizado_em || 'N/A'}`);
    console.log(`   💬 Observações: ${semana.observacoes || 'Nenhuma'}`);
  });

  // 2. VERIFICAR DADOS BRUTOS DO CONTAHUB (dias da semana 52)
  const semana52 = semanas.find(s => s.numero_semana === 52);
  if (!semana52) {
    console.log('\n⚠️  Semana 52 não encontrada na tabela desempenho_semanal');
    return;
  }

  console.log('\n\n📊 2. DADOS BRUTOS - ContaHub Período (Semana 52)');
  console.log('-'.repeat(80));
  console.log(`📅 Período: ${semana52.data_inicio} até ${semana52.data_fim}\n`);

  // Buscar dados do ContaHub para a semana 52
  const { data: contahubData, error: contahubError } = await supabase
    .from('contahub_periodo')
    .select('dt_gerencial, cli_fone, pessoas')
    .eq('bar_id', BAR_ID)
    .gte('dt_gerencial', semana52.data_inicio)
    .lte('dt_gerencial', semana52.data_fim)
    .not('cli_fone', 'is', null)
    .order('dt_gerencial', { ascending: true });

  if (contahubError) {
    console.error('❌ Erro ao buscar dados ContaHub:', contahubError);
  } else if (!contahubData || contahubData.length === 0) {
    console.log('⚠️  PROBLEMA IDENTIFICADO: Nenhum dado do ContaHub encontrado para a semana 52!');
    console.log('   Isso explicaria os clientes zerados.');
  } else {
    console.log(`✅ Total de registros ContaHub: ${contahubData.length}`);
    
    // Agrupar por dia
    const porDia = contahubData.reduce((acc, row) => {
      const dia = row.dt_gerencial;
      if (!acc[dia]) {
        acc[dia] = { clientes: new Set(), pessoas: 0 };
      }
      acc[dia].clientes.add(row.cli_fone);
      acc[dia].pessoas += parseInt(row.pessoas) || 0;
      return acc;
    }, {});

    Object.keys(porDia).sort().forEach(dia => {
      const dados = porDia[dia];
      console.log(`   📅 ${dia}: ${dados.clientes.size} clientes únicos, ${dados.pessoas} pessoas`);
    });

    // Total de clientes únicos da semana
    const clientesUnicos = new Set(contahubData.map(r => r.cli_fone));
    console.log(`\n   👥 Total de clientes únicos na semana 52: ${clientesUnicos.size}`);
  }

  // 3. CALCULAR NOVOS CLIENTES MANUALMENTE
  console.log('\n\n🆕 3. CÁLCULO DE NOVOS CLIENTES (Semana 52)');
  console.log('-'.repeat(80));

  if (contahubData && contahubData.length > 0) {
    const clientesSemana52 = new Set(contahubData.map(r => r.cli_fone));
    
    // Buscar histórico antes da semana 52
    const dataAnterior = new Date(semana52.data_inicio);
    dataAnterior.setDate(dataAnterior.getDate() - 1);
    const dataAnteriorStr = dataAnterior.toISOString().split('T')[0];

    console.log(`📅 Buscando histórico até: ${dataAnteriorStr}`);

    const { data: historicoData, error: historicoError } = await supabase
      .from('contahub_periodo')
      .select('cli_fone')
      .eq('bar_id', BAR_ID)
      .lte('dt_gerencial', dataAnteriorStr)
      .not('cli_fone', 'is', null);

    if (historicoError) {
      console.error('❌ Erro ao buscar histórico:', historicoError);
    } else {
      const clientesHistoricos = new Set(historicoData.map(r => r.cli_fone));
      
      let novos = 0;
      clientesSemana52.forEach(cliente => {
        if (!clientesHistoricos.has(cliente)) {
          novos++;
        }
      });

      const percentualNovos = clientesSemana52.size > 0 
        ? (novos / clientesSemana52.size) * 100 
        : 0;

      console.log(`   👥 Total de clientes na semana: ${clientesSemana52.size}`);
      console.log(`   📚 Clientes históricos (até ${dataAnteriorStr}): ${clientesHistoricos.size}`);
      console.log(`   🆕 Novos clientes: ${novos}`);
      console.log(`   📊 % Novos: ${percentualNovos.toFixed(2)}%`);
      
      if (semana52.perc_clientes_novos !== null) {
        console.log(`   💾 % Salvo no banco: ${semana52.perc_clientes_novos.toFixed(2)}%`);
        if (Math.abs(percentualNovos - semana52.perc_clientes_novos) > 1) {
          console.log('   ⚠️  DIVERGÊNCIA ENCONTRADA entre cálculo e valor salvo!');
        }
      } else {
        console.log('   ⚠️  % Novos não está salvo no banco (NULL)');
      }
    }
  }

  // 4. CALCULAR CLIENTES ATIVOS MANUALMENTE
  console.log('\n\n⭐ 4. CÁLCULO DE CLIENTES ATIVOS (Semana 52)');
  console.log('-'.repeat(80));

  if (contahubData && contahubData.length > 0) {
    // Calcular 90 dias antes do fim da semana 52
    const dataFim = new Date(semana52.data_fim);
    const data90DiasAtras = new Date(dataFim);
    data90DiasAtras.setDate(dataFim.getDate() - 90);
    const data90DiasAtrasStr = data90DiasAtras.toISOString().split('T')[0];

    console.log(`📅 Janela de 90 dias: ${data90DiasAtrasStr} até ${semana52.data_fim}`);

    const { data: baseAtivaResult, error: baseAtivaError } = await supabase
      .rpc('get_count_base_ativa', {
        p_bar_id: BAR_ID,
        p_data_inicio: data90DiasAtrasStr,
        p_data_fim: semana52.data_fim
      });

    if (baseAtivaError) {
      console.error('❌ Erro ao calcular base ativa:', baseAtivaError);
      console.log('   ⚠️  A stored procedure get_count_base_ativa pode não existir');
    } else {
      const clientesAtivosCalculado = Number(baseAtivaResult) || 0;
      console.log(`   ⭐ Clientes Ativos calculados: ${clientesAtivosCalculado}`);
      console.log(`   💾 Clientes Ativos salvos: ${semana52.clientes_ativos || 0}`);
      
      if (clientesAtivosCalculado !== semana52.clientes_ativos) {
        console.log('   ⚠️  DIVERGÊNCIA ENCONTRADA entre cálculo e valor salvo!');
      }
    }
  }

  // 5. VERIFICAR LOGS DA ÚLTIMA AUTOMAÇÃO
  console.log('\n\n🤖 5. VERIFICAÇÃO DA AUTOMAÇÃO SEMANAL');
  console.log('-'.repeat(80));

  if (semana52.observacoes) {
    console.log(`📝 Observações: ${semana52.observacoes}`);
    
    if (semana52.observacoes.includes('Automação semanal')) {
      console.log('✅ A semana foi processada pela automação');
    } else {
      console.log('⚠️  A semana pode não ter sido processada pela automação');
    }
  }

  if (semana52.atualizado_em) {
    const dataAtualizacao = new Date(semana52.atualizado_em);
    const horasDesdeAtualizacao = (Date.now() - dataAtualizacao.getTime()) / (1000 * 60 * 60);
    console.log(`🕐 Última atualização: ${dataAtualizacao.toLocaleString('pt-BR')} (há ${horasDesdeAtualizacao.toFixed(1)}h)`);
  }

  // 6. RESUMO DO DIAGNÓSTICO
  console.log('\n\n📋 RESUMO DO DIAGNÓSTICO');
  console.log('='.repeat(80));

  const problemas = [];
  const solucoes = [];

  if (!contahubData || contahubData.length === 0) {
    problemas.push('❌ CRÍTICO: Nenhum dado do ContaHub para a semana 52');
    solucoes.push('→ Verificar se houve sync do ContaHub para essa semana');
    solucoes.push('→ Executar sync manual se necessário');
  }

  if (semana52.perc_clientes_novos === null || semana52.perc_clientes_novos === 0) {
    problemas.push('❌ PROBLEMA: % Novos clientes está zerado ou NULL');
    solucoes.push('→ Executar recálculo manual da semana 52');
    solucoes.push('→ Verificar se a stored procedure calcular_metricas_clientes está funcionando');
  }

  if (semana52.clientes_ativos === null || semana52.clientes_ativos === 0) {
    problemas.push('❌ PROBLEMA: Clientes ativos está zerado ou NULL');
    solucoes.push('→ Verificar se a stored procedure get_count_base_ativa existe');
    solucoes.push('→ Executar recálculo manual da semana 52');
  }

  if (problemas.length === 0) {
    console.log('✅ Nenhum problema crítico encontrado');
  } else {
    console.log('\n🚨 PROBLEMAS ENCONTRADOS:');
    problemas.forEach(p => console.log(`   ${p}`));
    
    console.log('\n💡 SOLUÇÕES RECOMENDADAS:');
    solucoes.forEach(s => console.log(`   ${s}`));
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Diagnóstico concluído\n');
}

diagnosticar().catch(console.error);
