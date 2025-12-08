/**
 * Edge Function: CMV Semanal Automático
 * 
 * Roda automaticamente para criar/atualizar CMV da semana atual
 * Pode ser chamado via cron ou manualmente
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Calcular número da semana
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Calcular datas de início e fim da semana (segunda a domingo)
 */
function getWeekDates(date: Date): { inicio: string; fim: string } {
  const dayOfWeek = date.getDay();
  
  // Segunda-feira (início)
  const primeiroDia = new Date(date);
  const diasParaSegunda = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  primeiroDia.setDate(date.getDate() + diasParaSegunda);
  
  // Domingo (fim)
  const ultimoDia = new Date(primeiroDia);
  ultimoDia.setDate(primeiroDia.getDate() + 6);
  
  return {
    inicio: primeiroDia.toISOString().split('T')[0],
    fim: ultimoDia.toISOString().split('T')[0]
  };
}

/**
 * Helper: Buscar TODOS os registros com paginação automática (sem limite de 1000)
 */
async function fetchAllWithPagination(baseQuery: any) {
  let allRecords: any[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;
  
  while (hasMore) {
    const { data: batch } = await baseQuery.range(from, from + batchSize - 1);
    
    if (batch && batch.length > 0) {
      allRecords = allRecords.concat(batch);
      from += batchSize;
      hasMore = batch.length === batchSize;
    } else {
      hasMore = false;
    }
  }
  
  return allRecords;
}

/**
 * Buscar CMV da semana anterior (para estoque inicial)
 */
async function buscarCMVSemanaAnterior(supabase: any, barId: number, ano: number, semana: number) {
  const { data, error } = await supabase
    .from('cmv_semanal')
    .select('estoque_final')
    .eq('bar_id', barId)
    .eq('ano', ano)
    .eq('semana', semana - 1)
    .single();

  if (error || !data) {
    console.log('⚠️ CMV da semana anterior não encontrado, usando estoque inicial 0');
    return 0;
  }

  return data.estoque_final || 0;
}

/**
 * Buscar dados automáticos (consumos, faturamento, estoques, compras)
 */
async function buscarDadosAutomaticos(supabase: any, barId: number, dataInicio: string, dataFim: string) {
  console.log(`🔍 Buscando dados automáticos de ${dataInicio} até ${dataFim}...`);
  
  const resultado: any = {
    total_consumo_socios: 0,
    mesa_beneficios_cliente: 0,
    mesa_banda_dj: 0,
    chegadeira: 0,
    mesa_adm_casa: 0,
    mesa_rh: 0,
    compras_custo_comida: 0,
    compras_custo_bebidas: 0,
    compras_custo_outros: 0,
    compras_custo_drinks: 0,
    faturamento_cmvivel: 0,
    vendas_brutas: 0,
    vendas_liquidas: 0,
    // Estoque INICIAL (início da semana)
    estoque_inicial_cozinha: 0,
    estoque_inicial_bebidas: 0,
    estoque_inicial_drinks: 0,
    // Estoque FINAL (fim da semana)
    estoque_final_cozinha: 0,
    estoque_final_bebidas: 0,
    estoque_final_drinks: 0,
  };

  // 1. BUSCAR CONSUMO DOS SÓCIOS
  try {
    // Sócios: rodrigo, digão, diogo, corbal, cadu, gonza, augusto, lg, vini
    // Sócios consomem com 100% desconto, então valor está em vr_desconto
    // Filtro: Motivo contém "sócio" ou "socio" (não precisa ter X- no nome)
    const consumoSocios = await fetchAllWithPagination(
      supabase
        .from('contahub_periodo')
        .select('vr_desconto, vr_produtos, motivo')
        .eq('bar_id', barId)
        .gte('dt_gerencial', dataInicio)
        .lte('dt_gerencial', dataFim)
        .or('motivo.ilike.%sócio%,motivo.ilike.%socio%')
    );

    if (consumoSocios) {
      // Somar desconto + produtos (alguns podem ter desconto parcial)
      resultado.total_consumo_socios = consumoSocios.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.vr_desconto) || 0) + (parseFloat(item.vr_produtos) || 0), 0
      );
      console.log(`✅ Consumo sócios: R$ ${resultado.total_consumo_socios.toFixed(2)} (${consumoSocios.length} registros)`);
    }
  } catch (err) {
    console.error('Erro ao buscar consumo dos sócios:', err);
  }

  // 2. BUSCAR CONTAS ESPECIAIS
  try {
    // Contas especiais geralmente têm desconto, então buscar em vr_desconto + vr_produtos
    const contasEspeciais: Record<string, string[]> = {
      'mesa_beneficios_cliente': ['benefício', 'beneficio'],
      'mesa_banda_dj': ['consumação banda', 'consumação dj', 'consumacao banda', 'consumacao dj', ' banda ', ' dj '],
      'chegadeira': ['chegadeira', 'chegador'],
      'mesa_adm_casa': ['adm', 'administrativo', 'casa', 'marketing'],
      'mesa_rh': ['rh', 'recursos humanos']
    };

    for (const [campo, patterns] of Object.entries(contasEspeciais)) {
      const data = await fetchAllWithPagination(
        supabase
          .from('contahub_periodo')
          .select('vr_desconto, vr_produtos, cli_nome, motivo')
          .eq('bar_id', barId)
          .gte('dt_gerencial', dataInicio)
          .lte('dt_gerencial', dataFim)
          .or(patterns.map((p: string) => `motivo.ilike.%${p}%`).join(','))
      );

      if (data) {
        // Somar desconto + produtos (podem ter desconto parcial)
        resultado[campo] = data.reduce((sum: number, item: any) => 
          sum + (parseFloat(item.vr_desconto) || 0) + (parseFloat(item.vr_produtos) || 0), 0
        );
        console.log(`✅ ${campo}: R$ ${resultado[campo].toFixed(2)} (${data.length} registros)`);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar contas especiais:', err);
  }

  // 3. BUSCAR FATURAMENTO
  try {
    console.log(`🔍 Buscando faturamento de ${dataInicio} até ${dataFim} (bar_id: ${barId})`);
    
    const faturamento = await fetchAllWithPagination(
      supabase
        .from('contahub_periodo')
        .select('vr_repique, vr_pagamentos, vr_couvert')
        .eq('bar_id', barId)
        .gte('dt_gerencial', dataInicio)
        .lte('dt_gerencial', dataFim)
    );

    console.log(`📊 Registros de faturamento encontrados: ${faturamento?.length || 0}`);

    if (faturamento) {
      resultado.vendas_brutas = faturamento.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.vr_pagamentos) || 0), 0
      );
      
      const totalCouvert = faturamento.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.vr_couvert) || 0), 0
      );
      
      const totalComissao = faturamento.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.vr_repique) || 0), 0
      );
      
      // Vendas Líquidas = Faturamento Bar - Couvert
      resultado.vendas_liquidas = resultado.vendas_brutas - totalCouvert;
      
      // Faturamento CMVível = Vendas Líquidas - Comissão (exatamente como na planilha)
      resultado.faturamento_cmvivel = resultado.vendas_liquidas - totalComissao;
      
      console.log(`✅ Vendas Brutas (vr_pagamentos): R$ ${resultado.vendas_brutas.toFixed(2)}`);
      console.log(`✅ Couvert: R$ ${totalCouvert.toFixed(2)}`);
      console.log(`✅ Vendas Líquidas (Bar - Couvert): R$ ${resultado.vendas_liquidas.toFixed(2)}`);
      console.log(`✅ Comissão (vr_repique): R$ ${totalComissao.toFixed(2)}`);
      console.log(`✅ Faturamento CMVível (Líquidas - Comissão): R$ ${resultado.faturamento_cmvivel.toFixed(2)}`);
    }
  } catch (err) {
    console.error('Erro ao buscar faturamento:', err);
  }

  // 4. BUSCAR COMPRAS DO NIBO (exatamente como na planilha)
  try {
    const comprasNibo = await fetchAllWithPagination(
      supabase
        .from('nibo_agendamentos')
        .select('categoria_nome, valor')
        .eq('bar_id', barId)
        .eq('tipo', 'Debit')
        .gte('data_competencia', dataInicio)
        .lte('data_competencia', dataFim)
    );

    if (comprasNibo) {
      // BEBIDAS + TABACARIA = "Custo Bebidas" + "Custo Outros"
      resultado.compras_custo_bebidas = comprasNibo
        .filter((item: any) => 
          item.categoria_nome === 'Custo Bebidas' ||
          item.categoria_nome === 'Custo Outros'
        )
        .reduce((sum: number, item: any) => sum + Math.abs(parseFloat(item.valor) || 0), 0);

      // COZINHA = APENAS "CUSTO COMIDA" (exato, não inclui "ALIMENTAÇÃO")
      resultado.compras_custo_comida = comprasNibo
        .filter((item: any) => item.categoria_nome === 'CUSTO COMIDA')
        .reduce((sum: number, item: any) => sum + Math.abs(parseFloat(item.valor) || 0), 0);

      // DRINKS = "Custo Drinks"
      resultado.compras_custo_drinks = comprasNibo
        .filter((item: any) => item.categoria_nome === 'Custo Drinks')
        .reduce((sum: number, item: any) => sum + Math.abs(parseFloat(item.valor) || 0), 0);

      // OUTROS = Zero (Materiais de Limpeza e Operação NÃO entram no CMV)
      resultado.compras_custo_outros = 0;

      const totalCompras = resultado.compras_custo_bebidas + resultado.compras_custo_comida + 
                           resultado.compras_custo_drinks;

      console.log(`✅ Compras Bebidas + Tabacaria: R$ ${resultado.compras_custo_bebidas.toFixed(2)}`);
      console.log(`✅ Compras Cozinha (CUSTO COMIDA): R$ ${resultado.compras_custo_comida.toFixed(2)}`);
      console.log(`✅ Compras Drinks: R$ ${resultado.compras_custo_drinks.toFixed(2)}`);
      console.log(`📊 TOTAL COMPRAS CMV: R$ ${totalCompras.toFixed(2)}`);
    }
  } catch (err) {
    console.error('Erro ao buscar compras do NIBO:', err);
  }

  // 5. BUSCAR ESTOQUES
  try {
    // ESTOQUE INICIAL: Última contagem ANTES ou NO INÍCIO da semana COM VALOR > 0
    const { data: contagensInicio } = await supabase
      .from('contagem_estoque_insumos')
      .select('data_contagem')
      .eq('bar_id', barId)
      .lte('data_contagem', dataInicio)
      .gt('estoque_final', 0)  // Apenas insumos com estoque > 0
      .order('data_contagem', { ascending: false })
      .limit(50);
    
    let dataContagemInicial = null;
    let maxInsumosInicio = 0;
    
    if (contagensInicio && contagensInicio.length > 0) {
      const datasUnicas = [...new Set(contagensInicio.map((c: any) => c.data_contagem))];
      
      for (const data of datasUnicas) {
        // Contar insumos COM estoque > 0 nesta data
        const { count } = await supabase
          .from('contagem_estoque_insumos')
          .select('*', { count: 'exact', head: true })
          .eq('bar_id', barId)
          .eq('data_contagem', data)
          .gt('estoque_final', 0);
        
        if (count && count > 50 && count > maxInsumosInicio) {
          maxInsumosInicio = count;
          dataContagemInicial = data;
        }
      }
      
      if (!dataContagemInicial && datasUnicas.length > 0) {
        dataContagemInicial = datasUnicas[0];
      }
    }
    
    // ESTOQUE FINAL: Primeira contagem DEPOIS ou NO FIM da semana COM VALOR > 0
    const { data: contagensFinal } = await supabase
      .from('contagem_estoque_insumos')
      .select('data_contagem')
      .eq('bar_id', barId)
      .gte('data_contagem', dataFim)
      .gt('estoque_final', 0)  // Apenas insumos com estoque > 0
      .order('data_contagem', { ascending: true })
      .limit(50);
    
    let dataContagemFinal = null;
    let maxInsumosFinal = 0;
    
    if (contagensFinal && contagensFinal.length > 0) {
      const datasUnicas = [...new Set(contagensFinal.map((c: any) => c.data_contagem))];
      
      for (const data of datasUnicas) {
        // Contar insumos COM estoque > 0 nesta data
        const { count } = await supabase
          .from('contagem_estoque_insumos')
          .select('*', { count: 'exact', head: true })
          .eq('bar_id', barId)
          .eq('data_contagem', data)
          .gt('estoque_final', 0);
        
        if (count && count > 50 && count > maxInsumosFinal) {
          maxInsumosFinal = count;
          dataContagemFinal = data;
        }
      }
      
      if (!dataContagemFinal && datasUnicas.length > 0) {
        dataContagemFinal = datasUnicas[0];
      }
    }
    
    console.log(`📅 Estoque Inicial: ${dataContagemInicial} (${maxInsumosInicio} insumos)`);
    console.log(`📅 Estoque Final: ${dataContagemFinal} (${maxInsumosFinal} insumos)`);
    
    // Função auxiliar para calcular estoque de uma data
    async function calcularEstoqueData(dataContagem: string) {
      const contagens = await fetchAllWithPagination(
        supabase
          .from('contagem_estoque_insumos')
          .select('insumo_id, estoque_final, custo_unitario, tipo_local, categoria')
          .eq('bar_id', barId)
          .eq('data_contagem', dataContagem)
      );

      let totalCozinha = 0;
      let totalDrinks = 0;
      let totalBebidas = 0;

      if (contagens) {
        contagens.forEach((contagem: any) => {
          const valor = (contagem.estoque_final || 0) * (contagem.custo_unitario || 0);
          
          if (contagem.tipo_local === 'cozinha') {
            totalCozinha += valor;
          } else if (contagem.tipo_local === 'bar') {
            totalBebidas += valor;
          }
        });
      }

      return { cozinha: totalCozinha, drinks: totalDrinks, bebidas: totalBebidas, total: totalCozinha + totalDrinks + totalBebidas };
    }

    // Calcular ESTOQUE INICIAL
    if (dataContagemInicial) {
      console.log(`📦 Calculando estoque INICIAL de ${dataContagemInicial}...`);
      const estoqueInicial = await calcularEstoqueData(dataContagemInicial);
      resultado.estoque_inicial_cozinha = estoqueInicial.cozinha;
      resultado.estoque_inicial_drinks = estoqueInicial.drinks;
      resultado.estoque_inicial_bebidas = estoqueInicial.bebidas;
      console.log(`✅ Estoque Inicial: R$ ${estoqueInicial.total.toFixed(2)}`);
    }

    // Calcular ESTOQUE FINAL
    if (dataContagemFinal) {
      console.log(`📦 Calculando estoque FINAL de ${dataContagemFinal}...`);
      const estoqueFinal = await calcularEstoqueData(dataContagemFinal);
      resultado.estoque_final_cozinha = estoqueFinal.cozinha;
      resultado.estoque_final_drinks = estoqueFinal.drinks;
      resultado.estoque_final_bebidas = estoqueFinal.bebidas;
      console.log(`✅ Estoque Final: R$ ${estoqueFinal.total.toFixed(2)}`);
    }
    
  } catch (err) {
    console.error('Erro ao buscar estoques:', err);
  }

  return resultado;
}

