import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticaÃ¡Â§Ã¡Â£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃ¡Â£o autorizado' }, { status: 401 })
    }

    // Buscar configuraÃ¡Â§Ã¡Âµes LGPD do usuÃ¡Â¡rio
    const { data: settings, error } = await supabase
      .from('user_lgpd_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // NÃ¡Â£o encontrado Ã¡Â© OK
      throw error
    }

    // Se nÃ¡Â£o existir, retornar configuraÃ¡Â§Ã¡Âµes padrÃ¡Â£o
    if (!settings) {
      const defaultSettings = {
        user_id: user.id,
        consents: {
          essential: {
            type: 'essential',
            granted: true,
            timestamp: new Date(),
            version: '1.0',
            ip: getClientIP(request),
            userAgent: request.headers.get('user-agent') || 'unknown'
          },
          analytics: {
            type: 'analytics',
            granted: false,
            timestamp: new Date(),
            version: '1.0'
          },
          marketing: {
            type: 'marketing',
            granted: false,
            timestamp: new Date(),
            version: '1.0'
          },
          preferences: {
            type: 'preferences',
            granted: false,
            timestamp: new Date(),
            version: '1.0'
          },
          functional: {
            type: 'functional',
            granted: false,
            timestamp: new Date(),
            version: '1.0'
          }
        },
        bannerShown: false,
        lastUpdated: new Date(),
        version: '1.0'
      }

      return NextResponse.json(defaultSettings)
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error('Erro ao buscar configuraÃ¡Â§Ã¡Âµes LGPD:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticaÃ¡Â§Ã¡Â£o
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'NÃ¡Â£o autorizado' }, { status: 401 })
    }

    const settings = await request.json()
    
    // Adicionar informaÃ¡Â§Ã¡Âµes de auditoria
    const settingsWithAudit = {
      ...settings,
      user_id: user.id,
      last_updated: new Date(),
      ip_address: getClientIP(request),
      user_agent: request.headers.get('user-agent') || 'unknown'
    }

    // Salvar/atualizar configuraÃ¡Â§Ã¡Âµes
    const { data, error } = await supabase
      .from('user_lgpd_settings')
      .upsert(settingsWithAudit, {
        onConflict: 'user_id'
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    // Log de auditoria
    await supabase
      .from('lgpd_audit_log')
      .insert({
        user_id: user.id,
        action: 'settings_updated',
        details: settingsWithAudit.consents,
        ip_address: getClientIP(request),
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date()
      })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro ao salvar configuraÃ¡Â§Ã¡Âµes LGPD:', error)
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

