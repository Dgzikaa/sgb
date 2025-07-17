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
    
    console.log('Ã°Å¸â€œÂ¥ Webhook Evolution recebido:', {
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
        console.log(`Ã°Å¸â€œÂ Evento nÃ¡Â£o processado: ${body.event}`)
    }

    return NextResponse.json({ success: true })

  } catch (error: unknown) {
    console.error('ÂÅ’ Erro no webhook Evolution:', error)
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
    
    // Apenas processar mensagens recebidas (nÃ¡Â£o enviadas por nÃ¡Â³s)
    if (fromMe || !messageText) return

    const phoneNumber = remoteJid?.replace('@s.whatsapp.net', '')
    
    console.log('Ã°Å¸â€™Â¬ Nova mensagem recebida:', {
      from: phoneNumber,
      message: messageText,
      pushName: data.pushName
    })

    // Salvar mensagem no banco (usando tabela existente)
    // Para mensagens recebidas, to_number serÃ¡Â¡ o nÃ¡Âºmero da empresa (quem recebe)
    // e from_number seria quem enviou (mas usamos to_number por compatibilidade)
    const companyNumber = '+5561918444210' // NÃ¡Âºmero da empresa SGB
    
    await supabase
      .from('whatsapp_messages')
      .insert({
        to_number: companyNumber, // Quem recebeu (empresa)
        message: messageText,
        type: 'text', // Tipo de mensagem de texto
        provider: 'evolution-api',
        status: 'delivered', // Status: foi entregue para nÃ¡Â³s
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

    // Verificar se Ã¡Â© uma resposta a checklist
    if (phoneNumber && messageText) {
      await checkChecklistResponse(phoneNumber, messageText)
    }

  } catch (error: unknown) {
    console.error('ÂÅ’ Erro ao processar nova mensagem:', error)
  }
}

async function checkChecklistResponse(phoneNumber: string, message: string) {
  try {
    // Ã°Å¸â€ â€ VERIFICAR SE HÃ¡Â CÃ¡â€œDIGO ESPECÃ¡ÂFICO NA MENSAGEM
    const messageClean = message.toLowerCase().trim()
    const codigoMatch = messageClean.match(/(?:ok|pronto|feito|concluido|concluÃ¡Â­do|finalizado)\s+([a-f0-9]{8})/i)
    
    if (codigoMatch) {
      // Ã°Å¸Å½Â¯ CONCLUSÃ¡Æ’O COM CÃ¡â€œDIGO ESPECÃ¡ÂFICO
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

          console.log(`Å“â€¦ Checklist especÃ¡Â­fico concluÃ¡Â­do via cÃ¡Â³digo ${codigo}: ${agendamento.checklist_schedules?.titulo}`)
          
          // Enviar confirmaÃ¡Â§Ã¡Â£o
          await sendConfirmationMessage(phoneNumber, agendamento.checklist_schedules?.titulo || 'Checklist', codigo)
          return
        }
      }
      
      // CÃ¡Â³digo nÃ¡Â£o encontrado
      await sendErrorMessage(phoneNumber, codigo)
      return
    }

    // Ã°Å¸â€œâ€¹ VERIFICAR CONCLUSÃ¡Æ’O GERAL (SEM CÃ¡â€œDIGO) - APENAS 1 CHECKLIST PENDENTE
    const conclusionWords = ['concluÃ¡Â­do', 'concluido', 'feito', 'finalizado', 'pronto', 'ok', 'sim']
    const isCompletion = conclusionWords.some((word: string) => messageClean.includes(word))
    
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

      const meusAgendamentos = (agendamentos as AgendamentoChecklist[] | undefined)?.filter((ag: AgendamentoChecklist) => 
        ag.checklist_schedules?.responsaveis_whatsapp?.includes(phoneNumber)
      ) || [];

      if (meusAgendamentos.length === 1) {
        // Å“â€¦ APENAS 1 CHECKLIST - PODE CONCLUIR
        const agendamento = meusAgendamentos[0]
        await supabase
          .from('checklist_auto_executions')
          .update({ 
            status: 'concluido',
            notificacao_enviada: true 
          })
          .eq('id', agendamento.id)

        console.log(`Å“â€¦ Checklist Ã¡Âºnico concluÃ¡Â­do: ${agendamento.checklist_schedules?.titulo}`)
        await sendConfirmationMessage(phoneNumber, agendamento.checklist_schedules?.titulo || 'Checklist')
        
      } else if (meusAgendamentos.length > 1) {
        // Å¡Â Ã¯Â¸Â MÃ¡Å¡LTIPLOS CHECKLISTS - SOLICITAR CÃ¡â€œDIGO
        await sendMultipleChecklistsMessage(phoneNumber, meusAgendamentos)
      }
    }

  } catch (error: unknown) {
    console.error('ÂÅ’ Erro ao verificar resposta de checklist:', error)
  }
}

