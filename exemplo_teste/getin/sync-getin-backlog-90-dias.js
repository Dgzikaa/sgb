/**
 * Script de sincronização de backlog GET IN - Respeitando limite de 90 dias
 * Busca reservas históricas desde 31/01/2025 até hoje, dividindo em períodos de 90 dias
 * 
 * IMPORTANTE: A API do Getin tem limite de 90 dias por requisição
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
      line = line.trim();
      if (line && !line.startsWith('#')) {
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
 * Calcula períodos de 90 dias entre duas datas
 */
function calculatePeriods(startDate, endDate) {
  const periods = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let currentStart = new Date(start);
  
  while (currentStart < end) {
    let currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 89); // 90 dias (0-89)
    
    if (currentEnd > end) {
      currentEnd = new Date(end);
    }
    
    periods.push({
      start: currentStart.toISOString().split('T')[0],
      end: currentEnd.toISOString().split('T')[0],
      days: Math.ceil((currentEnd - currentStart) / (1000 * 60 * 60 * 24)) + 1
    });
    
    currentStart = new Date(currentEnd);
    currentStart.setDate(currentStart.getDate() + 1);
  }
  
  return periods;
}

/**
 * Busca reservas da API GET IN para um período específico
 */
async function fetchGetInReservationsPeriod(credentials, startDate, endDate, page = 1) {
  try {
    console.log(`📡 Buscando reservas: ${startDate} a ${endDate} (página ${page})`);
    
    const baseUrl = 'https://api.getinapis.com';
    const endpoint = '/apis/v2/reservations';
    
    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      per_page: 50, // Máximo por página
      page: page,
      sort: 'date:desc'
    });
    
    const apiUrl = `${baseUrl}${endpoint}?${queryParams.toString()}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': credentials.api_token,
        'Accept': 'application/json',
        'User-Agent': 'SGB-Getin-Sync/1.0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Erro na API (${response.status}):`, errorText);
      return null;
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ API retornou erro:', result);
      return null;
    }

    console.log(`✅ ${result.data?.length || 0} reservas encontradas na página ${page}`);
    if (result.pagination) {
      console.log(`📊 Paginação: ${result.pagination.current_page}/${result.pagination.last_page} (total: ${result.pagination.total})`);
    }
    
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
 * Sincroniza reservas para um período específico (máximo 90 dias)
 */
