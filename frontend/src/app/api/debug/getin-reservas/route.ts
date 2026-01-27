import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/debug/getin-reservas
 * 
 * Rota de debug para verificar reservas do GetIn
 * 
 * Params:
 * - bar_id: ID do bar (default: 3)
 * - data: Data específica (YYYY-MM-DD) ou 'hoje' ou 'ontem'
 * - data_inicio: Data início do período
 * - data_fim: Data fim do período
 * - limit: Limite de resultados (default: 100)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '3');
    const dataParam = searchParams.get('data');
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Calcular datas
    const hoje = new Date();
    const hojeStr = hoje.toISOString().split('T')[0];
    
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    const ontemStr = ontem.toISOString().split('T')[0];

    let startDate: string;
    let endDate: string;

    if (dataParam === 'hoje') {
      startDate = hojeStr;
      endDate = hojeStr;
    } else if (dataParam === 'ontem') {
      startDate = ontemStr;
      endDate = ontemStr;
    } else if (dataParam) {
      startDate = dataParam;
      endDate = dataParam;
    } else if (dataInicio && dataFim) {
      startDate = dataInicio;
      endDate = dataFim;
    } else {
      // Default: últimos 7 dias
      const seteDiasAtras = new Date(hoje);
      seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
      startDate = seteDiasAtras.toISOString().split('T')[0];
      endDate = hojeStr;
    }

    console.log('[DEBUG GETIN] Buscando reservas:', { barId, startDate, endDate, limit });

    // 1. Buscar na tabela getin_reservations (tabela real do sync)
    const { data: reservations, error: reservationsError } = await supabase
      .from('getin_reservations')
      .select('*')
      .eq('bar_id', barId)
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate)
      .order('reservation_date', { ascending: false })
      .limit(limit);

    // 2. Buscar na tabela getin_reservas (view/tabela antiga) para comparar
    const { data: reservas, error: reservasError } = await supabase
      .from('getin_reservas')
      .select('*')
      .eq('bar_id', barId)
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate)
      .order('reservation_date', { ascending: false })
      .limit(limit);

    // 3. Buscar total sem bar_id para ver se há dados com outro bar
    const { data: todasReservations, error: todasError } = await supabase
      .from('getin_reservations')
      .select('bar_id, reservation_date, customer_phone, status, customer_name')
      .gte('reservation_date', startDate)
      .lte('reservation_date', endDate)
      .order('reservation_date', { ascending: false })
      .limit(50);

    // Agrupar por bar_id para debug
    const reservasPorBar = new Map<number | null, number>();
    (todasReservations || []).forEach(r => {
      const count = reservasPorBar.get(r.bar_id) || 0;
      reservasPorBar.set(r.bar_id, count + 1);
    });

    // Estatísticas
    const stats = {
      getin_reservations: {
        total: reservations?.length || 0,
        error: reservationsError?.message || null,
        porStatus: {} as Record<string, number>,
        amostra: reservations?.slice(0, 5).map(r => ({
          id: r.id,
          reservation_id: r.reservation_id,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          reservation_date: r.reservation_date,
          status: r.status,
          bar_id: r.bar_id
        })) || []
      },
      getin_reservas: {
        total: reservas?.length || 0,
        error: reservasError?.message || null,
        amostra: reservas?.slice(0, 5).map(r => ({
          id: r.id,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          reservation_date: r.reservation_date,
          status: r.status,
          bar_id: r.bar_id
        })) || []
      },
      todas_reservations_periodo: {
        total: todasReservations?.length || 0,
        error: todasError?.message || null,
        por_bar_id: Object.fromEntries(reservasPorBar),
        amostra: todasReservations?.slice(0, 10) || []
      }
    };

    // Contar por status
    (reservations || []).forEach(r => {
      const status = r.status || 'unknown';
      stats.getin_reservations.porStatus[status] = (stats.getin_reservations.porStatus[status] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      params: {
        bar_id: barId,
        data_inicio: startDate,
        data_fim: endDate,
        limit
      },
      stats,
      dados: {
        getin_reservations: reservations || [],
        getin_reservas: reservas || []
      }
    });

  } catch (error: any) {
    console.error('[DEBUG GETIN] Erro:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || String(error) 
      },
      { status: 500 }
    );
  }
}
