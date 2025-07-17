import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase-admin'
import { securityMonitor } from '@/lib/security-monitor'

// Tipos auxiliares para eventos de seguranÃ§a
interface SecurityEvent {
  id: string;
  level?: string;
  category?: string;
  event_type: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_id?: string;
  timestamp: string;
  risk_score?: number;
  resolved?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    // Buscar mÃ¡Â©tricas das Ã¡Âºltimas 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const today = new Date()
    
    // Criar cliente Supabase
    const supabase = createServiceRoleClient()
    
    // Buscar eventos de seguranÃ¡Â§a das Ã¡Âºltimas 24 horas
    const { data: events, error: eventsError } = await supabase
      .from('security_events')
      .select('*')
      .gte('timestamp', oneDayAgo.toISOString())
      .lte('timestamp', today.toISOString())

    if (eventsError) {
      console.error('Erro ao buscar eventos:', eventsError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar eventos de seguranÃ¡Â§a' },
        { status: 500 }
      )
    }

    // Buscar mÃ¡Â©tricas do dia atual
    const { data: todayMetrics, error: metricsError } = await supabase
      .from('security_metrics')
      .select('*')
      .eq('date', today.toISOString().split('T')[0])
      .single()

    if (metricsError && metricsError.code !== 'PGRST116') {
      console.error('Erro ao buscar mÃ¡Â©tricas:', metricsError)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar mÃ¡Â©tricas de seguranÃ¡Â§a' },
        { status: 500 }
      )
    }

    // Calcular mÃ¡Â©tricas em tempo real dos eventos
    const totalEvents = (events as SecurityEvent[] | undefined)?.length || 0;
    const criticalEvents = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.level === 'critical').length || 0;
    const warningEvents = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.level === 'warning').length || 0;
    const infoEvents = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.level === 'info').length || 0;
    const authEvents = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.category === 'auth').length || 0;
    const accessEvents = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.category === 'access').length || 0;
    const injectionEvents = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.category === 'injection').length || 0;
    const rateLimitEvents = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.category === 'rate_limit').length || 0;
    const apiAbuseEvents = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.category === 'api_abuse').length || 0;
    const backupEvents = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.category === 'backup').length || 0;
    const systemEvents = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.category === 'system').length || 0;
    const uniqueIps = new Set((events as SecurityEvent[] | undefined)?.map((e: SecurityEvent) => e.ip_address).filter(Boolean)).size;
    const failedLogins = (events as SecurityEvent[] | undefined)?.filter((e: SecurityEvent) => e.event_type === 'failed_login').length || 0;
    
    // Usar mÃ¡Â©tricas do banco se disponÃ¡Â­veis, caso contrÃ¡Â¡rio usar calculadas
    const metrics = {
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
      blocked_ips: todayMetrics?.blocked_ips || 0
    }

    // Buscar Ã¡Âºltimos eventos para o timeline
    const { data: recentEvents, error: recentEventsError } = await supabase
      .from('security_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10)

    if (recentEventsError) {
      console.error('Erro ao buscar eventos recentes:', recentEventsError)
    }

    // Registrar evento de consulta de mÃ¡Â©tricas
    await securityMonitor.logEvent({
      level: 'info',
      category: 'access',
      event_type: 'security_metrics_accessed',
      ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      endpoint: '/api/security/metrics',
      details: { metrics_count: totalEvents },
      risk_score: 10
    })

    return NextResponse.json({
      success: true,
      metrics,
      recent_events: recentEvents || [],
      last_updated: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro interno na API:', error)
    
    // Registrar erro como evento de seguranÃ¡Â§a
    await securityMonitor.logEvent({
      level: 'warning',
      category: 'api_abuse',
      event_type: 'metrics_api_error',
      ip_address: request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      endpoint: '/api/security/metrics',
      details: { error: error instanceof Error ? error.message : 'Unknown error' },
      risk_score: 40
    })
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Endpoint para registrar um evento de seguranÃ¡Â§a
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar dados de entrada
    if (!body.level || !body.category || !body.event_type) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatÃ¡Â³rios ausentes: level, category, event_type' },
        { status: 400 }
      )
    }

    // Usar o SecurityMonitor para registrar o evento
    await securityMonitor.logEvent({
      level: body.level,
      category: body.category,
      event_type: body.event_type,
      user_id: body.user_id,
      ip_address: body.ip_address || request.ip || request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: body.user_agent || request.headers.get('user-agent') || 'unknown',
      endpoint: body.endpoint,
      details: body.details || {},
      risk_score: body.risk_score || 0
    })

    return NextResponse.json({
      success: true,
      message: 'Evento de seguranÃ¡Â§a registrado com sucesso'
    })

  } catch (error) {
    console.error('Erro interno na API POST:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

