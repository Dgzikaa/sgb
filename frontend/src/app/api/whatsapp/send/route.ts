import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// =====================================================
// 📱 API PARA ENVIO DE MENSAGENS WHATSAPP
// =====================================================

interface WhatsAppMessage {
  to: string
  message: string
  type?: 'text' | 'template'
  template_name?: string
  template_params?: any[]
}

interface WhatsAppConfig {
  provider: string
  enabled: boolean
  phone_number: string
  api_url?: string
  api_key?: string
  instance_id?: string
  session_name?: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { to, message, type = 'text', template_name, template_params }: WhatsAppMessage = await req.json()

    if (!to || !message) {
      return NextResponse.json({ 
        error: 'Destinatário e mensagem são obrigatórios' 
      }, { status: 400 })
    }

    // Buscar configuração do WhatsApp do usuário
    const { data: config, error: configError } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (configError || !config || !config.enabled) {
      return NextResponse.json({ 
        error: 'WhatsApp não configurado ou desabilitado' 
      }, { status: 400 })
    }

    // Enviar mensagem baseado no provedor
    const result = await sendMessage(config, { to, message, type, template_name, template_params })

    // Log da mensagem enviada
    await supabase
      .from('whatsapp_messages')
      .insert({
        user_id: user.id,
        to_number: to,
        message,
        type,
        provider: config.provider,
        status: result.success ? 'sent' : 'failed',
        provider_response: result.response,
        sent_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Mensagem enviada com sucesso' : 'Falha no envio',
      provider_response: result.response
    })

  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

// =====================================================
// 🚀 FUNÇÕES DE ENVIO POR PROVEDOR
// =====================================================

async function sendMessage(
  config: WhatsAppConfig, 
  message: WhatsAppMessage
): Promise<{ success: boolean; response: any }> {
  
  switch (config.provider) {
    case 'evolution':
      return sendEvolutionAPI(config, message)
    
    case 'twilio':
      return sendTwilio(config, message)
    
    case 'whatsapp_business':
      return sendWhatsAppBusiness(config, message)
    
    case 'baileys':
      return sendBaileys(config, message)
    
    default:
      return { success: false, response: { error: 'Provedor não suportado' } }
  }
}

// =====================================================
// 🚀 EVOLUTION API
// =====================================================
async function sendEvolutionAPI(
  config: WhatsAppConfig, 
  message: WhatsAppMessage
): Promise<{ success: boolean; response: any }> {
  try {
    const url = `${config.api_url}/message/sendText/${config.instance_id}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.api_key || ''
      },
      body: JSON.stringify({
        number: message.to,
        text: message.message
      })
    })

    const data = await response.json()
    
    return {
      success: response.ok && data.key,
      response: data
    }
  } catch (error) {
    return {
      success: false,
      response: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }
}

// =====================================================
// 📞 TWILIO
// =====================================================
async function sendTwilio(
  config: WhatsAppConfig, 
  message: WhatsAppMessage
): Promise<{ success: boolean; response: any }> {
  try {
    const accountSid = config.api_key
    const authToken = config.session_name
    const fromNumber = config.api_url // whatsapp:+5511999999999
    
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        From: fromNumber || '',
        To: `whatsapp:${message.to}`,
        Body: message.message
      })
    })

    const data = await response.json()
    
    return {
      success: response.ok && data.sid,
      response: data
    }
  } catch (error) {
    return {
      success: false,
      response: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }
}

// =====================================================
// ✅ WHATSAPP BUSINESS API
// =====================================================
async function sendWhatsAppBusiness(
  config: WhatsAppConfig, 
  message: WhatsAppMessage
): Promise<{ success: boolean; response: any }> {
  try {
    const phoneNumberId = config.instance_id
    const accessToken = config.session_name
    
    const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`
    
    const payload = {
      messaging_product: 'whatsapp',
      to: message.to,
      type: 'text',
      text: {
        body: message.message
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()
    
    return {
      success: response.ok && data.messages,
      response: data
    }
  } catch (error) {
    return {
      success: false,
      response: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }
}

// =====================================================
// 🔧 BAILEYS (SELF-HOSTED)
// =====================================================
async function sendBaileys(
  config: WhatsAppConfig, 
  message: WhatsAppMessage
): Promise<{ success: boolean; response: any }> {
  try {
    const url = `${config.api_url}/send-message`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (config.api_key) {
      headers['Authorization'] = `Bearer ${config.api_key}`
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        session: config.session_name || 'default',
        to: message.to,
        text: message.message
      })
    })

    const data = await response.json()
    
    return {
      success: response.ok && data.success,
      response: data
    }
  } catch (error) {
    return {
      success: false,
      response: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }
}

// =====================================================
// 🧪 ENDPOINT DE TESTE
// =====================================================
export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const to = searchParams.get('to')

    if (!to) {
      return NextResponse.json({ 
        error: 'Parâmetro "to" é obrigatório' 
      }, { status: 400 })
    }

    // Buscar configuração
    const { data: config, error: configError } = await supabase
      .from('whatsapp_configs')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'Configuração WhatsApp não encontrada' 
      }, { status: 400 })
    }

    // Mensagem de teste
    const testMessage = `🧪 *Teste de Conexão*

Esta é uma mensagem de teste do Sistema SGB.

✅ Provedor: ${config.provider}
📱 Número: ${config.phone_number}
⏰ Data/Hora: ${new Date().toLocaleString('pt-BR')}

Se você recebeu esta mensagem, a integração está funcionando corretamente!

_Sistema de Gestão de Bares_`

    const result = await sendMessage(config, {
      to,
      message: testMessage,
      type: 'text'
    })

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Mensagem de teste enviada!' : 'Falha no teste',
      provider: config.provider,
      response: result.response
    })

  } catch (error) {
    console.error('Erro no teste WhatsApp:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 