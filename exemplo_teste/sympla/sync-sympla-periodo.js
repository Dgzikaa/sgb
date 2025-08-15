// Script Sympla para Sync de Período Específico - Versão Backlog
// Uso: node sync-sympla-periodo.js [data_inicio] [data_fim]
// Exemplo: node sync-sympla-periodo.js 2025-07-01 2025-08-31

const fs = require('fs');

// Carregar .env.local
try {
  const path = require('path');
  const envPaths = [
    '../../frontend/.env.local',
    '../frontend/.env.local',
    '.env.local'
  ];
  
  let loaded = false;
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      require('dotenv').config({ path: envPath });
      console.log(`🔧 Carregando .env.local de: ${envPath}`);
      loaded = true;
      break;
    }
  }
  
  if (!loaded) {
    console.log('⚠️  Arquivo .env.local não encontrado');
  }
} catch (error) {
  console.log('⚠️  dotenv não instalado');
}

const { createClient } = require('@supabase/supabase-js');

// Configuração Sympla
function getSymplaConfig() {
  const token = '24a8cb785b622adeb3239928dd2ac79ec3f1a076558b0159ee9d4d27c8099022'; // CHAVE_2
  
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

// Configuração Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Argumentos da linha de comando
const args = process.argv.slice(2);
let dataInicio, dataFim;

if (args.length >= 2) {
  dataInicio = args[0];
  dataFim = args[1];
} else if (args.length === 1) {
  dataInicio = args[0];
  dataFim = args[0];
} else {
  // Últimos 7 dias como padrão
  const hoje = new Date();
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - 7);
  
  dataInicio = inicioSemana.toISOString().split('T')[0];
  dataFim = hoje.toISOString().split('T')[0];
}

console.log(`🎯 PROCESSANDO SYMPLA PERÍODO: ${dataInicio} até ${dataFim}`);

