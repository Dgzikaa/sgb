import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * UMBLER WEBHOOK - Recebe eventos do chatbot Umbler Talk
 * 
 * Eventos suportados:
 * - message.received: Mensagem recebida do cliente
 * - message.sent: Mensagem enviada (bot ou atendente)
 * - chat.started: Nova conversa iniciada
 * - chat.ended: Conversa encerrada
 * - chat.transferred: Conversa transferida para atendente
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-umbler-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Formato real da Umbler (letras maiúsculas)
interface UmblerWebhookPayload {
  Type?: string // "Message", "Chat", etc
  EventId?: string
  EventDate?: string
  Payload?: {
    Type?: string
    Content?: {
      Id?: string
      _t?: string
      Open?: boolean
      Waiting?: boolean
      Sector?: {
        Id?: string
        Name?: string
      }
      Channel?: {
        Id?: string
        Name?: string
        PhoneNumber?: string
        ChannelType?: string
      }
      Contact?: {
        Id?: string
        Name?: string
        PhoneNumber?: string
        Tags?: Array<{ Id: string; Name: string }>
        ProfilePictureUrl?: string
      }
      LastMessage?: {
        Id?: string
        Content?: string
        Source?: string // "Contact", "Bot", "Agent"
        MessageType?: string
        EventAtUTC?: string
        IsPrivate?: boolean
        BotInstance?: {
          Id?: string
          BotName?: string
        }
      }
      Organization?: {
        Id?: string
      }
      CreatedAtUTC?: string
      ClosedAtUTC?: string
      Bots?: Array<{
        BotId?: string
        Status?: string
        BotTitle?: string
      }>
      Tags?: Array<{ Id: string; Name: string }>
      OrganizationMember?: {
        Id?: string
        DisplayName?: string
      }
    }
  }
  // Formato alternativo (compatibilidade)
  _t?: string
  event?: string
  type?: string
  message?: {
    id: string
    type: string
    content?: string
    mediaUrl?: string
    timestamp?: string
    direction?: string
    from?: { id: string; name: string; phone: string }
    to?: { id: string; name: string; phone: string }
  }
  chat?: {
    id: string
    contactId: string
    contactName: string
    contactPhone: string
    channelId: string
    status: string
    sector?: string
    agent?: { id: string; name: string }
    tags?: string[]
    startedAt?: string
    endedAt?: string
  }
  channel?: {
    id: string
    name: string
    phone: string
  }
  organizationId?: string
  timestamp?: string
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const payload: UmblerWebhookPayload = await req.json()
    
    // Extrair dados do formato Umbler (maiúsculas)
    const content = payload.Payload?.Content
    const eventType = payload.Type || payload.event || payload.type || payload._t || 'unknown'
    
    // Log do webhook para debug
    const { error: logError } = await supabase
      .from('umbler_webhook_logs')
      .insert({
        event_type: eventType,
        payload: payload,
        processed: false
      })

    if (logError) {
      console.error('Erro ao salvar log:', logError)
    }

    // Buscar config do bar pelo channel_id (formato Umbler)
    const channelId = content?.Channel?.Id || payload.channel?.id || payload.chat?.channelId
    const organizationId = content?.Organization?.Id || payload.organizationId
    let barId: number | null = null

    if (channelId) {
      const { data: config } = await supabase
        .from('umbler_config')
        .select('bar_id')
        .eq('channel_id', channelId)
        .eq('ativo', true)
        .single()
      
      barId = config?.bar_id || null
    }

    // Se não encontrou por channel, tentar por organization
    if (!barId && organizationId) {
      const { data: config } = await supabase
        .from('umbler_config')
        .select('bar_id')
        .eq('organization_id', organizationId)
        .eq('ativo', true)
        .limit(1)
        .single()
      
      barId = config?.bar_id || null
    }

    console.log(`[UMBLER-WEBHOOK] Evento: ${eventType}, ChannelId: ${channelId}, BarId: ${barId}`)

