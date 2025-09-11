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
    const bar_id = searchParams.get('bar_id') || '1';
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');
    const dia_semana = searchParams.get('dia_semana');
    const hora = searchParams.get('hora');
    const limit = parseInt(searchParams.get('limit') || '1000');

    console.log(`🕐 Relatório de Faturamento por Hora solicitado para bar ${bar_id}`);

    let query = supabase
      .from('contahub_fatporhora')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .limit(limit);

    // Aplicar filtros
    if (data_inicio) {
      query = query.gte('vd_dtgerencial', data_inicio);
    }
    if (data_fim) {
      query = query.lte('vd_dtgerencial', data_fim);
    }
    if (dia_semana) {
      query = query.ilike('dia', `%${dia_semana}%`);
    }
    if (hora) {
      query = query.eq('hora', parseInt(hora));
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar dados de faturamento por hora:', error);
      return NextResponse.json(
        { error: `Erro ao buscar dados: ${error.message}` },
        { status: 500 }
      );
    }

    // Calcular estatísticas
    const estatisticas = {
      total_registros: data?.length || 0,
      total_valor: data?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0,
      total_quantidade: data?.reduce((sum, item) => sum + (item.qtd || 0), 0) || 0,
      dias_unicos: [...new Set(data?.map(item => item.vd_dtgerencial).filter(Boolean))].length,
      horas_unicas: [...new Set(data?.map(item => item.hora).filter(Boolean))].length,
      dias_semana_unicos: [...new Set(data?.map(item => item.dia).filter(Boolean))].length,
      valor_medio_por_hora: data?.length ? 
        data.reduce((sum, item) => sum + (item.valor || 0), 0) / data.length : 0
    };

    // Top horas por faturamento
    const horasPorValor = data?.reduce((acc, item) => {
      const hora = item.hora || 'Sem hora';
      if (!acc[hora]) {
        acc[hora] = { valor: 0, quantidade: 0, registros: 0 };
      }
      acc[hora].valor += item.valor || 0;
      acc[hora].quantidade += item.qtd || 0;
      acc[hora].registros += 1;
      return acc;
    }, {} as Record<string, { valor: number; quantidade: number; registros: number }>);

    const topHoras = Object.entries(horasPorValor || {})
      .map(([hora, stats]) => ({
        hora,
        valor_total: (stats as { valor: number; quantidade: number; registros: number }).valor,
        quantidade_total: (stats as { valor: number; quantidade: number; registros: number }).quantidade,
        total_registros: (stats as { valor: number; quantidade: number; registros: number }).registros,
        valor_medio: (stats as { valor: number; quantidade: number; registros: number }).registros > 0 ? 
          (stats as { valor: number; quantidade: number; registros: number }).valor / 
          (stats as { valor: number; quantidade: number; registros: number }).registros : 0
      }))
      .sort((a, b) => b.valor_total - a.valor_total)
      .slice(0, 10);

    // Top dias da semana por faturamento
    const diasPorValor = data?.reduce((acc, item) => {
      const dia = item.dia || 'Sem dia';
      if (!acc[dia]) {
        acc[dia] = { valor: 0, quantidade: 0, registros: 0 };
      }
      acc[dia].valor += item.valor || 0;
      acc[dia].quantidade += item.qtd || 0;
      acc[dia].registros += 1;
      return acc;
    }, {} as Record<string, { valor: number; quantidade: number; registros: number }>);

    const topDiasSemana = Object.entries(diasPorValor || {})
      .map(([dia, stats]) => ({
        dia,
        valor_total: (stats as { valor: number; quantidade: number; registros: number }).valor,
        quantidade_total: (stats as { valor: number; quantidade: number; registros: number }).quantidade,
        total_registros: (stats as { valor: number; quantidade: number; registros: number }).registros,
        valor_medio: (stats as { valor: number; quantidade: number; registros: number }).registros > 0 ? 
          (stats as { valor: number; quantidade: number; registros: number }).valor / 
          (stats as { valor: number; quantidade: number; registros: number }).registros : 0
      }))
      .sort((a, b) => b.valor_total - a.valor_total);

    // Faturamento por dia
    const faturamentoPorDia = data?.reduce((acc, item) => {
      const dia = item.vd_dtgerencial || 'Sem data';
      if (!acc[dia]) {
        acc[dia] = { 
          valor: 0, 
          quantidade: 0, 
          registros: 0,
          horas_ativas: new Set()
        };
      }
      acc[dia].valor += item.valor || 0;
      acc[dia].quantidade += item.qtd || 0;
      acc[dia].registros += 1;
      if (item.hora !== null) acc[dia].horas_ativas.add(item.hora);
      return acc;
    }, {} as Record<string, { 
      valor: number; 
      quantidade: number; 
      registros: number;
      horas_ativas: Set<string>;
    }>);

    const faturamentoDiario = Object.entries(faturamentoPorDia || {})
      .map(([dia, stats]) => ({
        dia,
        valor_total: (stats as { valor: number; quantidade: number; registros: number; horas_ativas: Set<string> }).valor,
        quantidade_total: (stats as { valor: number; quantidade: number; registros: number; horas_ativas: Set<string> }).quantidade,
        total_registros: (stats as { valor: number; quantidade: number; registros: number; horas_ativas: Set<string> }).registros,
        horas_ativas: Array.from((stats as { valor: number; quantidade: number; registros: number; horas_ativas: Set<string> }).horas_ativas).length
      }))
      .sort((a, b) => new Date(a.dia).getTime() - new Date(b.dia).getTime());

    // Horário de pico (hora com maior faturamento médio)
    const horarioPico = topHoras.length > 0 ? topHoras[0] : null;

    // Dia da semana mais lucrativo
    const diaMaisLucrativo = topDiasSemana.length > 0 ? topDiasSemana[0] : null;

    return NextResponse.json({
      success: true,
      tipo: 'fatporhora',
      bar_id: parseInt(bar_id),
      estatisticas,
      top_horas: topHoras,
      top_dias_semana: topDiasSemana,
      faturamento_por_dia: faturamentoDiario,
      insights: {
        horario_pico: horarioPico ? {
          hora: horarioPico.hora,
          valor_total: horarioPico.valor_total,
          valor_medio: horarioPico.valor_medio
        } : null,
        dia_mais_lucrativo: diaMaisLucrativo ? {
          dia: diaMaisLucrativo.dia,
          valor_total: diaMaisLucrativo.valor_total,
          valor_medio: diaMaisLucrativo.valor_medio
        } : null
      },
      dados: data,
      filtros: {
        data_inicio,
        data_fim,
        dia_semana,
        hora,
        limit
      }
    });

  } catch (error) {
    console.error('❌ Erro na API de relatórios de faturamento por hora:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 
