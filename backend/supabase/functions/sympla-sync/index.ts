import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.log("🚀 Sympla Sync Automático - Edge Function");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SymplaEvent {
  id: number;
  name: string;
  detail: string;
  private_event: number;
  published: number;
  cancelled: number;
  date_start: string;
  date_end: string;
  url: string;
  image: string;
}

interface SymplaEventResponse {
  data: SymplaEvent[];
  pagination: {
    has_next: boolean;
    has_prev: boolean;
    quantity: number;
    offset: number;
    page: number;
    page_size: number;
    total_page: number;
  };
  sort: {
    field_sort: string;
    sort: string;
  };
}

interface SymplaParticipant {
  id: string;
  order_id: string;
  first_name: string;
  last_name: string;
  email: string;
  ticket_number: string;
  ticket_num_qr_code: string;
  ticket_type_name: string;
  pdv_user: string;
  checkin: {
    check_in: boolean;
    check_in_date: string | null;
  };
  custom_form: any[];
  ticket_sale_price: number;
  exempt_fee: boolean;
}

interface SymplaParticipantsResponse {
  data: SymplaParticipant[];
  pagination: {
    has_next: boolean;
    has_prev: boolean;
    quantity: number;
    offset: number;
    page: number;
    page_size: number;
    total_page: number;
  };
  sort: {
    field_sort: string;
    sort: string;
  };
}

interface RequestBody {
  bar_id?: number;
  event_id?: number;
  token_sympla?: string;
  automated?: boolean; // Flag para execução via cron
}

// Função para enviar notificação Discord
async function sendDiscordNotification(webhookUrl: string, title: string, description: string, color: number = 3447003, fields: any[] = []) {
  try {
    const embed = {
      title,
      description,
      color,
      fields,
      timestamp: new Date().toISOString(),
      footer: {
        text: 'SGB Sympla Sync'
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ embeds: [embed] }),
    });

    if (!response.ok) {
      console.error('❌ Erro ao enviar Discord webhook:', await response.text());
    } else {
      console.log('✅ Discord notification enviada com sucesso');
    }
  } catch (error) {
    console.error('❌ Erro no Discord webhook:', error);
  }
}

// Função para buscar bar ativo automaticamente
async function getActiveBar(supabase: any): Promise<{ id: number; nome: string } | null> {
  try {
    const { data: bars, error } = await supabase
      .from('bars')
      .select('id, nome')
      .eq('ativo', true)
      .single();

    if (error) {
      console.error('❌ Erro ao buscar bar ativo:', error);
      return null;
    }

    return bars;
  } catch (error) {
    console.error('❌ Erro na consulta do bar ativo:', error);
    return null;
  }
}

// Função para buscar credenciais do Sympla
async function getSymplaCredentials(supabase: any, barId: number): Promise<string | null> {
  try {
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('token')
      .eq('sistema', 'sympla')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .single();

    if (error || !credentials) {
      console.error('❌ Credenciais Sympla não encontradas:', error);
      return null;
    }

    return credentials.token;
  } catch (error) {
    console.error('❌ Erro ao buscar credenciais Sympla:', error);
    return null;
  }
}

