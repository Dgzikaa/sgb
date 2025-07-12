import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('🔄 Discord Notification API - Dados recebidos:', {
      bar_id: body.bar_id,
      title: body.title,
      webhook_type: body.webhook_type,
      hasDescription: !!body.description,
      hasFields: !!body.fields
    })
    
    // Validar se bar_id foi fornecido
    if (!body.bar_id || !body.title) {
      console.error('❌ Validação falhou:', { bar_id: body.bar_id, title: body.title })
      return NextResponse.json(
        { success: false, error: 'bar_id e title são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      )
    }

    // Buscar configurações de webhook do banco
    const { data: configData, error: configError } = await supabase
      .from('api_credentials')
      .select('configuracoes')
      .eq('bar_id', body.bar_id)
      .eq('sistema', 'webhook')
      .single()

    console.log('📊 Config do banco:', { configData, configError })

    let webhookConfigs = {
      sistema: 'https://discord.com/api/webhooks/1393646423748116602/3zUhIrSKFHmq0zNRLf5AzrkSZNzTj7oYk6f45Tpj2LZWChtmGTKKTHxhfaNZigyLXN4y',
      contaazul: 'https://discord.com/api/webhooks/1391531226246021261/kxCJKKT7h7EnpVvNQj7oeJ3slqJOCAiXxB16SSOpuTn8EkmYDz3wIAAZpjpkUY3bnoWJ',
      meta: '',
      checklists: '',
      contahub: '',
      vendas: '',
      reservas: ''
    }

    // Se encontrou configurações no banco, usar elas
    if (!configError && configData?.configuracoes) {
      webhookConfigs = { ...webhookConfigs, ...configData.configuracoes }
      console.log('✅ Aplicando configurações do banco:', webhookConfigs)
    }

    // Determinar qual webhook usar
    const webhookType = body.webhook_type || 'sistema'
    const webhookUrl = webhookConfigs[webhookType as keyof typeof webhookConfigs]

    console.log('🎯 Webhook selecionado:', { 
      webhookType, 
      webhookUrl: webhookUrl ? webhookUrl.substring(0, 50) + '...' : 'VAZIO',
      hasUrl: !!webhookUrl 
    })

    if (!webhookUrl || webhookUrl === '') {
      console.error('❌ Webhook não configurado:', { webhookType, webhookConfigs })
      return NextResponse.json(
        { success: false, error: `Webhook ${webhookType} não configurado` },
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
        text: `SGB Analytics • Bar ${body.bar_id} • ${new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
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
      console.error('❌ Erro Discord:', {
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

    console.log(`✅ Webhook ${webhookType} enviado com sucesso para Discord`)
    return NextResponse.json({ 
      success: true, 
      message: `Webhook ${webhookType} enviado com sucesso`,
      webhook_type: webhookType,
      sent_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro no webhook Discord:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
} 