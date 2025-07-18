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

// Ã°Å¸â€ºÂ¡Ã¯Â¸Â CONFIGURAÃ¡â€¡Ã¡â€¢ES DE SEGURANÃ¡â€¡A ANTI-BAN
const SECURITY_CONFIG = {
  MAX_MESSAGES_PER_DAY: 50, // MÃ¡Â¡ximo de mensagens por dia
  MIN_INTERVAL_SECONDS: 30, // MÃ¡Â­nimo 30 segundos entre mensagens
  BUSINESS_HOURS: {
    START: 8, // 8h
    END: 18   // 18h
  },
  MAX_RETRIES: 3
}

interface NotificationRequest {
  checklistId: string
  responsavelNumero: string
  titulo: string
  prazo: string
  tipo?: 'novo' | 'lembrete' | 'urgente'
}

export async function POST(req: NextRequest) {
  try {
    const body: NotificationRequest = await req.json()
    
    // Ã°Å¸â€Â VALIDAÃ¡â€¡Ã¡â€¢ES DE SEGURANÃ¡â€¡A
    const securityCheck = await validateSecurityLimits(body.responsavelNumero)
    if (!securityCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: securityCheck.reason,
        nextAvailableAt: securityCheck.nextAvailableAt
      }, { status: 429 })
    }

    // Ã°Å¸â€œÂ± ENVIAR NOTIFICAÃ¡â€¡Ã¡Æ’O
    const result = await sendSecureNotification(body)
    
    return NextResponse.json(result)

  } catch (error: unknown) {
    console.error('ÂÅ’ Erro ao enviar notificaÃ¡Â§Ã¡Â£o:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno' },
      { status: 500 }
    )
  }
}

async function validateSecurityLimits(phoneNumber: string) {
  const today = new Date().toISOString().split('T')[0]
  const currentHour = new Date().getHours()
  
  // ÂÂ° VERIFICAR HORÃ¡ÂRIO COMERCIAL
  if (currentHour < SECURITY_CONFIG.BUSINESS_HOURS.START || 
      currentHour > SECURITY_CONFIG.BUSINESS_HOURS.END) {
    const nextBusinessHour = currentHour < SECURITY_CONFIG.BUSINESS_HOURS.START 
      ? SECURITY_CONFIG.BUSINESS_HOURS.START 
      : SECURITY_CONFIG.BUSINESS_HOURS.START + 24
    
    return {
      allowed: false,
      reason: 'Fora do horÃ¡Â¡rio comercial (8h Ã¡Â s 18h)',
      nextAvailableAt: `${nextBusinessHour}:00`
    }
  }

  // Ã°Å¸â€œÅ  VERIFICAR LIMITE DIÃ¡ÂRIO
  const { data: todayMessages } = await supabase
    .from('whatsapp_messages')
    .select('id')
    .eq('to_number', phoneNumber)
    .gte('sent_at', `${today}T00:00:00`)
    .lt('sent_at', `${today}T23:59:59`)
  
  if (todayMessages && todayMessages.length >= SECURITY_CONFIG.MAX_MESSAGES_PER_DAY) {
    return {
      allowed: false,
      reason: `Limite diÃ¡Â¡rio atingido (${SECURITY_CONFIG.MAX_MESSAGES_PER_DAY} mensagens)`,
      nextAvailableAt: 'AmanhÃ¡Â£ 08:00'
    }
  }

  // ÂÂ±Ã¯Â¸Â VERIFICAR INTERVALO MÃ¡ÂNIMO
  const { data: lastMessage } = await supabase
    .from('whatsapp_messages')
    .select('sent_at')
    .eq('to_number', phoneNumber)
    .order('sent_at', { ascending: false })
    .limit(1)
    .single()

  if (lastMessage) {
    const lastSent = new Date(lastMessage.sent_at)
    const now = new Date()
    const diffSeconds = (now.getTime() - lastSent.getTime()) / 1000
    
    if (diffSeconds < SECURITY_CONFIG.MIN_INTERVAL_SECONDS) {
      const waitTime = SECURITY_CONFIG.MIN_INTERVAL_SECONDS - diffSeconds
      return {
        allowed: false,
        reason: `Aguarde ${Math.ceil(waitTime)}s antes da prÃ¡Â³xima mensagem`,
        nextAvailableAt: new Date(now.getTime() + waitTime * 1000).toLocaleTimeString()
      }
    }
  }

  return { allowed: true }
}

