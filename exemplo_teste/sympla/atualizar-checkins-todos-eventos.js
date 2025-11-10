// Atualizar Check-ins de TODOS os Eventos Sympla
// 
// Este script busca todos os eventos do banco e re-sincroniza
// participantes e pedidos para pegar check-ins atualizados
//
// Para rodar: 
//   node exemplo_teste/sympla/atualizar-checkins-todos-eventos.js

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
async function atualizarCheckins() {
  console.log('🔄 ATUALIZAR CHECK-INS - TODOS OS EVENTOS SYMPLA\n');
  
  try {
    // Verificar configurações
    console.log('🔧 Verificando configurações...');
    const symplaConfig = getSymplaConfig();
    const supabaseConfig = getSupabaseConfig();
    console.log('✅ Configurações OK');
    
    // Conectar ao Supabase
    const supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.serviceRoleKey);
    console.log('✅ Conectado ao Supabase\n');
    
    // Buscar TODOS os eventos do banco
    console.log('📊 Buscando eventos no banco...');
    const { data: eventos, error: eventosError } = await supabase
      .from('sympla_eventos')
      .select('evento_sympla_id, nome_evento, data_inicio')
      .order('data_inicio', { ascending: true });
    
    if (eventosError) {
      throw new Error(`Erro ao buscar eventos: ${eventosError.message}`);
    }
    
    console.log(`✅ ${eventos.length} eventos encontrados no banco\n`);
    
    // Estatísticas
    let totalParticipantesAntes = 0;
    let totalCheckinsAntes = 0;
    let totalParticipantesDepois = 0;
    let totalCheckinsDepois = 0;
    let eventosAtualizados = 0;
    
    const inicioProcessamento = Date.now();
    
    // Processar cada evento
    for (let i = 0; i < eventos.length; i++) {
      const evento = eventos[i];
      const dataEvento = new Date(evento.data_inicio).toISOString().split('T')[0];
      
      console.log(`\n📅 [${i + 1}/${eventos.length}] ${dataEvento} - "${evento.nome_evento}"`);
      console.log(`   ID: ${evento.evento_sympla_id}`);
      
      // Buscar stats antes
      const { count: participantesAntes } = await supabase
        .from('sympla_participantes')
        .select('*', { count: 'exact', head: true })
        .eq('evento_sympla_id', evento.evento_sympla_id);
      
      const { count: checkinsAntes } = await supabase
        .from('sympla_participantes')
        .select('*', { count: 'exact', head: true })
        .eq('evento_sympla_id', evento.evento_sympla_id)
        .eq('fez_checkin', true);
      
      console.log(`   📊 Antes: ${participantesAntes || 0} participantes, ${checkinsAntes || 0} check-ins`);
      
      totalParticipantesAntes += (participantesAntes || 0);
      totalCheckinsAntes += (checkinsAntes || 0);
      
      try {
        // Buscar participantes atualizados da API
        console.log(`   🔄 Buscando participantes atualizados...`);
        const participantes = await buscarTodosParticipantes(evento.evento_sympla_id);
        console.log(`   👥 ${participantes.length} participantes encontrados`);
        
        if (participantes.length > 0) {
          await inserirParticipantes(supabase, evento.evento_sympla_id, participantes);
        }
        
        // Buscar pedidos atualizados
        console.log(`   🔄 Buscando pedidos atualizados...`);
        const pedidos = await buscarTodosPedidos(evento.evento_sympla_id);
        console.log(`   💰 ${pedidos.length} pedidos encontrados`);
        
        if (pedidos.length > 0) {
          await inserirPedidos(supabase, evento.evento_sympla_id, pedidos);
        }
        
        // Buscar stats depois
        const { count: participantesDepois } = await supabase
          .from('sympla_participantes')
          .select('*', { count: 'exact', head: true })
          .eq('evento_sympla_id', evento.evento_sympla_id);
        
        const { count: checkinsDepois } = await supabase
          .from('sympla_participantes')
          .select('*', { count: 'exact', head: true })
          .eq('evento_sympla_id', evento.evento_sympla_id)
          .eq('fez_checkin', true);
        
        totalParticipantesDepois += (participantesDepois || 0);
        totalCheckinsDepois += (checkinsDepois || 0);
        
        const diferencaCheckins = (checkinsDepois || 0) - (checkinsAntes || 0);
        const emoji = diferencaCheckins > 0 ? '📈' : diferencaCheckins < 0 ? '📉' : '➡️';
        
        console.log(`   ${emoji} Depois: ${participantesDepois || 0} participantes, ${checkinsDepois || 0} check-ins (${diferencaCheckins >= 0 ? '+' : ''}${diferencaCheckins})`);
        console.log(`   ✅ Evento atualizado`);
        
        eventosAtualizados++;
        
      } catch (error) {
        console.error(`   ❌ Erro ao processar evento: ${error.message}`);
      }
      
      // Delay entre eventos
      if (i < eventos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    const tempoTotal = Math.round((Date.now() - inicioProcessamento) / 1000);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMO FINAL DA ATUALIZAÇÃO');
    console.log('='.repeat(80));
    console.log(`⏱️  Tempo total: ${tempoTotal}s (${Math.round(tempoTotal/60)}min)`);
    console.log(`🎪 Eventos processados: ${eventosAtualizados}/${eventos.length}`);
    console.log('');
    console.log('ANTES:');
    console.log(`  👥 Total participantes: ${totalParticipantesAntes}`);
    console.log(`  ✅ Total check-ins: ${totalCheckinsAntes}`);
    console.log(`  📊 Taxa check-in: ${totalParticipantesAntes > 0 ? ((totalCheckinsAntes / totalParticipantesAntes) * 100).toFixed(1) : 0}%`);
    console.log('');
    console.log('DEPOIS:');
    console.log(`  👥 Total participantes: ${totalParticipantesDepois}`);
    console.log(`  ✅ Total check-ins: ${totalCheckinsDepois}`);
    console.log(`  📊 Taxa check-in: ${totalParticipantesDepois > 0 ? ((totalCheckinsDepois / totalParticipantesDepois) * 100).toFixed(1) : 0}%`);
    console.log('');
    console.log('DIFERENÇA:');
    console.log(`  👥 Participantes: ${totalParticipantesDepois >= totalParticipantesAntes ? '+' : ''}${totalParticipantesDepois - totalParticipantesAntes}`);
    console.log(`  ✅ Check-ins: ${totalCheckinsDepois >= totalCheckinsAntes ? '+' : ''}${totalCheckinsDepois - totalCheckinsAntes}`);
    
    console.log('\n🎉 ATUALIZAÇÃO DE CHECK-INS FINALIZADA COM SUCESSO!');
    
  } catch (error) {
    console.error('\n❌ ERRO NA ATUALIZAÇÃO:', error.message);
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
console.log(`🔄 Iniciando atualização de check-ins em 3 segundos...\n`);

setTimeout(() => atualizarCheckins(), 3000);

