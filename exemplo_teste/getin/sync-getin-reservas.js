/**
 * Script de sincronização de reservas GET IN
 * Busca reservas históricas da API e salva no banco de dados
 * 
 * NOTA: Este script está preparado para quando os endpoints de reservas
 * estiverem disponíveis na documentação da API GET IN
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

// Carregar variáveis de ambiente do .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '../../frontend/.env.local');
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    
    envLines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
              if (key && valueParts.length > 0) {
          let value = valueParts.join('=').trim();
          
          // Remover aspas duplas se existirem
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
          }
          
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
    });
    
    console.log('✅ Variáveis de ambiente carregadas do .env.local');
  } else {
    console.log('⚠️  Arquivo .env.local não encontrado em:', envPath);
  }
}

// Carregar variáveis de ambiente
loadEnvFile();

// Configuração do Supabase
const supabaseUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  console.error('💡 Certifique-se de que o arquivo frontend/.env.local existe e contém a chave');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Busca credenciais do GET IN no banco
 */
async function getGetInCredentials(barId = 3) {
  try {
    const { data, error } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', barId)
      .eq('sistema', 'getin')
      .eq('ativo', true)
      .single();

    if (error || !data) {
      console.error('❌ Credenciais GET IN não encontradas:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar credenciais:', error);
    return null;
  }
}

/**
 * Busca reservas da API GET IN
 */
async function fetchGetInReservations(credentials, params = {}) {
  try {
    console.log('📡 Buscando reservas da API GET IN...');
    
    // Usar sempre a URL da API, não a do painel
    const baseUrl = 'https://api.getinapis.com';
    const endpoint = '/apis/v2/reservations';
    
    // Construir query string com parâmetros
    const queryParams = new URLSearchParams();
    
    // Parâmetros para busca de reservas
    if (params.unitId) queryParams.append('unit_id', params.unitId);
    if (params.startDate) queryParams.append('start_date', params.startDate);
    if (params.endDate) queryParams.append('end_date', params.endDate);
    if (params.date) queryParams.append('date', params.date);
    if (params.search) queryParams.append('search', params.search);
    if (params.mobile) queryParams.append('mobile', params.mobile);
    if (params.email) queryParams.append('email', params.email);
    if (params.status) queryParams.append('status', params.status);
    if (params.page) queryParams.append('page', params.page);
    if (params.perPage) queryParams.append('per_page', params.perPage);
    if (params.sort) queryParams.append('sort', params.sort);
    
    const apiUrl = `${baseUrl}${endpoint}?${queryParams.toString()}`;
    
    console.log(`📡 Fazendo requisição para: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': credentials.api_token,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na API GET IN:', errorText);
      return null;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API retornou erro:', result);
      return null;
    }

    console.log(`✅ ${result.data.length} reservas encontradas na página ${result.pagination.current_page}`);
    console.log(`📊 Total de reservas: ${result.pagination.total} (${result.pagination.last_page} páginas)`);
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao buscar reservas:', error);
    return null;
  }
}

/**
 * Verifica se a tabela getin_reservations existe
 */
async function ensureGetInReservationsTable() {
  try {
    console.log('🔧 Verificando tabela getin_reservations...');
    
    // Testar se a tabela existe fazendo uma query simples
    const { error } = await supabase
      .from('getin_reservations')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Tabela getin_reservations não encontrada:', error.message);
      console.error('💡 Execute a migration para criar as tabelas GET IN');
      return false;
    }
    
    console.log('✅ Tabela getin_reservations encontrada');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
    return false;
  }
}

/**
 * Salva ou atualiza uma reserva no banco
 */
async function saveGetInReservation(reservation, barId) {
  try {
    const reservationData = {
      reservation_id: reservation.id,
      unit_id: reservation.unit?.id,
      unit_name: reservation.unit?.name,
      sector_id: reservation.sector?.id,
      sector_name: reservation.sector?.name,
      bar_id: barId,
      customer_name: reservation.name,
      customer_email: reservation.email,
      customer_phone: reservation.mobile,
      reservation_date: reservation.date,
      reservation_time: reservation.time,
      people: reservation.people,
      status: reservation.status,
      discount: reservation.discount || 0,
      no_show: reservation.no_show || false,
      no_show_tax: reservation.no_show_tax || 0,
      no_show_hours: reservation.no_show_hours,
      no_show_eligible: reservation.no_show_eligible || false,
      confirmation_sent: reservation.confirmation_sent || false,
      nps_answered: reservation.nps_answered || false,
      nps_url: reservation.nps_url,
      info: reservation.info,
      unit_cover_image: reservation.unit?.cover_image,
      unit_profile_image: reservation.unit?.profile_image,
      unit_full_address: reservation.unit?.full_address,
      unit_zipcode: reservation.unit?.zipcode,
      unit_cuisine_name: reservation.unit?.cuisine_name,
      unit_city_name: reservation.unit?.city_name,
      unit_coordinates_lat: reservation.unit?.coordinates?.lat,
      unit_coordinates_lng: reservation.unit?.coordinates?.lng,
      raw_data: reservation,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('getin_reservations')
      .upsert(reservationData, { 
        onConflict: 'reservation_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error(`❌ Erro ao salvar reserva ${reservation.id}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar reserva:`, error);
    return false;
  }
}

/**
 * Busca unidades GET IN salvas no banco
 */
async function getGetInUnits(barId) {
  try {
    const { data, error } = await supabase
      .from('getin_units')
      .select('unit_id, name')
      .eq('bar_id', barId);

    if (error) {
      console.error('❌ Erro ao buscar unidades:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('❌ Erro ao buscar unidades:', error);
    return [];
  }
}

/**
 * Sincroniza reservas históricas
 */
async function syncGetInReservations(barId = 3, options = {}) {
  try {
    console.log('🚀 Iniciando sincronização de reservas GET IN');
    console.log('=' .repeat(60));

    // 1. Buscar credenciais
    const credentials = await getGetInCredentials(barId);
    if (!credentials) {
      console.error('❌ Credenciais não encontradas');
      return false;
    }

    // 2. Verificar/criar tabela
    const tableReady = await ensureGetInReservationsTable();
    if (!tableReady) {
      console.error('❌ Não foi possível preparar a tabela');
      return false;
    }

    // 3. Buscar unidades para iterar sobre elas
    const units = await getGetInUnits(barId);
    if (units.length === 0) {
      console.log('⚠️  Nenhuma unidade encontrada. Execute primeiro sync-getin-units.js');
      return false;
    }

    console.log(`📍 Encontradas ${units.length} unidades para sincronizar`);

    // 4. Configurar parâmetros de busca
    const searchParams = {
      startDate: options.startDate || '2025-01-01', // Data inicial padrão
      endDate: options.endDate || new Date().toISOString().split('T')[0], // Hoje
      perPage: options.perPage || 50, // Reservas por página
      sort: 'date:desc', // Ordenar por data decrescente
      ...options
    };

    console.log('📅 Parâmetros de busca:', searchParams);

    let totalReservations = 0;
    let totalSaved = 0;
    let totalErrors = 0;

    // 5. Buscar reservas para cada unidade
    for (const unit of units) {
      console.log(`\n📍 Processando unidade: ${unit.unit_id} - ${unit.name}`);
      
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        console.log(`  📄 Página ${currentPage}...`);
        
        const searchParamsWithUnit = {
          ...searchParams,
          unitId: unit.unit_id,
          page: currentPage
        };

        const result = await fetchGetInReservations(credentials, searchParamsWithUnit);
      
        if (!result || !result.data || result.data.length === 0) {
          console.log(`    ⚠️  Nenhuma reserva encontrada na página ${currentPage}`);
          break;
        }

        const reservations = result.data;
        totalReservations += reservations.length;

        console.log(`    📊 Processando ${reservations.length} reservas...`);

        // Salvar reservas
        for (const reservation of reservations) {
          console.log(`    💾 Salvando: ${reservation.id} - ${reservation.name} (${reservation.date} ${reservation.time})`);
          
          const saved = await saveGetInReservation(reservation, barId);
          
          if (saved) {
            totalSaved++;
            console.log(`      ✅ Salva`);
          } else {
            totalErrors++;
            console.log(`      ❌ Erro`);
          }

          // Pequena pausa para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Verificar se há mais páginas
        hasMorePages = result.pagination && !result.pagination.is_last_page;
        currentPage++;

        // Pausa entre páginas
        if (hasMorePages) {
          console.log(`    ⏳ Aguardando próxima página...`);
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    console.log('\n📈 Resumo da sincronização:');
    console.log(`📊 Total de reservas encontradas: ${totalReservations}`);
    console.log(`✅ Reservas salvas: ${totalSaved}`);
    console.log(`❌ Erros: ${totalErrors}`);
    console.log('=' .repeat(60));

    return totalSaved > 0;
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return false;
  }
}

/**
 * Lista reservas salvas no banco
 */
async function listSavedReservations(barId = 3, limit = 10) {
  try {
    console.log('\n📋 Reservas GET IN salvas no banco:');
    
    const { data, error } = await supabase
      .from('getin_reservations')
      .select('*')
      .eq('bar_id', barId)
      .order('reservation_date', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Erro ao buscar reservas:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('📭 Nenhuma reserva encontrada no banco');
      return;
    }

    console.log(`📊 Mostrando ${data.length} reservas mais recentes:`);
    console.log('-' .repeat(100));

    data.forEach((reservation, index) => {
      console.log(`${index + 1}. ID: ${reservation.reservation_id}`);
      console.log(`   Cliente: ${reservation.customer_name || 'N/A'}`);
      console.log(`   Email: ${reservation.customer_email || 'N/A'}`);
      console.log(`   Telefone: ${reservation.customer_phone || 'N/A'}`);
      console.log(`   Data/Hora: ${reservation.reservation_date || 'N/A'} ${reservation.reservation_time || ''}`);
      console.log(`   Pessoas: ${reservation.people || 'N/A'}`);
      console.log(`   Status: ${reservation.status || 'N/A'}`);
      console.log(`   Unidade: ${reservation.unit_name || reservation.unit_id || 'N/A'}`);
      console.log(`   Setor: ${reservation.sector_name || 'N/A'}`);
      console.log(`   No-show: ${reservation.no_show ? 'Sim' : 'Não'}`);
      console.log(`   Desconto: R$ ${reservation.discount || 0}`);
      console.log(`   Observações: ${reservation.info || 'N/A'}`);
      console.log('-' .repeat(50));
    });

    // Estatísticas
    const { data: stats } = await supabase
      .from('getin_reservations')
      .select('status, no_show')
      .eq('bar_id', barId);

    if (stats) {
      const totalReservations = stats.length;
      const confirmedReservations = stats.filter(r => r.status === 'confirmed').length;
      const noShowReservations = stats.filter(r => r.no_show).length;
      
      console.log('\n📊 Estatísticas:');
      console.log(`📈 Total de reservas: ${totalReservations}`);
      console.log(`✅ Confirmadas: ${confirmedReservations}`);
      console.log(`❌ No-shows: ${noShowReservations}`);
      console.log(`📉 Taxa de no-show: ${totalReservations > 0 ? ((noShowReservations / totalReservations) * 100).toFixed(1) : 0}%`);
    }
  } catch (error) {
    console.error('❌ Erro ao listar reservas:', error);
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'sync';
  const barId = parseInt(args[1]) || 3;

  // Opções de sincronização
  const options = {};
  
  // Parse de argumentos adicionais
  for (let i = 2; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    if (key === '--start-date') options.startDate = value;
    if (key === '--end-date') options.endDate = value;
    if (key === '--limit') options.limit = parseInt(value);
  }

  switch (command) {
    case 'sync':
      await syncGetInReservations(barId, options);
      await listSavedReservations(barId, 5);
      break;
    
    case 'list':
      const limit = parseInt(args[2]) || 10;
      await listSavedReservations(barId, limit);
      break;
    
    default:
      console.log('Uso: node sync-getin-reservas.js [sync|list] [bar_id] [opções]');
      console.log('');
      console.log('Comandos:');
      console.log('  sync    Sincronizar reservas da API');
      console.log('  list    Listar reservas salvas no banco');
      console.log('');
      console.log('Opções para sync:');
      console.log('  --start-date YYYY-MM-DD    Data inicial (padrão: 2025-01-01)');
      console.log('  --end-date YYYY-MM-DD      Data final (padrão: hoje)');
      console.log('  --limit N                  Limite por requisição (padrão: 100)');
      console.log('');
      console.log('Exemplos:');
      console.log('  node sync-getin-reservas.js sync 3');
      console.log('  node sync-getin-reservas.js sync 3 --start-date 2025-01-01 --end-date 2025-12-31');
      console.log('  node sync-getin-reservas.js list 3 20');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  syncGetInReservations,
  listSavedReservations,
  getGetInCredentials,
  fetchGetInReservations
};
