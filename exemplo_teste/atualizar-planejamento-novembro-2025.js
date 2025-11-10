/**
 * Script para atualizar dados de planejamento dos eventos de Novembro/2025
 * 
 * Dados a adicionar:
 * - M1 (receita planejada)
 * - cli_plan (clientes planejados)
 * - te_plan: R$ 21,80
 * - tb_plan: R$ 85,00
 * - lot_max = cli_plan / 1,3 (arredondado)
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

// Dados de planejamento para novembro/2025
const dadosPlanejamento = {
  '2025-11-01': { m1_r: 76342.28, cl_plan: 715 },
  '2025-11-02': { m1_r: 40715.88, cl_plan: 381 },
  '2025-11-03': { m1_r: 10178.97, cl_plan: 95 },
  '2025-11-04': { m1_r: 10178.97, cl_plan: 95 },
  '2025-11-05': { m1_r: 50894.85, cl_plan: 477 },
  '2025-11-06': { m1_r: 25447.43, cl_plan: 238 },
  '2025-11-07': { m1_r: 89574.94, cl_plan: 839 },
  '2025-11-08': { m1_r: 76342.28, cl_plan: 715 },
  '2025-11-09': { m1_r: 40715.88, cl_plan: 381 },
  '2025-11-10': { m1_r: 10178.97, cl_plan: 95 },
  '2025-11-11': { m1_r: 10178.97, cl_plan: 95 },
  '2025-11-12': { m1_r: 50894.85, cl_plan: 477 },
  '2025-11-13': { m1_r: 25447.43, cl_plan: 238 },
  '2025-11-14': { m1_r: 89574.94, cl_plan: 839 },
  '2025-11-15': { m1_r: 76342.28, cl_plan: 715 },
  '2025-11-16': { m1_r: 40715.88, cl_plan: 381 },
  '2025-11-17': { m1_r: 10178.97, cl_plan: 95 },
  '2025-11-18': { m1_r: 10178.97, cl_plan: 95 },
  '2025-11-19': { m1_r: 50894.85, cl_plan: 477 },
  '2025-11-20': { m1_r: 25447.43, cl_plan: 238 },
  '2025-11-21': { m1_r: 89574.94, cl_plan: 839 },
  '2025-11-22': { m1_r: 76342.28, cl_plan: 715 },
  '2025-11-23': { m1_r: 40715.88, cl_plan: 381 },
  '2025-11-24': { m1_r: 10178.97, cl_plan: 95 },
  '2025-11-25': { m1_r: 10178.97, cl_plan: 95 },
  '2025-11-26': { m1_r: 50894.85, cl_plan: 477 },
  '2025-11-27': { m1_r: 25447.43, cl_plan: 238 },
  '2025-11-28': { m1_r: 89574.94, cl_plan: 839 },
  '2025-11-29': { m1_r: 76342.28, cl_plan: 715 },
  '2025-11-30': { m1_r: 40715.88, cl_plan: 381 }
};

// Valores fixos para todos os dias
const TE_PLAN = 21.80;
const TB_PLAN = 85.00;

/**
 * Calcula a lotação máxima baseada em cli_plan
 * @param {number} cl_plan - Clientes planejados
 * @returns {number} - Lotação máxima arredondada
 */
function calcularLotMax(cl_plan) {
  return Math.round(cl_plan / 1.3);
}

/**
 * Atualiza os dados de planejamento para um evento específico
 */
async function atualizarEvento(data_evento, dados) {
  const lot_max = calcularLotMax(dados.cl_plan);
  
  const { data: resultado, error } = await supabase
    .from('eventos_base')
    .update({
      m1_r: dados.m1_r,
      cl_plan: dados.cl_plan,
      te_plan: TE_PLAN,
      tb_plan: TB_PLAN,
      lot_max: lot_max,
      atualizado_em: new Date().toISOString()
    })
    .eq('data_evento', data_evento)
    .select();

  if (error) {
    console.error(`❌ Erro ao atualizar evento ${data_evento}:`, error.message);
    return false;
  }

  if (!resultado || resultado.length === 0) {
    console.warn(`⚠️  Nenhum evento encontrado para ${data_evento}`);
    return false;
  }

  console.log(`✅ Evento ${data_evento} atualizado: M1=R$ ${dados.m1_r.toFixed(2)}, Clientes=${dados.cl_plan}, Lot.Max=${lot_max}`);
  return true;
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando atualização de dados de planejamento - Novembro/2025\n');
  console.log(`📊 Total de dias a atualizar: ${Object.keys(dadosPlanejamento).length}`);
  console.log(`💰 te_plan (fixo): R$ ${TE_PLAN}`);
  console.log(`🍺 tb_plan (fixo): R$ ${TB_PLAN}`);
  console.log(`📐 Fórmula lot_max: cli_plan / 1,3 (arredondado)\n`);
  
  let sucessos = 0;
  let falhas = 0;

  for (const [data, dados] of Object.entries(dadosPlanejamento)) {
    const sucesso = await atualizarEvento(data, dados);
    if (sucesso) {
      sucessos++;
    } else {
      falhas++;
    }
    
    // Pequeno delay para não sobrecarregar o banco
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n📈 RESUMO DA ATUALIZAÇÃO');
  console.log('========================');
  console.log(`✅ Eventos atualizados com sucesso: ${sucessos}`);
  console.log(`❌ Falhas: ${falhas}`);
  console.log(`📊 Total processado: ${sucessos + falhas}`);
  
  // Verificação final
  console.log('\n🔍 Verificando dados atualizados...\n');
  
  const { data: eventos, error } = await supabase
    .from('eventos_base')
    .select('data_evento, nome, m1_r, cl_plan, te_plan, tb_plan, lot_max')
    .gte('data_evento', '2025-11-01')
    .lte('data_evento', '2025-11-30')
    .order('data_evento');

  if (error) {
    console.error('❌ Erro ao verificar eventos:', error.message);
    return;
  }

  console.log('📋 EVENTOS ATUALIZADOS:');
  console.log('========================\n');
  
  let totalM1 = 0;
  let totalClientes = 0;
  
  eventos.forEach(evento => {
    const lotMaxCalculado = evento.cl_plan ? Math.round(evento.cl_plan / 1.3) : 0;
    const lotMaxOk = evento.lot_max === lotMaxCalculado ? '✓' : '✗';
    
    console.log(`${evento.data_evento} | ${evento.nome.substring(0, 30).padEnd(30)}`);
    console.log(`  M1: R$ ${(evento.m1_r || 0).toFixed(2).padStart(12)} | Clientes: ${(evento.cl_plan || 0).toString().padStart(3)}`);
    console.log(`  TE: R$ ${(evento.te_plan || 0).toFixed(2).padStart(6)} | TB: R$ ${(evento.tb_plan || 0).toFixed(2).padStart(6)} | Lot.Max: ${evento.lot_max} ${lotMaxOk}`);
    console.log('');
    
    totalM1 += evento.m1_r || 0;
    totalClientes += evento.cl_plan || 0;
  });

  console.log('📊 TOTAIS NOVEMBRO/2025:');
  console.log('========================');
  console.log(`💰 M1 Total: R$ ${totalM1.toFixed(2)}`);
  console.log(`👥 Clientes Total: ${totalClientes}`);
  console.log(`📅 Total de Eventos: ${eventos.length}`);
  console.log(`💵 Ticket Médio Geral: R$ ${(totalM1 / totalClientes).toFixed(2)}`);
  
  console.log('\n✅ Atualização concluída com sucesso!\n');
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

