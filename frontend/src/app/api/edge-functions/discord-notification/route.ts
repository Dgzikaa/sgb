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
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Ã°Å¸â€â€ž Discord Notification API - Dados recebidos:', {
      bar_id: body.bar_id,
      title: body.title,
      webhook_type: body.webhook_type,
      hasDescription: !!body.description,
      hasFields: !!body.fields
    })
    
    // Validar se bar_id foi fornecido
    if (!body.bar_id || !body.title) {
      console.error('ÂÅ’ ValidaÃ¡Â§Ã¡Â£o falhou:', { bar_id: body.bar_id, title: body.title })
      return NextResponse.json(
        { success: false, error: 'bar_id e title sÃ¡Â£o obrigatÃ¡Â³rios' },
        { status: 400 }
      )
    }

    // Usar service role para bypass RLS

    // Buscar webhook especÃ¡Â­fico do sistema
    const webhookMapping = {
      sistema: 'sistema',
      contaazul: 'contaazul',
      meta: 'meta',
      checklists: 'checklists',
      contahub: 'contahub',
      sympla: 'sympla',
      yuzer: 'yuzer',
      reservas: 'getin'
    }

    const webhookType = body.webhook_type || 'sistema'
    const sistema = webhookMapping[webhookType as keyof typeof webhookMapping]

    console.log('Ã°Å¸Å½Â¯ Buscando webhook:', { webhookType, sistema })

    if (!sistema) {
      console.error('ÂÅ’ Tipo de webhook nÃ¡Â£o mapeado:', webhookType)
      return NextResponse.json(
        { success: false, error: `Tipo de webhook nÃ¡Â£o suportado: ${webhookType}` },
        { status: 400 }
      )
    }

    // Buscar webhook no sistema especÃ¡Â­fico
    const { data: webhookData, error: webhookError } = await supabaseAdmin
      .from('api_credentials')
      .select('configuracoes')
      .eq('bar_id', body.bar_id)
      .eq('sistema', sistema)
      .eq('ambiente', 'producao')
      .maybeSingle()

    console.log('Ã°Å¸â€œÅ  Webhook do banco:', { webhookData, webhookError })

    let webhookUrl = ''
    if (!webhookError && webhookData && webhookData.configuracoes?.webhook_url) {
      webhookUrl = webhookData.configuracoes.webhook_url
      console.log(`Å“â€¦ Webhook ${webhookType} encontrado no sistema ${sistema}`)
    } else {
      console.log(`Å¡Â Ã¯Â¸Â Webhook ${webhookType} nÃ¡Â£o encontrado no sistema ${sistema}`)
    }

    console.log('Ã°Å¸Å½Â¯ Webhook selecionado:', { 
      webhookType, 
      webhookUrl: webhookUrl ? webhookUrl.substring(0, 50) + '...' : 'VAZIO',
      hasUrl: !!webhookUrl 
    })

    if (!webhookUrl || webhookUrl === '') {
      console.error('ÂÅ’ Webhook nÃ¡Â£o configurado:', { webhookType, sistema })
      return NextResponse.json(
        { success: false, error: `Webhook ${webhookType} nÃ¡Â£o configurado` },
        { status: 400 }
      )
    }

    // Criar o embed para Discord
    const embed = {
      title: body.title,
      description: body.description || '',
      color: body.color || 0x00D084,
      fields: body.fields || [],
      footer: {
        text: `SGB Analytics â‚¬Â¢ Bar ${body.bar_id} â‚¬Â¢ ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
      },
      timestamp: new Date().toISOString()
    }

    // Enviar para Discord
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: body.content || null,
        embeds: [embed],
        username: 'SGB Analytics',
        avatar_url: 'https://cdn.discordapp.com/attachments/1234567890/1234567890/sgb-logo.png'
      })
    })

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text()
      console.error('ÂÅ’ Erro Discord:', {
        status: discordResponse.status,
        error: errorText,
        webhook_type: webhookType,
        webhook_url: webhookUrl.substring(0, 50) + '...'
      })
      return NextResponse.json(
        { success: false, error: `Erro Discord: ${discordResponse.status} - ${errorText}` },
        { status: 400 }
      )
    }

    console.log(`Å“â€¦ Webhook ${webhookType} enviado com sucesso para Discord`)
    return NextResponse.json({ 
      success: true, 
      message: `Webhook ${webhookType} enviado com sucesso`,
      webhook_type: webhookType,
      sent_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('ÂÅ’ Erro no webhook Discord:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 

