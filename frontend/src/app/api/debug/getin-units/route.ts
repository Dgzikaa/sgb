import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/debug/getin-units
 * 
 * Verifica o mapeamento de units do GetIn para bar_id
 * e as reservas sem mapeamento
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Buscar mapeamento de units
    const { data: units, error: unitsError } = await supabase
      .from('getin_units')
      .select('*');

    // 2. Buscar reservas com bar_id null (sem mapeamento)
    const { data: reservasSemBar, error: reservasSemBarError } = await supabase
      .from('getin_reservations')
      .select('unit_id, unit_name, reservation_date, customer_name, customer_phone, status, bar_id')
      .is('bar_id', null)
      .order('reservation_date', { ascending: false })
      .limit(50);

    // 3. Buscar units únicas das reservas sem mapeamento
    const unitsSemMapeamento = new Map<string, { unit_id: string; unit_name: string; count: number }>();
    (reservasSemBar || []).forEach(r => {
      if (r.unit_id) {
        const existing = unitsSemMapeamento.get(r.unit_id);
        if (existing) {
          existing.count++;
        } else {
          unitsSemMapeamento.set(r.unit_id, {
            unit_id: r.unit_id,
            unit_name: r.unit_name || 'unknown',
            count: 1
          });
        }
      }
    });

    // 4. Buscar total de reservas por bar_id
    const { data: reservasPorBar, error: reservasPorBarError } = await supabase
      .from('getin_reservations')
      .select('bar_id')
      .gte('reservation_date', '2026-01-01');

    const countPorBar = new Map<string, number>();
    (reservasPorBar || []).forEach(r => {
      const key = r.bar_id === null ? 'null' : String(r.bar_id);
      countPorBar.set(key, (countPorBar.get(key) || 0) + 1);
    });

    // 5. Buscar logs de sync recentes
    const { data: syncLogs, error: syncLogsError } = await supabase
      .from('getin_sync_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // 6. Verificar se há reservas com dados completos
    const { data: reservasCompletas, error: reservasCompletasError } = await supabase
      .from('getin_reservations')
      .select('*')
      .not('customer_phone', 'is', null)
      .not('customer_name', 'is', null)
      .order('reservation_date', { ascending: false })
      .limit(10);

    // 7. Buscar reservas para data específica (28/01/2026 - quarta do bulk)
    const dataAlvo = '2026-01-28';
    const { data: reservasDataAlvo, error: reservasDataAlvoError } = await supabase
      .from('getin_reservations')
      .select('*')
      .eq('reservation_date', dataAlvo)
      .order('reservation_time', { ascending: true });

    // 8. Buscar raw_data de algumas reservas para ver estrutura original da API
    const { data: reservasRaw, error: reservasRawError } = await supabase
      .from('getin_reservations')
      .select('reservation_id, customer_name, customer_phone, reservation_date, status, raw_data')
      .eq('reservation_date', dataAlvo)
      .limit(5);

    return NextResponse.json({
      success: true,
      getin_units: {
        total: units?.length || 0,
        error: unitsError?.message || null,
        mapeamentos: units || []
      },
      reservas_sem_bar_id: {
        total: reservasSemBar?.length || 0,
        error: reservasSemBarError?.message || null,
        units_sem_mapeamento: Array.from(unitsSemMapeamento.values()),
        amostra: reservasSemBar?.slice(0, 10) || []
      },
      reservas_por_bar_id: Object.fromEntries(countPorBar),
      sync_logs_recentes: {
        total: syncLogs?.length || 0,
        error: syncLogsError?.message || null,
        logs: syncLogs || []
      },
      reservas_com_dados_completos: {
        total: reservasCompletas?.length || 0,
        error: reservasCompletasError?.message || null,
        amostra: reservasCompletas?.slice(0, 5).map(r => ({
          reservation_id: r.reservation_id,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          reservation_date: r.reservation_date,
          status: r.status,
          bar_id: r.bar_id,
          unit_id: r.unit_id,
          unit_name: r.unit_name
        })) || []
      },
      reservas_data_28_01_2026: {
        data_alvo: dataAlvo,
        total: reservasDataAlvo?.length || 0,
        error: reservasDataAlvoError?.message || null,
        por_status: reservasDataAlvo?.reduce((acc, r) => {
          acc[r.status] = (acc[r.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
        reservas: reservasDataAlvo?.map(r => ({
          reservation_id: r.reservation_id,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          customer_email: r.customer_email,
          reservation_time: r.reservation_time,
          people: r.people,
          status: r.status,
          bar_id: r.bar_id,
          unit_id: r.unit_id,
          unit_name: r.unit_name,
          sector_name: r.sector_name,
          info: r.info
        })) || []
      },
      raw_data_amostra: {
        total: reservasRaw?.length || 0,
        error: reservasRawError?.message || null,
        reservas: reservasRaw?.map(r => ({
          reservation_id: r.reservation_id,
          customer_name: r.customer_name,
          customer_phone: r.customer_phone,
          reservation_date: r.reservation_date,
          status: r.status,
          raw_data: r.raw_data
        })) || []
      }
    });

  } catch (error: any) {
    console.error('[DEBUG GETIN UNITS] Erro:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error?.message || String(error) 
      },
      { status: 500 }
    );
  }
}
