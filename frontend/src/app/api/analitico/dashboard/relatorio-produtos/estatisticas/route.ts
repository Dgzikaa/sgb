import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// ========================================
// 📊 API PARA ESTATÍSTICAS DE PRODUTOS
// ========================================

interface TempoItem {
  t1_t2: number;
  prd_desc: string;
  grp_desc: string;
  t0_lancamento: string;
  itm_qtd: number;
}

interface ProdutoDados {
  tempos: number[];
  produto: string;
  pedidos: number;
}

interface Estatisticas {
  tempo_medio_geral: number;
  tempo_medio_30dias: number;
  tempo_dia_especifico: number;
  variacao_geral: number;
  total_produtos: number;
  produtos_problema: number;
}

interface ApiError {
  message: string;
}

// ========================================
// 📊 GET /api/configuracoes/dashboard/relatorio-produtos/estatisticas
// ========================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dataEspecifica = searchParams.get('data_especifica');
    const periodoAnalise = searchParams.get('periodo_analise') || '30';
    const grupoFiltro = searchParams.get('grupo_filtro') || 'todos';
    const barIdParam = searchParams.get('bar_id');
    
    if (!barIdParam) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }
    const barId = parseInt(barIdParam);

    if (!dataEspecifica) {
      return NextResponse.json(
        { error: 'Data específica é obrigatória' },
        { status: 400 }
      );
    }

    console.log(
      `📊 Calculando estatísticas para ${dataEspecifica}, período: ${periodoAnalise} dias, bar: ${barId}`
    );

    // Calcular datas
    const dataFim = new Date(dataEspecifica);
    const dataInicio = new Date(dataFim);

    if (periodoAnalise === 'todos') {
      dataInicio.setFullYear(2025, 0, 1);
    } else {
      dataInicio.setDate(dataFim.getDate() - parseInt(periodoAnalise));
    }

    console.log(
      `📅 Período: ${dataInicio.toISOString().split('T')[0]} até ${dataFim.toISOString().split('T')[0]}`
    );

    // Query base
    let queryBase = supabase
      .from('tempo')
      .select('t1_t2, prd_desc, grp_desc, t0_lancamento, itm_qtd')
      .eq('bar_id', barId)
      .not('prd_desc', 'is', null)
      .not('t1_t2', 'is', null)
      .gt('t1_t2', 0)
      .lt('t1_t2', 3600);

    // Aplicar filtro de grupo se especificado
    if (grupoFiltro !== 'todos') {
      queryBase = queryBase.eq('grp_desc', grupoFiltro);
    }

    // Buscar dados do período completo
    const { data: dadosPeriodo, error: errorPeriodo } = await queryBase
      .gte('t0_lancamento', dataInicio.toISOString().split('T')[0])
      .lte('t0_lancamento', dataFim.toISOString().split('T')[0]);

    if (errorPeriodo) {
      console.error('❌ Erro ao buscar dados do período:', errorPeriodo);
      return NextResponse.json(
        { error: 'Erro ao buscar dados do período' },
        { status: 500 }
      );
    }

    // Buscar dados do dia específico
    let queryDia = supabase
      .from('tempo')
      .select('t1_t2, prd_desc, grp_desc, t0_lancamento, itm_qtd')
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
      console.error('❌ Erro ao buscar dados do dia:', errorDia);
      return NextResponse.json(
        { error: 'Erro ao buscar dados do dia' },
        { status: 500 }
      );
    }

    console.log(
      `📊 Dados encontrados - Período: ${dadosPeriodo?.length || 0}, Dia específico: ${dadosDia?.length || 0}`
    );

    // Se não há dados para o dia específico, buscar dados dos últimos 7 dias
    let dadosComparacao = dadosDia;
    if (!dadosDia || dadosDia.length === 0) {
      const dataInicioRecente = new Date(dataFim);
      dataInicioRecente.setDate(dataFim.getDate() - 7);

      const { data: dadosRecentes } = await queryBase
        .gte('t0_lancamento', dataInicioRecente.toISOString().split('T')[0])
        .lte('t0_lancamento', dataFim.toISOString().split('T')[0]);

      dadosComparacao = dadosRecentes || [];
      console.log(
        `📊 Usando dados dos últimos 7 dias: ${dadosComparacao.length} registros`
      );
    } else {
      console.log(
        `📊 Usando dados do dia específico: ${dadosComparacao.length} registros`
      );
    }

    // Calcular estatísticas gerais
    const temposPeriodo =
      dadosPeriodo?.map((item: TempoItem) => item.t1_t2) || [];
    const temposComparacao =
      dadosComparacao?.map((item: TempoItem) => item.t1_t2) || [];

    console.log(
      `🔢 Tempos extraídos - Período: ${temposPeriodo.length}, Comparação: ${temposComparacao.length}`
    );

    const tempoMedioGeral =
      temposPeriodo.length > 0
        ? temposPeriodo.reduce((a: number, b: number) => a + b, 0) /
          temposPeriodo.length
        : 0;

    const tempoDiaEspecifico =
      temposComparacao.length > 0
        ? temposComparacao.reduce((a: number, b: number) => a + b, 0) /
          temposComparacao.length
        : 0;

    console.log(
      `⏱️ Tempos calculados - Geral: ${tempoMedioGeral}s, Dia: ${tempoDiaEspecifico}s`
    );

    const variacaoGeral =
      tempoMedioGeral > 0
        ? ((tempoDiaEspecifico - tempoMedioGeral) / tempoMedioGeral) * 100
        : 0;

    // Contar produtos únicos
    const produtosUnicos = new Set(
      dadosPeriodo?.map(
        (item: TempoItem) => `${item.prd_desc}_${item.grp_desc}`
      )
    );
    const totalProdutos = produtosUnicos.size;

    // Identificar produtos problema (com variação > 25% ou tempo > 20 min)
    const produtosProblema = new Set();

    // Agrupar por produto para análise individual
    const produtoMap = new Map<string, ProdutoDados>();
    dadosPeriodo?.forEach((item: TempoItem) => {
      const key = `${item.prd_desc}_${item.grp_desc}`;
      if (!produtoMap.has(key)) {
        produtoMap.set(key, { tempos: [], produto: item.prd_desc, pedidos: 0 });
      }
      const produto = produtoMap.get(key);
      if (produto) {
        produto.tempos.push(item.t1_t2);
        produto.pedidos += item.itm_qtd || 1;
      }
    });

    // Verificar produtos do dia específico/comparação
    const produtosComparacaoMap = new Map<string, ProdutoDados>();
    dadosComparacao?.forEach((item: TempoItem) => {
      const key = `${item.prd_desc}_${item.grp_desc}`;
      if (!produtosComparacaoMap.has(key)) {
        produtosComparacaoMap.set(key, {
          tempos: [],
          produto: item.prd_desc,
          pedidos: 0,
        });
      }
      const produto = produtosComparacaoMap.get(key);
      if (produto) {
        produto.tempos.push(item.t1_t2);
        produto.pedidos += item.itm_qtd || 1;
      }
    });

    // Identificar produtos com problemas
    produtosComparacaoMap.forEach(
      (dadosComparacao: ProdutoDados, key: string) => {
        const dadosPeriodo = produtoMap.get(key);
        if (!dadosPeriodo) return;

        const tempoMedioPeriodo =
          dadosPeriodo.tempos.reduce((a: number, b: number) => a + b, 0) /
          dadosPeriodo.tempos.length;
        const tempoMedioComparacao =
          dadosComparacao.tempos.reduce((a: number, b: number) => a + b, 0) /
          dadosComparacao.tempos.length;

        const variacao = Math.abs(
          ((tempoMedioComparacao - tempoMedioPeriodo) / tempoMedioPeriodo) * 100
        );

        if (variacao > 25 || tempoMedioComparacao > 1200) {
          // > 25% variação ou > 20 minutos
          produtosProblema.add(dadosComparacao.produto);
        }
      }
    );

    const estatisticas: Estatisticas = {
      tempo_medio_geral: Math.round(tempoMedioGeral),
      tempo_medio_30dias: Math.round(tempoMedioGeral), // Mantendo compatibilidade
      tempo_dia_especifico: Math.round(tempoDiaEspecifico),
      variacao_geral: Math.round(variacaoGeral * 10) / 10,
      total_produtos: totalProdutos,
      produtos_problema: produtosProblema.size,
    };

    console.log(`📈 Estatísticas calculadas:`, {
      ...estatisticas,
      dados_periodo: dadosPeriodo?.length || 0,
      dados_comparacao: dadosComparacao?.length || 0,
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
        usando_dados_recentes: !dadosDia || dadosDia.length === 0,
      },
    });
  } catch (error: unknown) {
    const apiError = error as ApiError;
    console.error('❌ Erro interno na API de estatísticas:', apiError);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