// Função para buscar TODOS os eventos do Sympla (incluindo históricos de 2025)
async function fetchSymplaEvents(token: string): Promise<SymplaEvent[]> {
  const events: SymplaEvent[] = [];
  let page = 1;
  let hasNext = true;

  console.log('🎪 Buscando TODOS os eventos de 2025 (incluindo finalizados/históricos)...');

  while (hasNext) {
    try {
      // Buscar todos os eventos, não filtrar por status
      const response = await fetch(`https://api.sympla.com.br/public/v1.5.1/events?page=${page}`, {
        headers: {
          's_token': token,
          'Content-Type': 'application/json',
          'User-Agent': 'SGB-Sync/1.0'
        }
      });

      if (!response.ok) {
        console.error(`❌ Erro na API Sympla eventos (página ${page}):`, response.status);
        break;
      }

      const data = await response.json();
      if (data.data && data.data.length > 0) {
        // Filtrar eventos de 2025 (incluindo todos os status)
        const eventos2025 = data.data.filter(event => {
          const year = new Date(event.start_date || event.date_start).getFullYear();
          return year === 2025;
        });
        
        events.push(...eventos2025);
        console.log(`✅ Página ${page}: ${data.data.length} eventos total, ${eventos2025.length} de 2025 (Total 2025: ${events.length})`);
        
        // API Sympla retorna 100 por página, se menor que 100, é a última página
        if (data.data.length < 100) {
          hasNext = false;
        } else {
          page++;
        }
      } else {
        hasNext = false;
      }

      if (page > 50) { // Limite de segurança
        console.log('⚠️ Limite de 50 páginas atingido para eventos');
        break;
      }

    } catch (error) {
      console.error(`❌ Erro ao buscar eventos Sympla página ${page}:`, error);
      break;
    }
  }

  return events;
}