    // ========================================
    // PROCESSAR FORMATO UMBLER (Message com Payload.Content)
    // ========================================
    if (eventType === 'Message' && content && barId) {
      const lastMsg = content.LastMessage
      const contact = content.Contact
      const chatId = content.Id
      
      if (lastMsg && !lastMsg.IsPrivate) {
        // Determinar direção e tipo de remetente
        const source = lastMsg.Source || ''
        const direcao = source === 'Contact' ? 'entrada' : 'saida'
        const tipoRemetente = source === 'Contact' ? 'cliente' : 
          (source === 'Bot' ? 'bot' : 'atendente')

        // Normalizar telefone
        const telefone = normalizePhone(contact?.PhoneNumber)

        // Primeiro, garantir que a conversa existe
        if (chatId) {
          const { error: chatUpsertError } = await supabase
            .from('umbler_conversas')
            .upsert({
              id: chatId,
              bar_id: barId,
              channel_id: channelId || '',
              contato_telefone: telefone || '',
              contato_nome: contact?.Name,
              contato_id: contact?.Id,
              status: content.Open ? (content.Waiting ? 'aberta' : 'em_atendimento') : 'finalizada',
              setor: content.Sector?.Name,
              tags: content.Tags?.map(t => t.Name) || contact?.Tags?.map(t => t.Name) || [],
              iniciada_em: content.CreatedAtUTC ? new Date(content.CreatedAtUTC).toISOString() : new Date().toISOString(),
              metadata: { contact_profile: contact?.ProfilePictureUrl, bots: content.Bots }
            }, { onConflict: 'id' })

          if (chatUpsertError) {
            console.error('Erro ao upsert conversa:', chatUpsertError)
          }
        }

        // Inserir mensagem
        const { error: msgError } = await supabase
          .from('umbler_mensagens')
          .upsert({
            id: lastMsg.Id,
            bar_id: barId,
            conversa_id: chatId,
            channel_id: channelId || '',
            direcao: direcao,
            tipo_remetente: tipoRemetente,
            contato_telefone: telefone || '',
            contato_nome: contact?.Name,
            tipo_mensagem: lastMsg.MessageType?.toLowerCase() || 'text',
            conteudo: lastMsg.Content,
            status: 'recebida',
            enviada_em: lastMsg.EventAtUTC ? new Date(lastMsg.EventAtUTC).toISOString() : new Date().toISOString(),
            metadata: { 
              bot: lastMsg.BotInstance?.BotName,
              source: source
            }
          }, { onConflict: 'id' })

        if (msgError) {
          console.error('Erro ao salvar mensagem:', msgError)
        } else {
          console.log(`[UMBLER-WEBHOOK] Mensagem salva: ${lastMsg.Id} de ${contact?.Name}`)
        }

        // Tentar correlacionar com cliente do ContaHub
        if (telefone) {
          await correlacionarCliente(supabase, telefone, barId)
        }
      }
    }

    // ========================================
    // MENSAGEM RECEBIDA (formato legado)
    // ========================================
    if ((eventType.includes('message') || payload.message) && !content) {
      const msg = payload.message
      if (msg && barId) {
        // Determinar direção
        const direcao = msg.direction === 'inbound' ? 'entrada' : 'saida'
        const tipoRemetente = direcao === 'entrada' ? 'cliente' : 
          (eventType.includes('bot') ? 'bot' : 'atendente')

        // Normalizar telefone
        const telefone = normalizePhone(
          direcao === 'entrada' ? msg.from?.phone : msg.to?.phone
        )

        // Buscar ou criar conversa
        let conversaId = payload.chat?.id
        if (!conversaId && telefone) {
          // Buscar conversa aberta para este telefone
          const { data: conversaExistente } = await supabase
            .from('umbler_conversas')
            .select('id')
            .eq('contato_telefone', telefone)
            .eq('bar_id', barId)
            .eq('status', 'aberta')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
          
          conversaId = conversaExistente?.id
        }

        // Inserir mensagem
        const { error: msgError } = await supabase
          .from('umbler_mensagens')
          .upsert({
            id: msg.id,
            bar_id: barId,
            conversa_id: conversaId,
            channel_id: channelId || '',
            direcao: direcao,
            tipo_remetente: tipoRemetente,
            contato_telefone: telefone || '',
            contato_nome: direcao === 'entrada' ? msg.from?.name : msg.to?.name,
            tipo_mensagem: msg.type || 'text',
            conteudo: msg.content,
            media_url: msg.mediaUrl,
            status: 'recebida',
            enviada_em: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString(),
            metadata: { raw: payload }
          }, { onConflict: 'id' })

        if (msgError) {
          console.error('Erro ao salvar mensagem:', msgError)
        }

        // Tentar correlacionar com cliente do ContaHub
        if (telefone) {
          await correlacionarCliente(supabase, telefone, barId)
        }
      }
    }

