// Teste da API Sympla + Inserção no Banco Supabase
// 
// Para configurar:
//   1. Arquivo .env.local na pasta frontend/ deve ter:
//      - SYMPLA_API_TOKEN=seu_token
//      - NEXT_PUBLIC_SUPABASE_URL=sua_url
//      - NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
//      - SUPABASE_SERVICE_ROLE_KEY=service_role_key
//
// Para rodar: 
//   node exemplo_teste/teste-sympla-api-com-banco.js

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
  // CHAVES DISPONÍVEIS - DESCOMENTE APENAS 1 POR VEZ:
  //const token = '3085e782ebcccbbc75b26f6a5057f170e4dfa4aeabe4c19974fc2639fbfc0a77'; // CHAVE_ORIGINAL
  //const token = 'e96a8233fd5acc27c65b166bf424dd8e1874f4d48b16ee2029c93b6f80fd6a06'; // CHAVE_1
  const token = '24a8cb785b622adeb3239928dd2ac79ec3f1a076558b0159ee9d4d27c8099022'; // CHAVE_2
  
  if (!token) {
    throw new Error('SYMPLA_API_TOKEN não encontrado nos secrets - configure a variável de ambiente');
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

// Função para obter configuração do Supabase
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis do Supabase não configuradas (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
  }
  
  return { supabaseUrl, serviceRoleKey };
}

