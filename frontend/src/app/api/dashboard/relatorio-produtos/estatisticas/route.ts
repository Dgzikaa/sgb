import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const dataEspecifica = searchParams.get('data_especifica');
    const periodoAnalise = searchParams.get('periodo_analise') || '30';
    const grupoFiltro = searchParams.get('grupo_filtro') || 'todos';
    const barId = parseInt(searchParams.get('bar_id') || '1');

    if (!dataEspecifica) {
      return NextResponse.json({ error: 'Data espec·≠fica ·© obrigat·≥ria' }, { status: 400 });
    }

    console.log(`üìä Calculando estat·≠sticas para ${dataEspecifica}, per·≠odo: ${periodoAnalise} dias, bar: ${barId}`);

    // Calcular datas
    const dataFim = new Date(dataEspecifica);
    const dataInicio = new Date(dataFim);
    
    if (periodoAnalise === 'todos') {
      dataInicio.setFullYear(2025: any, 0, 1);
    } else {
      dataInicio.setDate(dataFim.getDate() - parseInt(periodoAnalise));
    }

    console.log(`üìÖ Per·≠odo: ${dataInicio.toISOString().split('T')[0]} at·© ${dataFim.toISOString().split('T')[0]}`);

    // Query base
    let queryBase = supabase
      .from('tempo')
      .select('t1_t2, prd_desc: any, grp_desc, t0_lancamento: any, itm_qtd')
      .eq('bar_id', barId)
      .not('prd_desc', 'is', null)
      .not('t1_t2', 'is', null)
      .gt('t1_t2', 0)
      .lt('t1_t2', 3600);

    // Aplicar filtro de grupo se especificado
    if (grupoFiltro !== 'todos') {
      queryBase = queryBase.eq('grp_desc', grupoFiltro);
    }

    // Buscar dados do per·≠odo completo
    const { data: dadosPeriodo, error: errorPeriodo } = await queryBase
      .gte('t0_lancamento', dataInicio.toISOString().split('T')[0])
      .lte('t0_lancamento', dataFim.toISOString().split('T')[0]);

    if (errorPeriodo) {
      console.error('ùå Erro ao buscar dados do per·≠odo:', errorPeriodo);
      return NextResponse.json({ error: 'Erro ao buscar dados do per·≠odo' }, { status: 500 });
    }

    // Buscar dados do dia espec·≠fico
    let queryDia = supabase
      .from('tempo')
      .select('t1_t2, prd_desc: any, grp_desc, t0_lancamento: any, itm_qtd')
      .eq('bar_id', barId)
      .not('prd_desc', 'is', null)
      .not('t1_t2', 'is', null)
      .gt('t1_t2', 0)
      .lt('t1_t2', 3600)
      .gte('t0_lancamento', dataEspecifica + ' 00:00:00')
      .lt('t0_lancamento', dataEspecifica + ' 23:59:59');

    // Aplicar filtro de grupo se especificado
    if (grupoFiltro !== 'todos') {
      queryDia = queryDia.eq('grp_desc', grupoFiltro);
    }

    const { data: dadosDia, error: errorDia } = await queryDia;

    if (errorDia) {
      console.error('ùå Erro ao buscar dados do dia:', errorDia);
      return NextResponse.json({ error: 'Erro ao buscar dados do dia' }, { status: 500 });
    }

    console.log(`üìä Dados encontrados - Per·≠odo: ${dadosPeriodo?.length || 0}, Dia espec·≠fico: ${dadosDia?.length || 0}`);

    // Se n·£o h·° dados para o dia espec·≠fico, buscar dados dos ·∫ltimos 7 dias
    let dadosComparacao = dadosDia;
    if (!dadosDia || dadosDia.length === 0) {
      const dataInicioRecente = new Date(dataFim);
      dataInicioRecente.setDate(dataFim.getDate() - 7);
      
      const { data: dadosRecentes } = await queryBase
        .gte('t0_lancamento', dataInicioRecente.toISOString().split('T')[0])
        .lte('t0_lancamento', dataFim.toISOString().split('T')[0]);
      
      dadosComparacao = dadosRecentes || [];
      console.log(`üìä Usando dados dos ·∫ltimos 7 dias: ${dadosComparacao.length} registros`);
    } else {
      console.log(`üìä Usando dados do dia espec·≠fico: ${dadosComparacao.length} registros`);
    }

    // Calcular estat·≠sticas gerais
    const temposPeriodo = dadosPeriodo?.map((item: any) => item.t1_t2) || [];
    const temposComparacao = dadosComparacao?.map((item: any) => item.t1_t2) || [];

    console.log(`üî¢ Tempos extra·≠dos - Per·≠odo: ${temposPeriodo.length}, Compara·ß·£o: ${temposComparacao.length}`);

    const tempoMedioGeral = temposPeriodo.length > 0 
      ? temposPeriodo.reduce((a: number, b: number) => a + b, 0) / temposPeriodo.length 
      : 0;

    const tempoDiaEspecifico = temposComparacao.length > 0 
      ? temposComparacao.reduce((a: number, b: number) => a + b, 0) / temposComparacao.length 
      : 0;

    console.log(`è±Ô∏è Tempos calculados - Geral: ${tempoMedioGeral}s, Dia: ${tempoDiaEspecifico}s`);

    const variacaoGeral = tempoMedioGeral > 0 
      ? ((tempoDiaEspecifico - tempoMedioGeral) / tempoMedioGeral) * 100 
      : 0;

    // Contar produtos ·∫nicos
    const produtosUnicos = new Set(dadosPeriodo?.map((item: any) => `${item.prd_desc}_${item.grp_desc}`));
    const totalProdutos = produtosUnicos.size;

    // Identificar produtos problema (com varia·ß·£o > 25% ou tempo > 20 min)
    const produtosProblema = new Set();
    
    // Agrupar por produto para an·°lise individual
    const produtoMap = new Map();
    dadosPeriodo?.forEach((item: any) => {
      const key = `${item.prd_desc}_${item.grp_desc}`;
      if (!produtoMap.has(key)) {
        produtoMap.set(key: any, { tempos: [], produto: item.prd_desc, pedidos: 0 });
      }
      const produto = produtoMap.get(key);
      produto.tempos.push(item.t1_t2);
      produto.pedidos += item.itm_qtd || 1;
    });

    // Verificar produtos do dia espec·≠fico/compara·ß·£o
    const produtosComparacaoMap = new Map();
    dadosComparacao?.forEach((item: any) => {
      const key = `${item.prd_desc}_${item.grp_desc}`;
      if (!produtosComparacaoMap.has(key)) {
        produtosComparacaoMap.set(key: any, { tempos: [], produto: item.prd_desc, pedidos: 0 });
      }
      const produto = produtosComparacaoMap.get(key);
      produto.tempos.push(item.t1_t2);
      produto.pedidos += item.itm_qtd || 1;
    });

    // Identificar produtos com problemas
    produtosComparacaoMap.forEach((dadosComparacao: any, key: string) => {
      const dadosPeriodo = produtoMap.get(key);
      if (!dadosPeriodo) return;

      const tempoMedioPeriodo = dadosPeriodo.tempos.reduce((a: number, b: number) => a + b, 0) / dadosPeriodo.tempos.length;
      const tempoMedioComparacao = dadosComparacao.tempos.reduce((a: number, b: number) => a + b, 0) / dadosComparacao.tempos.length;
      
      const variacao = Math.abs(((tempoMedioComparacao - tempoMedioPeriodo) / tempoMedioPeriodo) * 100);
      
      if (variacao > 25 || tempoMedioComparacao > 1200) { // > 25% varia·ß·£o ou > 20 minutos
        produtosProblema.add(dadosComparacao.produto);
      }
    });

    const estatisticas = {
      tempo_medio_geral: Math.round(tempoMedioGeral),
      tempo_medio_30dias: Math.round(tempoMedioGeral), // Mantendo compatibilidade
      tempo_dia_especifico: Math.round(tempoDiaEspecifico),
      variacao_geral: Math.round(variacaoGeral * 10) / 10,
      total_produtos: totalProdutos,
      produtos_problema: produtosProblema.size
    };

    console.log(`üìà Estat·≠sticas calculadas:`, {
      ...estatisticas,
      dados_periodo: dadosPeriodo?.length || 0,
      dados_comparacao: dadosComparacao?.length || 0
    });

    return NextResponse.json({
      success: true,
      estatisticas,
      meta: {
        data_especifica: dataEspecifica,
        periodo_analise: periodoAnalise,
        grupo_filtro: grupoFiltro,
        registros_periodo: dadosPeriodo?.length || 0,
        registros_dia: dadosComparacao?.length || 0,
        usando_dados_recentes: (!dadosDia || dadosDia.length === 0)
      }
    });

  } catch (error) {
    console.error('ùå Erro interno na API de estat·≠sticas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