async function syncPeriod(credentials, startDate, endDate, barId) {
  console.log(`\n🔄 Sincronizando período: ${startDate} a ${endDate}`);
  console.log('=' .repeat(60));
  
  let totalReservations = 0;
  let totalSaved = 0;
  let totalErrors = 0;
  let currentPage = 1;
  let hasMorePages = true;

  while (hasMorePages) {
    const result = await fetchGetInReservationsPeriod(credentials, startDate, endDate, currentPage);
    
    if (!result || !result.data || result.data.length === 0) {
      console.log(`⚠️  Nenhuma reserva encontrada na página ${currentPage}`);
      break;
    }

    const reservations = result.data;
    totalReservations += reservations.length;

    console.log(`📊 Processando ${reservations.length} reservas da página ${currentPage}...`);

    // Salvar reservas
    for (const reservation of reservations) {
      console.log(`💾 Salvando: ${reservation.id} - ${reservation.name} (${reservation.date} ${reservation.time})`);
      
      const saved = await saveGetInReservation(reservation, barId);
      
      if (saved) {
        totalSaved++;
        console.log(`  ✅ Salva`);
      } else {
        totalErrors++;
        console.log(`  ❌ Erro`);
      }

      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Verificar se há mais páginas
    hasMorePages = result.pagination && !result.pagination.is_last_page;
    currentPage++;

    // Pausa entre páginas
    if (hasMorePages) {
      console.log(`⏳ Aguardando próxima página...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  console.log(`📈 Período ${startDate} a ${endDate}:`);
  console.log(`  📊 Reservas encontradas: ${totalReservations}`);
  console.log(`  ✅ Reservas salvas: ${totalSaved}`);
  console.log(`  ❌ Erros: ${totalErrors}`);

  return { totalReservations, totalSaved, totalErrors };
}

/**
 * Sincronização completa de backlog respeitando limite de 90 dias
 */
async function syncGetInBacklog(barId = 3, options = {}) {
  try {
    console.log('🚀 Iniciando sincronização de backlog GET IN (90 dias por período)');
    console.log('=' .repeat(80));

    // 1. Buscar credenciais
    const credentials = await getGetInCredentials(barId);
    if (!credentials) {
      console.error('❌ Credenciais não encontradas');
      return false;
    }

    console.log('✅ Credenciais encontradas:', {
      sistema: credentials.sistema,
      ambiente: credentials.ambiente,
      username: credentials.username
    });

    // 2. Verificar/criar tabela
    const tableReady = await ensureGetInReservationsTable();
    if (!tableReady) {
      console.error('❌ Não foi possível preparar a tabela');
      return false;
    }

    // 3. Calcular períodos de 90 dias
    const startDate = options.startDate || '2025-01-31';
    const endDate = options.endDate || new Date().toISOString().split('T')[0];
    
    console.log(`📅 Período total: ${startDate} a ${endDate}`);
    
    const periods = calculatePeriods(startDate, endDate);
    console.log(`📊 Dividido em ${periods.length} períodos de até 90 dias:`);
    
    periods.forEach((period, index) => {
      console.log(`  ${index + 1}. ${period.start} a ${period.end} (${period.days} dias)`);
    });

    // 4. Sincronizar cada período
    let grandTotalReservations = 0;
    let grandTotalSaved = 0;
    let grandTotalErrors = 0;

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      console.log(`\n🔄 Processando período ${i + 1}/${periods.length}`);
      
      const result = await syncPeriod(credentials, period.start, period.end, barId);
      
      grandTotalReservations += result.totalReservations;
      grandTotalSaved += result.totalSaved;
      grandTotalErrors += result.totalErrors;

      // Pausa entre períodos para não sobrecarregar a API
      if (i < periods.length - 1) {
        console.log('⏳ Aguardando próximo período...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log('\n🎉 RESUMO FINAL DA SINCRONIZAÇÃO DE BACKLOG:');
    console.log('=' .repeat(80));
    console.log(`📊 Total de reservas encontradas: ${grandTotalReservations}`);
    console.log(`✅ Total de reservas salvas: ${grandTotalSaved}`);
    console.log(`❌ Total de erros: ${grandTotalErrors}`);
    console.log(`📈 Taxa de sucesso: ${grandTotalReservations > 0 ? ((grandTotalSaved / grandTotalReservations) * 100).toFixed(1) : 0}%`);
    console.log(`⏱️  Períodos processados: ${periods.length}`);
    console.log('=' .repeat(80));

    return grandTotalSaved > 0;
  } catch (error) {
    console.error('❌ Erro na sincronização de backlog:', error);
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
      console.log(`   Data/Hora: ${reservation.reservation_date || 'N/A'} ${reservation.reservation_time || ''}`);
      console.log(`   Pessoas: ${reservation.people || 'N/A'}`);
      console.log(`   Status: ${reservation.status || 'N/A'}`);
      console.log(`   Unidade: ${reservation.unit_name || 'N/A'}`);
      console.log('-' .repeat(50));
    });

    // Estatísticas
    const { data: stats } = await supabase
      .from('getin_reservations')
      .select('status, no_show, reservation_date')
      .eq('bar_id', barId);

    if (stats) {
      const totalReservations = stats.length;
      const confirmedReservations = stats.filter(r => r.status === 'confirmed').length;
      const noShowReservations = stats.filter(r => r.no_show).length;
      
      // Reservas por mês
      const monthlyStats = {};
      stats.forEach(r => {
        if (r.reservation_date) {
          const month = r.reservation_date.substring(0, 7); // YYYY-MM
          monthlyStats[month] = (monthlyStats[month] || 0) + 1;
        }
      });
      
      console.log('\n📊 Estatísticas:');
      console.log(`📈 Total de reservas: ${totalReservations}`);
      console.log(`✅ Confirmadas: ${confirmedReservations}`);
      console.log(`❌ No-shows: ${noShowReservations}`);
      console.log(`📉 Taxa de no-show: ${totalReservations > 0 ? ((noShowReservations / totalReservations) * 100).toFixed(1) : 0}%`);
      
      console.log('\n📅 Reservas por mês:');
      Object.entries(monthlyStats)
        .sort()
        .slice(-6) // Últimos 6 meses
        .forEach(([month, count]) => {
          console.log(`  ${month}: ${count} reservas`);
        });
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
  }

  switch (command) {
    case 'sync':
      await syncGetInBacklog(barId, options);
      await listSavedReservations(barId, 5);
      break;
    
    case 'list':
      const limit = parseInt(args[2]) || 10;
      await listSavedReservations(barId, limit);
      break;
    
    default:
      console.log('Uso: node sync-getin-backlog-90-dias.js [sync|list] [bar_id] [opções]');
      console.log('');
      console.log('Comandos:');
      console.log('  sync    Sincronizar backlog respeitando limite de 90 dias');
      console.log('  list    Listar reservas salvas no banco');
      console.log('');
      console.log('Opções para sync:');
      console.log('  --start-date YYYY-MM-DD    Data inicial (padrão: 2025-01-31)');
      console.log('  --end-date YYYY-MM-DD      Data final (padrão: hoje)');
      console.log('');
      console.log('Exemplos:');
      console.log('  node sync-getin-backlog-90-dias.js sync 3');
      console.log('  node sync-getin-backlog-90-dias.js sync 3 --start-date 2025-01-31 --end-date 2025-08-21');
      console.log('  node sync-getin-backlog-90-dias.js list 3 20');
      console.log('');
      console.log('IMPORTANTE: Este script divide automaticamente o período em blocos de 90 dias');
      console.log('para respeitar o limite da API do Getin.');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  syncGetInBacklog,
  listSavedReservations,
  calculatePeriods
};
