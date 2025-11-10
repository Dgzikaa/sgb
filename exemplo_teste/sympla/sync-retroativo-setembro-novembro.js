// Sync Retroativo Sympla - 29/09/2025 até 10/11/2025
// 
// Para configurar:
//   1. Arquivo .env.local na pasta frontend/ deve ter:
//      - SYMPLA_API_TOKEN=seu_token
//      - NEXT_PUBLIC_SUPABASE_URL=sua_url
//      - NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_key
//      - SUPABASE_SERVICE_ROLE_KEY=service_role_key
//
// Para rodar: 
//   node exemplo_teste/sympla/sync-retroativo-setembro-novembro.js

const fs = require('fs');
const path = require('path');

// Carregar .env.local
const envPaths = [
  path.join(__dirname, '../../frontend/.env.local'),
  path.join(__dirname, '../.env.local'),
  path.join(__dirname, '../../.env.local'),
  '.env.local',
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
  process.exit(1);
}

const { createClient } = require('@supabase/supabase-js');

// Configuração Sympla
function getSymplaConfig() {
  const token = '2835b1e7099e748057c71a9c0c34b3a4ca1246b379687ebf8affa92cdc65a7a4'; // CHAVE_ATIVA
  
  if (!token) {
    throw new Error('SYMPLA_API_TOKEN não encontrado');
  }
  
  return {
    hostname: 'api.sympla.com.br',
    token: token,
    headers: {
      's_token': token,
      'Content-Type': 'application/json'
    }
  };
}

// Configuração Supabase
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis do Supabase não configuradas');
  }
  
  return { supabaseUrl, serviceRoleKey };
}

// Fazer requisição à API Sympla
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

