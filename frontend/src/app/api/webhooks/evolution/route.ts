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
    
    console.log('ðŸ“¥ Webhook Evolution recebido:', {
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
        console.log(`ðŸ“ Evento ná£o processado: ${body.event}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Œ Erro no webhook Evolution:', error)
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
    
    // Apenas processar mensagens recebidas (ná£o enviadas por ná³s)
    if (fromMe || !messageText) return

    const phoneNumber = remoteJid?.replace('@s.whatsapp.net', '')
    
    console.log('ðŸ’¬ Nova mensagem recebida:', {
      from: phoneNumber,
      message: messageText,
      pushName: data.pushName
    })

    // Salvar mensagem no banco (usando tabela existente)
    // Para mensagens recebidas, to_number será¡ o náºmero da empresa (quem recebe)
    // e from_number seria quem enviou (mas usamos to_number por compatibilidade)
    const companyNumber = '+5561918444210' // Náºmero da empresa SGB
    
    await supabase
      .from('whatsapp_messages')
      .insert({
        to_number: companyNumber, // Quem recebeu (empresa)
        message: messageText,
        type: 'text', // Tipo de mensagem de texto
        provider: 'evolution-api',
        status: 'delivered', // Status: foi entregue para ná³s
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

    // Verificar se á© uma resposta a checklist
    if (phoneNumber && messageText) {
      await checkChecklistResponse(phoneNumber, messageText)
    }

  } catch (error) {
    console.error('Œ Erro ao processar nova mensagem:', error)
  }
}

async function checkChecklistResponse(phoneNumber: string, message: string) {
  try {
    // ðŸ†” VERIFICAR SE Há Cá“DIGO ESPECáFICO NA MENSAGEM
    const messageClean = message.toLowerCase().trim()
    const codigoMatch = messageClean.match(/(?:ok|pronto|feito|concluido|concluá­do|finalizado)\s+([a-f0-9]{8})/i)
    
    if (codigoMatch) {
      // ðŸŽ¯ CONCLUSáƒO COM Cá“DIGO ESPECáFICO
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

          console.log(`œ… Checklist especá­fico concluá­do via cá³digo ${codigo}: ${agendamento.checklist_schedules?.titulo}`)
          
          // Enviar confirmaá§á£o
          await sendConfirmationMessage(phoneNumber, agendamento.checklist_schedules?.titulo || 'Checklist', codigo)
          return
        }
      }
      
      // Cá³digo ná£o encontrado
      await sendErrorMessage(phoneNumber, codigo)
      return
    }

    // ðŸ“‹ VERIFICAR CONCLUSáƒO GERAL (SEM Cá“DIGO) - APENAS 1 CHECKLIST PENDENTE
    const conclusionWords = ['concluá­do', 'concluido', 'feito', 'finalizado', 'pronto', 'ok', 'sim']
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

      const meusAgendamentos = agendamentos?.filter((ag: any) => 
        ag.checklist_schedules?.responsaveis_whatsapp?.includes(phoneNumber)
      ) || []

      if (meusAgendamentos.length === 1) {
        // œ… APENAS 1 CHECKLIST - PODE CONCLUIR
        const agendamento = meusAgendamentos[0]
        await supabase
          .from('checklist_auto_executions')
          .update({ 
            status: 'concluido',
            notificacao_enviada: true 
          })
          .eq('id', agendamento.id)

        console.log(`œ… Checklist áºnico concluá­do: ${agendamento.checklist_schedules?.titulo}`)
        await sendConfirmationMessage(phoneNumber, agendamento.checklist_schedules?.titulo || 'Checklist')
        
      } else if (meusAgendamentos.length > 1) {
        // š ï¸ MášLTIPLOS CHECKLISTS - SOLICITAR Cá“DIGO
        await sendMultipleChecklistsMessage(phoneNumber, meusAgendamentos)
      }
    }

  } catch (error) {
    console.error('Œ Erro ao verificar resposta de checklist:', error)
  }
}

async function sendConfirmationMessage(phoneNumber: string, titulo: string, codigo?: string) {
  const message = `œ… *Checklist Concluá­do!*

ðŸ“‹ ${titulo}
${codigo ? `ðŸ†” Cá³digo: ${codigo}` : ''}
° ${new Date().toLocaleString('pt-BR')}

Obrigado! ðŸ‘

_Sistema SGB_`

  await sendWhatsAppMessage(phoneNumber, message)
}

async function sendErrorMessage(phoneNumber: string, codigo: string) {
  const message = `Œ *Cá³digo ná£o encontrado*

ðŸ†” Cá³digo: ${codigo}

Verifique se:
€¢ O cá³digo está¡ correto
€¢ O checklist ainda está¡ pendente
€¢ Vocáª á© o responsá¡vel

_Sistema SGB_`

  await sendWhatsAppMessage(phoneNumber, message)
}

async function sendMultipleChecklistsMessage(phoneNumber: string, agendamentos: any[]) {
  const checklistsList = agendamentos.map((ag: any) => {
    const codigo = ag.id.slice(-8).toUpperCase()
    const prazo = new Date(ag.data_limite).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    return `ðŸ“‹ ${ag.checklist_schedules?.titulo}\nðŸ†” Cá³digo: *${codigo}*\nðŸ• Prazo: ${prazo}`
  }).join('\n\n')

  const message = `š ï¸ *Vocáª tem ${agendamentos.length} checklists pendentes*

${checklistsList}

Para concluir um especá­fico, responda:
œ… "*ok Cá“DIGO*" ou "*pronto Cá“DIGO*"

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
      console.error('Œ Erro ao enviar mensagem WhatsApp:', await response.text())
    }

  } catch (error) {
    console.error('Œ Erro ao enviar mensagem WhatsApp:', error)
  }
}

async function handleMessageUpdate(event: EvolutionWebhookEvent) {
  // Atualizar status de mensagem (lida, entregue, etc.)
  console.log('ðŸ“± Status de mensagem atualizado:', event.data)
}

async function handleConnectionUpdate(event: EvolutionWebhookEvent) {
  try {
    const status = event.data.status
    
    console.log(`ðŸ”„ Status de conexá£o: ${status}`)
    
    // Salvar status no banco
    await supabase
      .from('whatsapp_connection_status')
      .upsert({
        instance: event.instance,
        status: status,
        updated_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('Œ Erro ao atualizar status de conexá£o:', error)
  }
}

async function handleQRCodeUpdate(event: EvolutionWebhookEvent) {
  console.log('ðŸ“± QR Code atualizado para instá¢ncia:', event.instance)
  // Aqui vocáª pode notificar admins sobre novo QR Code disponá­vel
}

// GET - Endpoint para testar webhook
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Evolution API está¡ funcionando',
    timestamp: new Date().toISOString()
  })
} 