    // ========================================
    // CONVERSA INICIADA
    // ========================================
    if (eventType.includes('chat.started') || eventType.includes('ChatStarted') || 
        (payload.chat && !eventType.includes('ended'))) {
      const chat = payload.chat
      if (chat && barId) {
        const telefone = normalizePhone(chat.contactPhone)
        
        // Tentar encontrar cliente do ContaHub
        let clienteContahubId: number | null = null
        if (telefone) {
          const { data: cliente } = await supabase
            .from('contahub_periodo')
            .select('id')
            .eq('cliente_telefone_normalizado', telefone)
            .eq('bar_id', barId)
            .order('data_atendimento', { ascending: false })
            .limit(1)
            .single()
          
          clienteContahubId = cliente?.id || null
        }

        const { error: chatError } = await supabase
          .from('umbler_conversas')
          .upsert({
            id: chat.id,
            bar_id: barId,
            channel_id: chat.channelId || channelId || '',
            contato_telefone: telefone || '',
            contato_nome: chat.contactName,
            contato_id: chat.contactId,
            status: mapStatus(chat.status),
            setor: chat.sector,
            atendente_nome: chat.agent?.name,
            atendente_id: chat.agent?.id,
            tags: chat.tags || [],
            cliente_contahub_id: clienteContahubId,
            iniciada_em: chat.startedAt ? new Date(chat.startedAt).toISOString() : new Date().toISOString(),
            metadata: { raw: payload }
          }, { onConflict: 'id' })

        if (chatError) {
          console.error('Erro ao salvar conversa:', chatError)
        }
      }
    }

    // ========================================
    // CONVERSA ENCERRADA
    // ========================================
    if (eventType.includes('chat.ended') || eventType.includes('ChatEnded')) {
      const chat = payload.chat
      if (chat) {
        const finalizadaEm = chat.endedAt ? new Date(chat.endedAt) : new Date()
        
        // Calcular tempo total
        let tempoTotal: number | null = null
        if (chat.startedAt) {
          const iniciada = new Date(chat.startedAt)
          tempoTotal = Math.floor((finalizadaEm.getTime() - iniciada.getTime()) / 1000)
        }

        const { error: updateError } = await supabase
          .from('umbler_conversas')
          .update({
            status: 'finalizada',
            finalizada_em: finalizadaEm.toISOString(),
            tempo_total_segundos: tempoTotal,
            atendente_nome: chat.agent?.name,
            atendente_id: chat.agent?.id
          })
          .eq('id', chat.id)

        if (updateError) {
          console.error('Erro ao finalizar conversa:', updateError)
        }
      }
    }

    // ========================================
    // CONVERSA TRANSFERIDA
    // ========================================
    if (eventType.includes('transferred') || eventType.includes('Transferred')) {
      const chat = payload.chat
      if (chat) {
        await supabase
          .from('umbler_conversas')
          .update({
            status: 'em_atendimento',
            atendente_nome: chat.agent?.name,
            atendente_id: chat.agent?.id,
            setor: chat.sector
          })
          .eq('id', chat.id)
      }
    }

    // Marcar log como processado
    await supabase
      .from('umbler_webhook_logs')
      .update({ processed: true })
      .eq('payload->message->id', payload.message?.id || '')
      .or(`payload->chat->id.eq.${payload.chat?.id || ''}`)

    return new Response(
      JSON.stringify({ success: true, event: eventType }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Erro no webhook Umbler:', error)
    
    // Salvar erro no log
    await supabase
      .from('umbler_webhook_logs')
      .insert({
        event_type: 'error',
        payload: { error: String(error), raw: await req.text().catch(() => 'unable to read body') },
        processed: false,
        error_message: String(error)
      }).catch(() => {})

    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function normalizePhone(phone: string | undefined): string {
  if (!phone) return ''
  // Remove tudo que não é número
  let normalized = phone.replace(/\D/g, '')
  // Garante que começa com 55 (Brasil)
  if (normalized.length === 11) {
    normalized = '55' + normalized
  } else if (normalized.length === 10) {
    normalized = '55' + normalized
  }
  return normalized
}

function mapStatus(status: string | undefined): string {
  if (!status) return 'aberta'
  const statusMap: Record<string, string> = {
    'open': 'aberta',
    'pending': 'aberta',
    'in_progress': 'em_atendimento',
    'waiting': 'em_atendimento',
    'closed': 'finalizada',
    'ended': 'finalizada',
    'resolved': 'finalizada'
  }
  return statusMap[status.toLowerCase()] || 'aberta'
}

async function correlacionarCliente(
  supabase: ReturnType<typeof createClient>,
  telefone: string,
  barId: number
): Promise<void> {
  try {
    // Buscar cliente no ContaHub pelo telefone
    const { data: cliente } = await supabase
      .from('contahub_periodo')
      .select('id, cliente_nome')
      .eq('cliente_telefone_normalizado', telefone)
      .eq('bar_id', barId)
      .order('data_atendimento', { ascending: false })
      .limit(1)
      .single()

    if (cliente) {
      // Atualizar conversas abertas deste telefone com o ID do cliente
      await supabase
        .from('umbler_conversas')
        .update({ cliente_contahub_id: cliente.id })
        .eq('contato_telefone', telefone)
        .eq('bar_id', barId)
        .is('cliente_contahub_id', null)
    }
  } catch {
    // Ignorar erros de correlação
  }
}
