import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface EvolutionWebhookEvent {
  event: string
  instance: string
  data: {
    key?: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    message?: {
      conversation?: string
      extendedTextMessage?: {
        text: string
      }
    }
    messageTimestamp?: number
    pushName?: string
    status?: string
    participant?: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: EvolutionWebhookEvent = await req.json()
    
    console.log('📥 Webhook Evolution recebido:', {
      event: body.event,
      instance: body.instance,
      timestamp: new Date().toISOString()
    })

    // Processar diferentes tipos de eventos
    switch (body.event) {
      case 'messages.upsert':
        await handleNewMessage(body)
        break
        
      case 'messages.update':
        await handleMessageUpdate(body)
        break
        
      case 'connection.update':
        await handleConnectionUpdate(body)
        break
        
      case 'qrcode.updated':
        await handleQRCodeUpdate(body)
        break
        
      default:
        console.log(`📝 Evento não processado: ${body.event}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('❌ Erro no webhook Evolution:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function handleNewMessage(event: EvolutionWebhookEvent) {
  try {
    const { data } = event
    const remoteJid = data.key?.remoteJid
    const fromMe = data.key?.fromMe
    const messageText = data.message?.conversation || data.message?.extendedTextMessage?.text
    
    // Apenas processar mensagens recebidas (não enviadas por nós)
    if (fromMe || !messageText) return

    const phoneNumber = remoteJid?.replace('@s.whatsapp.net', '')
    
    console.log('💬 Nova mensagem recebida:', {
      from: phoneNumber,
      message: messageText,
      pushName: data.pushName
    })

    // Salvar mensagem no banco (usando tabela existente)
    // Para mensagens recebidas, to_number será o número da empresa (quem recebe)
    // e from_number seria quem enviou (mas usamos to_number por compatibilidade)
    const compNumber = '+5561918444210' // Número da empresa SGB
    
    await supabase
      .from('whatsapp_messages')
      .insert({
        to_number: compNumber, // Quem recebeu (empresa)
        message: messageText,
        type: 'text', // Tipo de mensagem de texto
        provider: 'evolution-api',
        status: 'delivered', // Status: foi entregue para nós
        provider_response: {
          sender_name: data.pushName || 'Desconhecido',
          sender_number: phoneNumber || 'Desconhecido',
          message_id: data.key?.id || '',
          instance: event.instance,
          timestamp: data.messageTimestamp,
          direction: 'received' // Indica que foi recebida
        },
        sent_at: new Date((data.messageTimestamp || 0) * 1000).toISOString()
      })

    // Verificar se é uma resposta a checklist
    if (phoneNumber && messageText) {
      await checkChecklistResponse(phoneNumber, messageText)
    }

  } catch (error) {
    console.error('❌ Erro ao processar nova mensagem:', error)
  }
}

async function checkChecklistResponse(phoneNumber: string, message: string) {
  try {
    // 🆔 VERIFICAR SE HÁ CÓDIGO ESPECÍFICO NA MENSAGEM
    const messageClean = message.toLowerCase().trim()
    const codigoMatch = messageClean.match(/(?:ok|pronto|feito|concluido|concluído|finalizado)\s+([a-f0-9]{8})/i)
    
    if (codigoMatch) {
      // 🎯 CONCLUSÃO COM CÓDIGO ESPECÍFICO
      const codigo = codigoMatch[1].toUpperCase()
      
      const { data: agendamentos } = await supabase
        .from('checklist_auto_executions')
        .select(`
          *,
          checklist_schedules (
            responsaveis_whatsapp,
            titulo
          )
        `)
        .eq('status', 'pendente')
        .ilike('id', `%${codigo}`)

      for (const agendamento of agendamentos || []) {
        const responsaveis = agendamento.checklist_schedules?.responsaveis_whatsapp || []
        const isResponsavel = responsaveis.includes(phoneNumber)

        if (isResponsavel) {
          await supabase
            .from('checklist_auto_executions')
            .update({ 
              status: 'concluido',
              notificacao_enviada: true 
            })
            .eq('id', agendamento.id)

          console.log(`✅ Checklist específico concluído via código ${codigo}: ${agendamento.checklist_schedules?.titulo}`)
          
          // Enviar confirmação
          await sendConfirmationMessage(phoneNumber, agendamento.checklist_schedules?.titulo || 'Checklist', codigo)
          return
        }
      }
      
      // Código não encontrado
      await sendErrorMessage(phoneNumber, codigo)
      return
    }

    // 📋 VERIFICAR CONCLUSÃO GERAL (SEM CÓDIGO) - APENAS 1 CHECKLIST PENDENTE
    const conclusionWords = ['concluído', 'concluido', 'feito', 'finalizado', 'pronto', 'ok', 'sim']
    const isCompletion = conclusionWords.some(word => messageClean.includes(word))
    
    if (isCompletion) {
      const { data: agendamentos } = await supabase
        .from('checklist_auto_executions')
        .select(`
          *,
          checklist_schedules (
            responsaveis_whatsapp,
            titulo
          )
        `)
        .eq('status', 'pendente')
        .gte('data_limite', new Date().toISOString())

      const meusAgendamentos = agendamentos?.filter(ag => 
        ag.checklist_schedules?.responsaveis_whatsapp?.includes(phoneNumber)
      ) || []

      if (meusAgendamentos.length === 1) {
        // ✅ APENAS 1 CHECKLIST - PODE CONCLUIR
        const agendamento = meusAgendamentos[0]
        await supabase
          .from('checklist_auto_executions')
          .update({ 
            status: 'concluido',
            notificacao_enviada: true 
          })
          .eq('id', agendamento.id)

        console.log(`✅ Checklist único concluído: ${agendamento.checklist_schedules?.titulo}`)
        await sendConfirmationMessage(phoneNumber, agendamento.checklist_schedules?.titulo || 'Checklist')
        
      } else if (meusAgendamentos.length > 1) {
        // ⚠️ MÚLTIPLOS CHECKLISTS - SOLICITAR CÓDIGO
        await sendMultipleChecklistsMessage(phoneNumber, meusAgendamentos)
      }
    }

  } catch (error) {
    console.error('❌ Erro ao verificar resposta de checklist:', error)
  }
}

async function sendConfirmationMessage(phoneNumber: string, titulo: string, codigo?: string) {
  const message = `✅ *Checklist Concluído!*

📋 ${titulo}
${codigo ? `🆔 Código: ${codigo}` : ''}
⏰ ${new Date().toLocaleString('pt-BR')}

Obrigado! 👍

_Sistema SGB_`

  await sendWhatsAppMessage(phoneNumber, message)
}

async function sendErrorMessage(phoneNumber: string, codigo: string) {
  const message = `❌ *Código não encontrado*

🆔 Código: ${codigo}

Verifique se:
• O código está correto
• O checklist ainda está pendente
• Você é o responsável

_Sistema SGB_`

  await sendWhatsAppMessage(phoneNumber, message)
}

async function sendMultipleChecklistsMessage(phoneNumber: string, agendamentos: unknown[]) {
  const checklistsList = agendamentos.map(ag => {
    const codigo = ag.id.slice(-8).toUpperCase()
    const prazo = new Date(ag.data_limite).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    return `📋 ${ag.checklist_schedules?.titulo}\n🆔 Código: *${codigo}*\n🕐 Prazo: ${prazo}`
  }).join('\n\n')

  const message = `⚠️ *Você tem ${agendamentos.length} checklists pendentes*

${checklistsList}

Para concluir um específico, responda:
✅ "*ok CÓDIGO*" ou "*pronto CÓDIGO*"

Exemplo: "*ok A1B2C3D4*"

_Sistema SGB_`

  await sendWhatsAppMessage(phoneNumber, message)
}

async function sendWhatsAppMessage(phoneNumber: string, text: string) {
  try {
    const response = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${process.env.EVOLUTION_INSTANCE_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.EVOLUTION_API_KEY!
      },
      body: JSON.stringify({
        number: phoneNumber,
        text: text
      })
    })

    if (!response.ok) {
      console.error('❌ Erro ao enviar mensagem WhatsApp:', await response.text())
    }

  } catch (error) {
    console.error('❌ Erro ao enviar mensagem WhatsApp:', error)
  }
}

async function handleMessageUpdate(event: EvolutionWebhookEvent) {
  // Atualizar status de mensagem (lida, entregue, etc.)
  console.log('📱 Status de mensagem atualizado:', event.data)
}

async function handleConnectionUpdate(event: EvolutionWebhookEvent) {
  try {
    const status = event.data.status
    
    console.log(`🔄 Status de conexão: ${status}`)
    
    // Salvar status no banco
    await supabase
      .from('whatsapp_connection_status')
      .upsert({
        instance: event.instance,
        status: status,
        updated_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('❌ Erro ao atualizar status de conexão:', error)
  }
}

async function handleQRCodeUpdate(event: EvolutionWebhookEvent) {
  console.log('📱 QR Code atualizado para instância:', event.instance)
  // Aqui você pode notificar admins sobre novo QR Code disponível
}

// GET - Endpoint para testar webhook
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Evolution API está funcionando',
    timestamp: new Date().toISOString()
  })
} 
