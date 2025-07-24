import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId') || '3'

    console.log('🔍 Testando busca de webhook Discord para bar_id:', barId)

    // Buscar webhook do Discord da tabela api_credentials
    const { data: credenciaisDiscord, error } = await supabase
      .from('api_credentials')
      .select('configuracoes')
      .eq('bar_id', barId)
      .eq('sistema', 'inter')
      .single()

    console.log('📋 Resultado da busca webhook:', { 
      error: error?.message, 
      configuracoes: credenciaisDiscord?.configuracoes 
    })

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar webhook',
        details: error.message,
        barId: barId
      }, { status: 500 })
    }

    if (!credenciaisDiscord?.configuracoes?.webhook_url) {
      return NextResponse.json({
        success: false,
        error: 'Webhook do Discord não encontrado',
        config: {
          barId: barId,
          sistema: 'inter',
          configuracoes: credenciaisDiscord?.configuracoes
        }
      }, { status: 404 })
    }

    const webhookUrl = credenciaisDiscord.configuracoes.webhook_url

    // Testar o webhook
    const embed = {
      title: "🧪 Teste de Webhook Discord",
      color: 0x00ff00,
      description: "Este é um teste para verificar se o webhook está funcionando",
      fields: [
        {
          name: "Status",
          value: "✅ Webhook encontrado e funcionando",
          inline: true
        },
        {
          name: "Bar ID",
          value: barId,
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "SGB - Sistema de Gestão de Bares"
      }
    }

    const payload = {
      embeds: [embed]
    }

    console.log('📤 Enviando teste para Discord...')
    console.log('🔗 Webhook URL:', webhookUrl)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log('📡 Status da resposta Discord:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `Discord webhook error: ${response.status}`,
        details: errorText,
        webhookUrl: webhookUrl
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook Discord encontrado e funcionando',
      webhookUrl: webhookUrl,
      barId: barId
    })

  } catch (error: any) {
    console.error('❌ Erro ao testar webhook Discord:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 