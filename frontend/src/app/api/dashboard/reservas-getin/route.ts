import { NextRequest, NextResponse } from 'next/server';
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
    console.log(`??? Buscando reservas para ${dataConsulta}`);

    let query = supabase
      .from('getin_reservas')
      .select(`
        getin_id,
        cliente_nome,
        numero_pessoas,
        data_reserva,
        hora_reserva,
        status,
        cliente_telefone,
        cliente_email,
        observacoes,
        valor_entrada,
        mesa_numero,
        source,
        created_at,
        updated_at,
        dados_extras
      `);

    // Aplicar filtro de data(s)
    if (consultaPeriodo) {
      query = query.gte('data_reserva', data_inicio).lte('data_reserva', data_fim);
    } else {
      query = query.eq('data_reserva', data);
    }

    // CORREÇÃO: Buscar TODAS as reservas (não filtrar por status)
    // query = query.in('status', ['confirmed', 'seated']);

    // Filtrar por bar_id
    query = query.eq('bar_id', bar_id);

    query = query.order('hora_reserva', { ascending: true });

    const { data: reservas, error } = await query;

    if (error) {
      console.error('Erro ao buscar reservas:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar reservas' },
        { status: 500 }
      );
    }

    console.log(`?? ${reservas?.length || 0} reservas encontradas (TODOS OS STATUS)`);

    // Calcular estatísticas - CORRIGIDO para incluir todos os status
    const statusCancelados = ['cancelada', 'no_show'];
    const statusConfirmados = ['confirmada', 'finalizada'];
    const statusPendentes = ['pendente'];
    
    console.log('?? ANÁLISE DETALHADA DE STATUS:');
    
    // Contar por status
    const porStatus = reservas?.reduce((acc: any, r: any) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {}) || {};
    
    console.log('   ?? Reservas por status:', porStatus);
    
    // Pessoas por status
    const pessoasPorStatus = reservas?.reduce((acc: any, r: any) => {
      acc[r.status] = (acc[r.status] || 0) + (r.people || 0);
      return acc;
    }, {}) || {};
    
    console.log('   ?? Pessoas por status:', pessoasPorStatus);

    const stats = {
      total_reservas: reservas?.length || 0,
      total_pessoas: reservas?.reduce((sum: number, r: any) => sum + (r.numero_pessoas || 0), 0) || 0,
      confirmed: reservas?.filter((r: any) => r.status === 'confirmada').length || 0,
      seated: reservas?.filter((r: any) => r.status === 'finalizada').length || 0,
      pending: reservas?.filter((r: any) => r.status === 'pendente').length || 0,
      
      // **NOVA MÉTRICA: Confirmadas apenas (confirmed + seated)**
      reservas_confirmadas: reservas?.filter((r: any) => statusConfirmados.includes(r.status)).length || 0,
      pessoas_confirmadas: reservas?.filter((r: any) => statusConfirmados.includes(r.status)).reduce((sum: number, r: any) => sum + (r.numero_pessoas || 0), 0) || 0,
      
      // **NOVA MÉTRICA: Confirmadas + Pendentes (como no planejamento)**
      reservas_confirmadas_mais_pendentes: reservas?.filter((r: any) => [...statusConfirmados, ...statusPendentes].includes(r.status)).length || 0,
      pessoas_confirmadas_mais_pendentes: reservas?.filter((r: any) => [...statusConfirmados, ...statusPendentes].includes(r.status)).reduce((sum: number, r: any) => sum + (r.numero_pessoas || 0), 0) || 0,
      
      reservas_pendentes: reservas?.filter((r: any) => r.status === 'pendente').length || 0,
      pessoas_pendentes: reservas?.filter((r: any) => r.status === 'pendente').reduce((sum: number, r: any) => sum + (r.numero_pessoas || 0), 0) || 0,
      
      canceled: reservas?.filter((r: any) => r.status?.includes('cancelada')).length || 0,
      no_show: reservas?.filter((r: any) => r.status === 'no_show').length || 0,
      canceladas_total: reservas?.filter((r: any) => statusCancelados.includes(r.status)).length || 0,
      pessoas_canceladas: reservas?.filter((r: any) => statusCancelados.includes(r.status)).reduce((sum: number, r: any) => sum + (r.numero_pessoas || 0), 0) || 0,
      
      // Agrupamento por horário
      por_horario: reservas?.reduce((acc: any, reserva: any) => {
        const hora = reserva.hora_reserva?.substring(0, 2) || '00';
        if (!acc[hora]) {
          acc[hora] = {
            horario: `${hora}:00`,
            reservas: 0,
            pessoas: 0
          };
        }
        acc[hora].reservas++;
        acc[hora].pessoas += reserva.numero_pessoas || 0;
        return acc;
      }, {}) || {},

      // Agrupamento por mesa
      por_mesa: reservas?.reduce((acc: any, reserva: any) => {
        const mesa = reserva.mesa_numero || 'Sem mesa definida';
        if (!acc[mesa]) {
          acc[mesa] = {
            mesa,
            reservas: 0,
            pessoas: 0
          };
        }
        acc[mesa].reservas++;
        acc[mesa].pessoas += reserva.numero_pessoas || 0;
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
        filtros_aplicados: ['confirmada', 'finalizada', 'pendente', 'cancelada', 'no_show']
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