// Função para requisições Sympla
async function makeSymplaRequest(path) {
  const config = getSymplaConfig();
  const url = `https://${config.hostname}${path}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: config.headers
  });

  if (!response.ok) {
    throw new Error(`Sympla API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Função para gerar datas no período
function gerarDatasNoPeriodo(inicio, fim) {
  const datas = [];
  const dataAtual = new Date(inicio);
  const dataFinal = new Date(fim);
  
  while (dataAtual <= dataFinal) {
    datas.push(dataAtual.toISOString().split('T')[0]);
    dataAtual.setDate(dataAtual.getDate() + 1);
  }
  
  return datas;
}

// Função para criar período do evento (dia completo - sem filtro de horário)
function criarPeriodoEvento(dataEvento) {
  // Criar data correta para o dia (sem confusão de fuso)
  const dataStr = dataEvento; // YYYY-MM-DD
  
  return {
    from: `${dataStr}T00:00:00-03:00`, // Início do dia Brasil
    to: `${dataStr}T23:59:59-03:00`,   // Fim do dia Brasil
    fromDate: dataStr,
    toDate: dataStr
  };
}

// Buscar eventos por período
async function buscarEventosPorPeriodo(dataEvento) {
  const periodo = criarPeriodoEvento(dataEvento);
  
  console.log(`\n🎯 BUSCANDO EVENTOS SYMPLA PARA ${dataEvento}...`);
  console.log(`   📅 Período: ${new Date(periodo.from).toLocaleString('pt-BR')} até ${new Date(periodo.to).toLocaleString('pt-BR')} (dia completo)`);
  
  try {
    let todosEventos = [];
    let pagina = 1;
    let temProximaPagina = true;

    while (temProximaPagina) {
      console.log(`   📄 Página ${pagina}...`);
      const path = `/public/v1.5.1/events?page=${pagina}&start_date=${periodo.fromDate}&end_date=${periodo.toDate}`;
      const response = await makeSymplaRequest(path);

      if (response.data && response.data.length > 0) {
        // Filtrar eventos no período específico (dia completo)
        const eventosFiltrados = response.data.filter(evento => {
          if (!evento.start_date) return false;
          
          const dataEventoStart = new Date(evento.start_date);
          const dataEventoPeriodo = new Date(periodo.from);
          const dataEventoFim = new Date(periodo.to);
          
          return dataEventoStart >= dataEventoPeriodo && dataEventoStart <= dataEventoFim;
        });
        
        todosEventos = todosEventos.concat(eventosFiltrados);
        pagina++;
        
        if (response.data.length < 100) {
          temProximaPagina = false;
        }
      } else {
        temProximaPagina = false;
      }
    }
    
    console.log(`   ✅ Encontrados ${todosEventos.length} eventos no período`);
    
    // Filtrar eventos com 'ordi'
    const eventosOrdi = todosEventos.filter(evento => {
      return evento.name && evento.name.toLowerCase().includes('ordi');
    });
    
    console.log(`   📊 Eventos com "ordi": ${eventosOrdi.length} de ${todosEventos.length}`);
    
    // Log dos eventos encontrados
    eventosOrdi.forEach(evento => {
      console.log(`      🎪 ${evento.name} (ID: ${evento.id})`);
    });
    
    return eventosOrdi;
    
  } catch (error) {
    console.log(`   ❌ Erro ao buscar eventos para ${dataEvento}:`, error.message);
    return [];
  }
}

// Salvar eventos no banco
async function salvarEventos(eventos, dataEvento) {
  if (!eventos || eventos.length === 0) return;
  
  console.log(`\n🎯 SALVANDO ${eventos.length} EVENTOS NO BANCO...`);
  
  const eventosData = eventos.map(evento => ({
    bar_id: 3,
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
  
  // GARANTIR que usa a tabela correta: sympla_eventos
  const { data, error } = await supabase
    .from('sympla_eventos')  // TABELA CORRETA
    .upsert(eventosData, {
      onConflict: 'evento_sympla_id',
      ignoreDuplicates: false
    })
    .select('id');
  
  if (error) {
    console.error('   ❌ Erro ao inserir eventos:', error);
    return 0;
  }
  
  console.log(`   ✅ ${data?.length || 0} eventos salvos no banco`);
  return data?.length || 0;
}

// Buscar participantes com paginação
async function buscarTodosParticipantes(eventoId) {
  let todosParticipantes = [];
  let pagina = 1;
  let temProximaPagina = true;

  while (temProximaPagina) {
    const path = `/public/v1.5.1/events/${eventoId}/participants?page=${pagina}`;
    const response = await makeSymplaRequest(path);

    if (response.data && response.data.length > 0) {
      todosParticipantes = todosParticipantes.concat(response.data);
      pagina++;
      
      if (response.data.length < 100) {
        temProximaPagina = false;
      }
    } else {
      temProximaPagina = false;
    }
  }

  return todosParticipantes;
}

// Buscar pedidos com paginação
async function buscarTodosPedidos(eventoId) {
  let todosPedidos = [];
  let pagina = 1;
  let temProximaPagina = true;

  while (temProximaPagina) {
    const path = `/public/v1.5.1/events/${eventoId}/orders?page=${pagina}`;
    const response = await makeSymplaRequest(path);

    if (response.data && response.data.length > 0) {
      todosPedidos = todosPedidos.concat(response.data);
      pagina++;
      
      if (response.data.length < 100) {
        temProximaPagina = false;
      }
    } else {
      temProximaPagina = false;
    }
  }

  return todosPedidos;
}

// Salvar participantes em lotes
async function salvarParticipantes(eventoId, participantes) {
  if (participantes.length === 0) return 0;
  
  console.log(`   🎯 Salvando participantes - Evento ${eventoId}...`);
  
  const participantesData = participantes.map(participante => ({
    bar_id: 3,
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
  
  const tamanhoLote = 100;
  let totalInserido = 0;
  
  for (let i = 0; i < participantesData.length; i += tamanhoLote) {
    const lote = participantesData.slice(i, i + tamanhoLote);
    
    const { data, error } = await supabase
      .from('sympla_participantes')
      .upsert(lote, {
        onConflict: 'participante_sympla_id',
        ignoreDuplicates: false
      })
      .select('id');
    
    if (error) {
      console.error(`      ❌ Erro no lote ${Math.floor(i/tamanhoLote) + 1}:`, error);
    } else {
      totalInserido += data?.length || 0;
    }
  }
  
  console.log(`      ✅ Participantes: ${totalInserido} registros`);
  return totalInserido;
}

// Salvar pedidos em lotes  
async function salvarPedidos(eventoId, pedidos) {
  if (pedidos.length === 0) return 0;
  
  console.log(`   🎯 Salvando pedidos - Evento ${eventoId}...`);
  
  const pedidosData = pedidos.map(pedido => ({
    bar_id: 3,
    pedido_sympla_id: pedido.id,
    evento_sympla_id: pedido.event_id,
    data_pedido: pedido.order_date ? new Date(pedido.order_date).toISOString() : null,
    status_pedido: pedido.order_status,
    tipo_transacao: pedido.transaction_type,
    nome_comprador: `${pedido.buyer_first_name || ''} ${pedido.buyer_last_name || ''}`.trim(),
    email_comprador: pedido.buyer_email,
    valor_bruto: pedido.order_total_sale_price || 0,
    valor_liquido: pedido.order_total_net_value || 0,
    taxa_sympla: pedido.order_total_sale_price && pedido.order_total_net_value ? (pedido.order_total_sale_price - pedido.order_total_net_value) : 0,
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
  
  const tamanhoLote = 100;
  let totalInserido = 0;
  
  for (let i = 0; i < pedidosData.length; i += tamanhoLote) {
    const lote = pedidosData.slice(i, i + tamanhoLote);
    
    const { data, error } = await supabase
      .from('sympla_pedidos')
      .upsert(lote, {
        onConflict: 'pedido_sympla_id,evento_sympla_id',
        ignoreDuplicates: false
      })
      .select('id');
    
    if (error) {
      console.error(`      ❌ Erro no lote ${Math.floor(i/tamanhoLote) + 1}:`, error);
    } else {
      totalInserido += data?.length || 0;
    }
  }
  
  console.log(`      ✅ Pedidos: ${totalInserido} registros`);
  return totalInserido;
}

// Função principal
async function main() {
  const inicioTempo = Date.now();
  console.log('🚀 INICIANDO SYNC SYMPLA PARA PERÍODO ESPECÍFICO\n');
  
  console.log(`📅 Período: ${dataInicio} até ${dataFim}`);
  console.log(`🏢 Bar ID: 3`);
  console.log('');
  
  try {
    // Gerar lista de datas no período
    const datas = gerarDatasNoPeriodo(dataInicio, dataFim);
    console.log(`📊 Total de dias para processar: ${datas.length}`);
    
    let totalEventos = 0;
    let totalParticipantes = 0;
    let totalPedidos = 0;
    
    // Processar cada data
    for (const dataEvento of datas) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📅 PROCESSANDO ${dataEvento}`);
      console.log(`${'='.repeat(60)}`);
      
      // 1. Buscar eventos para a data
      const eventos = await buscarEventosPorPeriodo(dataEvento);
      
      if (eventos.length === 0) {
        console.log(`   ⚠️ Nenhum evento encontrado para ${dataEvento}`);
        continue;
      }
      
      // 2. Salvar eventos no banco
      await salvarEventos(eventos, dataEvento);
      
      // 3. Para cada evento, buscar dados detalhados
      for (const evento of eventos) {
        const eventoId = evento.id;
        const eventoNome = evento.name || `Evento ${eventoId}`;
        
        console.log(`\n   📊 PROCESSANDO: ${eventoNome} (ID: ${eventoId})`);
        
        // Buscar e salvar participantes
        const participantes = await buscarTodosParticipantes(eventoId);
        console.log(`      👥 Participantes encontrados: ${participantes.length}`);
        totalParticipantes += participantes.length;
        
        if (participantes.length > 0) {
          await salvarParticipantes(eventoId, participantes);
        }
        
        // Buscar e salvar pedidos
        const pedidos = await buscarTodosPedidos(eventoId);
        console.log(`      💰 Pedidos encontrados: ${pedidos.length}`);
        totalPedidos += pedidos.length;
        
        if (pedidos.length > 0) {
          await salvarPedidos(eventoId, pedidos);
        }
        
        totalEventos++;
      }
      
      // Pausa entre dias
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const tempoTotal = Date.now() - inicioTempo;
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ SYNC SYMPLA PERÍODO CONCLUÍDO');
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 ${totalEventos} eventos processados em ${datas.length} dias`);
    console.log(`👥 ${totalParticipantes} participantes processados`);
    console.log(`💰 ${totalPedidos} pedidos processados`);
    console.log(`⏱️ Tempo total: ${Math.round(tempoTotal / 1000)}s`);
    
  } catch (error) {
    console.error('\n❌ ERRO NO SYNC:', error.message);
    process.exit(1);
  }
}

// Executar
main();
