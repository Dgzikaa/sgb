import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
    const barId = parseInt(searchParams.get('bar_id') || '1');

    if (!dataEspecifica) {
      return NextResponse.json(
        { error: 'Data específica é obrigatória' },
        { status: 400 }
      );
    }

    // Calcular período para histórico (últimos 30 dias)
    const dataFim = new Date(dataEspecifica);
    const dataInicio = new Date(dataFim);
    dataInicio.setDate(dataFim.getDate() - 30);

    console.log(
      `📈 Buscando histórico de ${dataInicio.toISOString().split('T')[0]} até ${dataFim.toISOString().split('T')[0]}`
    );

    // Query base
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
    const dadosPorData = new Map();

    dadosHistorico?.forEach((item: unknown) => {
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
      dadosDia.tempos.push(item.t1_t2);
      dadosDia.pedidos += item.itm_qtd || 1;

      // Identificar produtos com tempo alto (> 20 minutos)
      if (item.t1_t2 > 1200) {
        dadosDia.produtos_problema.add(item.prd_desc);
      }
    });

    // Calcular estatísticas por dia
    const historico = Array.from(dadosPorData.values()).map((dia: unknown) => {
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
