import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticaÃ§Ã£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃ£o autorizado' }, { status: 401 })
    }

    // Compilar todos os dados do usuÃ¡rio de diferentes tabelas
    const userData: any = {
      metadata: {
        requestedAt: new Date(),
        userId: user.id,
        email: user.email,
        purpose: 'LGPD Art. 15 - Direito de Acesso aos Dados'
      },
      personalData: {},
      systemData: {},
      activityData: {},
      consentData: {}
    }

    // 1. Dados pessoais bÃ¡sicos (tabela profiles)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      userData.personalData = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        phone: profile.phone,
        avatar: profile.avatar_url,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        metadata: profile.metadata
      }
    }

    // 2. Dados do sistema (configuraÃ§Ãµes, preferÃªncias)
    const { data: settings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)

    userData.systemData = {
      settings: settings || [],
      preferences: {
        theme: 'Obtido do localStorage',
        language: 'pt-BR',
        notifications: 'ConfiguraÃ§Ãµes de notificaÃ§Ã£o'
      }
    }

    // 3. Dados de atividade
    const { data: loginHistory } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: auditLogs } = await supabase
      .from('lgpd_audit_log')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(100)

    userData.activityData = {
      recentLogins: loginHistory || [],
      auditTrail: auditLogs || [],
      lastActivity: new Date()
    }

    // 4. Dados de consentimento LGPD
    const { data: lgpdSettings } = await supabase
      .from('user_lgpd_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    userData.consentData = {
      currentConsents: lgpdSettings?.consents || {},
      lastUpdated: lgpdSettings?.last_updated,
      version: lgpdSettings?.version || '1.0',
      bannerShown: lgpdSettings?.bannerShown || false
    }

    // 5. Dados de negÃ³cio especÃ­ficos (se aplicÃ¡vel)
    const { data: bars } = await supabase
      .from('bars')
      .select('id, name, role')
      .contains('members', [{ user_id: user.id }])

    const { data: checklists } = await supabase
      .from('checklist_executions')
      .select('*')
      .eq('user_id', user.id)
      .limit(20)

    userData.businessData = {
      associatedBars: bars || [],
      recentChecklists: checklists || [],
      roles: 'ExtraÃ­do dos bars'
    }

    // 6. Dados tÃ©cnicos
    userData.technicalData = {
      ipAddresses: 'HistÃ³rico obtido dos logs',
      userAgents: 'HistÃ³rico obtido dos logs',
      cookies: 'Baseado nos consentimentos',
      sessions: 'Dados de sessÃ£o ativa'
    }

    // Log da solicitaÃ§Ã£o de acesso
    await supabase
      .from('lgpd_audit_log')
      .insert({
        user_id: user.id,
        action: 'data_access_requested',
        details: {
          requestedAt: new Date(),
          ipAddress: getClientIP(request)
        },
        ip_address: getClientIP(request),
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date()
      })

    return NextResponse.json(userData)

  } catch (error) {
    console.error('Erro ao acessar dados do usuÃ¡rio:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  return 'unknown'
} 
