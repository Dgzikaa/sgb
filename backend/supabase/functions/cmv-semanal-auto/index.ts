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
 * Calcular datas de início e fim da semana
 */
function getWeekDates(date: Date): { inicio: string; fim: string } {
  const primeiroDia = new Date(date);
  primeiroDia.setDate(date.getDate() - date.getDay());
  
  const ultimoDia = new Date(primeiroDia);
  ultimoDia.setDate(primeiroDia.getDate() + 6);
  
  return {
    inicio: primeiroDia.toISOString().split('T')[0],
    fim: ultimoDia.toISOString().split('T')[0]
  };
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
    estoque_final_cozinha: 0,
    estoque_final_bebidas: 0,
    estoque_final_drinks: 0,
  };

  // 1. BUSCAR CONSUMO DOS SÓCIOS
  try {
    const sociosPatterns = ['x-corbal', 'x-bruno', 'x-matheus', 'x-leonardo', 'x-thiago'];
    
    const { data: consumoSocios } = await supabase
      .from('contahub_periodo')
      .select('vr_consumo')
      .eq('bar_id', barId)
      .gte('dt_gerencial', dataInicio)
      .lte('dt_gerencial', dataFim)
      .or(sociosPatterns.map((s: string) => `cli_nome.ilike.%${s}%`).join(','));

    if (consumoSocios) {
      resultado.total_consumo_socios = consumoSocios.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.vr_consumo) || 0), 0
      );
      console.log(`✅ Consumo sócios: R$ ${resultado.total_consumo_socios.toFixed(2)}`);
    }
  } catch (err) {
    console.error('Erro ao buscar consumo dos sócios:', err);
  }

  // 2. BUSCAR CONTAS ESPECIAIS
  try {
    const contasEspeciais: Record<string, string[]> = {
      'mesa_beneficios_cliente': ['benefício', 'beneficio'],
      'mesa_banda_dj': ['banda', 'dj', 'artista'],
      'chegadeira': ['chegadeira', 'chegador'],
      'mesa_adm_casa': ['adm', 'administrativo', 'casa'],
      'mesa_rh': ['rh', 'recursos humanos']
    };

    for (const [campo, patterns] of Object.entries(contasEspeciais)) {
      const { data } = await supabase
        .from('contahub_periodo')
        .select('vr_consumo')
        .eq('bar_id', barId)
        .gte('dt_gerencial', dataInicio)
        .lte('dt_gerencial', dataFim)
        .or(patterns.map((p: string) => `cli_nome.ilike.%${p}%`).join(','));

      if (data) {
        resultado[campo] = data.reduce((sum: number, item: any) => 
          sum + (parseFloat(item.vr_consumo) || 0), 0
        );
        console.log(`✅ ${campo}: R$ ${resultado[campo].toFixed(2)}`);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar contas especiais:', err);
  }

  // 3. BUSCAR FATURAMENTO
  try {
    const { data: faturamento } = await supabase
      .from('contahub_periodo')
      .select('vr_repique, vr_pagamentos, vr_couvert')
      .eq('bar_id', barId)
      .gte('dt_gerencial', dataInicio)
      .lte('dt_gerencial', dataFim);

    if (faturamento) {
      resultado.faturamento_cmvivel = faturamento.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.vr_repique) || 0), 0
      );
      resultado.vendas_brutas = faturamento.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.vr_pagamentos) || 0), 0
      );
      resultado.vendas_liquidas = faturamento.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.vr_pagamentos) || 0) - (parseFloat(item.vr_couvert) || 0), 0
      );
      console.log(`✅ Faturamento CMVível: R$ ${resultado.faturamento_cmvivel.toFixed(2)}`);
    }
  } catch (err) {
    console.error('Erro ao buscar faturamento:', err);
  }

  // 4. BUSCAR COMPRAS DO NIBO
  try {
    const categoriasCompras: Record<string, string[]> = {
      'CUSTO COMIDA': ['CUSTO COMIDA', 'COMIDA', 'ALIMENTOS'],
      'CUSTO BEBIDAS': ['CUSTO BEBIDAS', 'BEBIDAS', 'CERVEJA'],
      'CUSTO OUTROS': ['CUSTO OUTROS', 'OUTROS CUSTOS', 'DESCARTÁVEIS'],
      'CUSTO DRINKS': ['CUSTO DRINKS', 'DRINKS', 'DESTILADOS']
    };

    const { data: comprasNibo } = await supabase
      .from('nibo_agendamentos')
      .select('categoria_nome, valor_pago')
      .eq('bar_id', barId)
      .eq('tipo', 'despesa')
      .eq('status', 'pago')
      .gte('data_pagamento', dataInicio)
      .lte('data_pagamento', dataFim);

    if (comprasNibo) {
      for (const [campo, categorias] of Object.entries(categoriasCompras)) {
        const valorCategoria = comprasNibo
          .filter((item: any) => 
            item.categoria_nome && 
            categorias.some((cat: string) => 
              item.categoria_nome.toUpperCase().includes(cat.toUpperCase())
            )
          )
          .reduce((sum: number, item: any) => sum + Math.abs(parseFloat(item.valor_pago) || 0), 0);

        if (campo === 'CUSTO COMIDA') resultado.compras_custo_comida = valorCategoria;
        else if (campo === 'CUSTO BEBIDAS') resultado.compras_custo_bebidas = valorCategoria;
        else if (campo === 'CUSTO OUTROS') resultado.compras_custo_outros = valorCategoria;
        else if (campo === 'CUSTO DRINKS') resultado.compras_custo_drinks = valorCategoria;

        console.log(`✅ Compras ${campo}: R$ ${valorCategoria.toFixed(2)}`);
      }
    }
  } catch (err) {
    console.error('Erro ao buscar compras do NIBO:', err);
  }

  // 5. BUSCAR ESTOQUES
  try {
    const { data: ultimaContagem } = await supabase
      .from('historico_estoque')
      .select('data_contagem')
      .eq('bar_id', barId)
      .lte('data_contagem', dataFim)
      .order('data_contagem', { ascending: false })
      .limit(1)
      .single();

    if (ultimaContagem) {
      const dataContagem = ultimaContagem.data_contagem;
      console.log(`📅 Usando contagem de estoque de: ${dataContagem}`);

      const tiposLocal = ['cozinha', 'salão', 'drinks'];
      
      for (const tipo of tiposLocal) {
        const { data: estoque } = await supabase
          .from('historico_estoque')
          .select(`
            insumos!inner(tipo_local, custo_unitario),
            quantidade_fechada,
            quantidade_flutuante
          `)
          .eq('bar_id', barId)
          .eq('data_contagem', dataContagem)
          .eq('insumos.tipo_local', tipo);

        if (estoque) {
          const valorTotal = estoque.reduce((sum: number, item: any) => {
            const qtdTotal = (item.quantidade_fechada || 0) + (item.quantidade_flutuante || 0);
            const custo = item.insumos?.custo_unitario || 0;
            return sum + (qtdTotal * custo);
          }, 0);

          if (tipo === 'cozinha') resultado.estoque_final_cozinha = valorTotal;
          else if (tipo === 'salão') resultado.estoque_final_bebidas = valorTotal;
          else if (tipo === 'drinks') resultado.estoque_final_drinks = valorTotal;

          console.log(`✅ Estoque ${tipo}: R$ ${valorTotal.toFixed(2)}`);
        }
      }
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
  
  // Estoque final
  dados.estoque_final = (dados.estoque_final_cozinha || 0) + 
                         (dados.estoque_final_bebidas || 0) + 
                         (dados.estoque_final_drinks || 0);
  
  // Compras
  dados.compras_periodo = (dados.compras_custo_comida || 0) + 
                          (dados.compras_custo_bebidas || 0) + 
                          (dados.compras_custo_outros || 0) + 
                          (dados.compras_custo_drinks || 0);
  
  // CMV Real
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
 * Handler principal
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
    
    // Definir semana e ano
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const semana = getWeekNumber(hoje);
    const { inicio, fim } = getWeekDates(hoje);
    
    console.log(`📅 Processando: Ano ${ano}, Semana ${semana}`);
    console.log(`   Período: ${inicio} até ${fim}`);
    
    const barId = 3; // Ordinário (pode ser parametrizado)
    
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
    
    console.log('\n📊 Resultado do CMV:');
    console.log(`   CMV Real: R$ ${cmvData.cmv_real.toFixed(2)}`);
    console.log(`   CMV Limpo: ${cmvData.cmv_limpo_percentual.toFixed(2)}%`);
    console.log(`   Gap: ${cmvData.gap.toFixed(2)}%`);
    
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

    console.log('\n✅ CMV Semanal processado com sucesso!');

    return new Response(
      JSON.stringify({
        success: true,
        data,
        message: 'CMV Semanal processado com sucesso'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
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

