import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { filtrarDiasAbertos } from '@/lib/helpers/calendario-helper';

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
    const tipo_venda = searchParams.get('tipo_venda');
    const localizacao = searchParams.get('localizacao');
    const limit = parseInt(searchParams.get('limit') || '1000');

    console.log(`📅 Relatório de Período solicitado para bar ${bar_id}`);

    let query = supabase
      .from('contahub_periodo')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .limit(limit);

    // Aplicar filtros
    if (data_inicio) {
      query = query.gte('dt_gerencial', data_inicio);
    }
    if (data_fim) {
      query = query.lte('dt_gerencial', data_fim);
    }
    if (tipo_venda) {
      query = query.ilike('tipovenda', `%${tipo_venda}%`);
    }
    if (localizacao) {
      query = query.ilike('vd_localizacao', `%${localizacao}%`);
    }

    const { data: dataBruto, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar dados de período:', error);
      return NextResponse.json(
        { error: `Erro ao buscar dados: ${error.message}` },
        { status: 500 }
      );
    }

    // ⚡ FILTRAR DIAS FECHADOS
    const data = await filtrarDiasAbertos(dataBruto || [], 'dt_gerencial', parseInt(bar_id));
    console.log(`📅 Dados filtrados: ${dataBruto?.length || 0} → ${data.length} (removidos ${(dataBruto?.length || 0) - data.length} dias fechados)`);

    // Calcular estatísticas
    const estatisticas = {
      total_registros: data?.length || 0,
      total_pessoas: data?.reduce((sum, item) => sum + (item.pessoas || 0), 0) || 0,
      total_pagamentos: data?.reduce((sum, item) => sum + (item.vr_pagamentos || 0), 0) || 0,
      total_couvert: data?.reduce((sum, item) => sum + (item.vr_couvert || 0), 0) || 0,
      total_taxa: data?.reduce((sum, item) => sum + ((item.vr_pagamentos || 0) * 0.03), 0) || 0,
      total_desconto: data?.reduce((sum, item) => sum + (item.vr_desconto || 0), 0) || 0,
      total_acrescimo: 0,
      total_geral: data?.reduce((sum, item) => sum + ((item.vr_pagamentos || 0) + (item.vr_couvert || 0)), 0) || 0,
      dias_unicos: [...new Set(data?.map(item => item.dt_gerencial).filter(Boolean))].length,
      tipos_venda_unicos: [...new Set(data?.map(item => item.tipovenda).filter(Boolean))].length,
      localizacoes_unicas: [...new Set(data?.map(item => item.vd_localizacao).filter(Boolean))].length
    };

    // Faturamento por dia
    const faturamentoPorDia = data?.reduce((acc, item) => {
      const dia = item.dt_gerencial || 'Sem data';
      if (!acc[dia]) {
        acc[dia] = { 
          pagamentos: 0, 
          couvert: 0, 
          pessoas: 0, 
          transacoes: 0 
        };
      }
      acc[dia].pagamentos += item.vr_pagamentos || 0;
      acc[dia].couvert += item.vr_couvert || 0;
      acc[dia].pessoas += item.pessoas || 0;
      acc[dia].transacoes += 1;
      return acc;
    }, {} as Record<string, { pagamentos: number; couvert: number; pessoas: number; transacoes: number }>);

    const faturamentoDiario = Object.entries(faturamentoPorDia || {})
      .map(([dia, stats]) => ({
        dia,
        pagamentos: (stats as { pagamentos: number; couvert: number; pessoas: number; transacoes: number }).pagamentos,
        couvert: (stats as { pagamentos: number; couvert: number; pessoas: number; transacoes: number }).couvert,
        pessoas: (stats as { pagamentos: number; couvert: number; pessoas: number; transacoes: number }).pessoas,
        transacoes: (stats as { pagamentos: number; couvert: number; pessoas: number; transacoes: number }).transacoes,
        total: (stats as { pagamentos: number; couvert: number; pessoas: number; transacoes: number }).pagamentos + 
               (stats as { pagamentos: number; couvert: number; pessoas: number; transacoes: number }).couvert
      }))
      .sort((a, b) => new Date(a.dia).getTime() - new Date(b.dia).getTime());

    // Top localizações por faturamento
    const localizacoesPorValor = data?.reduce((acc, item) => {
      const localizacao = item.vd_localizacao || 'Sem localização';
      if (!acc[localizacao]) {
        acc[localizacao] = { valor: 0, pessoas: 0, transacoes: 0 };
      }
      acc[localizacao].valor += item.vr_pagamentos || 0;
      acc[localizacao].pessoas += item.pessoas || 0;
      acc[localizacao].transacoes += 1;
      return acc;
    }, {} as Record<string, { valor: number; pessoas: number; transacoes: number }>);

    const topLocalizacoes = Object.entries(localizacoesPorValor || {})
      .map(([localizacao, stats]) => ({
        localizacao,
        valor_total: (stats as { valor: number; pessoas: number; transacoes: number }).valor,
        total_pessoas: (stats as { valor: number; pessoas: number; transacoes: number }).pessoas,
        total_transacoes: (stats as { valor: number; pessoas: number; transacoes: number }).transacoes
      }))
      .sort((a, b) => b.valor_total - a.valor_total)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      tipo: 'periodo',
      bar_id: parseInt(bar_id),
      estatisticas,
      faturamento_por_dia: faturamentoDiario,
      top_localizacoes: topLocalizacoes,
      dados: data,
      filtros: {
        data_inicio,
        data_fim,
        tipo_venda,
        localizacao,
        limit
      }
    });

  } catch (error) {
    console.error('❌ Erro na API de relatórios de período:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
