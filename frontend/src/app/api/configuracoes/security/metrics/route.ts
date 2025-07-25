import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Interfaces para tipagem adequada
interface SecurityEvent {
  level: 'critical' | 'warning' | 'info';
  category: 'auth' | 'access' | 'injection' | 'rate_limit' | 'api_abuse' | 'backup' | 'system';
  event_type: string;
  ip_address?: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface SecurityMetrics {
  total_events: number;
  critical_events: number;
  warning_events: number;
  info_events: number;
  auth_events: number;
  access_events: number;
  injection_events: number;
  rate_limit_events: number;
  api_abuse_events: number;
  backup_events: number;
  system_events: number;
  unique_ips: number;
  failed_logins: number;
  blocked_ips: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Buscar métricas do dia atual
    const today = new Date().toISOString().split('T')[0];
    const { data: todayMetrics, error: metricsError } = await supabase
      .from('security_metrics')
      .select('*')
      .eq('date', today)
      .single();

    if (metricsError && metricsError.code !== 'PGRST116') {
      console.error('Erro ao buscar métricas:', metricsError);
    }

    // Buscar eventos de hoje para cálculo em tempo real
    const { data: events, error: eventsError } = await supabase
      .from('security_events')
      .select('*')
      .gte('timestamp', `${today}T00:00:00`)
      .lte('timestamp', `${today}T23:59:59`);

    if (eventsError) {
      console.error('Erro ao buscar eventos:', eventsError);
      return NextResponse.json(
        { error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    // Calcular métricas em tempo real dos eventos
    const typedEvents = (events || []) as SecurityEvent[];
    const totalEvents = typedEvents.length;
    const criticalEvents = typedEvents.filter(e => e.level === 'critical').length;
    const warningEvents = typedEvents.filter(e => e.level === 'warning').length;
    const infoEvents = typedEvents.filter(e => e.level === 'info').length;
    const authEvents = typedEvents.filter(e => e.category === 'auth').length;
    const accessEvents = typedEvents.filter(e => e.category === 'access').length;
    const injectionEvents = typedEvents.filter(e => e.category === 'injection').length;
    const rateLimitEvents = typedEvents.filter(e => e.category === 'rate_limit').length;
    const apiAbuseEvents = typedEvents.filter(e => e.category === 'api_abuse').length;
    const backupEvents = typedEvents.filter(e => e.category === 'backup').length;
    const systemEvents = typedEvents.filter(e => e.category === 'system').length;

    const uniqueIps = new Set(
      typedEvents.map(e => e.ip_address).filter(Boolean)
    ).size;
    const failedLogins = typedEvents.filter(e => e.event_type === 'failed_login').length;

    // Usar métricas do banco se disponíveis, caso contrário usar calculadas
    const metrics: SecurityMetrics = {
      total_events: todayMetrics?.total_events || totalEvents,
      critical_events: todayMetrics?.critical_events || criticalEvents,
      warning_events: todayMetrics?.warning_events || warningEvents,
      info_events: todayMetrics?.info_events || infoEvents,
      auth_events: todayMetrics?.auth_events || authEvents,
      access_events: todayMetrics?.access_events || accessEvents,
      injection_events: todayMetrics?.injection_events || injectionEvents,
      rate_limit_events: todayMetrics?.rate_limit_events || rateLimitEvents,
      api_abuse_events: todayMetrics?.api_abuse_events || apiAbuseEvents,
      backup_events: todayMetrics?.backup_events || backupEvents,
      system_events: todayMetrics?.system_events || systemEvents,
      unique_ips: todayMetrics?.unique_ips || uniqueIps,
      failed_logins: todayMetrics?.failed_logins || failedLogins,
      blocked_ips: todayMetrics?.blocked_ips || 0,
    };

    // Buscar últimos eventos para o timeline
    const { data: recentEvents, error: recentEventsError } = await supabase
      .from('security_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);

    if (recentEventsError) {
      console.error('Erro ao buscar eventos recentes:', recentEventsError);
    }

    // Registrar evento de consulta de métricas
    await securityMonitor.logEvent({
      level: 'info',
      category: 'access',
      event_type: 'security_metrics_accessed',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      endpoint: '/api/configuracoes/security/metrics',
      details: { metrics_count: totalEvents },
      risk_score: 10,
    });

    return NextResponse.json({
      success: true,
      metrics,
      recent_events: recentEvents || [],
      last_updated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro interno na API:', error);

    // Registrar erro como evento de segurança
    await securityMonitor.logEvent({
      level: 'warning',
      category: 'api_abuse',
      event_type: 'metrics_api_error',
      ip_address:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      endpoint: '/api/configuracoes/security/metrics',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      risk_score: 50,
    });

    return NextResponse.json(
      { 
        success: false, 
        error: `Erro interno: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
      },
      { status: 500 }
    );
  }
}

// Endpoint para registrar um evento de segurança
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validar dados de entrada
    if (!body.level || !body.category || !body.event_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados obrigatórios ausentes: level, category, event_type',
        },
        { status: 400 }
      );
    }

    // Usar o SecurityMonitor para registrar o evento
    await securityMonitor.logEvent({
      level: body.level,
      category: body.category,
      event_type: body.event_type,
      user_id: body.user_id,
      ip_address:
        body.ip_address ||
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip') ||
        'unknown',
      user_agent:
        body.user_agent || request.headers.get('user-agent') || 'unknown',
      endpoint: body.endpoint,
      details: body.details || {},
      risk_score: body.risk_score || 0,
    });

    return NextResponse.json({
      success: true,
      message: 'Evento de segurança registrado com sucesso',
    });
  } catch (error) {
    console.error('Erro interno na API POST:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
