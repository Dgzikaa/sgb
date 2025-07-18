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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { numero, mensagem } = await req.json()
    
    if (!numero) {
      return NextResponse.json(
        { success: false, error: 'NÃ¡Âºmero Ã¡Â© obrigatÃ¡Â³rio' },
        { status: 400 }
      )
    }

    // Validar formato do nÃ¡Âºmero
    const numeroLimpo = numero.replace(/\D/g, '')
    if (numeroLimpo.length !== 11) {
      return NextResponse.json(
        { success: false, error: 'NÃ¡Âºmero deve ter 11 dÃ¡Â­gitos' },
        { status: 400 }
      )
    }

    // Verificar se estÃ¡Â¡ em modo de simulaÃ¡Â§Ã¡Â£o
    if (process.env.WHATSAPP_SIMULATION_MODE === 'true') {
      // Modo simulaÃ¡Â§Ã¡Â£o - simular sucesso
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
          text: mensagem || `Ã°Å¸â€œÂ± Teste de WhatsApp - SGB\n\nÅ“â€¦ Seu nÃ¡Âºmero estÃ¡Â¡ funcionando!\n\n_${new Date().toLocaleString('pt-BR')}_`
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
    console.error('Erro ao testar nÃ¡Âºmero:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
} 