// Função para buscar participantes de um evento
async function fetchEventParticipants(token: string, eventId: number): Promise<SymplaParticipant[]> {
  const participants: SymplaParticipant[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    try {
      const response = await fetch(`https://api.sympla.com.br/public/v1.5.1/events/${eventId}/participants?page=${page}`, {
        headers: {
          's_token': token,
          'Content-Type': 'application/json',
          'User-Agent': 'SGB-Sync/1.0'
        }
      });

      if (!response.ok) {
        console.log(`⚠️ Erro na API Sympla participantes evento ${eventId} (página ${page}):`, response.status);
        break;
      }

      const data = await response.json();
      console.log(`📊 Evento ${eventId} - Página ${page} - Response:`, {
        hasData: !!data.data,
        dataLength: data.data?.length || 0,
        pagination: data.pagination || 'N/A'
      });
      
      if (data.data && data.data.length > 0) {
        participants.push(...data.data);
        console.log(`✅ Evento ${eventId} - Página ${page}: ${data.data.length} participantes (Total: ${participants.length})`);
        
        // API Sympla retorna 100 por página, se menor que 100, é a última página
        if (data.data.length < 100) {
          console.log(`🏁 Evento ${eventId} - Última página atingida (${data.data.length} < 100)`);
          hasNext = false;
        } else {
          page++;
        }
      } else {
        console.log(`🚫 Evento ${eventId} - Página ${page} sem dados, parando busca`);
        hasNext = false;
      }

      if (page > 500) { // Limite de segurança aumentado
        console.log(`⚠️ Limite de 500 páginas atingido para evento ${eventId} - isso seria +50k participantes`);
        break;
      }

    } catch (error) {
      console.error(`❌ Erro ao buscar participantes evento ${eventId} página ${page}:`, error);
      break;
    }
  }

  console.log(`🎯 TOTAL FINAL Evento ${eventId}: ${participants.length} participantes encontrados em ${page-1} páginas`);
  return participants;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  // GET para teste simples
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({
        message: 'Sympla Sync Edge Function',
        usage: {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sgb-cron-token-secure-2025'
          },
          body_examples: {
            todos_eventos: { bar_id: 3 },
            automatico: { automated: true },
            evento_especifico: { bar_id: 3, event_id: 123456 }
          }
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Conectar ao Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: RequestBody = {};
    
    if (req.method === 'POST') {
      try {
        const text = await req.text();
        console.log(`📥 Request body (length: ${text.length}): "${text}"`);
        console.log(`📥 Body chars: ${Array.from(text).map(c => `${c}(${c.charCodeAt(0)})`).join(' ')}`);
        
        if (text.trim()) {
          // Limpar possíveis caracteres invisíveis
          const cleanText = text.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').trim();
          console.log(`🧹 Cleaned text: "${cleanText}"`);
          
          if (cleanText) {
            body = JSON.parse(cleanText);
          }
        }
      } catch (jsonError) {
        console.error('❌ Erro ao fazer parse do JSON:', jsonError);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'JSON inválido no body da requisição',
            json_error: jsonError.message,
            example: {
              bar_id: 3,
              automated: true
            },
            help: 'Certifique-se de enviar JSON válido no body'
          }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    const { bar_id, event_id, token_sympla, automated } = body;

    // Verificar autenticação
    const authHeader = req.headers.get('authorization');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log(`🔐 Authorization header: "${authHeader}"`);
    console.log(`🔐 Supabase anon key exists: ${!!supabaseAnonKey}`);
    console.log(`🔐 Has sgb-cron-token: ${authHeader?.includes('sgb-cron-token-secure-2025')}`);
    console.log(`🔐 Has supabase key: ${authHeader?.includes(supabaseAnonKey || '')}`);
    
    if (!authHeader) {
      console.error('❌ No authorization header provided');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization header is required',
          help: 'Include header: Authorization: Bearer sgb-cron-token-secure-2025'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Aceitar qualquer Bearer token por enquanto para teste
    if (!authHeader.startsWith('Bearer ')) {
      console.error('❌ Authorization must be Bearer token');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Authorization must be Bearer token',
          received: authHeader,
          expected: 'Bearer <token>',
          help: 'Use format: Authorization: Bearer <your-token>'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('✅ Authorization passed');

    // Para execução automática via cron, buscar bar ativo
    let targetBarId: number;
    let barNome: string;

    if (automated && !bar_id) {
      const activeBar = await getActiveBar(supabase);
      if (!activeBar) {
        throw new Error('Nenhum bar ativo encontrado para sincronização automática');
      }
      targetBarId = activeBar.id;
      barNome = activeBar.nome;
      console.log(`🏢 Bar ativo encontrado: ${barNome} (ID: ${targetBarId})`);
    } else {
      targetBarId = bar_id!;
      // Buscar nome do bar
      const { data: barData } = await supabase
        .from('bars')
        .select('nome')
        .eq('id', targetBarId)
        .single();
      barNome = barData?.nome || `Bar ${targetBarId}`;
    }

    if (!targetBarId) {
      return new Response(
        JSON.stringify({ 
          error: 'bar_id é obrigatório',
          example: {
            bar_id: 3,
            automated: true
          }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🎯 SYMPLA SYNC - Bar: ${barNome} (${targetBarId})`);

    // Buscar token do Sympla - usar token do teste por enquanto
    let symplaToken = token_sympla;
    
    if (!symplaToken) {
      // Tentar buscar do banco primeiro
      symplaToken = await getSymplaCredentials(supabase, targetBarId);
    }
    
    if (!symplaToken) {
      // Usar token que funciona no teste como fallback
      symplaToken = '3085e782ebcccbbc75b26f6a5057f170e4dfa4aeabe4c19974fc2639fbfc0a77';
      console.log('⚠️ Usando token de teste (fallback)');
    }
    
    console.log(`🎪 Token Sympla encontrado: ${symplaToken ? 'SIM' : 'NÃO'}`);
    
    if (!symplaToken) {
      throw new Error(`Token Sympla não encontrado para o bar ${targetBarId}`);
    }

    let eventsToProcess: SymplaEvent[] = [];
    let totalParticipants = 0;
    let totalEvents = 0;

    // Se event_id foi especificado, buscar apenas esse evento
    if (event_id) {
      console.log(`🎪 Sincronizando evento específico: ${event_id}`);
      
      try {
        const response = await fetch(`https://api.sympla.com.br/public/v3/events/${event_id}`, {
          headers: {
            'Authorization': `Bearer ${symplaToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const eventData = await response.json();
          eventsToProcess = [eventData.data];
        } else {
          throw new Error(`Evento ${event_id} não encontrado ou inativo`);
        }
      } catch (error) {
        throw new Error(`Erro ao buscar evento ${event_id}: ${error.message}`);
      }
    } else {
      // Buscar TODOS os eventos de 2025 (incluindo finalizados/históricos)
      console.log(`🎪 1/2 - Buscando TODOS os eventos de 2025...`);
      eventsToProcess = await fetchSymplaEvents(symplaToken);
      console.log(`✅ Total de eventos de 2025 encontrados: ${eventsToProcess.length}`);
    }

    // NÃO deletar dados antigos - usar UPSERT para preservar dados existentes
    console.log('🔄 Usando UPSERT para preservar dados existentes...');

    // Processar cada evento
    for (const event of eventsToProcess) {
      console.log(`🎪 Processando evento: ${event.name} (ID: ${event.id})`);

      // Inserir/atualizar dados do evento
      const eventoData = {
        bar_id: targetBarId,
        evento_sympla_id: event.id,
        reference_id: event.reference_id || null,
        nome_evento: event.name,
        data_inicio: event.start_date,
        data_fim: event.end_date,
        publicado: event.published === 1,
        imagem_url: event.image,
        evento_url: event.url,
        dados_endereco: event.address || null,
        dados_host: event.host || null,
        categoria_primaria: event.category_prim?.name || null,
        categoria_secundaria: event.category_sec?.name || null,
        raw_data: event,
        created_at: new Date().toISOString()
      };

      // MANTER todos os dados - apenas fazer UPSERT
      console.log(`🔄 Fazendo UPSERT do evento ${event.id} (preservando dados existentes)`);

      const { error: eventError } = await supabase
        .from('sympla_eventos')
        .upsert(eventoData, {
          onConflict: 'evento_sympla_id',
          ignoreDuplicates: false
        });

      if (eventError) {
        console.error(`❌ Erro ao inserir evento ${event.id}:`, eventError);
        continue;
      }

      totalEvents++;

      // Buscar participantes do evento
      console.log(`👥 Buscando participantes do evento ${event.id}...`);
      const participants = await fetchEventParticipants(symplaToken, event.id);

      if (participants.length > 0) {
        // Inserir participantes em lotes
        const participantesData = participants.map(participant => ({
          bar_id: targetBarId,
          participante_sympla_id: participant.id,
          evento_sympla_id: participant.event_id || event.id,
          pedido_id: participant.order_id,
          nome_completo: `${participant.first_name || ''} ${participant.last_name || ''}`.trim(),
          email: participant.email,
          tipo_ingresso: participant.ticket_name,
          numero_ticket: participant.ticket_number,
          fez_checkin: participant.checkin?.check_in === true,
          data_checkin: participant.checkin?.check_in_date ? new Date(participant.checkin.check_in_date).toISOString() : null,
          status_pedido: participant.order_status,
          dados_ticket: {
            ticket_created_at: participant.ticket_created_at,
            ticket_updated_at: participant.ticket_updated_at,
            ticket_num_qr_code: participant.ticket_num_qr_code
          },
          raw_data: participant,
          created_at: new Date().toISOString()
        }));

        // Remover duplicatas por participante_sympla_id para evitar conflito no UPSERT
        const uniqueParticipantes = participantesData.filter((participante, index, arr) => {
          const firstIndex = arr.findIndex(p => p.participante_sympla_id === participante.participante_sympla_id);
          return firstIndex === index;
        });

        console.log(`🔍 Evento ${event.id}: ${participantesData.length} participantes brutos, ${uniqueParticipantes.length} únicos após remoção de duplicatas`);

        // Inserir em lotes de 1000
        const loteSize = 1000;
        let participantesInseridos = 0;

        for (let i = 0; i < uniqueParticipantes.length; i += loteSize) {
          const lote = uniqueParticipantes.slice(i, i + loteSize);
          
          const { error } = await supabase
            .from('sympla_participantes')
            .upsert(lote, {
              onConflict: 'participante_sympla_id',
              ignoreDuplicates: false
            });

          if (!error) {
            participantesInseridos += lote.length;
            console.log(`✅ Evento ${event.id} - Lote ${Math.floor(i/loteSize) + 1}: ${lote.length} participantes`);
          } else {
            console.error(`❌ Erro no lote ${Math.floor(i/loteSize) + 1} evento ${event.id}:`, error.message);
          }
        }

        totalParticipants += participantesInseridos;
        console.log(`✅ Evento ${event.id}: ${participantesInseridos} participantes inseridos`);
      } else {
        console.log(`ℹ️ Evento ${event.id}: Nenhum participante encontrado`);
      }
    }

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Enviar notificação Discord se for execução automática
    if (automated) {
      try {
        const { data: discordConfig } = await supabase
          .from('discord_webhooks')
          .select('webhook_url')
          .eq('bar_id', targetBarId)
          .eq('ativo', true)
          .single();

        if (discordConfig?.webhook_url) {
          await sendDiscordNotification(
            discordConfig.webhook_url,
            `🎪 Sympla Sync Concluído - ${barNome}`,
            `Sincronização automática do Sympla realizada com sucesso!`,
            15844367, // Laranja Sympla
            [
              { name: '🎪 Eventos', value: totalEvents.toString(), inline: true },
              { name: '👥 Participantes', value: totalParticipants.toString(), inline: true },
              { name: '⏱️ Tempo', value: `${executionTime}ms`, inline: true }
            ]
          );
        }
      } catch (discordError) {
        console.error('❌ Erro no Discord:', discordError);
      }
    }

    const response = {
      success: true,
      message: event_id 
        ? `Evento ${event_id} sincronizado com sucesso para ${barNome}!`
        : `Dados do Sympla sincronizados com sucesso para ${barNome}!`,
      data: {
        bar_id: targetBarId,
        bar_nome: barNome,
        event_id: event_id || null,
        eventos_processados: totalEvents,
        participantes_inseridos: totalParticipants,
        is_update: true,
        execution_time_ms: executionTime,
        automated: automated || false
      },
      result: {
        inserted: totalEvents + totalParticipants,
        skipped: 0,
        execution_time: executionTime
      }
    };

    console.log(`✅ Sympla Sync concluído: ${totalEvents} eventos, ${totalParticipants} participantes em ${executionTime}ms`);

    // 🚀 CHAMAR DISCORD NOTIFICATION para EVENTOS (Sympla)
    try {
      const discordResponse = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/discord-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
        },
        body: JSON.stringify({
          title: '✅ Sympla Sync Concluído',
          webhook_type: 'eventos',
          processed_records: totalParticipants,
          bar_id: targetBarId,
          execution_time: `${executionTime}ms`,
          custom_message: `🎪 **Sincronização Sympla finalizada!**\n\n📊 **Resultados:**\n• **Eventos:** ${totalEvents} processados\n• **Participantes:** ${totalParticipants} sincronizados\n• **Bar:** ${barNome} (ID: ${targetBarId})\n• **Tempo:** ${executionTime}ms\n\n💾 **Dados atualizados:** Eventos e participantes do Sympla\n⏰ **Concluído:** ${new Date().toLocaleString('pt-BR')}`
        })
      });

      if (!discordResponse.ok) {
        console.error('❌ Erro ao enviar notificação Discord Sympla:', discordResponse.status);
      } else {
        console.log('📢 Notificação Discord Sympla enviada');
      }
    } catch (discordError) {
      console.error('❌ Erro ao enviar notificação Discord Sympla:', discordError);
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro:', error);
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Erro desconhecido',
        data: {
          bar_id: 0,
          eventos_processados: 0,
          participantes_inseridos: 0,
          is_update: false,
          execution_time_ms: executionTime
        },
        result: {
          inserted: 0,
          skipped: 0,
          execution_time: executionTime,
          error: error.message || 'Erro desconhecido'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});