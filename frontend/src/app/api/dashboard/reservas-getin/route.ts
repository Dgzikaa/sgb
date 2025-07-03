import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }
    const { searchParams } = new URL(request.url);
    const data = searchParams.get('data');
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');
    const bar_id = parseInt(searchParams.get('bar_id') || '1'); // Default para Bar Ordinário

    // Suporte a consulta por data única ou período
    if (!data && (!data_inicio || !data_fim)) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios: data (YYYY-MM-DD) OU data_inicio + data_fim' },
        { status: 400 }
      );
    }

    const consultaPeriodo = data_inicio && data_fim;
    const dataConsulta = consultaPeriodo ? `${data_inicio} até ${data_fim}` : data;
    console.log(`🗓️ Buscando reservas para ${dataConsulta}`);

    let query = supabase
      .from('getin_reservas')
      .select(`
        getin_id,
        name,
        people,
        date,
        time,
        status,
        mobile,
        email,
        info,
        discount,
        confirmation_sent,
        unit_id,
        unit_name,
        unit_address,
        unit_city,
        unit_cuisine,
        sector_id,
        sector_name,
        custom_fields,
        monetize,
        data_busca
      `);

    // Aplicar filtro de data(s)
    if (consultaPeriodo) {
      query = query.gte('date', data_inicio).lte('date', data_fim);
    } else {
      query = query.eq('date', data);
    }

    // CORREÇÃO: Buscar TODAS as reservas (não filtrar por status)
    // query = query.in('status', ['confirmed', 'seated']);

    // Se for o Bar Ordinário, incluir TODAS as variações do nome + unit_name NULL
    if (bar_id === 1) {
      // Incluir todas as variações conhecidas do nome do bar + registros sem unit_name
      query = query.or('unit_name.is.null,unit_name.ilike.%Ordinário%,unit_name.ilike.%Ordinario%,unit_name.ilike.%Bar%Música%,unit_name.ilike.%Bar%Masica%,unit_name.ilike.%Bar%Musica%');
    }

    query = query.order('time', { ascending: true });

    const { data: reservas, error } = await query;

    if (error) {
      console.error('Erro ao buscar reservas:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar reservas' },
        { status: 500 }
      );
    }

    console.log(`📊 ${reservas?.length || 0} reservas encontradas (TODOS OS STATUS)`);

    // Calcular estatísticas - CORRIGIDO para incluir todos os status
    const statusCancelados = ['canceled-agent', 'canceled-user', 'no-show'];
    const statusConfirmados = ['confirmed', 'seated'];
    const statusPendentes = ['pending'];
    
    console.log('📊 ANÁLISE DETALHADA DE STATUS:');
    
    // Contar por status
    const porStatus = reservas?.reduce((acc: any, r: any) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {}) || {};
    
    console.log('   📋 Reservas por status:', porStatus);
    
    // Pessoas por status
    const pessoasPorStatus = reservas?.reduce((acc: any, r: any) => {
      acc[r.status] = (acc[r.status] || 0) + (r.people || 0);
      return acc;
    }, {}) || {};
    
    console.log('   👥 Pessoas por status:', pessoasPorStatus);

    const stats = {
      total_reservas: reservas?.length || 0,
      total_pessoas: reservas?.reduce((sum: number, r: any) => sum + (r.people || 0), 0) || 0,
      confirmed: reservas?.filter((r: any) => r.status === 'confirmed').length || 0,
      seated: reservas?.filter((r: any) => r.status === 'seated').length || 0,
      pending: reservas?.filter((r: any) => r.status === 'pending').length || 0,
      
      // **NOVA MÉTRICA: Confirmadas apenas (confirmed + seated)**
      reservas_confirmadas: reservas?.filter((r: any) => statusConfirmados.includes(r.status)).length || 0,
      pessoas_confirmadas: reservas?.filter((r: any) => statusConfirmados.includes(r.status)).reduce((sum: number, r: any) => sum + (r.people || 0), 0) || 0,
      
      // **NOVA MÉTRICA: Confirmadas + Pendentes (como no planejamento)**
      reservas_confirmadas_mais_pendentes: reservas?.filter((r: any) => [...statusConfirmados, ...statusPendentes].includes(r.status)).length || 0,
      pessoas_confirmadas_mais_pendentes: reservas?.filter((r: any) => [...statusConfirmados, ...statusPendentes].includes(r.status)).reduce((sum: number, r: any) => sum + (r.people || 0), 0) || 0,
      
      reservas_pendentes: reservas?.filter((r: any) => r.status === 'pending').length || 0,
      pessoas_pendentes: reservas?.filter((r: any) => r.status === 'pending').reduce((sum: number, r: any) => sum + (r.people || 0), 0) || 0,
      
      canceled: reservas?.filter((r: any) => r.status?.includes('canceled')).length || 0,
      no_show: reservas?.filter((r: any) => r.status === 'no-show').length || 0,
      canceladas_total: reservas?.filter((r: any) => statusCancelados.includes(r.status)).length || 0,
      pessoas_canceladas: reservas?.filter((r: any) => statusCancelados.includes(r.status)).reduce((sum: number, r: any) => sum + (r.people || 0), 0) || 0,
      
      // Agrupamento por horário
      por_horario: reservas?.reduce((acc: any, reserva: any) => {
        const hora = reserva.time?.substring(0, 2) || '00';
        if (!acc[hora]) {
          acc[hora] = {
            horario: `${hora}:00`,
            reservas: 0,
            pessoas: 0
          };
        }
        acc[hora].reservas++;
        acc[hora].pessoas += reserva.people || 0;
        return acc;
      }, {}) || {},

      // Agrupamento por setor/mesa
      por_setor: reservas?.reduce((acc: any, reserva: any) => {
        const setor = reserva.sector_name || 'Sem setor';
        if (!acc[setor]) {
          acc[setor] = {
            setor,
            reservas: 0,
            pessoas: 0
          };
        }
        acc[setor].reservas++;
        acc[setor].pessoas += reserva.people || 0;
        return acc;
      }, {}) || {}
    };

    return NextResponse.json({
      success: true,
      data: {
        reservas: reservas || [],
        estatisticas: stats
      },
      meta: {
        data_consultada: dataConsulta,
        bar_id: bar_id,
        tipo_consulta: consultaPeriodo ? 'periodo' : 'dia_unico',
        filtros_aplicados: ['confirmed', 'seated']
      }
    });

  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
