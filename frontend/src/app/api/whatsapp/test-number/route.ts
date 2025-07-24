import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { numero, mensagem } = await req.json()
    
    if (!numero) {
      return NextResponse.json(
        { success: false, error: 'Número é obrigatório' },
        { status: 400 }
      )
    }

    // Validar formato do número
    const numeroLimpo = numero.replace(/\D/g, '')
    if (numeroLimpo.length !== 11) {
      return NextResponse.json(
        { success: false, error: 'Número deve ter 11 dígitos' },
        { status: 400 }
      )
    }

    // Verificar se está em modo de simulação
    if (process.env.WHATSAPP_SIMULATION_MODE === 'true') {
      // Modo simulação - simular sucesso
      await supabase
        .from('whatsapp_messages')
        .insert({
          to_number: numeroLimpo,
          message: mensagem || 'Teste de conectividade',
          type: 'text',
          provider: 'evolution-api-test',
          status: 'sent',
          provider_response: {
            simulation: true,
            test_timestamp: new Date().toISOString()
          },
          sent_at: new Date().toISOString()
        })

      return NextResponse.json({
        success: true,
        simulation: true,
        message: 'Teste simulado com sucesso'
      })
    }

    // Modo real - enviar via Evolution API
    const evolutionResponse = await fetch(
      `${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.EVOLUTION_API_KEY!
        },
        body: JSON.stringify({
          number: numeroLimpo,
          text: mensagem || `📱 Teste de WhatsApp - SGB\n\n✅ Seu número está funcionando!\n\n_${new Date().toLocaleString('pt-BR')}_`
        })
      }
    )

    const evolutionResult = await evolutionResponse.json()

    if (!evolutionResponse.ok) {
      // Salvar falha no banco
      await supabase
        .from('whatsapp_messages')
        .insert({
          to_number: numeroLimpo,
          message: mensagem || 'Teste de conectividade',
          type: 'text',
          provider: 'evolution-api',
          status: 'failed',
          provider_response: {
            error: evolutionResult.message || 'Erro desconhecido',
            test: true
          },
          sent_at: new Date().toISOString()
        })

      return NextResponse.json({
        success: false,
        error: evolutionResult.message || 'Erro ao enviar teste'
      })
    }

    // Salvar sucesso no banco
    await supabase
      .from('whatsapp_messages')
      .insert({
        to_number: numeroLimpo,
        message: mensagem || 'Teste de conectividade',
        type: 'text',
        provider: 'evolution-api',
        status: 'sent',
        provider_response: {
          evolution_response: evolutionResult,
          test: true
        },
        sent_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      messageId: evolutionResult.key?.id,
      message: 'Teste enviado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao testar número:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
} 