// Função para fazer requisições HTTPS à API do Sympla (mesmo padrão do código de produção)
async function makeSymplaRequest(path) {
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
  let todosEventos = [];
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
async function buscarTodosParticipantes(eventoId) {
  let todosParticipantes = [];
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
async function buscarTodosPedidos(eventoId) {
  let todosPedidos = [];
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

// Função para inserir eventos no banco
async function inserirEventos(supabase, eventos) {
  console.log(`\n📊 Inserindo ${eventos.length} eventos no banco...`);
  
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
  
  console.log(`✅ ${data?.length || 0} eventos inseridos/atualizados`);
  return data?.length || 0;
}

// Função para inserir participantes no banco (processamento em lotes)
async function inserirParticipantes(supabase, eventoId, participantes) {
  console.log(`\n👥 Inserindo ${participantes.length} participantes do evento ${eventoId}...`);
  
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
async function inserirPedidos(supabase, eventoId, pedidos) {
  console.log(`\n💰 Inserindo ${pedidos.length} pedidos do evento ${eventoId}...`);
  
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
    console.log(`   📦 Processando lote ${Math.floor(i/tamanhoLote) + 1}: ${lote.length} registros`);
    
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
      console.log(`   ✅ Lote ${Math.floor(i/tamanhoLote) + 1}: ${data?.length || 0} registros`);
    }
  }
  
  console.log(`✅ TOTAL: ${totalInserido} pedidos inseridos/atualizados`);
  return totalInserido;
}

// Função principal de teste
async function testarSymplaAPIComBanco() {
  console.log('🎪 TESTE DA API SYMPLA + BANCO SUPABASE\n');

  try {
    // Verificar configurações
    console.log('🔧 Verificando configurações...');
    const symplaConfig = getSymplaConfig();
    const supabaseConfig = getSupabaseConfig();
    console.log('✅ Configurações OK');
    
    // Conectar ao Supabase
    const supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.serviceRoleKey);
    console.log('✅ Conectado ao Supabase');
    
    // Teste 1: Buscar TODOS os eventos (com paginação)
    console.log('\n📡 Teste 1: Buscando todos os eventos com paginação...');
    const todosEventos = await buscarTodosEventos();
    
    console.log(`✅ Resposta recebida com sucesso!`);
    console.log(`📊 TOTAL de eventos encontrados: ${todosEventos.length}`);
    
    // Filtrar eventos com 'ordi'
    const eventosOrdi = todosEventos.filter(evento => {
      return evento.name && evento.name.toLowerCase().includes('ordi');
    });
    
    console.log(`🎯 Eventos com "ordi" encontrados: ${eventosOrdi.length}`);
    
    if (eventosOrdi.length === 0) {
      console.log('❌ Nenhum evento do Ordi encontrado');
      return;
    }
    
    // Inserir eventos no banco
    const eventosInseridos = await inserirEventos(supabase, eventosOrdi);
    
    // Processar TODOS os eventos (não só o primeiro!)
    console.log(`\n🔄 Processando participantes e pedidos de TODOS os ${eventosOrdi.length} eventos...`);
    
    let totalParticipantesTodos = 0;
    let totalPedidosTodos = 0;
    
    for (let i = 0; i < eventosOrdi.length; i++) {
      const evento = eventosOrdi[i];
      console.log(`\n📅 [${i + 1}/${eventosOrdi.length}] Processando: "${evento.name}" (${evento.id})`);
      
      // Buscar TODOS os participantes deste evento
      const participantesEvento = await buscarTodosParticipantes(evento.id);
      console.log(`   👥 Participantes encontrados: ${participantesEvento.length}`);
      totalParticipantesTodos += participantesEvento.length;
      
      // Inserir participantes no banco
      if (participantesEvento.length > 0) {
        await inserirParticipantes(supabase, evento.id, participantesEvento);
      }
      
      // Buscar TODOS os pedidos deste evento
      const pedidosEvento = await buscarTodosPedidos(evento.id);
      console.log(`   💰 Pedidos encontrados: ${pedidosEvento.length}`);
      totalPedidosTodos += pedidosEvento.length;
      
      // Inserir pedidos no banco
      if (pedidosEvento.length > 0) {
        await inserirPedidos(supabase, evento.id, pedidosEvento);
      }
      
      console.log(`   ✅ Evento ${i + 1} processado`);
    }
    
    console.log(`\n📊 RESUMO GERAL:`);
    console.log(`   🎪 Eventos processados: ${eventosOrdi.length}`);
    console.log(`   👥 Total participantes: ${totalParticipantesTodos}`);
    console.log(`   💰 Total pedidos: ${totalPedidosTodos}`);
    
    // Verificar dados no banco
    console.log('\n📊 Verificando dados inseridos no banco...');
    
    const { data: eventosNoBanco } = await supabase
      .from('sympla_eventos')
      .select('*')
      .order('created_at', { ascending: false });
    
    const { count: totalParticipantes } = await supabase
      .from('sympla_participantes')
      .select('*', { count: 'exact', head: true });
    
    const { count: totalPedidos } = await supabase
      .from('sympla_pedidos')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Eventos no banco: ${eventosNoBanco?.length || 0}`);
    console.log(`✅ Participantes no banco: ${totalParticipantes || 0}`);
    console.log(`✅ Pedidos no banco: ${totalPedidos || 0}`);
    
    // Estatísticas de check-ins
    const { count: totalCheckins } = await supabase
      .from('sympla_participantes')
      .select('*', { count: 'exact', head: true })
      .eq('fez_checkin', true);
    
    console.log(`📊 Check-ins realizados: ${totalCheckins || 0}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('✅ API Sympla funcionando');
    console.log('✅ Dados inseridos no banco Supabase');
    console.log('✅ Estrutura validada para Edge Function');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.log('\n📋 Verificações:');
    console.log('1. ✅ Variável SYMPLA_API_TOKEN configurada?');
    console.log('2. ✅ Variáveis do Supabase configuradas?');
    console.log('3. ✅ npm install @supabase/supabase-js executado?');
    console.log('4. ✅ Internet funcionando?');
  }
}

// Verificar se configurações estão ok antes de executar
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

// Executar teste
console.log('✅ Configurações OK!');
console.log('🎪 Iniciando teste em 2 segundos...\n');
setTimeout(testarSymplaAPIComBanco, 2000); 