/**
 * Calcular valores de CMV
 */
function calcularCMV(dados: any) {
  // Consumos
  dados.consumo_socios = (dados.total_consumo_socios || 0) * 0.35;
  dados.consumo_beneficios = ((dados.mesa_beneficios_cliente || 0) + (dados.chegadeira || 0)) * 0.33;
  dados.consumo_adm = (dados.mesa_adm_casa || 0) * 0.35;
  dados.consumo_artista = (dados.mesa_banda_dj || 0) * 0.35;
  
  // Estoque INICIAL (calculado da contagem de insumos)
  dados.estoque_inicial = (dados.estoque_inicial_cozinha || 0) + 
                          (dados.estoque_inicial_bebidas || 0) + 
                          (dados.estoque_inicial_drinks || 0);
  
  // Estoque FINAL (calculado da contagem de insumos)
  dados.estoque_final = (dados.estoque_final_cozinha || 0) + 
                         (dados.estoque_final_bebidas || 0) + 
                         (dados.estoque_final_drinks || 0);
  
  // Compras
  dados.compras_periodo = (dados.compras_custo_comida || 0) + 
                          (dados.compras_custo_bebidas || 0) + 
                          (dados.compras_custo_outros || 0) + 
                          (dados.compras_custo_drinks || 0);
  
  // CMV Real = Estoque Inicial + Compras - Estoque Final
  const cmvBruto = (dados.estoque_inicial || 0) + 
                   (dados.compras_periodo || 0) - 
                   (dados.estoque_final || 0);
  
  const totalConsumos = (dados.consumo_socios || 0) + 
                        (dados.consumo_beneficios || 0) + 
                        (dados.consumo_adm || 0) + 
                        (dados.consumo_rh || 0) + 
                        (dados.consumo_artista || 0) + 
                        (dados.outros_ajustes || 0);
  
  dados.cmv_real = cmvBruto - totalConsumos + (dados.ajuste_bonificacoes || 0);
  
  // CMV Limpo
  if ((dados.faturamento_cmvivel || 0) > 0) {
    dados.cmv_limpo_percentual = ((dados.cmv_real || 0) / (dados.faturamento_cmvivel || 1)) * 100;
  } else {
    dados.cmv_limpo_percentual = 0;
  }
  
  // Gap
  dados.gap = (dados.cmv_limpo_percentual || 0) - (dados.cmv_teorico_percentual || 0);
  
  return dados;
}

