import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const bar_id = parseInt(searchParams.get('bar_id') || '1');

    console.log('📊 VERIFICANDO STATUS DOS CLIENTES');
    console.log(`🏪 Bar ID: ${bar_id}`);

    // 1. Estatísticas gerais de clientes
    const { data: clientesStats, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .eq('bar_id', bar_id);

    if (clientesError) {
      throw new Error(`Erro ao buscar clientes: ${clientesError.message}`);
    }

    // 2. Estatísticas de visitas
    const { data: visitasStats, error: visitasError } = await supabase
      .from('cliente_visitas')
      .select('*')
      .eq('bar_id', bar_id);

    if (visitasError) {
      throw new Error(`Erro ao buscar visitas: ${visitasError.message}`);
    }

    // 3. Estatísticas de período (base de dados)
    const { data: periodoStats, error: periodoError } = await supabase
      .from('periodo')
      .select('dt_gerencial, vr_pagamentos')
      .eq('bar_id', bar_id)
      .gt('vr_pagamentos', 0);

    if (periodoError) {
      throw new Error(`Erro ao buscar período: ${periodoError.message}`);
    }

    // 4. Calcular métricas
    const totalClientes = clientesStats.length;
    const totalVisitas = visitasStats.length;
    const totalRegistrosPeriodo = periodoStats.length;

    // Classificar clientes
    const clientesNovos = clientesStats.filter((c: any) => c.tipo_cliente === 'novo').length;
    const clientesRecorrentes = clientesStats.filter((c: any) => c.tipo_cliente === 'recorrente').length;

    // Top clientes por valor
    const topClientesPorValor = clientesStats
      .sort((a: any, b: any) => parseFloat(b.valor_total_gasto || '0') - parseFloat(a.valor_total_gasto || '0'))
      .slice(0, 10)
      .map((c: any) => ({
        nome: c.nome,
        total_visitas: c.total_visitas,
        valor_total: parseFloat(c.valor_total_gasto || '0'),
        valor_medio: parseFloat(c.valor_medio_ticket || '0'),
        primeira_visita: c.data_primeiro_visit,
        ultima_visita: c.data_ultimo_visit
      }));

    // Top clientes por frequência
    const topClientesPorFrequencia = clientesStats
      .sort((a: any, b: any) => parseInt(b.total_visitas || '0') - parseInt(a.total_visitas || '0'))
      .slice(0, 10)
      .map((c: any) => ({
        nome: c.nome,
        total_visitas: c.total_visitas,
        valor_total: parseFloat(c.valor_total_gasto || '0'),
        valor_medio: parseFloat(c.valor_medio_ticket || '0'),
        primeira_visita: c.data_primeiro_visit,
        ultima_visita: c.data_ultimo_visit
      }));

    // Range de datas
    const datasVisitas = visitasStats.map((v: any) => v.data_visita).sort();
    const primeiraVisita = datasVisitas[0] || null;
    const ultimaVisita = datasVisitas[datasVisitas.length - 1] || null;

    // Progresso do processamento (estimativa)
    const registrosProcessados = totalVisitas;
    const registrosTotais = totalRegistrosPeriodo;
    const progressoEstimado = registrosTotais > 0 ? Math.round((registrosProcessados / registrosTotais) * 100) : 0;

    console.log(`📊 Status: ${totalClientes} clientes, ${totalVisitas} visitas (${progressoEstimado}%)`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      bar_id: bar_id,
      status: {
        processamento_estimado: `${progressoEstimado}%`,
        concluido: progressoEstimado >= 95 // Considera concluído se >= 95%
      },
      estatisticas_gerais: {
        total_clientes: totalClientes,
        total_visitas: totalVisitas,
        total_registros_periodo: totalRegistrosPeriodo,
        clientes_novos: clientesNovos,
        clientes_recorrentes: clientesRecorrentes,
        percentual_recorrencia: totalClientes > 0 ? Math.round((clientesRecorrentes / totalClientes) * 100) : 0
      },
      periodo_dados: {
        primeira_visita: primeiraVisita,
        ultima_visita: ultimaVisita,
        dias_operacao: primeiraVisita && ultimaVisita ? 
          Math.ceil((new Date(ultimaVisita).getTime() - new Date(primeiraVisita).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0
      },
      top_clientes: {
        por_valor: topClientesPorValor,
        por_frequencia: topClientesPorFrequencia
      },
      metricas_negocio: {
        valor_total_identificado: clientesStats.reduce((sum: number, c: any) => sum + parseFloat(c.valor_total_gasto || '0'), 0),
        ticket_medio_geral: totalVisitas > 0 ? 
          clientesStats.reduce((sum: number, c: any) => sum + parseFloat(c.valor_total_gasto || '0'), 0) / totalVisitas : 0,
        visitas_por_cliente: totalClientes > 0 ? totalVisitas / totalClientes : 0
      }
    });

  } catch (error: any) {
    console.error('💥 Erro ao verificar status:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
