// Teste específico Sympla - Dados de 20.07.2025
// Foco: Verificar se check-ins aumentaram com novo login
// 
// Para rodar: 
//   node exemplo_teste/sympla/teste-sympla-20-07-checkins.js

const fs = require('fs');

// Função para carregar .env.local manualmente (sem dotenv)
function loadEnvManually() {
  const path = require('path');
  
  // Caminhos possíveis para o .env.local
  const envPaths = [
    path.resolve(__dirname, '../../frontend/.env.local'),
    path.resolve(process.cwd(), 'frontend/.env.local'),
    path.resolve(process.cwd(), '.env.local')
  ];
  
  console.log('🔍 Procurando .env.local...');
  
  for (const envPath of envPaths) {
    console.log(`   Testando: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      console.log(`   ✅ Encontrado!`);
      
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        
        let loaded = 0;
        for (const line of lines) {
          // Ignorar comentários e linhas vazias
          if (line.trim() && !line.trim().startsWith('#')) {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim();
              // Remover aspas se existirem
              const cleanValue = value.replace(/^["']|["']$/g, '');
              process.env[key.trim()] = cleanValue;
              loaded++;
            }
          }
        }
        
        console.log(`🔧 Carregadas ${loaded} variáveis de: ${envPath}`);
        return true;
      } catch (error) {
        console.log(`   ❌ Erro ao ler arquivo: ${error.message}`);
      }
    } else {
      console.log(`   ❌ Não encontrado`);
    }
  }
  
  console.log('⚠️  Nenhum .env.local encontrado nos caminhos testados');
  return false;
}

// Carregar variáveis de ambiente
loadEnvManually();

const { createClient } = require('@supabase/supabase-js');

// Configuração Sympla
function getSymplaConfig() {
  // CHAVES DISPONÍVEIS - teste com login atualizado
  const token = '3085e782ebcccbbc75b26f6a5057f170e4dfa4aeabe4c19974fc2639fbfc0a77'; // CHAVE_ORIGINAL
  //const token = 'e96a8233fd5acc27c65b166bf424dd8e1874f4d48b16ee2029c93b6f80fd6a06'; // CHAVE_1
  //const token = '24a8cb785b622adeb3239928dd2ac79ec3f1a076558b0159ee9d4d27c8099022'; // CHAVE_2
  
  if (!token) {
    throw new Error('SYMPLA_API_TOKEN não encontrado');
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

// Configuração Supabase
function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Variáveis do Supabase não configuradas');
  }
  
  return { supabaseUrl, serviceRoleKey };
}

// Fazer requisição Sympla
async function makeSymplaRequest(path) {
  const config = getSymplaConfig();
  const url = `https://${config.hostname}${path}`;
  
  console.log(`🔗 Requisição: ${url}`);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: config.headers
  });

  if (!response.ok) {
    throw new Error(`Sympla API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Buscar eventos do dia 20.07.2025
async function buscarEventos2007() {
  console.log('🎪 Buscando eventos de 20.07.2025...');
  
  let todosEventos = [];
  let pagina = 1;
  let temProximaPagina = true;

  while (temProximaPagina) {
    console.log(`   📄 Página ${pagina}...`);
    const path = `/public/v1.5.1/events?page=${pagina}`;
    const response = await makeSymplaRequest(path);

    if (response.data && response.data.length > 0) {
      todosEventos = todosEventos.concat(response.data);
      pagina++;
      
      if (response.data.length < 100) {
        temProximaPagina = false;
      }
    } else {
      temProximaPagina = false;
    }
  }

  // Filtrar eventos de 20.07.2025
  const data2007 = '2025-07-20';
  const eventos2007 = todosEventos.filter(evento => {
    if (!evento.start_date) return false;
    
    const dataEvento = evento.start_date.split('T')[0]; // Pegar só a data
    return dataEvento === data2007;
  });

  console.log(`✅ Total eventos encontrados: ${todosEventos.length}`);
  console.log(`🎯 Eventos de 20.07.2025: ${eventos2007.length}`);
  
  return eventos2007;
}

// Buscar participantes com paginação completa
async function buscarParticipantesCompleto(eventoId) {
  console.log(`👥 Buscando participantes do evento ${eventoId}...`);
  
  let todosParticipantes = [];
  let pagina = 1;
  let temProximaPagina = true;

  while (temProximaPagina) {
    console.log(`   📄 Página ${pagina}...`);
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

  console.log(`   ✅ ${todosParticipantes.length} participantes encontrados`);
  return todosParticipantes;
}

// Analisar check-ins
function analisarCheckins(participantes) {
  const comCheckin = participantes.filter(p => p.checkin?.check_in === true);
  const semCheckin = participantes.filter(p => !p.checkin?.check_in);
  
  const estatisticas = {
    total: participantes.length,
    comCheckin: comCheckin.length,
    semCheckin: semCheckin.length,
    percentualCheckin: participantes.length > 0 ? ((comCheckin.length / participantes.length) * 100).toFixed(1) : 0
  };
  
  return { estatisticas, comCheckin, semCheckin };
}

// Comparar com dados do banco
async function compararComBanco(supabase, eventoId) {
  console.log(`📊 Comparando com dados do banco para evento ${eventoId}...`);
  
  // Buscar dados atuais no banco
  const { data: participantesBanco, error } = await supabase
    .from('sympla_participantes')
    .select('*')
    .eq('evento_sympla_id', eventoId);
  
  if (error) {
    console.error('❌ Erro ao buscar dados do banco:', error);
    return null;
  }
  
  const checkinsNoBanco = participantesBanco?.filter(p => p.fez_checkin === true).length || 0;
  const totalNoBanco = participantesBanco?.length || 0;
  
  return {
    totalNoBanco,
    checkinsNoBanco,
    percentualBanco: totalNoBanco > 0 ? ((checkinsNoBanco / totalNoBanco) * 100).toFixed(1) : 0
  };
}

// Função principal
async function testarCheckins2007() {
  console.log('🎯 TESTE SYMPLA 20.07.2025 - VERIFICAÇÃO DE CHECK-INS\n');
  console.log('📅 Data alvo: 20 de Julho de 2025');
  console.log('🎯 Objetivo: Verificar se check-ins aumentaram com novo login\n');

  try {
    // Configurações
    console.log('🔧 Verificando configurações...');
    const symplaConfig = getSymplaConfig();
    const supabaseConfig = getSupabaseConfig();
    console.log('✅ Configurações OK');
    
    // Conectar Supabase
    const supabase = createClient(supabaseConfig.supabaseUrl, supabaseConfig.serviceRoleKey);
    console.log('✅ Conectado ao Supabase');
    
    // Buscar eventos de 20.07.2025
    const eventos2007 = await buscarEventos2007();
    
    if (eventos2007.length === 0) {
      console.log('❌ Nenhum evento encontrado para 20.07.2025');
      return;
    }
    
    console.log('\n📋 EVENTOS ENCONTRADOS DE 20.07.2025:');
    eventos2007.forEach((evento, index) => {
      console.log(`   ${index + 1}. "${evento.name}" (ID: ${evento.id})`);
      console.log(`      Data: ${evento.start_date}`);
      console.log(`      Status: ${evento.published === 1 ? 'Publicado' : 'Não publicado'}`);
    });
    
    // Analisar cada evento
    console.log('\n🔍 ANÁLISE DETALHADA POR EVENTO:');
    
    let totalGeralAPI = 0;
    let totalCheckinAPI = 0;
    let totalGeralBanco = 0;
    let totalCheckinBanco = 0;
    
    for (let i = 0; i < eventos2007.length; i++) {
      const evento = eventos2007[i];
      console.log(`\n📅 [${i + 1}/${eventos2007.length}] Analisando: "${evento.name}"`);
      console.log(`   🆔 ID: ${evento.id}`);
      
      // Buscar participantes da API
      const participantesAPI = await buscarParticipantesCompleto(evento.id);
      const analiseAPI = analisarCheckins(participantesAPI);
      
      // Comparar com banco
      const dadosBanco = await compararComBanco(supabase, evento.id);
      
      console.log(`\n   📊 RESULTADOS API (ATUAL):`);
      console.log(`      Total participantes: ${analiseAPI.estatisticas.total}`);
      console.log(`      Com check-in: ${analiseAPI.estatisticas.comCheckin}`);
      console.log(`      Sem check-in: ${analiseAPI.estatisticas.semCheckin}`);
      console.log(`      Percentual check-in: ${analiseAPI.estatisticas.percentualCheckin}%`);
      
      if (dadosBanco) {
        console.log(`\n   📊 RESULTADOS BANCO (ANTERIOR):`);
        console.log(`      Total participantes: ${dadosBanco.totalNoBanco}`);
        console.log(`      Com check-in: ${dadosBanco.checkinsNoBanco}`);
        console.log(`      Percentual check-in: ${dadosBanco.percentualBanco}%`);
        
        // Comparação
        const diferencaTotal = analiseAPI.estatisticas.total - dadosBanco.totalNoBanco;
        const diferencaCheckins = analiseAPI.estatisticas.comCheckin - dadosBanco.checkinsNoBanco;
        
        console.log(`\n   🔄 DIFERENÇAS (API vs BANCO):`);
        console.log(`      Participantes: ${diferencaTotal > 0 ? '+' : ''}${diferencaTotal}`);
        console.log(`      Check-ins: ${diferencaCheckins > 0 ? '+' : ''}${diferencaCheckins}`);
        
        if (diferencaCheckins > 0) {
          console.log(`      ✅ AUMENTOU ${diferencaCheckins} check-ins!`);
        } else if (diferencaCheckins < 0) {
          console.log(`      ⚠️ DIMINUIU ${Math.abs(diferencaCheckins)} check-ins`);
        } else {
          console.log(`      ➖ Check-ins iguais`);
        }
        
        totalGeralBanco += dadosBanco.totalNoBanco;
        totalCheckinBanco += dadosBanco.checkinsNoBanco;
      }
      
      totalGeralAPI += analiseAPI.estatisticas.total;
      totalCheckinAPI += analiseAPI.estatisticas.comCheckin;
      
      // Mostrar alguns check-ins recentes
      if (analiseAPI.comCheckin.length > 0) {
        console.log(`\n   📋 ÚLTIMOS CHECK-INS:`);
        analiseAPI.comCheckin
          .sort((a, b) => new Date(b.checkin?.check_in_date || 0) - new Date(a.checkin?.check_in_date || 0))
          .slice(0, 5)
          .forEach((p, idx) => {
            const dataCheckin = p.checkin?.check_in_date ? new Date(p.checkin.check_in_date).toLocaleString('pt-BR') : 'N/A';
            console.log(`      ${idx + 1}. ${p.first_name} ${p.last_name} - ${dataCheckin}`);
          });
      }
    }
    
    // Resumo final
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMO GERAL - 20.07.2025');
    console.log('='.repeat(70));
    
    console.log(`🎪 Eventos analisados: ${eventos2007.length}`);
    
    console.log(`\n📊 TOTAIS API (ATUAL):`);
    console.log(`   👥 Total participantes: ${totalGeralAPI}`);
    console.log(`   ✅ Total check-ins: ${totalCheckinAPI}`);
    console.log(`   📈 Percentual: ${totalGeralAPI > 0 ? ((totalCheckinAPI / totalGeralAPI) * 100).toFixed(1) : 0}%`);
    
    if (totalGeralBanco > 0) {
      console.log(`\n📊 TOTAIS BANCO (ANTERIOR):`);
      console.log(`   👥 Total participantes: ${totalGeralBanco}`);
      console.log(`   ✅ Total check-ins: ${totalCheckinBanco}`);
      console.log(`   📈 Percentual: ${((totalCheckinBanco / totalGeralBanco) * 100).toFixed(1)}%`);
      
      const difTotalFinal = totalGeralAPI - totalGeralBanco;
      const difCheckinFinal = totalCheckinAPI - totalCheckinBanco;
      
      console.log(`\n🔄 DIFERENÇA GERAL:`);
      console.log(`   👥 Participantes: ${difTotalFinal > 0 ? '+' : ''}${difTotalFinal}`);
      console.log(`   ✅ Check-ins: ${difCheckinFinal > 0 ? '+' : ''}${difCheckinFinal}`);
      
      if (difCheckinFinal > 0) {
        console.log(`\n🎉 SUCESSO! Novo login trouxe +${difCheckinFinal} check-ins!`);
      } else if (difCheckinFinal < 0) {
        console.log(`\n⚠️ ATENÇÃO! Perdeu ${Math.abs(difCheckinFinal)} check-ins`);
      } else {
        console.log(`\n➖ Check-ins mantidos iguais`);
      }
    }
    
    console.log('\n✅ TESTE CONCLUÍDO!');
    console.log('📅 Data testada: 20 de Julho de 2025');
    console.log('🔍 Login atualizado verificado');
    
  } catch (error) {
    console.error('\n❌ ERRO NO TESTE:', error.message);
    console.log('\n📋 Verificações:');
    console.log('1. ✅ Token Sympla válido?');
    console.log('2. ✅ Login atualizado funcionando?');
    console.log('3. ✅ Variáveis Supabase configuradas?');
    console.log('4. ✅ Internet funcionando?');
  }
}

// Verificar configurações
console.log('🔧 Verificando configuração...');

// Debug das variáveis carregadas
console.log('\n🔍 DEBUG - Variáveis carregadas:');
console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Definida' : '❌ Não encontrada'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Definida' : '❌ Não encontrada'}`);

const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('\n❌ Variáveis de ambiente não configuradas:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n📋 Soluções possíveis:');
  console.log('1. Verifique se o arquivo frontend/.env.local existe');
  console.log('2. Instale dotenv: npm install dotenv');
  console.log('3. Ou defina as variáveis manualmente no sistema');
  
  // Tentar usar valores padrão do env.example se disponível
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
    console.log('\n🔧 Usando URL padrão do Supabase do env.example');
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('\n❌ SUPABASE_SERVICE_ROLE_KEY é obrigatória e não pode ser inferida');
    console.log('   Configure no arquivo .env.local do frontend');
    process.exit(1);
  }
}

// Executar teste
console.log('✅ Configurações OK!');
console.log('🎯 Iniciando teste específico para 20.07.2025...\n');
setTimeout(testarCheckins2007, 1000); 