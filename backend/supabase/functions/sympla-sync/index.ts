import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para obter configuração da API Sympla dos secrets
function getSymplaConfig() {
  const token = Deno.env.get('SYMPLA_API_TOKEN');
  if (!token) {
    throw new Error('SYMPLA_API_TOKEN não encontrado nos secrets');
  }
  
  return {
    hostname: 'api.sympla.com.br',
    token: token,
    headers: {
      's_token': token,
      'Content-Type': 'application/json',
      'User-Agent': 'SGB-Sync/1.0'
    }
  };
}

// Função para fazer requisições HTTPS à API do Sympla
async function makeSymplaRequest(path: string) {
  const config = getSymplaConfig();
  const url = `https://${config.hostname}${path}`;
  
  console.log(`🔗 Fazendo requisição para: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: config.headers
  });

  if (!response.ok) {
    throw new Error(`Sympla API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Função para buscar TODOS os eventos (com paginação completa)
async function buscarTodosEventos() {
  let todosEventos: any[] = [];
  let pagina = 1;
  let temProximaPagina = true;

  console.log(`🔄 Buscando eventos com paginação...`);

  while (temProximaPagina) {
    console.log(`   📄 Página ${pagina}...`);
    const path = `/public/v1.5.1/events?page=${pagina}`;
    const response = await makeSymplaRequest(path);

    if (response.data && response.data.length > 0) {
      todosEventos = todosEventos.concat(response.data);
      pagina++;
      
      // Verificar se há próxima página (API Sympla retorna 100 por página)
      if (response.data.length < 100) {
        temProximaPagina = false;
      }
    } else {
      temProximaPagina = false;
    }
  }

  console.log(`   ✅ ${todosEventos.length} eventos encontrados em ${pagina - 1} páginas`);
  return todosEventos;
}

// Função para buscar participantes de um evento (com paginação completa)
async function buscarTodosParticipantes(eventoId: string) {
  let todosParticipantes: any[] = [];
  let pagina = 1;
  let temProximaPagina = true;

  console.log(`🔄 Buscando participantes com paginação...`);

  while (temProximaPagina) {
    console.log(`   📄 Página ${pagina}...`);
    const path = `/public/v1.5.1/events/${eventoId}/participants?page=${pagina}`;
    const response = await makeSymplaRequest(path);

    if (response.data && response.data.length > 0) {
      todosParticipantes = todosParticipantes.concat(response.data);
      pagina++;
      
      // Verificar se há próxima página (API Sympla retorna 100 por página)
      if (response.data.length < 100) {
        temProximaPagina = false;
      }
    } else {
      temProximaPagina = false;
    }
  }

  console.log(`   ✅ ${todosParticipantes.length} participantes encontrados em ${pagina - 1} páginas`);
  return todosParticipantes;
}

// Função para buscar pedidos de um evento (com paginação completa)
async function buscarTodosPedidos(eventoId: string) {
  let todosPedidos: any[] = [];
  let pagina = 1;
  let temProximaPagina = true;

  console.log(`🔄 Buscando pedidos com paginação...`);

  while (temProximaPagina) {
    console.log(`   📄 Página ${pagina}...`);
    const path = `/public/v1.5.1/events/${eventoId}/orders?page=${pagina}`;
    const response = await makeSymplaRequest(path);

    if (response.data && response.data.length > 0) {
      todosPedidos = todosPedidos.concat(response.data);
      pagina++;
      
      // Verificar se há próxima página
      if (response.data.length < 100) {
        temProximaPagina = false;
      }
    } else {
      temProximaPagina = false;
    }
  }

  console.log(`   ✅ ${todosPedidos.length} pedidos encontrados em ${pagina - 1} páginas`);
  return todosPedidos;
}

// Função para inserir eventos no banco (processamento em lotes)
async function inserirEventos(supabase: any, eventos: any[]) {
  console.log(`\n📊 Inserindo ${eventos.length} eventos no banco...`);
  
  const eventosParaInserir = eventos.map((evento: any) => ({
    evento_sympla_id: evento.id,
    reference_id: evento.reference_id,
    nome_evento: evento.name,
    data_inicio: evento.start_date,
    data_fim: evento.end_date,
    publicado: evento.published === 1,
    imagem_url: evento.image,
    evento_url: evento.url,
    dados_endereco: evento.address,
    dados_host: evento.host,
    categoria_primaria: evento.category_prim?.name,
    categoria_secundaria: evento.category_sec?.name,
    raw_data: evento
  }));
  
  const { data, error } = await supabase
    .from('sympla_eventos')
    .upsert(eventosParaInserir, {
      onConflict: 'evento_sympla_id',
      ignoreDuplicates: false
    })
    .select('id');
  
  if (error) {
    console.error('❌ Erro ao inserir eventos:', error);
    return 0;
  }
  
  console.log(`✅ ${data?.length || 0} eventos inseridos/atualizados`);
  return data?.length || 0;
}

// Função para inserir participantes no banco (processamento em lotes)
async function inserirParticipantes(supabase: any, eventoId: string, participantes: any[]) {
  console.log(`\n👥 Inserindo ${participantes.length} participantes do evento ${eventoId}...`);
  
  const participantesParaInserir = participantes.map((participante: any) => ({
    participante_sympla_id: participante.id,
    evento_sympla_id: participante.event_id,
    pedido_id: participante.order_id,
    nome_completo: `${participante.first_name || ''} ${participante.last_name || ''}`.trim(),
    email: participante.email,
    tipo_ingresso: participante.ticket_name,
    numero_ticket: participante.ticket_number,
    fez_checkin: participante.checkin?.check_in === true,
    data_checkin: participante.checkin?.check_in_date ? new Date(participante.checkin.check_in_date).toISOString() : null,
    status_pedido: participante.order_status,
    dados_ticket: {
      ticket_created_at: participante.ticket_created_at,
      ticket_updated_at: participante.ticket_updated_at,
      ticket_num_qr_code: participante.ticket_num_qr_code
    },
    raw_data: participante
  }));
  
  // Processar em lotes de 100 para evitar timeout
  const tamanhoLote = 100;
  let totalInserido = 0;
  
  for (let i = 0; i < participantesParaInserir.length; i += tamanhoLote) {
    const lote = participantesParaInserir.slice(i, i + tamanhoLote);
    console.log(`   📦 Processando lote ${Math.floor(i/tamanhoLote) + 1}: ${lote.length} registros`);
    
    const { data, error } = await supabase
      .from('sympla_participantes')
      .upsert(lote, {
        onConflict: 'participante_sympla_id',
        ignoreDuplicates: false
      })
      .select('id');
    
    if (error) {
      console.error(`❌ Erro no lote ${Math.floor(i/tamanhoLote) + 1}:`, error);
    } else {
      totalInserido += data?.length || 0;
      console.log(`   ✅ Lote ${Math.floor(i/tamanhoLote) + 1}: ${data?.length || 0} registros`);
    }
  }
  
  console.log(`✅ TOTAL: ${totalInserido} participantes inseridos/atualizados`);
  return totalInserido;
}

// Função para inserir pedidos no banco (processamento em lotes)
async function inserirPedidos(supabase: any, eventoId: string, pedidos: any[]) {
  console.log(`\n💰 Inserindo ${pedidos.length} pedidos do evento ${eventoId}...`);
  
  const pedidosParaInserir = pedidos.map((pedido: any) => ({
    pedido_sympla_id: pedido.id,
    evento_sympla_id: pedido.event_id,
    data_pedido: pedido.order_date ? new Date(pedido.order_date).toISOString() : null,
    status_pedido: pedido.order_status,
    tipo_transacao: pedido.transaction_type,
    nome_comprador: `${pedido.buyer_first_name || ''} ${pedido.buyer_last_name || ''}`.trim(),
    email_comprador: pedido.buyer_email,
    valor_liquido: parseFloat(pedido.order_total_net_value || '0'),
    valor_bruto: parseFloat(pedido.order_total_sale_price || '0'),
    taxa_sympla: (parseFloat(pedido.order_total_sale_price || '0') - parseFloat(pedido.order_total_net_value || '0')),
    dados_utm: pedido.utm,
    dados_comprador: {
      buyer_first_name: pedido.buyer_first_name,
      buyer_last_name: pedido.buyer_last_name,
      buyer_email: pedido.buyer_email,
      updated_date: pedido.updated_date,
      approved_date: pedido.approved_date
    },
    raw_data: pedido
  }));
  
  // Processar em lotes de 100 para evitar timeout
  const tamanhoLote = 100;
  let totalInserido = 0;
  
  for (let i = 0; i < pedidosParaInserir.length; i += tamanhoLote) {
    const lote = pedidosParaInserir.slice(i, i + tamanhoLote);
    console.log(`   📦 Processando lote ${Math.floor(i/tamanhoLote) + 1}: ${lote.length} registros`);
    
    const { data, error } = await supabase
      .from('sympla_pedidos')
      .upsert(lote, {
        onConflict: 'pedido_sympla_id',
        ignoreDuplicates: false
      })
      .select('id');
    
    if (error) {
      console.error(`❌ Erro no lote ${Math.floor(i/tamanhoLote) + 1}:`, error);
    } else {
      totalInserido += data?.length || 0;
      console.log(`   ✅ Lote ${Math.floor(i/tamanhoLote) + 1}: ${data?.length || 0} registros`);
    }
  }
  
  console.log(`✅ TOTAL: ${totalInserido} pedidos inseridos/atualizados`);
  return totalInserido;
}

// Função para registrar log de sincronização
async function registrarLogSync(supabase: any, eventoId: string, tipo: string, status: string, detalhes: any) {
  await supabase
    .from('sympla_sync_logs')
    .insert({
      evento_sympla_id: eventoId,
      tipo_sync: tipo,
      status: status,
      detalhes: detalhes
    });
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('🎪 INICIANDO SYMPLA SYNC COMPLETO');

    // Pegar parâmetros da requisição
    const requestBody = await req.json().catch(() => ({}));
    const { filtro_eventos, debug_mode, data_inicio, data_fim } = requestBody;
    
    // **MODO DEBUG: Apenas analisar estrutura dos eventos**
    if (debug_mode) {
      console.log('🔍 MODO DEBUG - ANALISANDO ESTRUTURA DOS EVENTOS');
      
      const todosEventos = await buscarTodosEventos();
      console.log(`📊 Total de eventos encontrados: ${todosEventos.length}`);
      
      // Filtrar eventos do Ordi
      const eventosOrdi = todosEventos.filter((evento: any) => {
        return evento.name && evento.name.toLowerCase().includes('ordi');
      });
      
      console.log(`🎯 Eventos do Ordi: ${eventosOrdi.length}`);
      
      return Response.json({
        success: true,
        debug_data: {
          total_eventos: todosEventos.length,
          eventos_ordi: eventosOrdi.length,
          primeiro_evento: eventosOrdi[0] || null,
          estrutura_eventos: eventosOrdi.slice(0, 3) // Primeiros 3 para análise
        }
      }, { headers: corsHeaders });
    }

    // Supabase connection
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar TODOS os eventos (com paginação)
    console.log(`🔍 Buscando todos os eventos...`);
    const todosEventos = await buscarTodosEventos();
    
    // Calcular período de datas (última semana por padrão, ou customizado)
    let dataInicioPeriodo: Date;
    let dataFimPeriodo: Date;
    
    if (data_inicio && data_fim) {
      // Usar datas customizadas
      dataInicioPeriodo = new Date(data_inicio);
      dataInicioPeriodo.setHours(0, 0, 0, 0);
      
      dataFimPeriodo = new Date(data_fim);
      dataFimPeriodo.setHours(23, 59, 59, 999);
      
      console.log(`📅 Usando período customizado: ${data_inicio} a ${data_fim}`);
    } else {
      // Calcular última semana automaticamente (segunda a domingo)
      const hoje = new Date();
      const diaDaSemana = hoje.getDay(); // 0 = domingo, 1 = segunda, etc.
      const diasParaSegundaPassada = diaDaSemana === 0 ? 6 : diaDaSemana - 1; // Se for domingo, volta 6 dias
      
      dataInicioPeriodo = new Date(hoje);
      dataInicioPeriodo.setDate(hoje.getDate() - diasParaSegundaPassada - 7); // Semana passada
      dataInicioPeriodo.setHours(0, 0, 0, 0);
      
      dataFimPeriodo = new Date(dataInicioPeriodo);
      dataFimPeriodo.setDate(dataInicioPeriodo.getDate() + 6);
      dataFimPeriodo.setHours(23, 59, 59, 999);
      
      console.log(`📅 Usando última semana automática: ${dataInicioPeriodo.toISOString().split('T')[0]} a ${dataFimPeriodo.toISOString().split('T')[0]}`);
    }
    
    // Filtrar eventos para sincronizar (Ordi + data da última semana)
    const filtroUsar = filtro_eventos || 'ordi';
    const eventosParaSincronizar = todosEventos.filter((evento: any) => {
      // Filtro por nome
      const temNomeCorreto = evento.name && evento.name.toLowerCase().includes(filtroUsar.toLowerCase());
      
      if (!temNomeCorreto) return false;
      
      // Filtro por data (período definido)
      const dataEvento = new Date(evento.start_date || evento.date);
      const eventoNoPeriodo = dataEvento >= dataInicioPeriodo && dataEvento <= dataFimPeriodo;
      
      if (eventoNoPeriodo) {
        console.log(`   ✅ Evento incluído: ${evento.name} - ${dataEvento.toISOString().split('T')[0]}`);
      }
      
      return eventoNoPeriodo;
    });

    console.log(`🎯 ${eventosParaSincronizar.length} eventos encontrados com filtro "${filtroUsar}" no período ${dataInicioPeriodo.toISOString().split('T')[0]} a ${dataFimPeriodo.toISOString().split('T')[0]}`);
    
    if (eventosParaSincronizar.length === 0) {
      return Response.json({
        success: false,
        message: `Nenhum evento encontrado com filtro "${filtroUsar}" no período especificado`,
        data: {
          total_eventos_api: todosEventos.length,
          eventos_filtrados: 0,
          periodo_filtro: {
            data_inicio: dataInicioPeriodo.toISOString().split('T')[0],
            data_fim: dataFimPeriodo.toISOString().split('T')[0]
          }
        }
      }, { 
        headers: corsHeaders 
      });
    }

    // Inserir eventos no banco
    const eventosInseridos = await inserirEventos(supabase, eventosParaSincronizar);

    // Processar TODOS os eventos (participantes e pedidos)
    console.log(`\n🔄 Processando participantes e pedidos de TODOS os ${eventosParaSincronizar.length} eventos...`);
    
    let totalParticipantesTodos = 0;
    let totalPedidosTodos = 0;
    let totalCheckinsGeral = 0;
    let totalValorBruto = 0;
    let totalValorLiquido = 0;
    let eventosComErro = 0;
    
    for (let i = 0; i < eventosParaSincronizar.length; i++) {
      const evento = eventosParaSincronizar[i];
      console.log(`\n📅 [${i + 1}/${eventosParaSincronizar.length}] Processando: "${evento.name}" (${evento.id})`);
      
      try {
        // Registrar início do processamento
        await registrarLogSync(supabase, evento.id, 'evento', 'processando', {
          nome_evento: evento.name,
          data_inicio: evento.start_date
        });
        
        // Buscar TODOS os participantes deste evento
        const participantesEvento = await buscarTodosParticipantes(evento.id);
        console.log(`   👥 Participantes encontrados: ${participantesEvento.length}`);
        totalParticipantesTodos += participantesEvento.length;
        
        // Contar check-ins
        const checkinsEvento = participantesEvento.filter((p: any) => p.checkin?.check_in === true).length;
        totalCheckinsGeral += checkinsEvento;
        
        // Inserir participantes no banco
        if (participantesEvento.length > 0) {
          await inserirParticipantes(supabase, evento.id, participantesEvento);
          
          await registrarLogSync(supabase, evento.id, 'participantes', 'sucesso', {
            total_participantes: participantesEvento.length,
            total_checkins: checkinsEvento
          });
        }
        
        // Buscar TODOS os pedidos deste evento
        const pedidosEvento = await buscarTodosPedidos(evento.id);
        console.log(`   💰 Pedidos encontrados: ${pedidosEvento.length}`);
        totalPedidosTodos += pedidosEvento.length;
        
        // Calcular valores financeiros
        let valorBrutoEvento = 0;
        let valorLiquidoEvento = 0;
        
        pedidosEvento.forEach((pedido: any) => {
          valorBrutoEvento += parseFloat(pedido.order_total_sale_price || '0');
          valorLiquidoEvento += parseFloat(pedido.order_total_net_value || '0');
        });
        
        totalValorBruto += valorBrutoEvento;
        totalValorLiquido += valorLiquidoEvento;
        
        // Inserir pedidos no banco
        if (pedidosEvento.length > 0) {
          await inserirPedidos(supabase, evento.id, pedidosEvento);
          
          await registrarLogSync(supabase, evento.id, 'pedidos', 'sucesso', {
            total_pedidos: pedidosEvento.length,
            valor_bruto: valorBrutoEvento,
            valor_liquido: valorLiquidoEvento
          });
        }
        
        console.log(`   ✅ Evento ${i + 1} processado - Participantes: ${participantesEvento.length}, Pedidos: ${pedidosEvento.length}, Check-ins: ${checkinsEvento}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ Erro ao processar evento ${evento.id}:`, error);
        eventosComErro++;
        
        await registrarLogSync(supabase, evento.id, 'evento', 'erro', {
          erro: errorMessage,
          nome_evento: evento.name
        });
      }
    }
    
    console.log(`\n📊 RESUMO GERAL:`);
    console.log(`   🎪 Eventos processados: ${eventosParaSincronizar.length}`);
    console.log(`   👥 Total participantes: ${totalParticipantesTodos}`);
    console.log(`   💰 Total pedidos: ${totalPedidosTodos}`);
    console.log(`   ✅ Total check-ins: ${totalCheckinsGeral}`);
    console.log(`   💵 Valor bruto total: R$ ${totalValorBruto.toFixed(2)}`);
    console.log(`   💰 Valor líquido total: R$ ${totalValorLiquido.toFixed(2)}`);
    console.log(`   ❌ Eventos com erro: ${eventosComErro}`);

    // Registrar log geral da sincronização
    await registrarLogSync(supabase, 'GERAL', 'sync_completo', 'sucesso', {
      eventos_processados: eventosParaSincronizar.length,
      total_participantes: totalParticipantesTodos,
      total_pedidos: totalPedidosTodos,
      total_checkins: totalCheckinsGeral,
      valor_bruto_total: totalValorBruto,
      valor_liquido_total: totalValorLiquido,
      eventos_com_erro: eventosComErro,
      filtro_usado: filtroUsar,
      periodo_sincronizado: {
        data_inicio: dataInicioPeriodo.toISOString().split('T')[0],
        data_fim: dataFimPeriodo.toISOString().split('T')[0]
      }
    });

    return Response.json({
      success: true,
      message: `Sympla sync concluído: ${eventosParaSincronizar.length} eventos processados`,
      result: {
        eventos_processados: eventosParaSincronizar.length,
        total_participantes: totalParticipantesTodos,
        total_pedidos: totalPedidosTodos,
        total_checkins: totalCheckinsGeral,
        valor_bruto_total: totalValorBruto,
        valor_liquido_total: totalValorLiquido,
        eventos_com_erro: eventosComErro,
        percentual_checkin: totalParticipantesTodos > 0 ? 
          Math.round((totalCheckinsGeral / totalParticipantesTodos) * 100 * 100) / 100 : 0
      }
    }, { headers: corsHeaders });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('💥 Erro na sincronização Sympla:', error);

    return Response.json({
      success: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { 
      status: 500,
      headers: corsHeaders 
    });
  }
}); 