async function sendSecureNotification(data: NotificationRequest) {
  const { checklistId, responsavelNumero, titulo, prazo, tipo = 'novo' } = data
  
  // Ã°Å¸Å½Â¯ MENSAGEM PERSONALIZADA ANTI-SPAM
  const emojis = {
    novo: 'Ã°Å¸â€œâ€¹',
    lembrete: 'ÂÂ°', 
    urgente: 'Ã°Å¸Å¡Â¨'
  }
  
  const saudacoes = [
    'OlÃ¡Â¡!', 'Oi!', 'Bom dia!', 'Boa tarde!'
  ]
  
  const saudacao = saudacoes[Math.floor(Math.random() * saudacoes.length)]
  
  // Ã°Å¸â€ â€ CÃ¡â€œDIGO Ã¡Å¡NICO PARA IDENTIFICAÃ¡â€¡Ã¡Æ’O
  const codigoChecklist = checklistId.slice(-8).toUpperCase()
  
  const message = `${saudacao} ${emojis[tipo]}

Ã°Å¸â€œâ€¹ *${titulo}*
Ã°Å¸â€¢Â Prazo: ${new Date(prazo).toLocaleDateString('pt-BR', { 
  day: '2-digit', 
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
})}

Ã°Å¸â€ â€ CÃ¡Â³digo: *${codigoChecklist}*

Para marcar como concluÃ¡Â­do, responda com:
Å“â€¦ "*ok ${codigoChecklist}*" ou "*pronto ${codigoChecklist}*"

_Sistema SGB - Bar Management_`

  try {
    // Ã°Å¸â€œÂ¤ ENVIAR VIA EVOLUTION API
    const evolutionResponse = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY!
      },
      body: JSON.stringify({
        number: responsavelNumero,
        text: message
      })
    })

    const evolutionResult = await evolutionResponse.json()
    
    if (!evolutionResponse.ok) {
      throw new Error(`Evolution API error: ${evolutionResult.message}`)
    }

    // Ã°Å¸â€™Â¾ SALVAR NO BANCO
    await supabase
      .from('whatsapp_messages')
      .insert({
        to_number: responsavelNumero,
        message: message,
        type: 'template', 
        provider: 'evolution-api',
        status: 'sent',
        checklist_id: checklistId,
        provider_response: {
          evolution_response: evolutionResult,
          codigo_checklist: codigoChecklist,
          tipo_notificacao: tipo
        },
        sent_at: new Date().toISOString()
      })

    return {
      success: true,
      codigoChecklist,
      messageId: evolutionResult.key?.id,
      sentAt: new Date().toISOString()
    }

  } catch (error: unknown) {
    console.error('ÂÅ’ Erro ao enviar via Evolution:', error)
    
    // Ã°Å¸â€œÂ SALVAR FALHA NO BANCO
    await supabase
      .from('whatsapp_messages')
      .insert({
        to_number: responsavelNumero,
        message: message,
        type: 'template',
        provider: 'evolution-api', 
        status: 'failed',
        checklist_id: checklistId,
        provider_response: {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          codigo_checklist: codigoChecklist.slice(-8).toUpperCase()
        },
        sent_at: new Date().toISOString()
      })

    throw error
  }
}

interface WhatsAppMessageStatus {
  status: string;
  to_number: string;
}

// GET - Status do sistema de notificaÃ¡Â§Ã¡Âµes
export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  
  const { data: stats } = await supabase
    .from('whatsapp_messages')
    .select('status, to_number')
    .gte('sent_at', `${today}T00:00:00`)
    .lt('sent_at', `${today}T23:59:59`)

  const summary = {
    messagesShared: stats?.length || 0,
    successful: (stats as WhatsAppMessageStatus[] | undefined)?.filter((m: WhatsAppMessageStatus) => m.status === 'sent').length || 0,
    failed: (stats as WhatsAppMessageStatus[] | undefined)?.filter((m: WhatsAppMessageStatus) => m.status === 'failed').length || 0,
    uniqueNumbers: new Set((stats as WhatsAppMessageStatus[] | undefined)?.map((m: WhatsAppMessageStatus) => m.to_number)).size || 0,
    businessHours: SECURITY_CONFIG.BUSINESS_HOURS,
    limits: {
      maxPerDay: SECURITY_CONFIG.MAX_MESSAGES_PER_DAY,
      minInterval: SECURITY_CONFIG.MIN_INTERVAL_SECONDS
    }
  }

  return NextResponse.json(summary)
} 

