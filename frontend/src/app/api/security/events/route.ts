import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const hours = parseInt(searchParams.get('hours') || '24');

    // Calcular timestamp para filtrar por horas
    const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    let query = supabase
      .from('security_events')
      .select('*')
      .gte('timestamp', hoursAgo.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit);

    // Filtros opcionais
    if (level) {
      query = query.eq('level', level);
    }
    if (category) {
      query = query.eq('category', category);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar eventos de segurança' },
        { status: 500 }
      );
    }

    // Formatar eventos para o frontend
    const formattedEvents =
      events?.map(event => ({
        id: event.id,
        level: event.level,
        category: event.category,
        event_type: event.event_type,
        message:
          event.details?.message || `${event.category} - ${event.event_type}`,
        ip_address: event.ip_address,
        user_id: event.user_id,
        timestamp: event.timestamp,
        details: event.details,
        risk_score: event.risk_score,
        resolved: event.resolved,
      })) || [];

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      total: events?.length || 0,
      filters: {
        level,
        category,
        hours,
      },
    });
  } catch (error) {
    console.error('Erro interno na API de eventos:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
