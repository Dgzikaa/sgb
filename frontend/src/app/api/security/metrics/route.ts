import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

interface SecurityEvent {
  level: string
  category: string
  event_type: string
  ip_address?: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      )
    }

    // Buscar métricas de segurança das últimas 24 horas
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Buscar eventos de segurança
    const { data: events, error: eventsError } = await supabase
      .from('security_events')
      .select('level, category, event_type, ip_address')
      .gte('timestamp', oneDayAgo)

    if (eventsError) {
      console.error('❌ Erro ao buscar eventos de segurança:', eventsError)
    }

    // Calcular métricas
    const securityEvents: SecurityEvent[] = events || []
    
    const metrics = {
      total_events: securityEvents.length,
      critical_events: securityEvents.filter((e: SecurityEvent) => e.level === 'critical').length,
      warning_events: securityEvents.filter((e: SecurityEvent) => e.level === 'warning').length,
      info_events: securityEvents.filter((e: SecurityEvent) => e.level === 'info').length,
      auth_events: securityEvents.filter((e: SecurityEvent) => e.category === 'authentication').length,
      access_events: securityEvents.filter((e: SecurityEvent) => e.category === 'access_control').length,
      injection_events: securityEvents.filter((e: SecurityEvent) => e.category === 'sql_injection').length,
      rate_limit_events: securityEvents.filter((e: SecurityEvent) => e.category === 'rate_limiting').length,
      api_abuse_events: securityEvents.filter((e: SecurityEvent) => e.category === 'api_abuse').length,
      backup_events: securityEvents.filter((e: SecurityEvent) => e.category === 'backup').length,
      system_events: securityEvents.filter((e: SecurityEvent) => e.category === 'system').length,
      unique_ips: new Set(securityEvents.map((e: SecurityEvent) => e.ip_address).filter(Boolean)).size,
      failed_logins: securityEvents.filter((e: SecurityEvent) => e.event_type === 'login_failed').length,
      blocked_ips: securityEvents.filter((e: SecurityEvent) => e.event_type === 'ip_blocked').length
    }

    return NextResponse.json({
      success: true,
      metrics
    })

  } catch (error) {
    console.error('❌ Erro na API de métricas de segurança:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 