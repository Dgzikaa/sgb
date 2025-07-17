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
        console.log(`ðŸ“ Evento nÃ£o processado: ${body.event}`)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('âŒ Erro no webhook Evolution:', error)
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
    
    // Apenas processar mensagens recebidas (nÃ£o enviadas por nÃ³s)
    if (fromMe || !messageText) return

    const phoneNumber = remoteJid?.replace('@s.whatsapp.net', '')
    
    console.log('ðŸ’¬ Nova mensagem recebida:', {
      from: phoneNumber,
      message: messageText,
      pushName: data.pushName
    })

    // Salvar mensagem no banco (usando tabela existente)
    // Para mensagens recebidas, to_number serÃ¡ o nÃºmero da empresa (quem recebe)
    // e from_number seria quem enviou (mas usamos to_number por compatibilidade)
    const companyNumber = '+5561918444210' // NÃºmero da empresa SGB
    
    await supabase
      .from('whatsapp_messages')
      .insert({
        to_number: companyNumber, // Quem recebeu (empresa)
        message: messageText,
        type: 'text', // Tipo de mensagem de texto
        provider: 'evolution-api',
        status: 'delivered', // Status: foi entregue para nÃ³s
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

    // Verificar se Ã© uma resposta a checklist
    if (phoneNumber && messageText) {
      await checkChecklistResponse(phoneNumber, messageText)
    }

  } catch (error) {
    console.error('âŒ Erro ao processar nova mensagem:', error)
  }
}

async function checkChecklistResponse(phoneNumber: string, message: string) {
  try {
    // ðŸ†” VERIFICAR SE HÃ CÃ“DIGO ESPECÃFICO NA MENSAGEM
    const messageClean = message.toLowerCase().trim()
    const codigoMatch = messageClean.match(/(?:ok|pronto|feito|concluido|concluÃ­do|finalizado)\s+([a-f0-9]{8})/i)
    
    if (codigoMatch) {
      // ðŸŽ¯ CONCLUSÃƒO COM CÃ“DIGO ESPECÃFICO
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

          console.log(`âœ… Checklist especÃ­fico concluÃ­do via cÃ³digo ${codigo}: ${agendamento.checklist_schedules?.titulo}`)
          
          // Enviar confirmaÃ§Ã£o
          await sendConfirmationMessage(phoneNumber, agendamento.checklist_schedules?.titulo || 'Checklist', codigo)
          return
        }
      }
      
      // CÃ³digo nÃ£o encontrado
      await sendErrorMessage(phoneNumber, codigo)
      return
    }

    // ðŸ“‹ VERIFICAR CONCLUSÃƒO GERAL (SEM CÃ“DIGO) - APENAS 1 CHECKLIST PENDENTE
    const conclusionWords = ['concluÃ­do', 'concluido', 'feito', 'finalizado', 'pronto', 'ok', 'sim']
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
        // âœ… APENAS 1 CHECKLIST - PODE CONCLUIR
        const agendamento = meusAgendamentos[0]
        await supabase
          .from('checklist_auto_executions')
          .update({ 
            status: 'concluido',
            notificacao_enviada: true 
          })
          .eq('id', agendamento.id)

        console.log(`âœ… Checklist Ãºnico concluÃ­do: ${agendamento.checklist_schedules?.titulo}`)
        await sendConfirmationMessage(phoneNumber, agendamento.checklist_schedules?.titulo || 'Checklist')
        
      } else if (meusAgendamentos.length > 1) {
        // âš ï¸ MÃšLTIPLOS CHECKLISTS - SOLICITAR CÃ“DIGO
        await sendMultipleChecklistsMessage(phoneNumber, meusAgendamentos)
      }
    }

  } catch (error) {
    console.error('âŒ Erro ao verificar resposta de checklist:', error)
  }
}

async function sendConfirmationMessage(phoneNumber: string, titulo: string, codigo?: string) {
  const message = `âœ… *Checklist ConcluÃ­do!*

ðŸ“‹ ${titulo}
${codigo ? `ðŸ†” CÃ³digo: ${codigo}` : ''}
â° ${new Date().toLocaleString('pt-BR')}

Obrigado! ðŸ‘

_Sistema SGB_`

  await sendWhatsAppMessage(phoneNumber, message)
}

async function sendErrorMessage(phoneNumber: string, codigo: string) {
  const message = `âŒ *CÃ³digo nÃ£o encontrado*

ðŸ†” CÃ³digo: ${codigo}

Verifique se:
â€¢ O cÃ³digo estÃ¡ correto
â€¢ O checklist ainda estÃ¡ pendente
â€¢ VocÃª Ã© o responsÃ¡vel

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
    return `ðŸ“‹ ${ag.checklist_schedules?.titulo}\nðŸ†” CÃ³digo: *${codigo}*\nðŸ• Prazo: ${prazo}`
  }).join('\n\n')

  const message = `âš ï¸ *VocÃª tem ${agendamentos.length} checklists pendentes*

${checklistsList}

Para concluir um especÃ­fico, responda:
âœ… "*ok CÃ“DIGO*" ou "*pronto CÃ“DIGO*"

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
      console.error('âŒ Erro ao enviar mensagem WhatsApp:', await response.text())
    }

  } catch (error) {
    console.error('âŒ Erro ao enviar mensagem WhatsApp:', error)
  }
}

async function handleMessageUpdate(event: EvolutionWebhookEvent) {
  // Atualizar status de mensagem (lida, entregue, etc.)
  console.log('ðŸ“± Status de mensagem atualizado:', event.data)
}

async function handleConnectionUpdate(event: EvolutionWebhookEvent) {
  try {
    const status = event.data.status
    
    console.log(`ðŸ”„ Status de conexÃ£o: ${status}`)
    
    // Salvar status no banco
    await supabase
      .from('whatsapp_connection_status')
      .upsert({
        instance: event.instance,
        status: status,
        updated_at: new Date().toISOString()
      })

  } catch (error) {
    console.error('âŒ Erro ao atualizar status de conexÃ£o:', error)
  }
}

async function handleQRCodeUpdate(event: EvolutionWebhookEvent) {
  console.log('ðŸ“± QR Code atualizado para instÃ¢ncia:', event.instance)
  // Aqui vocÃª pode notificar admins sobre novo QR Code disponÃ­vel
}

// GET - Endpoint para testar webhook
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Evolution API estÃ¡ funcionando',
    timestamp: new Date().toISOString()
  })
} 
