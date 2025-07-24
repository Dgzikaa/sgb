import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false
        }
      }
    )
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar todos os dados do usuário para exportação
    const exportData: unknown = {
      metadata: {
        exportedAt: new Date().toISOString(),
        userId: user.id,
        email: user.email,
        purpose: 'LGPD Art. 20 - Portabilidade de Dados',
        format: 'JSON',
        version: '1.0'
      },
      data: {}
    }

    // 1. Perfil do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile) {
      exportData.data.profile = profile
    }

    // 2. Configurações LGPD
    const { data: lgpdSettings } = await supabase
      .from('user_lgpd_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (lgpdSettings) {
      exportData.data.lgpdSettings = lgpdSettings
    }

    // 3. Configurações do usuário
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)

    exportData.data.userSettings = userSettings || []

    // 4. Histórico de login (últimos 100)
    const { data: loginHistory } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    exportData.data.loginHistory = loginHistory || []

    // 5. Log de auditoria LGPD
    const { data: auditLogs } = await supabase
      .from('lgpd_audit_log')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })

    exportData.data.auditTrail = auditLogs || []

    // 6. Dados de negócio (bars associados)
    const { data: userBars } = await supabase
      .from('user_bars')
      .select(`
        *,
        bars (
          id,
          name,
          created_at
        )
      `)
      .eq('user_id', user.id)

    exportData.data.associatedBars = userBars || []

    // 7. Execuções de checklist
    const { data: checklistExecutions } = await supabase
      .from('checklist_executions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200)

    exportData.data.checklistExecutions = checklistExecutions || []

    // 8. Notificações
    const { data: notifications } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    exportData.data.notifications = notifications || []

    // 9. Uploads/arquivos do usuário
    const { data: uploads } = await supabase
      .from('uploads')
      .select('*')
      .eq('user_id', user.id)

    exportData.data.uploads = uploads || []

    // Log da solicitação de portabilidade
    await supabase
      .from('lgpd_audit_log')
      .insert({
        user_id: user.id,
        action: 'data_portability_requested',
        details: {
          exportedAt: new Date(),
          ipAddress: getClientIP(request),
          dataTypes: Object.keys(exportData.data)
        },
        ip_address: getClientIP(request),
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date()
      })

    // Criar o arquivo JSON formatado
    const jsonData = JSON.stringify(exportData, null, 2)
    const fileName = `dados-pessoais-${user.id}-${new Date().toISOString().split('T')[0]}.json`

    // Retornar como blob/download
    return new NextResponse(jsonData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': jsonData.length.toString()
      }
    })

  } catch (error) {
    console.error('Erro na portabilidade de dados:', error)
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