// Buscar eventos no período
async function buscarEventosPeriodo(dataInicio, dataFim) {
  let todosEventos = [];
  let pagina = 1;
  let temProximaPagina = true;

  console.log(`🔍 Buscando todos os eventos (filtro de data será aplicado depois)`);
  
  // Converter datas para objetos Date para comparação
  const dataInicioObj = new Date(dataInicio);
  const dataFimObj = new Date(dataFim);

  while (temProximaPagina) {
    const path = `/public/v1.5.1/events?page=${pagina}`;
    
    try {
      console.log(`   📄 Página ${pagina}...`);
      const response = await makeSymplaRequest(path);

      if (response.data && response.data.length > 0) {
        // Filtrar eventos com 'ordi' E no período especificado
        const eventosOrdi = response.data.filter(evento => {
          if (!evento.name || !evento.name.toLowerCase().includes('ordi') || !evento.start_date) {
            return false;
          }
          
          // Verificar se está no período
          const dataEvento = new Date(evento.start_date);
          return dataEvento >= dataInicioObj && dataEvento <= dataFimObj;
        });
        
        console.log(`     📊 ${response.data.length} eventos total, ${eventosOrdi.length} do Ordi no período`);
        
        todosEventos = todosEventos.concat(eventosOrdi);
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

  console.log(`✅ TOTAL: ${todosEventos.length} eventos do Ordi encontrados no período ${dataInicio} a ${dataFim}`);
  return todosEventos;
}

// Buscar participantes de um evento
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

// Buscar pedidos de um evento
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

// Inserir eventos no banco
async function inserirEventos(supabase, eventos) {
  if (eventos.length === 0) return 0;
  
  const eventosParaInserir = eventos.map(evento => ({
    bar_id: 3, // Ordi
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

// Inserir participantes no banco
async function inserirParticipantes(supabase, eventoId, participantes) {
  if (participantes.length === 0) return 0;
  
  const participantesParaInserir = participantes.map(participante => ({
    bar_id: 3, // Ordi
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
  
  // Processar em lotes de 100
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

// Inserir pedidos no banco
async function inserirPedidos(supabase, eventoId, pedidos) {
  if (pedidos.length === 0) return 0;
  
  const pedidosParaInserir = pedidos.map(pedido => ({
    bar_id: 3, // Ordi
    pedido_sympla_id: pedido.id,
    evento_sympla_id: pedido.event_id,
    data_pedido: pedido.order_date ? new Date(pedido.order_date).toISOString() : null,
    status_pedido: pedido.order_status,
    tipo_transacao: pedido.transaction_type,
    nome_comprador: `${pedido.buyer_first_name || ''} ${pedido.buyer_last_name || ''}`.trim(),
    email_comprador: pedido.buyer_email,
    valor_bruto: pedido.order_total_sale_price || 0,
    valor_liquido: pedido.order_total_net_value || 0,
    taxa_sympla: pedido.order_total_sale_price && pedido.order_total_net_value ? 
      (pedido.order_total_sale_price - pedido.order_total_net_value) : 0,
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
  
  // Processar em lotes de 100
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

// Função principal
async function syncRetroativo() {
  console.log('🎪 SYNC RETROATIVO SYMPLA - 29/09/2025 até 10/11/2025\n');
  
  try {
    // Verificar configurações
    console.log('🔧 Verificando configurações...');
    const symplaConfig = getSymplaConfig();
    const supabaseConfig = getSupabaseConfig();
    console.log('✅ Configurações OK');
    
    // Conectar ao Supabase
    const supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.serviceRoleKey);
    console.log('✅ Conectado ao Supabase');
    
    // Período retroativo - desde último evento (28/09) até hoje
    const dataInicio = '2025-09-28'; // Incluir 28/09 para atualizar check-ins
    const dataFim = new Date().toISOString().split('T')[0]; // Hoje
    
    console.log(`📊 Período: ${dataInicio} até ${dataFim}\n`);
    
    // Buscar eventos do período
    const eventos = await buscarEventosPeriodo(dataInicio, dataFim);
    
    if (eventos.length === 0) {
      console.log('❌ Nenhum evento do Ordi encontrado no período');
      return;
    }
    
    // Inserir eventos
    const eventosInseridos = await inserirEventos(supabase, eventos);
    console.log(`✅ ${eventosInseridos} eventos inseridos/atualizados\n`);
    
    // Estatísticas
    let totalParticipantes = 0;
    let totalPedidos = 0;
    let totalCheckins = 0;
    let totalValorBruto = 0;
    let totalValorLiquido = 0;
    
    const inicioProcessamento = Date.now();
    
    // Processar cada evento
    for (let i = 0; i < eventos.length; i++) {
      const evento = eventos[i];
      const dataEvento = new Date(evento.start_date).toISOString().split('T')[0];
      
      console.log(`\n📅 [${i + 1}/${eventos.length}] ${dataEvento} - "${evento.name}" (${evento.id})`);
      
      // Buscar participantes
      const participantes = await buscarTodosParticipantes(evento.id);
      console.log(`   👥 ${participantes.length} participantes`);
      
      if (participantes.length > 0) {
        const participantesInseridos = await inserirParticipantes(supabase, evento.id, participantes);
        totalParticipantes += participantesInseridos;
        
        const checkins = participantes.filter(p => p.checkin?.check_in === true).length;
        totalCheckins += checkins;
      }
      
      // Buscar pedidos
      const pedidos = await buscarTodosPedidos(evento.id);
      console.log(`   💰 ${pedidos.length} pedidos`);
      
      if (pedidos.length > 0) {
        const pedidosInseridos = await inserirPedidos(supabase, evento.id, pedidos);
        totalPedidos += pedidosInseridos;
        
        // Calcular valores
        pedidos.forEach(pedido => {
          totalValorBruto += parseFloat(pedido.order_total_sale_price || '0');
          totalValorLiquido += parseFloat(pedido.order_total_net_value || '0');
        });
      }
      
      console.log(`   ✅ Processado`);
      
      // Delay entre eventos
      if (i < eventos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const tempoTotal = Math.round((Date.now() - inicioProcessamento) / 1000);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO FINAL DO SYNC RETROATIVO');
    console.log('='.repeat(80));
    console.log(`📅 Período: ${dataInicio} até ${dataFim}`);
    console.log(`⏱️  Tempo total: ${tempoTotal}s (${Math.round(tempoTotal/60)}min)`);
    console.log(`🎪 Total eventos: ${eventos.length}`);
    console.log(`👥 Total participantes: ${totalParticipantes}`);
    console.log(`💰 Total pedidos: ${totalPedidos}`);
    console.log(`✅ Total check-ins: ${totalCheckins}`);
    console.log(`💵 Valor bruto: R$ ${totalValorBruto.toFixed(2)}`);
    console.log(`💰 Valor líquido: R$ ${totalValorLiquido.toFixed(2)}`);
    console.log(`📈 Taxa Sympla: R$ ${(totalValorBruto - totalValorLiquido).toFixed(2)}`);
    
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
    
    console.log(`✅ Eventos no banco: ${eventosNoBanco || 0}`);
    console.log(`✅ Participantes no banco: ${participantesNoBanco || 0}`);
    console.log(`✅ Pedidos no banco: ${pedidosNoBanco || 0}`);
    
    console.log('\n🎉 SYNC RETROATIVO FINALIZADO COM SUCESSO!');
    
  } catch (error) {
    console.error('\n❌ ERRO NO SYNC RETROATIVO:', error.message);
  }
}

// Verificar variáveis de ambiente
console.log('🔧 Verificando configuração...');

const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('\n❌ Variáveis de ambiente não configuradas:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📋 Configure no arquivo .env.local e tente novamente');
  process.exit(1);
}

console.log('✅ Configurações OK!');
console.log(`🎪 Iniciando sync retroativo em 3 segundos...\n`);

setTimeout(() => syncRetroativo(), 3000);

