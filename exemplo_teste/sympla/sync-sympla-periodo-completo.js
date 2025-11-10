// Sync Completo Sympla - Período 31.01 até Hoje
// 
// Para configurar:
//   1. Arquivo .env.local na pasta frontend/ deve ter:
//      - SYMPLA_API_TOKEN=seu_token
//      - NEXT_PUBLIC_SUPABASE_URL=sua_url
//      - NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
//      - SUPABASE_SERVICE_ROLE_KEY=service_role_key
//
// Para rodar: 
//   node exemplo_teste/sympla/sync-sympla-periodo-completo.js
//
// Opções:
//   node exemplo_teste/sympla/sync-sympla-periodo-completo.js --data-inicio=2025-01-31
//   node exemplo_teste/sympla/sync-sympla-periodo-completo.js --data-inicio=2025-01-31 --data-fim=2025-01-31
//   node exemplo_teste/sympla/sync-sympla-periodo-completo.js --teste (processa apenas 3 dias)

const fs = require('fs');

// Tentar carregar .env.local se existir (procurar em vários lugares)
try {
  const path = require('path');
  
  // Lista de locais para procurar o .env.local
  const envPaths = [
    '../../frontend/.env.local',  // Pasta frontend (desde exemplo_teste/sympla)
    '../frontend/.env.local',     // Pasta frontend (desde exemplo_teste)
    '../../.env.local',           // Raiz do projeto  
    '../.env.local',              // Um nível acima
    '.env.local',                 // Diretório atual
    '.env'                        // Arquivo .env padrão
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
    console.log('⚠️  Arquivo .env.local não encontrado, usando variáveis de ambiente manuais');
  }
} catch (error) {
  // dotenv não instalado, usar variável de ambiente manual
  console.log('⚠️  dotenv não instalado, usando variáveis de ambiente manuais');
}

// Importar Supabase client
const { createClient } = require('@supabase/supabase-js');

// Função para obter configuração da API Sympla
function getSymplaConfig() {
  const token = '2835b1e7099e748057c71a9c0c34b3a4ca1246b379687ebf8affa92cdc65a7a4'; // CHAVE_ATIVA
  
  if (!token) {
    throw new Error('SYMPLA_API_TOKEN não encontrado nos secrets - configure a variável de ambiente');
  }
  
  return {
    hostname: 'api.sympla.com.br',
    token: token,
    headers: {
      's_token': token,
      'Content-Type': 'application/json',
      'User-Agent': 'SGB-Sync-Completo/1.0'
    }
  };
}

// Função para obter configuração do Supabase
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis do Supabase não configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }
  
  return { supabaseUrl, serviceRoleKey };
}

