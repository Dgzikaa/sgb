import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CMVSemanal {
  semana: number;
  ano: number;
  data_inicio: string;
  data_fim: string;
  estoque_inicial_cozinha: number;
  estoque_inicial_bebidas: number;
  estoque_inicial_drinks: number;
  estoque_final_cozinha: number;
  estoque_final_bebidas: number;
  estoque_final_drinks: number;
  compras_cozinha: number;
  compras_bebidas: number;
  compras_drinks: number;
  consumo_socios: number;
  mesa_banda_dj: number;
  mesa_beneficios_cliente: number;
  mesa_adm_casa: number;
  mesa_rh: number;
  chegadeira: number;
  faturamento_bruto: number;
  vr_repique: number;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return weekNo;
}

function getWeekDates(year: number, week: number): { inicio: string; fim: string } {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - jan4Day + 1);
  
  const targetMonday = new Date(firstMonday);
  targetMonday.setDate(firstMonday.getDate() + (week - 1) * 7);
  
  const targetSunday = new Date(targetMonday);
  targetSunday.setDate(targetMonday.getDate() + 6);
  
  return {
    inicio: targetMonday.toISOString().split('T')[0],
    fim: targetSunday.toISOString().split('T')[0],
  };
}

async function buscarDadosAutomaticos(
  supabase: any,
  dataInicio: string,
  dataFim: string
): Promise<Partial<CMVSemanal>> {
  console.log(`📊 Buscando dados automáticos para ${dataInicio} - ${dataFim}`);

  // 1. Buscar dados do ContaHub
  const { data: contahubData } = await supabase
    .from('contahub_periodo')
    .select('*')
    .gte('dt_fechamento', dataInicio)
    .lte('dt_fechamento', dataFim);

  let faturamento_bruto = 0;
  let vr_repique = 0;
  let consumo_socios = 0;
  let mesa_banda_dj = 0;
  let mesa_beneficios_cliente = 0;
  let mesa_adm_casa = 0;

  if (contahubData && contahubData.length > 0) {
    faturamento_bruto = contahubData.reduce((sum: number, item: any) => sum + (parseFloat(item.vr_bruto) || 0), 0);
    vr_repique = contahubData.reduce((sum: number, item: any) => sum + (parseFloat(item.vr_repique) || 0), 0);

    // Consumo dos Sócios
    const nomesValidos = ['x-digao', 'x-diogo', 'x-rodrigo', 'x-cadu', 'x-corbal', 'x-augusto', 'x-gonza'];
    consumo_socios = contahubData
      .filter((item: any) => {
        const mesaDesc = (item.vd_mesadesc || '').toLowerCase();
        const cliNome = (item.cli_nome || '').toLowerCase();
        const motivo = (item.motivo || '').toLowerCase();
        
        const temNomeValido = nomesValidos.some(nome => 
          mesaDesc.includes(nome) || cliNome.includes(nome)
        );
        const temMotivoSocio = motivo.includes('sócio') || motivo.includes('socio');
        
        return temNomeValido || temMotivoSocio;
      })
      .reduce((sum: number, item: any) => sum + (parseFloat(item.vr_desconto) || 0), 0);

    // Mesa Banda/DJ
    mesa_banda_dj = contahubData
      .filter((item: any) => {
        const motivo = (item.motivo || '').toLowerCase();
        return ['dj', 'benza', 'banda', 'roadie', 'roudier'].some(termo => motivo.includes(termo));
      })
      .reduce((sum: number, item: any) => sum + (parseFloat(item.vr_desconto) || 0), 0);

    // Mesa Benefícios Cliente
    mesa_beneficios_cliente = contahubData
      .filter((item: any) => {
        const motivo = (item.motivo || '').toLowerCase();
        return ['aniversario', 'aniversário', 'voucher', 'beneficio', 'benefício'].some(termo => motivo.includes(termo));
      })
      .reduce((sum: number, item: any) => sum + (parseFloat(item.vr_desconto) || 0), 0);

    // Mesa ADM/Casa
    mesa_adm_casa = contahubData
      .filter((item: any) => {
        const motivo = (item.motivo || '').toLowerCase();
        return ['funcionario', 'funcionário', 'chefe', 'consuma', 'mkt', 'consumação financeiro', 'financeiro', 'rh', 'thais', 'isaias'].some(termo => motivo.includes(termo));
      })
      .reduce((sum: number, item: any) => sum + (parseFloat(item.vr_desconto) || 0), 0);
  }

  // 2. Buscar compras do NIBO
  const { data: niboData } = await supabase
    .from('nibo_agendamentos')
    .select('*')
    .eq('tipo', 'Debit')
    .gte('data_competencia', dataInicio)
    .lte('data_competencia', dataFim);

  let compras_cozinha = 0;
  let compras_bebidas = 0;
  let compras_drinks = 0;

  if (niboData && niboData.length > 0) {
    compras_cozinha = niboData
      .filter((item: any) => item.categoria_nome === 'CUSTO COMIDA')
      .reduce((sum: number, item: any) => sum + (parseFloat(item.valor) || 0), 0);

    const custoOutros = niboData
      .filter((item: any) => item.categoria_nome === 'CUSTO OUTROS')
      .reduce((sum: number, item: any) => sum + (parseFloat(item.valor) || 0), 0);

    const custoBebidas = niboData
      .filter((item: any) => item.categoria_nome === 'CUSTO BEBIDAS')
      .reduce((sum: number, item: any) => sum + (parseFloat(item.valor) || 0), 0);

    compras_bebidas = custoBebidas + custoOutros;

    compras_drinks = niboData
      .filter((item: any) => item.categoria_nome === 'CUSTO DRINKS')
      .reduce((sum: number, item: any) => sum + (parseFloat(item.valor) || 0), 0);
  }

  // 3. Buscar estoque final (bar_id passado via parâmetro)
  const { data: estoqueData } = await supabase
    .from('contagem_estoque_insumos')
    .select('*')
    .gte('data_contagem', dataInicio)
    .lte('data_contagem', dataFim)
    .order('data_contagem', { ascending: false });

  let estoque_final_cozinha = 0;
  let estoque_final_bebidas = 0;
  let estoque_final_drinks = 0;

  if (estoqueData && estoqueData.length > 0) {
    // Pegar a última contagem da semana
    const ultimaData = estoqueData[0].data_contagem;
    const estoqueUltimoDia = estoqueData.filter((item: any) => item.data_contagem === ultimaData);

    for (const item of estoqueUltimoDia) {
      const valor = (parseFloat(item.estoque_final) || 0) * (parseFloat(item.custo_unitario) || 0);
      
      if (item.tipo_local === 'cozinha') {
        estoque_final_cozinha += valor;
      } else if (item.tipo_local === 'bar') {
        if (item.categoria && item.categoria.toLowerCase().includes('drink')) {
          estoque_final_drinks += valor;
        } else {
          estoque_final_bebidas += valor;
        }
      }
    }
  }

  console.log('✅ Dados automáticos processados:');
  console.log(`  - Faturamento Bruto: R$ ${faturamento_bruto.toFixed(2)}`);
  console.log(`  - Estoque Cozinha: R$ ${estoque_final_cozinha.toFixed(2)}`);
  console.log(`  - Compras Cozinha: R$ ${compras_cozinha.toFixed(2)}`);
  console.log(`  - Consumo Sócios: R$ ${consumo_socios.toFixed(2)}`);

  return {
    faturamento_bruto,
    vr_repique,
    consumo_socios,
    mesa_banda_dj,
    mesa_beneficios_cliente,
    mesa_adm_casa,
    mesa_rh: 0,
    chegadeira: 0,
    compras_cozinha,
    compras_bebidas,
    compras_drinks,
    estoque_final_cozinha,
    estoque_final_bebidas,
    estoque_final_drinks,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parâmetros - bar_id é opcional (se não passar, processa todos)
    const body = await req.json().catch(() => ({}))
    const { bar_id } = body
    
    // Buscar bares para processar
    const { data: todosOsBares } = await supabaseClient
      .from('bars')
      .select('id, nome')
      .eq('ativo', true)
    
    if (!todosOsBares?.length) {
      return new Response(
        JSON.stringify({ success: false, error: 'Nenhum bar ativo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    const baresParaProcessar = bar_id 
      ? todosOsBares.filter(b => b.id === bar_id)
      : todosOsBares

    console.log(`🚀 Processando CMV Semanal para ${baresParaProcessar.length} bar(es)`);

    // Obter semana atual
    const hoje = new Date();
    const semanaAtual = getWeekNumber(hoje);
    const anoAtual = hoje.getFullYear();
    const { inicio: dataInicio, fim: dataFim } = getWeekDates(anoAtual, semanaAtual);

    console.log(`📅 Processando Semana ${semanaAtual}/${anoAtual} (${dataInicio} - ${dataFim})`);

    const resultadosPorBar: any[] = [];

    // ====== LOOP POR CADA BAR ======
    for (const bar of baresParaProcessar) {
      console.log(`\n🏪 Processando CMV para: ${bar.nome} (ID: ${bar.id})`);

      // Verificar se já existe registro para esta semana e bar
      const { data: existente } = await supabaseClient
        .from('cmv_semanal')
        .select('*')
        .eq('semana', semanaAtual)
        .eq('ano', anoAtual)
        .eq('bar_id', bar.id)
        .single();

      // Buscar dados automáticos
      const dadosAutomaticos = await buscarDadosAutomaticos(supabaseClient, dataInicio, dataFim);

      // Buscar estoque inicial (estoque final da semana anterior)
      let estoque_inicial_cozinha = 0;
      let estoque_inicial_bebidas = 0;
      let estoque_inicial_drinks = 0;

      if (semanaAtual > 1) {
        const { data: semanaAnterior } = await supabaseClient
          .from('cmv_semanal')
          .select('estoque_final_cozinha, estoque_final_bebidas, estoque_final_drinks')
          .eq('semana', semanaAtual - 1)
          .eq('ano', anoAtual)
          .eq('bar_id', bar.id)
          .single();

        if (semanaAnterior) {
          estoque_inicial_cozinha = semanaAnterior.estoque_final_cozinha || 0;
          estoque_inicial_bebidas = semanaAnterior.estoque_final_bebidas || 0;
          estoque_inicial_drinks = semanaAnterior.estoque_final_drinks || 0;
        }
      }

      const registro: any = {
        bar_id: bar.id,
        semana: semanaAtual,
        ano: anoAtual,
        data_inicio: dataInicio,
        data_fim: dataFim,
        estoque_inicial_cozinha,
        estoque_inicial_bebidas,
        estoque_inicial_drinks,
        ...dadosAutomaticos,
      };

      let result;
      try {
        if (existente) {
          // Atualizar registro existente, preservando campos manuais
          const { data, error } = await supabaseClient
            .from('cmv_semanal')
            .update({
              ...registro,
              outros_ajustes: existente.outros_ajustes, // Preservar manual
              ajuste_bonificacoes: existente.ajuste_bonificacoes, // Preservar manual
              cmv_teorico_percent: existente.cmv_teorico_percent, // Preservar manual
            })
            .eq('id', existente.id)
            .select()
            .single();

          if (error) throw error;
          result = data;
          console.log(`✅ ${bar.nome}: Registro atualizado com sucesso`);
        } else {
          // Criar novo registro
          const { data, error } = await supabaseClient
            .from('cmv_semanal')
            .insert(registro)
            .select()
            .single();

          if (error) throw error;
          result = data;
          console.log(`✅ ${bar.nome}: Novo registro criado com sucesso`);
        }
        
        resultadosPorBar.push({
          bar_id: bar.id,
          bar_nome: bar.nome,
          success: true,
          semana: semanaAtual,
          ano: anoAtual
        });
      } catch (barError) {
        console.error(`❌ Erro ao processar ${bar.nome}:`, barError);
        resultadosPorBar.push({
          bar_id: bar.id,
          bar_nome: bar.nome,
          success: false,
          error: barError.message
        });
      }
    }
    // ====== FIM DO LOOP DE BARES ======

    const totalSucesso = resultadosPorBar.filter(r => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `CMV Semanal processado: ${totalSucesso}/${baresParaProcessar.length} bar(es) na Semana ${semanaAtual}/${anoAtual}`,
        bares_processados: baresParaProcessar.length,
        resultados_por_bar: resultadosPorBar,
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
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

