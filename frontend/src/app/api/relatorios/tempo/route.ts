import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

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
    const bar_id = searchParams.get('bar_id') || '3';
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');
    const produto = searchParams.get('produto');
    const grupo = searchParams.get('grupo');
    const localizacao = searchParams.get('localizacao');
    const limit = parseInt(searchParams.get('limit') || '1000');

    console.log(`⏱️ Relatório de Tempo solicitado para bar ${bar_id}`);

    let query = supabase
      .from('contahub_tempo')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .limit(limit);

    // Aplicar filtros
    if (data_inicio) {
      query = query.gte('dia', data_inicio);
    }
    if (data_fim) {
      query = query.lte('dia', data_fim);
    }
    if (produto) {
      query = query.ilike('prd_desc', `%${produto}%`);
    }
    if (grupo) {
      query = query.ilike('grp_desc', `%${grupo}%`);
    }
    if (localizacao) {
      query = query.ilike('loc_desc', `%${localizacao}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar dados de tempo:', error);
      return NextResponse.json(
        { error: `Erro ao buscar dados: ${error.message}` },
        { status: 500 }
      );
    }

    // Calcular estatísticas
    const estatisticas = {
      total_registros: data?.length || 0,
      tempo_medio_t0_t1: data?.reduce((sum, item) => sum + (item.t0_t1 || 0), 0) / (data?.length || 1) || 0,
      tempo_medio_t1_t2: data?.reduce((sum, item) => sum + (item.t1_t2 || 0), 0) / (data?.length || 1) || 0,
      tempo_medio_t2_t3: data?.reduce((sum, item) => sum + (item.t2_t3 || 0), 0) / (data?.length || 1) || 0,
      tempo_medio_total: data?.reduce((sum, item) => sum + (item.t0_t3 || 0), 0) / (data?.length || 1) || 0,
      produtos_unicos: [...new Set(data?.map(item => item.prd_desc).filter(Boolean))].length,
      grupos_unicos: [...new Set(data?.map(item => item.grp_desc).filter(Boolean))].length,
      localizacoes_unicas: [...new Set(data?.map(item => item.loc_desc).filter(Boolean))].length,
      total_itens: data?.reduce((sum, item) => sum + (item.itm_qtd || 0), 0) || 0
    };

    // Top produtos por tempo médio
    const produtosPorTempo = data?.reduce((acc, item) => {
      const produto = item.prd_desc || 'Sem descrição';
      if (!acc[produto]) {
        acc[produto] = { 
          tempo_total: 0, 
          quantidade: 0, 
          registros: 0,
          t0_t1_total: 0,
          t1_t2_total: 0,
          t2_t3_total: 0
        };
      }
      acc[produto].tempo_total += item.t0_t3 || 0;
      acc[produto].t0_t1_total += item.t0_t1 || 0;
      acc[produto].t1_t2_total += item.t1_t2 || 0;
      acc[produto].t2_t3_total += item.t2_t3 || 0;
      acc[produto].quantidade += item.itm_qtd || 0;
      acc[produto].registros += 1;
      return acc;
    }, {} as Record<string, { 
      tempo_total: number; 
      quantidade: number; 
      registros: number;
      t0_t1_total: number;
      t1_t2_total: number;
      t2_t3_total: number;
    }>);

    const topProdutos = Object.entries(produtosPorTempo || {})
      .map(([produto, stats]) => ({
        produto,
        tempo_medio_total: (stats as any).registros > 0 ? (stats as any).tempo_total / (stats as any).registros : 0,
        tempo_medio_t0_t1: (stats as any).registros > 0 ? (stats as any).t0_t1_total / (stats as any).registros : 0,
        tempo_medio_t1_t2: (stats as any).registros > 0 ? (stats as any).t1_t2_total / (stats as any).registros : 0,
        tempo_medio_t2_t3: (stats as any).registros > 0 ? (stats as any).t2_t3_total / (stats as any).registros : 0,
        quantidade_total: (stats as any).quantidade,
        total_registros: (stats as any).registros
      }))
      .sort((a, b) => b.tempo_medio_total - a.tempo_medio_total)
      .slice(0, 10);

    // Top grupos por tempo médio
    const gruposPorTempo = data?.reduce((acc, item) => {
      const grupo = item.grp_desc || 'Sem grupo';
      if (!acc[grupo]) {
        acc[grupo] = { 
          tempo_total: 0, 
          quantidade: 0, 
          registros: 0 
        };
      }
      acc[grupo].tempo_total += item.t0_t3 || 0;
      acc[grupo].quantidade += item.itm_qtd || 0;
      acc[grupo].registros += 1;
      return acc;
    }, {} as Record<string, { tempo_total: number; quantidade: number; registros: number }>);

    const topGrupos = Object.entries(gruposPorTempo || {})
      .map(([grupo, stats]) => ({
        grupo,
        tempo_medio: (stats as { tempo_total: number; quantidade: number; registros: number }).registros > 0 ? 
          (stats as { tempo_total: number; quantidade: number; registros: number }).tempo_total / 
          (stats as { tempo_total: number; quantidade: number; registros: number }).registros : 0,
        quantidade_total: (stats as { tempo_total: number; quantidade: number; registros: number }).quantidade,
        total_registros: (stats as { tempo_total: number; quantidade: number; registros: number }).registros
      }))
      .sort((a, b) => b.tempo_medio - a.tempo_medio)
      .slice(0, 10);

    // Tempo médio por dia
    const tempoPorDia = data?.reduce((acc, item) => {
      const dia = item.dia || 'Sem data';
      if (!acc[dia]) {
        acc[dia] = { 
          tempo_total: 0, 
          registros: 0,
          quantidade: 0
        };
      }
      acc[dia].tempo_total += item.t0_t3 || 0;
      acc[dia].quantidade += item.itm_qtd || 0;
      acc[dia].registros += 1;
      return acc;
    }, {} as Record<string, { tempo_total: number; registros: number; quantidade: number }>);

    const tempoDiario = Object.entries(tempoPorDia || {})
      .map(([dia, stats]) => ({
        dia,
        tempo_medio: (stats as { tempo_total: number; registros: number; quantidade: number }).registros > 0 ? 
          (stats as { tempo_total: number; registros: number; quantidade: number }).tempo_total / 
          (stats as { tempo_total: number; registros: number; quantidade: number }).registros : 0,
        quantidade_total: (stats as { tempo_total: number; registros: number; quantidade: number }).quantidade,
        total_registros: (stats as { tempo_total: number; registros: number; quantidade: number }).registros
      }))
      .sort((a, b) => new Date(a.dia).getTime() - new Date(b.dia).getTime());

    return NextResponse.json({
      success: true,
      tipo: 'tempo',
      bar_id: parseInt(bar_id),
      estatisticas,
      top_produtos_tempo: topProdutos,
      top_grupos_tempo: topGrupos,
      tempo_por_dia: tempoDiario,
      dados: data,
      filtros: {
        data_inicio,
        data_fim,
        produto,
        grupo,
        localizacao,
        limit
      }
    });

  } catch (error) {
    console.error('❌ Erro na API de relatórios de tempo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
