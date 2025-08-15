import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

console.log("🚀 Sympla Sync Automático - Edge Function");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SymplaEvent {
  id: string;
  reference_id: number;
  start_date: string;
  end_date: string;
  name: string;
  detail: string;
  private_event: number;
  published: number;
  cancelled: number;
  image: string;
  url: string;
  address: {
    name: string;
    address: string;
    address_num: string;
    address_alt: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    lon: string;
    lat: string;
  };
  host: {
    name: string;
    description: string;
  };
  category_prim: {
    name: string;
  };
  category_sec: {
    name: string;
  };
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
  id: number;
  event_id: string;
  order_id: string;
  order_status: string;
  order_date: string;
  order_updated_date: string;
  order_approved_date: string;
  order_discount: string;
  first_name: string;
  last_name: string;
  email: string;
  ticket_number: string;
  ticket_num_qr_code: string;
  ticket_name: string;
  sector_name: string;
  marked_place_name: string;
  access_information: string;
  pdv_user: string;
  ticket_sale_price: number;
  checkin: {
    id: number;
    check_in: boolean;
    check_in_date: string;
  };
  custom_form: {
    id: number;
    name: string;
    value: string;
  };
  ticket_created_at: string;
  ticket_updated_at: string;
  presentation_id: number;
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

interface SymplaOrder {
  id: string;
  event_id: string;
  order_date: string;
  order_status: string;
  updated_date: string;
  approved_date: string;
  discount_code: string;
  transaction_type: string;
  order_total_sale_price: number;
  order_total_net_value: number;
  buyer_first_name: string;
  buyer_last_name: string;
  buyer_email: string;
  invoice_info: {
    doc_type: string;
    doc_number: string;
    client_name: string;
    address_zip_code: string;
    address_street: string;
    address_street_number: string;
    address_street2: string;
    address_neighborhood: string;
    address_city: string;
    address_state: string;
    mei: number;
  };
  utm: {
    utm_source: string;
    utm_medium: string;
    utm_campaign: string;
    utm_term: string;
    utm_content: string;
    user_agent: string;
    referrer: string;
  };
}

interface SymplaOrdersResponse {
  data: SymplaOrder[];
  pagination: {
    has_next: boolean;
    has_prev: boolean;
    quantity: number;
    offset: number;
    page: number;
    page_size: number;
    total_records: number;
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
async function sendDiscordNotification(webhookUrl: string, title: string, description: string, color: number = 3447003, fields: Record<string, unknown>[] = []) {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

    return bars as { id: number; nome: string };
  } catch (error) {
    console.error('❌ Erro na consulta do bar ativo:', error);
    return null;
  }
}

// Função para buscar credenciais do Sympla
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getSymplaCredentials(supabase: any, barId: number): Promise<string | null> {
  try {
    const { data: credentials, error } = await supabase
      .from('api_credentials')
      .select('api_token')
      .eq('sistema', 'sympla')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .single();

    if (error || !credentials) {
      console.error('❌ Credenciais Sympla não encontradas:', error);
      return null;
    }

    return credentials.api_token as string;
  } catch (error) {
    console.error('❌ Erro ao buscar credenciais Sympla:', error);
    return null;
  }
}

// Função para buscar eventos do Sympla com período 10h-10h (para automação)
async function fetchSymplaEvents(token: string, automated: boolean = false): Promise<SymplaEvent[]> {
  const events: SymplaEvent[] = [];
  let page = 1;
  let hasNext = true;

  // Se for automação, usar período 10h-10h do dia anterior
  let filtroData = '';
  if (automated) {
    const agora = new Date();
    
    // Data de ontem 10h até hoje 10h (Brasil)
    const dataFim = new Date();
    dataFim.setUTCHours(13, 0, 0, 0); // 10h Brasil = 13h UTC (hoje)
    
    const dataInicio = new Date(dataFim);
    dataInicio.setDate(dataInicio.getDate() - 1); // Ontem 10h
    
    const fromDate = dataInicio.toISOString().split('T')[0];
    const toDate = dataFim.toISOString().split('T')[0];
    
    filtroData = `&start_date=${fromDate}&end_date=${toDate}`;
    
    console.log(`🎪 Buscando eventos Sympla período 10h-10h (automação)...`);
    console.log(`   📅 Período: ${dataInicio.toLocaleString('pt-BR')} até ${dataFim.toLocaleString('pt-BR')}`);
  } else {
    console.log('🎪 Buscando TODOS os eventos de 2025 (incluindo finalizados/históricos)...');
  }

  while (hasNext) {
    try {
      // URL com ou sem filtro de data dependendo se é automação
      const url = `https://api.sympla.com.br/public/v1.5.1/events?page=${page}${filtroData}`;
      
      const response = await fetch(url, {
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
        let eventosFiltrados = data.data;
        
        if (automated) {
          // Para automação, filtrar eventos no período específico 10h-10h
          const dataInicio = new Date();
          dataInicio.setDate(dataInicio.getDate() - 1);
          dataInicio.setUTCHours(13, 0, 0, 0);
          
          const dataFim = new Date();
          dataFim.setUTCHours(13, 0, 0, 0);
          
          eventosFiltrados = data.data.filter((event: SymplaEvent) => {
            const dataEvento = new Date(event.start_date);
            return dataEvento >= dataInicio && dataEvento <= dataFim;
          });
          
          console.log(`✅ Página ${page}: ${data.data.length} eventos total, ${eventosFiltrados.length} no período 10h-10h`);
        } else {
          // Para busca completa, filtrar eventos de 2025
          eventosFiltrados = data.data.filter((event: SymplaEvent) => {
            const year = new Date(event.start_date).getFullYear();
            return year === 2025;
          });
          
          console.log(`✅ Página ${page}: ${data.data.length} eventos total, ${eventosFiltrados.length} de 2025`);
        }
        
        events.push(...eventosFiltrados);
        console.log(`   📊 Total acumulado: ${events.length} eventos`);
        
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
async function fetchEventParticipants(token: string, eventId: string): Promise<SymplaParticipant[]> {
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

// 🆕 Função para buscar pedidos/orders de um evento
async function fetchEventOrders(token: string, eventId: string): Promise<SymplaOrder[]> {
  const orders: SymplaOrder[] = [];
  let page = 1;
  let hasNext = true;

  console.log(`💰 Iniciando busca de pedidos para evento ${eventId}...`);

  while (hasNext) {
    try {
      const response = await fetch(`https://api.sympla.com.br/public/v1.5.1/events/${eventId}/orders?page=${page}`, {
        headers: {
          's_token': token,
          'Content-Type': 'application/json',
          'User-Agent': 'SGB-Sync/1.0'
        }
      });

      if (!response.ok) {
        console.log(`⚠️ Erro na API Sympla pedidos evento ${eventId} (página ${page}):`, response.status);
        break;
      }

      const data: SymplaOrdersResponse = await response.json();
      
      // 🔍 DEBUG: Log completo da resposta para investigar
      console.log(`🔍 DEBUG - Evento ${eventId} orders página ${page}:`, JSON.stringify(data));
      
      if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
        console.log(`💰 Evento ${eventId} - Página ${page}: ${data.data.length} pedidos`);
        orders.push(...data.data);
        
        // API Sympla retorna 100 por página, se menor que 100, é a última página
        if (data.data.length < 100) {
          console.log(`🏁 Evento ${eventId} - Última página pedidos atingida (${data.data.length} < 100)`);
          hasNext = false;
        } else {
          page++;
        }
      } else {
        console.log(`🚫 Evento ${eventId} - Página ${page} sem pedidos, parando busca`);
        hasNext = false;
      }

      if (page > 100) { // Limite de segurança para pedidos
        console.log(`⚠️ Limite de 100 páginas de pedidos atingido para evento ${eventId}`);
        break;
      }

    } catch (error) {
      console.error(`❌ Erro ao buscar pedidos evento ${eventId} página ${page}:`, error);
      break;
    }
  }

  console.log(`💰 TOTAL FINAL Evento ${eventId}: ${orders.length} pedidos encontrados em ${page-1} páginas`);
  return orders;
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
        
        if (text.trim()) {
          body = JSON.parse(text);
          console.log(`✅ JSON parsed successfully:`, body);
        }
      } catch (jsonError) {
        console.error('❌ Erro ao fazer parse do JSON:', String(jsonError));
        return new Response(
          JSON.stringify({ 
            success: false,
            error: 'JSON inválido no body da requisição',
            json_error: String(jsonError),
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

    // Verificar autenticação - aceitar qualquer formato válido
    const authHeader = req.headers.get('authorization');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    console.log(`🔐 Authorization header: "${authHeader}"`);
    console.log(`🔐 Supabase anon key exists: ${!!supabaseAnonKey}`);
    console.log(`🔐 Has sgb-cron-token: ${authHeader?.includes('sgb-cron-token-secure-2025')}`);
    console.log(`🔐 Has supabase key: ${authHeader?.includes(supabaseAnonKey || '')}`);
    
    // Aceitar SERVICE_ROLE_KEY (mais estável) ou outros tokens válidos  
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (authHeader) {
      if (authHeader.includes(serviceRoleKey || '') || authHeader.includes('sgb-cron-token-secure-2025') || authHeader.startsWith('Bearer ')) {
        console.log('✅ Authentication passed - SERVICE_ROLE_KEY, pgcron or Bearer token');
      } else {
        console.error('❌ Invalid authorization format');
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Invalid authorization format',
            help: 'Use Bearer SERVICE_ROLE_KEY or valid token'
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Para compatibilidade, aceitar requisições sem auth durante teste
      console.log('⚠️ No authorization header - allowing for testing');
    }

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
    let symplaToken: string | null = token_sympla || null;
    
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
        throw new Error(`Erro ao buscar evento ${event_id}: ${String(error)}`);
      }
    } else {
      // Buscar eventos baseado no tipo de execução
      if (automated) {
        console.log(`🎪 1/2 - Buscando eventos período 10h-10h (automação)...`);
        eventsToProcess = await fetchSymplaEvents(symplaToken, true);
        console.log(`✅ Total de eventos encontrados no período: ${eventsToProcess.length}`);
      } else {
        console.log(`🎪 1/2 - Buscando TODOS os eventos de 2025...`);
        eventsToProcess = await fetchSymplaEvents(symplaToken, false);
        console.log(`✅ Total de eventos de 2025 encontrados: ${eventsToProcess.length}`);
      }
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

        // 🆕 BUSCAR PEDIDOS/ORDERS DO EVENTO PARA SINCRONIZAR FATURAMENTO
        console.log(`💰 Buscando pedidos/faturamento do evento ${event.id}...`);
        const orders = await fetchEventOrders(symplaToken, event.id);
        
        if (orders.length > 0) {
          // Inserir pedidos com tratamento de erro
          const pedidosData = orders.map(order => {
            try {
              return {
            bar_id: targetBarId,
            pedido_sympla_id: order.id,
            evento_sympla_id: event.id,
            data_pedido: (() => {
              try {
                return order.order_date ? new Date(order.order_date).toISOString() : new Date().toISOString();
              } catch (_e) {
                console.log(`⚠️ Data inválida para pedido ${order.id}: ${order.order_date}, usando data atual`);
                return new Date().toISOString();
              }
            })(),
            status_pedido: order.order_status,
            tipo_transacao: order.transaction_type || null,
            nome_comprador: order.buyer_first_name && order.buyer_last_name ? `${order.buyer_first_name} ${order.buyer_last_name}`.trim() : null,
            email_comprador: order.buyer_email || null,
            valor_bruto: isNaN(order.order_total_sale_price) ? 0 : order.order_total_sale_price,
            valor_liquido: isNaN(order.order_total_net_value) ? 0 : order.order_total_net_value,
            taxa_sympla: order.order_total_sale_price && order.order_total_net_value ? (order.order_total_sale_price - order.order_total_net_value) : 0,
            dados_comprador: {
              buyer_first_name: order.buyer_first_name,
              buyer_last_name: order.buyer_last_name,
              buyer_email: order.buyer_email
            },
            dados_utm: order.utm || null,
            raw_data: order,
            created_at: new Date().toISOString()
              };
            } catch (error) {
              console.error(`❌ Erro ao processar pedido ${order.id}:`, error);
              return null;
            }
          }).filter(pedido => pedido !== null);

          // Inserir pedidos em lotes
          const loteSize = 1000;
          let pedidosInseridos = 0;

          for (let i = 0; i < pedidosData.length; i += loteSize) {
            const lote = pedidosData.slice(i, i + loteSize);
            
            const { error } = await supabase
              .from('sympla_pedidos')
              .upsert(lote, {
                onConflict: 'evento_sympla_id,pedido_sympla_id',
                ignoreDuplicates: false
              });

            if (!error) {
              pedidosInseridos += lote.length;
              console.log(`💰 Evento ${event.id} - Lote pedidos ${Math.floor(i/loteSize) + 1}: ${lote.length} pedidos`);
            } else {
              console.error(`❌ Erro no lote pedidos ${Math.floor(i/loteSize) + 1} evento ${event.id}:`, error.message);
            }
          }

          const totalFaturamento = pedidosData.reduce((sum, p) => sum + (p.valor_liquido || 0), 0);
          console.log(`✅ Evento ${event.id}: ${pedidosInseridos} pedidos, R$ ${totalFaturamento.toFixed(2)}`);
        } else {
          console.log(`ℹ️ Evento ${event.id}: Nenhum pedido encontrado`);
        }
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
      console.error('❌ Erro ao enviar notificação Discord Sympla:', String(discordError));
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
        error: String(error) || 'Erro desconhecido',
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
          error: String(error) || 'Erro desconhecido'
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});