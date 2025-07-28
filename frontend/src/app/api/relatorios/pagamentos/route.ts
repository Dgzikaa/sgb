import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

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
    const meio_pagamento = searchParams.get('meio_pagamento');
    const cliente = searchParams.get('cliente');
    const usuario = searchParams.get('usuario');
    const limit = parseInt(searchParams.get('limit') || '1000');

    console.log(`💰 Relatório de Pagamentos solicitado para bar ${bar_id}`);

    let query = supabase
      .from('contahub_pagamentos')
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
    if (meio_pagamento) {
      query = query.ilike('meio', `%${meio_pagamento}%`);
    }
    if (cliente) {
      query = query.ilike('cliente', `%${cliente}%`);
    }
    if (usuario) {
      query = query.ilike('usr_lancou', `%${usuario}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar dados de pagamentos:', error);
      return NextResponse.json(
        { error: `Erro ao buscar dados: ${error.message}` },
        { status: 500 }
      );
    }

    // Calcular estatísticas
    const estatisticas = {
      total_registros: data?.length || 0,
      total_valor: data?.reduce((sum, item) => sum + (parseFloat(item.liquido) || 0), 0) || 0,
      total_valor_bruto: data?.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0) || 0,
      total_taxas: data?.reduce((sum, item) => sum + (parseFloat(item.taxa) || 0), 0) || 0,
      clientes_unicos: [...new Set(data?.map(item => item.cliente).filter(Boolean))].length,
      meios_unicos: [...new Set(data?.map(item => item.meio).filter(Boolean))].length,
      usuarios_unicos: [...new Set(data?.map(item => item.usr_lancou).filter(Boolean))].length
    };

    // Top meios de pagamento por valor
    const meiosPorValor = data?.reduce((acc, item) => {
      const meio = item.meio || 'Sem meio';
      if (!acc[meio]) {
        acc[meio] = { valor: 0, transacoes: 0 };
      }
      acc[meio].valor += parseFloat(item.liquido) || 0;
      acc[meio].transacoes += 1;
      return acc;
    }, {} as Record<string, { valor: number; transacoes: number }>);

    const topMeios = Object.entries(meiosPorValor || {})
      .map(([meio, stats]) => ({
        meio,
        valor_total: (stats as { valor: number; transacoes: number }).valor,
        total_transacoes: (stats as { valor: number; transacoes: number }).transacoes
      }))
      .sort((a, b) => b.valor_total - a.valor_total)
      .slice(0, 10);

    // Top clientes por valor
    const clientesPorValor = data?.reduce((acc, item) => {
      const cliente = item.cliente || 'Sem cliente';
      if (!acc[cliente]) {
        acc[cliente] = { valor: 0, transacoes: 0 };
      }
      acc[cliente].valor += parseFloat(item.liquido) || 0;
      acc[cliente].transacoes += 1;
      return acc;
    }, {} as Record<string, { valor: number; transacoes: number }>);

    const topClientes = Object.entries(clientesPorValor || {})
      .map(([cliente, stats]) => ({
        cliente,
        valor_total: (stats as { valor: number; transacoes: number }).valor,
        total_transacoes: (stats as { valor: number; transacoes: number }).transacoes
      }))
      .sort((a, b) => b.valor_total - a.valor_total)
      .slice(0, 10);

    // Faturamento por dia
    const faturamentoPorDia = data?.reduce((acc, item) => {
      const dia = item.dt_gerencial;
      if (!acc[dia]) {
        acc[dia] = { valor: 0, transacoes: 0 };
      }
      acc[dia].valor += parseFloat(item.liquido) || 0;
      acc[dia].transacoes += 1;
      return acc;
    }, {} as Record<string, { valor: number; transacoes: number }>);

    const faturamentoDiario = Object.entries(faturamentoPorDia || {})
      .map(([dia, stats]) => ({
        dia,
        valor_total: (stats as { valor: number; transacoes: number }).valor,
        total_transacoes: (stats as { valor: number; transacoes: number }).transacoes
      }))
      .sort((a, b) => new Date(a.dia).getTime() - new Date(b.dia).getTime());

    return NextResponse.json({
      success: true,
      tipo: 'pagamentos',
      bar_id: parseInt(bar_id),
      estatisticas,
      top_meios_pagamento: topMeios,
      top_clientes: topClientes,
      faturamento_por_dia: faturamentoDiario,
      dados: data,
      filtros: {
        data_inicio,
        data_fim,
        meio_pagamento,
        cliente,
        usuario,
        limit
      }
    });

  } catch (error) {
    console.error('❌ Erro na API de relatórios de pagamentos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 