/**
 * Handler principal - Processa CMV para todos os bares ativos ou bar específico
 */
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🚀 Iniciando processamento automático de CMV Semanal...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Permitir processar semana específica via parâmetro
    const body = await req.json().catch(() => ({}));
    const offsetSemanas = body.offsetSemanas !== undefined ? body.offsetSemanas : -1; // Padrão: -1 (semana passada)
    const barIdParam = body.bar_id; // Bar específico (opcional)
    
    // Definir semana e ano
    const hoje = new Date();
    hoje.setDate(hoje.getDate() + (offsetSemanas * 7)); // Ajustar data baseado no offset
    const ano = hoje.getFullYear();
    const semana = getWeekNumber(hoje);
    const { inicio, fim } = getWeekDates(hoje);
    
    console.log(`📅 Processando: Ano ${ano}, Semana ${semana}`);
    console.log(`   Período: ${inicio} até ${fim}`);
    console.log(`   Data de referência (offsetSemanas: ${offsetSemanas}): ${hoje.toISOString().split('T')[0]}`);
    
    // Buscar bares para processar
    let baresParaProcessar: { id: number; nome: string }[] = [];
    
    if (barIdParam) {
      // Bar específico
      const { data: bar } = await supabase
        .from('bars')
        .select('id, nome')
        .eq('id', barIdParam)
        .single();
      
      if (bar) {
        baresParaProcessar = [bar];
      }
    } else {
      // Todos os bares ativos
      const { data: bares } = await supabase
        .from('bars')
        .select('id, nome')
        .eq('ativo', true);
      
      baresParaProcessar = bares || [];
    }
    
    console.log(`🏪 Processando ${baresParaProcessar.length} bar(es)`);
    
    const resultados: any[] = [];
    
    for (const bar of baresParaProcessar) {
      const barId = bar.id;
      console.log(`\n🏪 Processando: ${bar.nome} (bar_id: ${barId})`);
      
      try {
        // Buscar estoque inicial (da semana anterior)
        const estoqueInicial = await buscarCMVSemanaAnterior(supabase, barId, ano, semana);
        console.log(`📦 Estoque inicial: R$ ${estoqueInicial.toFixed(2)}`);
        
        // Buscar dados automáticos
        const dadosAuto = await buscarDadosAutomaticos(supabase, barId, inicio, fim);
        
        // Montar objeto CMV
        let cmvData: any = {
          bar_id: barId,
          ano,
          semana,
          data_inicio: inicio,
          data_fim: fim,
          estoque_inicial: estoqueInicial,
          ...dadosAuto,
          // Campos manuais (deixar zerado se não existirem)
          consumo_rh: 0,
          outros_ajustes: 0,
          ajuste_bonificacoes: 0,
          cmv_teorico_percentual: 33, // Meta padrão
          status: 'rascunho',
          responsavel: 'Sistema Automático'
        };
        
        // Calcular CMV
        cmvData = calcularCMV(cmvData);
        
        console.log(`📊 ${bar.nome}: CMV Real R$ ${cmvData.cmv_real.toFixed(2)} | CMV Limpo ${cmvData.cmv_limpo_percentual.toFixed(2)}%`);
        
        // Inserir/atualizar no banco
        const { data, error } = await supabase
          .from('cmv_semanal')
          .upsert(cmvData, {
            onConflict: 'bar_id,ano,semana'
          })
          .select()
          .single();

        if (error) {
          throw error;
        }
        
        resultados.push({
          bar_id: barId,
          bar_nome: bar.nome,
          success: true,
          cmv_real: cmvData.cmv_real,
          cmv_limpo_percentual: cmvData.cmv_limpo_percentual
        });
        
      } catch (barError: any) {
        console.error(`❌ Erro ao processar ${bar.nome}:`, barError.message);
        resultados.push({
          bar_id: barId,
          bar_nome: bar.nome,
          success: false,
          error: barError.message
        });
      }
    }

    const sucessos = resultados.filter(r => r.success).length;
    const erros = resultados.filter(r => !r.success).length;
    
    console.log(`\n✅ CMV Semanal processado: ${sucessos} sucesso(s), ${erros} erro(s)`);

    return new Response(
      JSON.stringify({
        success: erros === 0,
        message: `CMV Semanal processado: ${sucessos} sucesso(s), ${erros} erro(s)`,
        ano,
        semana,
        periodo: { inicio, fim },
        resultados
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erro:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

