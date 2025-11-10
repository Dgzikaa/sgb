/**
 * Script para calcular e atualizar atrasos de entrega em desempenho_semanal
 * 
 * Critérios de atraso:
 * - Cozinha (COMIDA): tempo de entrega > 1200 segundos (20 minutos)
 * - Bar (DRINK): tempo de entrega > 600 segundos (10 minutos)
 * 
 * Fonte de dados: tabela contahub_tempo (campo t1_t3)
 */

import { createClient } from '@supabase/supabase-js';

// Configuração Supabase
const supabaseUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não definida nas variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Limites de tempo para considerar atraso (em segundos)
const LIMITE_ATRASO_COZINHA = 1200; // 20 minutos
const LIMITE_ATRASO_BAR = 600;      // 10 minutos

/**
 * Calcula o número da semana ISO para uma data
 */
function getISOWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return weekNo;
}

/**
 * Calcula início e fim de semana baseado em uma data
 */
function getWeekRange(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Segunda-feira
  
  const monday = new Date(d.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return {
    inicio: monday.toISOString().split('T')[0],
    fim: sunday.toISOString().split('T')[0]
  };
}

/**
 * Calcula atrasos de uma semana específica
 */
async function calcularAtrasosSemana(ano, numeroSemana, dataInicio, dataFim, barId) {
  console.log(`\n📊 Calculando atrasos para semana ${numeroSemana}/${ano} (${dataInicio} a ${dataFim})`);
  
  const { data: atrasos, error } = await supabase.rpc('calcular_atrasos_periodo', {
    p_data_inicio: dataInicio,
    p_data_fim: dataFim,
    p_bar_id: barId
  });

  if (error) {
    // Se a função não existe, calcular diretamente via query
    const { data: tempoDados, error: tempoError } = await supabase
      .from('contahub_tempo')
      .select('categoria, t1_t3')
      .gte('data', dataInicio)
      .lte('data', dataFim)
      .eq('bar_id', barId)
      .not('t1_t3', 'is', null);

    if (tempoError) {
      console.error(`❌ Erro ao buscar dados de tempo:`, tempoError.message);
      return null;
    }

    // Calcular atrasos manualmente
    const atrasosCozinha = tempoDados.filter(
      item => item.categoria === 'comida' && parseFloat(item.t1_t3) > LIMITE_ATRASO_COZINHA
    ).length;

    const atrasosBar = tempoDados.filter(
      item => item.categoria === 'drink' && parseFloat(item.t1_t3) > LIMITE_ATRASO_BAR
    ).length;

    console.log(`  🍳 Atrasos Cozinha (>20min): ${atrasosCozinha}`);
    console.log(`  🍺 Atrasos Bar (>10min): ${atrasosBar}`);

    return { atrasos_cozinha: atrasosCozinha, atrasos_bar: atrasosBar };
  }

  console.log(`  🍳 Atrasos Cozinha (>20min): ${atrasos.atrasos_cozinha}`);
  console.log(`  🍺 Atrasos Bar (>10min): ${atrasos.atrasos_bar}`);
  
  return atrasos;
}

/**
 * Atualiza os atrasos na tabela desempenho_semanal
 */
async function atualizarAtrasos(ano, numeroSemana, atrasosCozinha, atrasosBar, barId) {
  const { data, error } = await supabase
    .from('desempenho_semanal')
    .update({
      atrasos_cozinha: atrasosCozinha,
      atrasos_bar: atrasosBar,
      updated_at: new Date().toISOString()
    })
    .eq('ano', ano)
    .eq('numero_semana', numeroSemana)
    .eq('bar_id', barId)
    .select();

  if (error) {
    console.error(`❌ Erro ao atualizar desempenho:`, error.message);
    return false;
  }

  if (!data || data.length === 0) {
    console.warn(`⚠️  Nenhum registro de desempenho encontrado para semana ${numeroSemana}/${ano}`);
    return false;
  }

  console.log(`✅ Atrasos atualizados para semana ${numeroSemana}/${ano}`);
  return true;
}

/**
 * Processa todas as semanas de um período
 */
async function processarPeriodo(dataInicio, dataFim, barId = 3) {
  console.log('🚀 Iniciando cálculo de atrasos');
  console.log(`📅 Período: ${dataInicio} a ${dataFim}`);
  console.log(`🏪 Bar ID: ${barId}`);
  console.log(`⏱️  Limites: Cozinha >${LIMITE_ATRASO_COZINHA}s, Bar >${LIMITE_ATRASO_BAR}s\n`);

  // Buscar todas as semanas do período
  const { data: semanas, error: semanasError } = await supabase
    .from('desempenho_semanal')
    .select('id, ano, numero_semana, data_inicio, data_fim, bar_id')
    .gte('data_inicio', dataInicio)
    .lte('data_fim', dataFim)
    .eq('bar_id', barId)
    .order('ano', { ascending: true })
    .order('numero_semana', { ascending: true });

  if (semanasError) {
    console.error('❌ Erro ao buscar semanas:', semanasError.message);
    return;
  }

  if (!semanas || semanas.length === 0) {
    console.warn('⚠️  Nenhuma semana encontrada no período especificado');
    return;
  }

  console.log(`📊 Total de semanas a processar: ${semanas.length}\n`);

  let sucessos = 0;
  let falhas = 0;

  for (const semana of semanas) {
    try {
      const atrasos = await calcularAtrasosSemana(
        semana.ano,
        semana.numero_semana,
        semana.data_inicio,
        semana.data_fim,
        semana.bar_id
      );

      if (atrasos) {
        const sucesso = await atualizarAtrasos(
          semana.ano,
          semana.numero_semana,
          atrasos.atrasos_cozinha,
          atrasos.atrasos_bar,
          semana.bar_id
        );

        if (sucesso) {
          sucessos++;
        } else {
          falhas++;
        }
      } else {
        falhas++;
      }

      // Delay para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Erro ao processar semana ${semana.numero_semana}/${semana.ano}:`, error.message);
      falhas++;
    }
  }

  console.log('\n📈 RESUMO DO PROCESSAMENTO');
  console.log('==========================');
  console.log(`✅ Semanas atualizadas: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log(`📊 Total: ${sucessos + falhas}`);
}

/**
 * Processar semana específica (para testes)
 */
async function processarSemanaEspecifica(ano, numeroSemana, barId = 3) {
  console.log(`🔍 Processando semana específica: ${numeroSemana}/${ano}\n`);

  const { data: semana, error } = await supabase
    .from('desempenho_semanal')
    .select('data_inicio, data_fim')
    .eq('ano', ano)
    .eq('numero_semana', numeroSemana)
    .eq('bar_id', barId)
    .single();

  if (error) {
    console.error('❌ Erro ao buscar semana:', error.message);
    return;
  }

  if (!semana) {
    console.error(`❌ Semana ${numeroSemana}/${ano} não encontrada`);
    return;
  }

  const atrasos = await calcularAtrasosSemana(
    ano,
    numeroSemana,
    semana.data_inicio,
    semana.data_fim,
    barId
  );

  if (atrasos) {
    await atualizarAtrasos(
      ano,
      numeroSemana,
      atrasos.atrasos_cozinha,
      atrasos.atrasos_bar,
      barId
    );
  }
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('📖 USO:');
  console.log('  node calcular-atrasos-desempenho.js periodo <data_inicio> <data_fim> [bar_id]');
  console.log('  node calcular-atrasos-desempenho.js semana <ano> <numero_semana> [bar_id]');
  console.log('\n📖 EXEMPLOS:');
  console.log('  node calcular-atrasos-desempenho.js periodo 2025-10-01 2025-10-31');
  console.log('  node calcular-atrasos-desempenho.js periodo 2025-10-01 2025-10-31 3');
  console.log('  node calcular-atrasos-desempenho.js semana 2025 44');
  console.log('  node calcular-atrasos-desempenho.js semana 2025 44 3');
  process.exit(0);
}

const modo = args[0];

if (modo === 'periodo') {
  const dataInicio = args[1];
  const dataFim = args[2];
  const barId = args[3] ? parseInt(args[3]) : 3;

  if (!dataInicio || !dataFim) {
    console.error('❌ Informe data_inicio e data_fim');
    process.exit(1);
  }

  processarPeriodo(dataInicio, dataFim, barId)
    .then(() => console.log('\n✅ Processamento concluído!'))
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });

} else if (modo === 'semana') {
  const ano = parseInt(args[1]);
  const numeroSemana = parseInt(args[2]);
  const barId = args[3] ? parseInt(args[3]) : 3;

  if (!ano || !numeroSemana) {
    console.error('❌ Informe ano e numero_semana');
    process.exit(1);
  }

  processarSemanaEspecifica(ano, numeroSemana, barId)
    .then(() => console.log('\n✅ Processamento concluído!'))
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });

} else {
  console.error(`❌ Modo desconhecido: ${modo}`);
  console.error('Use "periodo" ou "semana"');
  process.exit(1);
}

