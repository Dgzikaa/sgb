import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const webhookUrl = 'https://discord.com/api/webhooks/1397957282771239004/PtuGxuTrNDIPRx_tliv1es5zg3zv-TkdvWel4Git_QHOi9X7T-BP1k25lRl6364PqeHT'
    
    const embed = {
      title: "🧪 Teste de Webhook Discord",
      color: 0x00ff00, // Verde
      description: "Este é um teste para verificar se o webhook está funcionando",
      fields: [
        {
          name: "Status",
          value: "✅ Teste realizado com sucesso",
          inline: true
        },
        {
          name: "Data/Hora",
          value: new Date().toLocaleString('pt-BR'),
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
    console.log('📦 Payload:', JSON.stringify(payload, null, 2))

    // Enviar diretamente para o webhook do Discord
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    console.log('📡 Status da resposta Discord:', response.status)
    console.log('📡 Headers da resposta Discord:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro no Discord:', errorText)
      throw new Error(`Discord webhook error: ${response.status} - ${errorText}`)
    }

    console.log('✅ Teste enviado para Discord com sucesso!')
    
    return NextResponse.json({
      success: true,
      message: 'Teste enviado para Discord com sucesso',
      status: response.status,
      webhook_url: webhookUrl
    })

  } catch (error: any) {
    console.error('❌ Erro ao testar Discord:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
} 