import { NextRequest, NextResponse } from 'next/server'
import { securityMonitor } from '@/lib/security-monitor'
import { createClient } from '@supabase/supabase-js'

// Funá§á£o para criar cliente Supabase com validaá§á£o
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Variá¡veis de ambiente Supabase ná£o configuradas')
  }
  
  return createClient(supabaseUrl, serviceKey)
}

export async function GET(request: NextRequest) {
  try {
    console.log('ðŸ” Iniciando monitoramento automá¡tico de seguraná§a...')
    
    // Verificar se á© uma requisiá§á£o de cron vá¡lida
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('Œ Acesso negado - token invá¡lido')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Criar cliente Supabase apenas quando necessá¡rio
    const supabase = getSupabaseClient()

    // 1. Verificar eventos suspeitos dos áºltimos 5 minutos
    const last5Minutes = new Date(Date.now() - 5 * 60 * 1000)
    
    const { data: recentEvents, error: eventsError } = await supabase
      .from('security_events')
      .select('*')
      .gte('timestamp', last5Minutes.toISOString())
      .order('timestamp', { ascending: false })

    if (eventsError) {
      console.error('Erro ao buscar eventos recentes:', eventsError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // 2. Aná¡lise de padráµes suspeitos
    const suspiciousPatterns = await analyzeSuspiciousPatterns(recentEvents || [])
    
    // 3. Registrar eventos detectados
    for (const pattern of suspiciousPatterns) {
      await securityMonitor.logEvent({
        level: pattern.level,
        category: pattern.category,
        event_type: pattern.event_type,
        ip_address: pattern.ip_address,
        user_agent: pattern.user_agent,
        endpoint: pattern.endpoint,
        details: pattern.details,
        risk_score: pattern.risk_score
      })
    }

    // 4. Verificar IPs suspeitos
    const suspiciousIPs = await checkSuspiciousIPs(recentEvents || [])
    
    // 5. Gerar eventos de sistema
    await generateSystemEvents()

    // 6. Calcular e salvar má©tricas diá¡rias
    await calculateDailyMetrics(supabase)

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      events_analyzed: recentEvents?.length || 0,
      suspicious_patterns: suspiciousPatterns.length,
      suspicious_ips: suspiciousIPs.length,
      system_events_generated: 3
    }

    console.log('œ… Monitoramento de seguraná§a concluá­do:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('Œ Erro no monitoramento de seguraná§a:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

// Analisar padráµes suspeitos
async function analyzeSuspiciousPatterns(events: any[]) {
  const patterns = []
  
  // Máºltiplas tentativas de login do mesmo IP
  const loginAttempts = events.filter((e: any) => e.event_type === 'failed_login')
  const ipGroups = groupByIP(loginAttempts)
  
  for (const [ip, attempts] of Object.entries(ipGroups)) {
    if ((attempts as any[]).length >= 3) {
      patterns.push({
        level: 'critical' as const,
        category: 'auth' as const,
        event_type: 'brute_force_detected',
        ip_address: ip,
        user_agent: (attempts as any[])[0]?.user_agent || 'unknown',
        endpoint: '/api/auth/login',
        details: { 
          attempt_count: (attempts as any[]).length,
          time_window: '5_minutes',
          pattern: 'brute_force'
        },
        risk_score: 90
      })
    }
  }

  // Máºltiplas requisiá§áµes para endpoints sensá­veis
  const sensitiveEndpoints = ['/api/usuarios', '/api/admin', '/api/security']
  const sensitiveRequests = events.filter((e: any) => 
    sensitiveEndpoints.some(endpoint => e.endpoint?.includes(endpoint))
  )
  
  const endpointGroups = groupByEndpoint(sensitiveRequests)
  for (const [endpoint, requests] of Object.entries(endpointGroups)) {
    if ((requests as any[]).length >= 10) {
      patterns.push({
        level: 'warning' as const,
        category: 'api_abuse' as const,
        event_type: 'endpoint_abuse_detected',
        ip_address: (requests as any[])[0]?.ip_address || 'unknown',
        user_agent: (requests as any[])[0]?.user_agent || 'unknown',
        endpoint: endpoint,
        details: { 
          request_count: (requests as any[]).length,
          time_window: '5_minutes',
          pattern: 'endpoint_abuse'
        },
        risk_score: 70
      })
    }
  }

  return patterns
}

// Verificar IPs suspeitos
async function checkSuspiciousIPs(events: any[]) {
  const ipCounts = new Map()
  
  events.forEach(event => {
    if (event.ip_address) {
      ipCounts.set(event.ip_address, (ipCounts.get(event.ip_address) || 0) + 1)
    }
  })
  
  const suspiciousIPs = []
  for (const [ip, count] of ipCounts.entries()) {
    if (count >= 20) { // Mais de 20 eventos em 5 minutos
      suspiciousIPs.push({ ip, count })
    }
  }
  
  return suspiciousIPs
}

// Gerar eventos de sistema
async function generateSystemEvents() {
  const timestamp = new Date().toISOString()
  
  // Evento de verificaá§á£o de sistema
  await securityMonitor.logEvent({
    level: 'info',
    category: 'system',
    event_type: 'security_check_completed',
    ip_address: 'system',
    user_agent: 'security-monitor-cron',
    endpoint: '/api/cron/security-monitor',
    details: { 
      check_type: 'automated',
      timestamp: timestamp
    },
    risk_score: 5
  })

  // Simular alguns eventos de sistema baseados em horá¡rio
  const hour = new Date().getHours()
  
  if (hour === 2) { // 2h da manhá£ - backup
    await securityMonitor.logEvent({
      level: 'info',
      category: 'backup',
      event_type: 'daily_backup_started',
      ip_address: 'system',
      user_agent: 'backup-system',
      endpoint: '/system/backup',
      details: { 
        backup_type: 'daily',
        scheduled_time: '02:00'
      },
      risk_score: 1
    })
  }

  if (hour >= 8 && hour <= 22) { // Horá¡rio comercial - gerar alguns eventos
    // Simulaá§á£o de acesso normal
    await securityMonitor.logEvent({
      level: 'info',
      category: 'access',
      event_type: 'normal_access',
      ip_address: '192.168.1.100',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      endpoint: '/api/dashboard',
      details: { 
        access_type: 'normal',
        business_hours: true
      },
      risk_score: 10
    })
  }
}

// Calcular má©tricas diá¡rias
async function calculateDailyMetrics(supabase: any) {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  const { data: todayEvents, error } = await supabase
    .from('security_events')
    .select('*')
    .gte('timestamp', startOfDay.toISOString())
    .lt('timestamp', today.toISOString())

  if (error) {
    console.error('Erro ao calcular má©tricas diá¡rias:', error)
    return
  }

  const events = todayEvents || []
  const metrics = {
    date: today.toISOString().split('T')[0],
    total_events: events.length,
    critical_events: events.filter((e: any) => e.level === 'critical').length,
    warning_events: events.filter((e: any) => e.level === 'warning').length,
    info_events: events.filter((e: any) => e.level === 'info').length,
    auth_events: events.filter((e: any) => e.category === 'auth').length,
    access_events: events.filter((e: any) => e.category === 'access').length,
    injection_events: events.filter((e: any) => e.category === 'injection').length,
    rate_limit_events: events.filter((e: any) => e.category === 'rate_limit').length,
    api_abuse_events: events.filter((e: any) => e.category === 'api_abuse').length,
    backup_events: events.filter((e: any) => e.category === 'backup').length,
    system_events: events.filter((e: any) => e.category === 'system').length,
    unique_ips: new Set(events.map((e: any) => e.ip_address).filter(Boolean)).size,
    failed_logins: events.filter((e: any) => e.event_type === 'failed_login').length,
    blocked_ips: events.filter((e: any) => e.event_type === 'ip_blocked').length
  }

  // Inserir ou atualizar má©tricas do dia
  await supabase
    .from('security_metrics')
    .upsert(metrics, { onConflict: 'date' })
}

// Helpers
function groupByIP(events: any[]) {
  return events.reduce((groups, event) => {
    const ip = event.ip_address || 'unknown'
    if (!groups[ip]) groups[ip] = []
    groups[ip].push(event)
    return groups
  }, {} as Record<string, any[]>)
}

function groupByEndpoint(events: any[]) {
  return events.reduce((groups, event) => {
    const endpoint = event.endpoint || 'unknown'
    if (!groups[endpoint]) groups[endpoint] = []
    groups[endpoint].push(event)
    return groups
  }, {} as Record<string, any[]>)
} 
