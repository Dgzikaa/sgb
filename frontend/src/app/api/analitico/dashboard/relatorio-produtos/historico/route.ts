import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Interfaces para tipagem
interface TempoItem {
  t0_lancamento: string;
  t1_t2: number;
  prd_desc: string;
  grp_desc: string;
  itm_qtd: number;
}

interface DadosDia {
  data: string;
  tempos: number[];
  pedidos: number;
  produtos_problema: Set<string>;
}

interface HistoricoItem {
  data: string;
  tempo_medio: number;
  total_pedidos: number;
  produtos_problema: string[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataEspecifica = searchParams.get('data_especifica');
    const periodoAnalise = searchParams.get('periodo_analise') || '7d';
    const grupoFiltro = searchParams.get('grupo_filtro') || 'todos';
    const barId = parseInt(searchParams.get('bar_id') || '3');

    console.log('📊 API Histórico - Parâmetros:', {
      dataEspecifica,
      periodoAnalise,
      grupoFiltro,
      barId,
    });

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    // Calcular período de análise
    const dataFim = dataEspecifica
      ? new Date(dataEspecifica)
      : new Date();
    const dataInicio = new Date(dataFim);
    
    switch (periodoAnalise) {
      case '7d':
        dataInicio.setDate(dataInicio.getDate() - 7);
        break;
      case '30d':
        dataInicio.setDate(dataInicio.getDate() - 30);
        break;
      case '90d':
        dataInicio.setDate(dataInicio.getDate() - 90);
        break;
      default:
        dataInicio.setDate(dataInicio.getDate() - 7);
    }

    // Buscar dados históricos
    let query = supabase
      .from('tempo')
      .select(
        `
        t0_lancamento,
        t1_t2,
        prd_desc,
        grp_desc,
        itm_qtd
      `
      )
      .eq('bar_id', barId)
      .not('prd_desc', 'is', null)
      .not('t1_t2', 'is', null)
      .gt('t1_t2', 0)
      .lt('t1_t2', 3600)
      .gte('t0_lancamento', dataInicio.toISOString().split('T')[0])
      .lte('t0_lancamento', dataFim.toISOString().split('T')[0]);

    // Aplicar filtro de grupo se especificado
    if (grupoFiltro !== 'todos') {
      query = query.eq('grp_desc', grupoFiltro);
    }

    const { data: dadosHistorico, error } = await query;

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar histórico' },
        { status: 500 }
      );
    }

    // Agrupar dados por data
    const dadosPorData = new Map<string, DadosDia>();

    dadosHistorico?.forEach((item: TempoItem) => {
      const data = item.t0_lancamento.split('T')[0];

      if (!dadosPorData.has(data)) {
        dadosPorData.set(data, {
          data,
          tempos: [],
          pedidos: 0,
          produtos_problema: new Set(),
        });
      }

      const dadosDia = dadosPorData.get(data);
      if (dadosDia) {
        dadosDia.tempos.push(item.t1_t2);
        dadosDia.pedidos += item.itm_qtd || 1;

        // Identificar produtos com tempo alto (> 20 minutos)
        if (item.t1_t2 > 1200) {
          dadosDia.produtos_problema.add(item.prd_desc);
        }
      }
    });

    // Calcular estatísticas por dia
    const historico: HistoricoItem[] = Array.from(dadosPorData.values()).map((dia: DadosDia) => {
      const tempoMedio =
        dia.tempos.length > 0
          ? dia.tempos.reduce((a: number, b: number) => a + b, 0) /
            dia.tempos.length
          : 0;

      return {
        data: new Date(dia.data).toLocaleDateString('pt-BR'),
        tempo_medio: Math.round(tempoMedio),
        total_pedidos: dia.pedidos,
        produtos_problema: Array.from(dia.produtos_problema),
      };
    });

    // Ordenar por data
    historico.sort(
      (a, b) =>
        new Date(a.data.split('/').reverse().join('-')).getTime() -
        new Date(b.data.split('/').reverse().join('-')).getTime()
    );

    return NextResponse.json({
      success: true,
      historico,
      meta: {
        data_especifica: dataEspecifica,
        periodo_analise: periodoAnalise,
        grupo_filtro: grupoFiltro,
        total_dias: historico.length,
      },
    });
  } catch (error) {
    console.error('Erro interno na API de histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