// Função para fazer requisições HTTPS à API do Sympla com retry
async function makeSymplaRequest(path, tentativa = 1, maxTentativas = 3) {
  const config = getSymplaConfig();
  const url = `https://${config.hostname}${path}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: config.headers
    });

    if (!response.ok) {
      throw new Error(`Sympla API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (tentativa < maxTentativas) {
      console.log(`⚠️  Tentativa ${tentativa} falhou, tentando novamente em 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return makeSymplaRequest(path, tentativa + 1, maxTentativas);
    }
    throw error;
  }
}

// Função para gerar lista de datas no período
function gerarListaDatas(dataInicio, dataFim) {
  const datas = [];
  const atual = new Date(dataInicio);
  const fim = new Date(dataFim);
  
  while (atual <= fim) {
    datas.push(atual.toISOString().split('T')[0]);
    atual.setDate(atual.getDate() + 1);
  }
  
  return datas;
}

// Função para buscar eventos de uma data específica
async function buscarEventosData(data) {
  let todosEventos = [];
  let pagina = 1;
  let temProximaPagina = true;

  // Criar objetos Date para comparação precisa
  const dataAlvo = new Date(data + 'T00:00:00-03:00'); // Forçar fuso Brasil
  const dataInicioDia = new Date(dataAlvo);
  dataInicioDia.setHours(0, 0, 0, 0);
  
  const dataFimDia = new Date(dataAlvo);
  dataFimDia.setHours(23, 59, 59, 999);

  console.log(`   🔍 Buscando eventos para ${data} (${dataInicioDia.toLocaleString('pt-BR')} até ${dataFimDia.toLocaleString('pt-BR')})`);

  // Buscar em um período de 1 mês ao redor da data para garantir que pegamos o evento
  const dataBase = new Date(data);
  const dataInicioMes = new Date(dataBase.getFullYear(), dataBase.getMonth(), 1);
  const dataFimMes = new Date(dataBase.getFullYear(), dataBase.getMonth() + 1, 0);
  
  const fromDate = dataInicioMes.toISOString().split('T')[0];
  const toDate = dataFimMes.toISOString().split('T')[0];
  
  console.log(`     🗓️  Buscando no período: ${fromDate} até ${toDate}`);

  while (temProximaPagina) {
    const path = `/public/v1.5.1/events?page=${pagina}&start_date=${fromDate}&end_date=${toDate}`;
    
    try {
      const response = await makeSymplaRequest(path);

      if (response.data && response.data.length > 0) {
        // Filtrar eventos com 'ordi' E que estejam na data específica
        const eventosFiltrados = response.data.filter(evento => {
          // Primeiro filtro: deve conter 'ordi'
          if (!evento.name || !evento.name.toLowerCase().includes('ordi')) {
            return false;
          }
          
          // Segundo filtro: deve estar na data específica
          if (!evento.start_date) {
            return false;
          }
          
          const dataEvento = new Date(evento.start_date);
          
          // Verificar se o evento está no dia específico (comparar apenas a data, não o horário)
          const dataEventoStr = dataEvento.toISOString().split('T')[0];
          const dataAlvoStr = data;
          
          return dataEventoStr === dataAlvoStr;
        });
        
        console.log(`     📄 Página ${pagina}: ${response.data.length} eventos total, ${eventosFiltrados.length} do Ordi na data`);
        
        todosEventos = todosEventos.concat(eventosFiltrados);
        pagina++;
        
        if (response.data.length < 100) {
          temProximaPagina = false;
        }
      } else {
        temProximaPagina = false;
      }
    } catch (error) {
      console.log(`   ⚠️  Erro na página ${pagina}: ${error.message}`);
      temProximaPagina = false;
    }
  }

  console.log(`   ✅ Total encontrado para ${data}: ${todosEventos.length} eventos do Ordi`);
  return todosEventos;
}

// Função para buscar participantes de um evento (com paginação completa)
async function buscarTodosParticipantes(eventoId) {
  let todosParticipantes = [];
  let pagina = 1;
  let temProximaPagina = true;

  while (temProximaPagina) {
    const path = `/public/v1.5.1/events/${eventoId}/participants?page=${pagina}`;
    
    try {
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
    } catch (error) {
      console.log(`     ⚠️  Erro ao buscar participantes página ${pagina}: ${error.message}`);
      temProximaPagina = false;
    }
  }

  return todosParticipantes;
}

// Função para buscar pedidos de um evento (com paginação completa)
async function buscarTodosPedidos(eventoId) {
  let todosPedidos = [];
  let pagina = 1;
  let temProximaPagina = true;

  while (temProximaPagina) {
    const path = `/public/v1.5.1/events/${eventoId}/orders?page=${pagina}`;
    
    try {
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
    } catch (error) {
      console.log(`     ⚠️  Erro ao buscar pedidos página ${pagina}: ${error.message}`);
      temProximaPagina = false;
    }
  }

  return todosPedidos;
}

// Função para inserir eventos no banco
async function inserirEventos(supabase, eventos) {
  if (eventos.length === 0) return 0;
  
  const eventosParaInserir = eventos.map(evento => ({
    bar_id: 3, // Adicionar bar_id
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
  
  return data?.length || 0;
}

// Função para inserir participantes no banco (processamento em lotes)
async function inserirParticipantes(supabase, eventoId, participantes) {
  if (participantes.length === 0) return 0;
  
  const participantesParaInserir = participantes.map(participante => ({
    bar_id: 3, // Adicionar bar_id
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
    }
  }
  
  return totalInserido;
}

// Função para inserir pedidos no banco (processamento em lotes)
async function inserirPedidos(supabase, eventoId, pedidos) {
  if (pedidos.length === 0) return 0;
  
  const pedidosParaInserir = pedidos.map(pedido => ({
    bar_id: 3, // Adicionar bar_id
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
  
  // Processar em lotes de 100 para evitar timeout
  const tamanhoLote = 100;
  let totalInserido = 0;
  
  for (let i = 0; i < pedidosParaInserir.length; i += tamanhoLote) {
    const lote = pedidosParaInserir.slice(i, i + tamanhoLote);
    
    const { data, error } = await supabase
      .from('sympla_pedidos')
      .upsert(lote, {
        onConflict: 'pedido_sympla_id,evento_sympla_id',
        ignoreDuplicates: false
      })
      .select('id');
    
    if (error) {
      console.error(`❌ Erro no lote ${Math.floor(i/tamanhoLote) + 1}:`, error);
    } else {
      totalInserido += data?.length || 0;
    }
  }
  
  return totalInserido;
}

// Função para processar uma data específica
async function processarData(supabase, data, indice, total) {
  console.log(`\n📅 [${indice}/${total}] Processando: ${data}`);
  
  try {
    // Buscar eventos da data
    const eventos = await buscarEventosData(data);
    
    if (eventos.length === 0) {
      console.log(`   ❌ Nenhum evento do Ordi encontrado`);
      return { eventos: 0, participantes: 0, pedidos: 0 };
    }
    
    console.log(`   🎪 ${eventos.length} eventos encontrados`);
    
    // Inserir eventos
    const eventosInseridos = await inserirEventos(supabase, eventos);
    
    let totalParticipantes = 0;
    let totalPedidos = 0;
    
    // Processar cada evento
    for (let i = 0; i < eventos.length; i++) {
      const evento = eventos[i];
      console.log(`   📊 [${i + 1}/${eventos.length}] "${evento.name}" (${evento.id})`);
      
      // Buscar participantes
      const participantes = await buscarTodosParticipantes(evento.id);
      console.log(`     👥 ${participantes.length} participantes`);
      
      if (participantes.length > 0) {
        const participantesInseridos = await inserirParticipantes(supabase, evento.id, participantes);
        totalParticipantes += participantesInseridos;
      }
      
      // Buscar pedidos
      const pedidos = await buscarTodosPedidos(evento.id);
      console.log(`     💰 ${pedidos.length} pedidos`);
      
      if (pedidos.length > 0) {
        const pedidosInseridos = await inserirPedidos(supabase, evento.id, pedidos);
        totalPedidos += pedidosInseridos;
      }
    }
    
    console.log(`   ✅ Concluído: ${eventos.length} eventos, ${totalParticipantes} participantes, ${totalPedidos} pedidos`);
    
    return { 
      eventos: eventos.length, 
      participantes: totalParticipantes, 
      pedidos: totalPedidos 
    };
    
  } catch (error) {
    console.error(`   ❌ Erro ao processar ${data}:`, error.message);
    return { eventos: 0, participantes: 0, pedidos: 0 };
  }
}

// Função para buscar TODOS os eventos do Ordi no período
async function buscarTodosEventosOrdi(dataInicio, dataFim) {
  console.log('🔍 FASE 1: Descobrindo todos os eventos do Ordi no período...');
  
  let todosEventosOrdi = [];
  let pagina = 1;
  let temProximaPagina = true;
  
  // Buscar em todo o período de uma vez
  const fromDate = dataInicio;
  const toDate = dataFim;
  
  console.log(`📅 Buscando eventos de ${fromDate} até ${toDate}`);
  
  while (temProximaPagina) {
    const path = `/public/v1.5.1/events?page=${pagina}&start_date=${fromDate}&end_date=${toDate}`;
    
    try {
      console.log(`   📄 Página ${pagina}...`);
      const response = await makeSymplaRequest(path);

      if (response.data && response.data.length > 0) {
        // Filtrar apenas eventos com 'ordi'
        const eventosOrdi = response.data.filter(evento => {
          return evento.name && evento.name.toLowerCase().includes('ordi') && evento.start_date;
        });
        
        console.log(`     📊 ${response.data.length} eventos total, ${eventosOrdi.length} do Ordi`);
        
        todosEventosOrdi = todosEventosOrdi.concat(eventosOrdi);
        pagina++;
        
        if (response.data.length < 100) {
          temProximaPagina = false;
        }
      } else {
        temProximaPagina = false;
      }
    } catch (error) {
      console.log(`   ⚠️  Erro na página ${pagina}: ${error.message}`);
      temProximaPagina = false;
    }
  }
  
  console.log(`✅ TOTAL: ${todosEventosOrdi.length} eventos do Ordi encontrados`);
  
  // Extrair datas únicas
  const datasUnicas = [...new Set(todosEventosOrdi.map(evento => {
    const dataEvento = new Date(evento.start_date);
    return dataEvento.toISOString().split('T')[0];
  }))].sort();
  
  console.log(`📅 Datas com eventos do Ordi: ${datasUnicas.length}`);
  datasUnicas.forEach((data, index) => {
    const eventosNaData = todosEventosOrdi.filter(evento => {
      const dataEvento = new Date(evento.start_date).toISOString().split('T')[0];
      return dataEvento === data;
    });
    console.log(`   ${index + 1}. ${data} - ${eventosNaData.length} evento(s)`);
  });
  
  return { todosEventosOrdi, datasUnicas };
}

// Função principal de sync completo
async function syncSymplaCompleto(dataInicio, dataFim, modeTeste = false) {
  console.log('🎪 SYNC INTELIGENTE SYMPLA - BUSCA OTIMIZADA\n');
  
  try {
    // Verificar configurações
    console.log('🔧 Verificando configurações...');
    const symplaConfig = getSymplaConfig();
    const supabaseConfig = getSupabaseConfig();
    console.log('✅ Configurações OK');
    
    // Conectar ao Supabase
    const supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.serviceRoleKey);
    console.log('✅ Conectado ao Supabase');
    
    console.log(`📊 Período: ${dataInicio} até ${dataFim}`);
    
    // FASE 1: Buscar todos os eventos do Ordi e descobrir as datas
    const { todosEventosOrdi, datasUnicas } = await buscarTodosEventosOrdi(dataInicio, dataFim);
    
    if (datasUnicas.length === 0) {
      console.log('❌ Nenhum evento do Ordi encontrado no período');
      return;
    }
    
    let datasParaProcessar = datasUnicas;
    
    if (modeTeste) {
      // Modo teste: apenas primeiras 3 datas
      datasParaProcessar = datasUnicas.slice(0, 3);
      console.log(`🧪 MODO TESTE: Processando apenas ${datasParaProcessar.length} primeiras datas`);
    }
    
    console.log(`\n🔄 FASE 2: Processando dados detalhados de ${datasParaProcessar.length} datas...`);
    
    // Estatísticas gerais
    let totalEventos = 0;
    let totalParticipantes = 0;
    let totalPedidos = 0;
    let datasComEventos = 0;
    
    const inicioProcessamento = Date.now();
    
    // Processar apenas as datas que têm eventos
    for (let i = 0; i < datasParaProcessar.length; i++) {
      const data = datasParaProcessar[i];
      
      // Filtrar eventos desta data específica
      const eventosNaData = todosEventosOrdi.filter(evento => {
        const dataEvento = new Date(evento.start_date).toISOString().split('T')[0];
        return dataEvento === data;
      });
      
      console.log(`\n📅 [${i + 1}/${datasParaProcessar.length}] Processando: ${data}`);
      console.log(`   🎪 ${eventosNaData.length} eventos do Ordi nesta data`);
      
      // Inserir eventos no banco
      const eventosInseridos = await inserirEventos(supabase, eventosNaData);
      totalEventos += eventosNaData.length;
      
      let participantesNaData = 0;
      let pedidosNaData = 0;
      
      // Processar cada evento da data
      for (let j = 0; j < eventosNaData.length; j++) {
        const evento = eventosNaData[j];
        console.log(`   📊 [${j + 1}/${eventosNaData.length}] "${evento.name}" (${evento.id})`);
        
        // Buscar participantes
        const participantes = await buscarTodosParticipantes(evento.id);
        console.log(`     👥 ${participantes.length} participantes`);
        
        if (participantes.length > 0) {
          const participantesInseridos = await inserirParticipantes(supabase, evento.id, participantes);
          participantesNaData += participantesInseridos;
        }
        
        // Buscar pedidos
        const pedidos = await buscarTodosPedidos(evento.id);
        console.log(`     💰 ${pedidos.length} pedidos`);
        
        if (pedidos.length > 0) {
          const pedidosInseridos = await inserirPedidos(supabase, evento.id, pedidos);
          pedidosNaData += pedidosInseridos;
        }
      }
      
      totalParticipantes += participantesNaData;
      totalPedidos += pedidosNaData;
      datasComEventos++;
      
      console.log(`   ✅ Concluído: ${eventosNaData.length} eventos, ${participantesNaData} participantes, ${pedidosNaData} pedidos`);
      
      // Delay entre datas para não sobrecarregar a API
      if (i < datasParaProcessar.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const tempoTotal = Math.round((Date.now() - inicioProcessamento) / 1000);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO FINAL DO SYNC INTELIGENTE');
    console.log('='.repeat(80));
    console.log(`📅 Período processado: ${dataInicio} até ${dataFim}`);
    console.log(`⏱️  Tempo total: ${tempoTotal}s (${Math.round(tempoTotal/60)}min)`);
    console.log(`📊 Datas com eventos do Ordi: ${datasComEventos}`);
    console.log(`🎪 Total eventos: ${totalEventos}`);
    console.log(`👥 Total participantes: ${totalParticipantes}`);
    console.log(`💰 Total pedidos: ${totalPedidos}`);
    
    // Verificar dados finais no banco
    console.log('\n📊 Verificando dados no banco...');
    
    const { count: eventosNoBanco } = await supabase
      .from('sympla_eventos')
      .select('*', { count: 'exact', head: true });
    
    const { count: participantesNoBanco } = await supabase
      .from('sympla_participantes')
      .select('*', { count: 'exact', head: true });
    
    const { count: pedidosNoBanco } = await supabase
      .from('sympla_pedidos')
      .select('*', { count: 'exact', head: true });
    
    const { count: checkinsNoBanco } = await supabase
      .from('sympla_participantes')
      .select('*', { count: 'exact', head: true })
      .eq('fez_checkin', true);
    
    console.log(`✅ Eventos no banco: ${eventosNoBanco || 0}`);
    console.log(`✅ Participantes no banco: ${participantesNoBanco || 0}`);
    console.log(`✅ Pedidos no banco: ${pedidosNoBanco || 0}`);
    console.log(`✅ Check-ins no banco: ${checkinsNoBanco || 0}`);
    
    console.log('\n🎉 SYNC COMPLETO FINALIZADO COM SUCESSO!');
    
  } catch (error) {
    console.error('\n❌ ERRO NO SYNC COMPLETO:', error.message);
    console.log('\n📋 Verificações:');
    console.log('1. ✅ Variável SYMPLA_API_TOKEN configurada?');
    console.log('2. ✅ Variáveis do Supabase configuradas?');
    console.log('3. ✅ npm install @supabase/supabase-js executado?');
    console.log('4. ✅ Internet funcionando?');
  }
}

// Verificar configurações
console.log('🔧 Verificando configuração...');

const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('\n❌ Variáveis de ambiente não configuradas:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📋 Configure no arquivo .env.local e tente novamente');
  console.log('\n💡 Precisa instalar: npm install @supabase/supabase-js');
  process.exit(1);
}

// Processar argumentos da linha de comando
const args = process.argv.slice(2);
let dataInicio = '2025-01-31';
let dataFim = new Date().toISOString().split('T')[0]; // Hoje
let modeTeste = false;

// Processar argumentos
args.forEach(arg => {
  if (arg.startsWith('--data-inicio=')) {
    dataInicio = arg.split('=')[1];
  } else if (arg.startsWith('--data-fim=')) {
    dataFim = arg.split('=')[1];
  } else if (arg === '--teste') {
    modeTeste = true;
  }
});

// Validar datas
if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicio) || !/^\d{4}-\d{2}-\d{2}$/.test(dataFim)) {
  console.log('❌ Formato de data inválido. Use: YYYY-MM-DD');
  console.log('💡 Exemplo: node sync-sympla-periodo-completo.js --data-inicio=2025-01-31 --data-fim=2025-01-31');
  process.exit(1);
}

console.log('✅ Configurações OK!');
console.log(`🎪 Iniciando sync completo em 3 segundos...`);
console.log(`📅 Período: ${dataInicio} até ${dataFim}`);

if (modeTeste) {
  console.log('🧪 MODO TESTE ATIVADO - Apenas 3 datas');
}

console.log('\n💡 Opções disponíveis:');
console.log('   --data-inicio=YYYY-MM-DD (padrão: 2025-01-31)');
console.log('   --data-fim=YYYY-MM-DD (padrão: hoje)');
console.log('   --teste (processa apenas 3 datas)\n');

setTimeout(() => syncSymplaCompleto(dataInicio, dataFim, modeTeste), 3000);