async function sendConfirmationMessage(phoneNumber: string, titulo: string, codigo?: string) {
  const message = `Å“â€¦ *Checklist ConcluÃ¡Â­do!*

Ã°Å¸â€œâ€¹ ${titulo}
${codigo ? `Ã°Å¸â€ â€ CÃ¡Â³digo: ${codigo}` : ''}
ÂÂ° ${new Date().toLocaleString('pt-BR')}

Obrigado! Ã°Å¸â€˜Â

_Sistema SGB_`

  await sendWhatsAppMessage(phoneNumber, message)
}

async function sendErrorMessage(phoneNumber: string, codigo: string) {
  const message = `ÂÅ’ *CÃ¡Â³digo nÃ¡Â£o encontrado*

Ã°Å¸â€ â€ CÃ¡Â³digo: ${codigo}

Verifique se:
â‚¬Â¢ O cÃ¡Â³digo estÃ¡Â¡ correto
â‚¬Â¢ O checklist ainda estÃ¡Â¡ pendente
â‚¬Â¢ VocÃ¡Âª Ã¡Â© o responsÃ¡Â¡vel

_Sistema SGB_`

  await sendWhatsAppMessage(phoneNumber, message)
}

async function sendMultipleChecklistsMessage(phoneNumber: string, agendamentos: AgendamentoChecklist[]) {
  const checklistsList = agendamentos.map((ag: AgendamentoChecklist) => {
    const codigo = ag.id.slice(-8).toUpperCase()
    const prazo = new Date(ag.data_limite).toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
    return `Ã°Å¸â€œâ€¹ ${ag.checklist_schedules?.titulo}\nÃ°Å¸â€ â€ CÃ¡Â³digo: *${codigo}*\nÃ°Å¸â€¢Â Prazo: ${prazo}`
  }).join('\n\n')

  const message = `Å¡Â Ã¯Â¸Â *VocÃ¡Âª tem ${agendamentos.length} checklists pendentes*

${checklistsList}

Para concluir um especÃ¡Â­fico, responda:
Å“â€¦ "*ok CÃ¡â€œDIGO*" ou "*pronto CÃ¡â€œDIGO*"

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
      console.error('ÂÅ’ Erro ao enviar mensagem WhatsApp:', await response.text())
    }

  } catch (error: unknown) {
    console.error('ÂÅ’ Erro ao enviar mensagem WhatsApp:', error)
  }
}

async function handleMessageUpdate(event: EvolutionWebhookEvent) {
  // Atualizar status de mensagem (lida, entregue, etc.)
  console.log('Ã°Å¸â€œÂ± Status de mensagem atualizado:', event.data)
}

async function handleConnectionUpdate(event: EvolutionWebhookEvent) {
  try {
    const status = event.data.status
    
    console.log(`Ã°Å¸â€â€ž Status de conexÃ¡Â£o: ${status}`)
    
    // Salvar status no banco
    await supabase
      .from('whatsapp_connection_status')
      .upsert({
        instance: event.instance,
        status: status,
        updated_at: new Date().toISOString()
      })

  } catch (error: unknown) {
    console.error('ÂÅ’ Erro ao atualizar status de conexÃ¡Â£o:', error)
  }
}

async function handleQRCodeUpdate(event: EvolutionWebhookEvent) {
  console.log('Ã°Å¸â€œÂ± QR Code atualizado para instÃ¡Â¢ncia:', event.instance)
  // Aqui vocÃ¡Âª pode notificar admins sobre novo QR Code disponÃ¡Â­vel
}

// GET - Endpoint para testar webhook
export async function GET() {
  return NextResponse.json({
    message: 'Webhook Evolution API estÃ¡Â¡ funcionando',
    timestamp: new Date().toISOString()
  })
} 

// Tipos auxiliares para agendamento
interface AgendamentoChecklist {
  id: string;
  data_limite: string;
  checklist_schedules?: {
    responsaveis_whatsapp?: string[];
    titulo?: string;
  };
} 

