/**
 * Script de sincronização contínua GET IN
 * Roda de 4 em 4 horas sincronizando reservas futuras (hoje + 60 dias)
 * 
 * Este script é otimizado para manter as reservas futuras sempre atualizadas
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
 * Calcula período futuro (hoje + 60 dias)
 */
function calculateFuturePeriod() {
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + 60);
  
  return {
    start: today.toISOString().split('T')[0],
    end: futureDate.toISOString().split('T')[0],
    days: 60
  };
}

/**
 * Busca reservas futuras da API GET IN
 */
async function fetchFutureReservations(credentials, startDate, endDate, page = 1) {
  try {
    console.log(`📡 Buscando reservas futuras: ${startDate} a ${endDate} (página ${page})`);
    
    const baseUrl = 'https://api.getinapis.com';
    const endpoint = '/apis/v2/reservations';
    
    const queryParams = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
      per_page: 50,
      page: page,
      sort: 'date:asc' // Ordenar por data crescente para reservas futuras
    });
    
    const apiUrl = `${baseUrl}${endpoint}?${queryParams.toString()}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': credentials.api_token,
        'Accept': 'application/json',
        'User-Agent': 'SGB-Getin-Continuous/1.0'
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

    console.log(`✅ ${result.data?.length || 0} reservas futuras encontradas na página ${page}`);
    if (result.pagination) {
      console.log(`📊 Paginação: ${result.pagination.current_page}/${result.pagination.last_page} (total: ${result.pagination.total})`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Erro ao buscar reservas futuras:', error);
    return null;
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
 * Remove reservas antigas (passadas) do banco
 */
async function cleanupOldReservations(barId, daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
    
    console.log(`🧹 Removendo reservas anteriores a ${cutoffDateStr}...`);
    
    const { data, error } = await supabase
      .from('getin_reservations')
      .delete()
      .eq('bar_id', barId)
      .lt('reservation_date', cutoffDateStr);

    if (error) {
      console.error('❌ Erro ao limpar reservas antigas:', error);
      return false;
    }

    console.log(`✅ Limpeza concluída`);
    return true;
  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    return false;
  }
}

/**
 * Registra log da sincronização
 */
async function logSyncExecution(barId, result) {
  try {
    const logData = {
      bar_id: barId,
      sistema: 'getin',
      tipo_sync: 'continuous',
      status: result.success ? 'success' : 'error',
      reservas_processadas: result.totalReservations || 0,
      reservas_salvas: result.totalSaved || 0,
      erros: result.totalErrors || 0,
      periodo_inicio: result.startDate,
      periodo_fim: result.endDate,
      detalhes: result.details || null,
      executado_em: new Date().toISOString()
    };

    const { error } = await supabase
      .from('sync_logs')
      .insert(logData);

    if (error) {
      console.error('❌ Erro ao registrar log:', error);
    } else {
      console.log('✅ Log da sincronização registrado');
    }
  } catch (error) {
    console.error('❌ Erro ao registrar log:', error);
  }
}

/**
 * Sincronização contínua de reservas futuras
 */
async function syncContinuous(barId = 3, options = {}) {
  const startTime = new Date();
  console.log(`🚀 Iniciando sincronização contínua GET IN - ${startTime.toLocaleString('pt-BR')}`);
  console.log('=' .repeat(80));

  let result = {
    success: false,
    totalReservations: 0,
    totalSaved: 0,
    totalErrors: 0,
    startDate: null,
    endDate: null,
    details: null
  };

  try {
    // 1. Buscar credenciais
    const credentials = await getGetInCredentials(barId);
    if (!credentials) {
      result.details = 'Credenciais não encontradas';
      await logSyncExecution(barId, result);
      return false;
    }

    console.log('✅ Credenciais encontradas:', {
      sistema: credentials.sistema,
      ambiente: credentials.ambiente,
      username: credentials.username
    });

    // 2. Calcular período futuro (hoje + 60 dias)
    const period = calculateFuturePeriod();
    result.startDate = period.start;
    result.endDate = period.end;
    
    console.log(`📅 Período de sincronização: ${period.start} a ${period.end} (${period.days} dias)`);

    // 3. Limpar reservas antigas (opcional)
    if (options.cleanup !== false) {
      await cleanupOldReservations(barId, 30);
    }

    // 4. Sincronizar reservas futuras
    let currentPage = 1;
    let hasMorePages = true;
    let totalReservations = 0;
    let totalSaved = 0;
    let totalErrors = 0;

    while (hasMorePages) {
      const apiResult = await fetchFutureReservations(credentials, period.start, period.end, currentPage);
      
      if (!apiResult || !apiResult.data || apiResult.data.length === 0) {
        console.log(`⚠️  Nenhuma reserva encontrada na página ${currentPage}`);
        break;
      }

      const reservations = apiResult.data;
      totalReservations += reservations.length;

      console.log(`📊 Processando ${reservations.length} reservas da página ${currentPage}...`);

      // Salvar reservas
      for (const reservation of reservations) {
        const saved = await saveGetInReservation(reservation, barId);
        
        if (saved) {
          totalSaved++;
          console.log(`✅ ${reservation.id} - ${reservation.name} (${reservation.date})`);
        } else {
          totalErrors++;
          console.log(`❌ Erro ao salvar ${reservation.id}`);
        }

        // Pequena pausa para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Verificar se há mais páginas
      hasMorePages = apiResult.pagination && !apiResult.pagination.is_last_page;
      currentPage++;

      // Pausa entre páginas
      if (hasMorePages) {
        console.log(`⏳ Aguardando próxima página...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // 5. Atualizar resultado
    result.success = totalSaved > 0 || totalReservations === 0;
    result.totalReservations = totalReservations;
    result.totalSaved = totalSaved;
    result.totalErrors = totalErrors;

    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log('\n🎉 SINCRONIZAÇÃO CONTÍNUA CONCLUÍDA:');
    console.log('=' .repeat(80));
    console.log(`📊 Reservas encontradas: ${totalReservations}`);
    console.log(`✅ Reservas salvas/atualizadas: ${totalSaved}`);
    console.log(`❌ Erros: ${totalErrors}`);
    console.log(`⏱️  Duração: ${duration}s`);
    console.log(`📅 Período: ${period.start} a ${period.end}`);
    console.log(`🕐 Próxima execução: ${new Date(Date.now() + 4 * 60 * 60 * 1000).toLocaleString('pt-BR')}`);
    console.log('=' .repeat(80));

    // 6. Registrar log
    await logSyncExecution(barId, result);

    return result.success;
  } catch (error) {
    console.error('❌ Erro na sincronização contínua:', error);
    result.details = error.message;
    await logSyncExecution(barId, result);
    return false;
  }
}

/**
 * Executa sincronização em loop (para desenvolvimento/teste)
 */
async function runContinuousLoop(barId = 3, intervalHours = 4) {
  console.log(`🔄 Iniciando loop de sincronização contínua (a cada ${intervalHours}h)`);
  
  while (true) {
    try {
      await syncContinuous(barId);
      
      const nextRun = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
      console.log(`⏰ Aguardando próxima execução em ${intervalHours}h (${nextRun.toLocaleString('pt-BR')})`);
      
      // Aguardar intervalo
      await new Promise(resolve => setTimeout(resolve, intervalHours * 60 * 60 * 1000));
      
    } catch (error) {
      console.error('❌ Erro no loop de sincronização:', error);
      console.log('⏳ Aguardando 30 minutos antes de tentar novamente...');
      await new Promise(resolve => setTimeout(resolve, 30 * 60 * 1000));
    }
  }
}

/**
 * Lista últimas execuções de sincronização
 */
async function listSyncLogs(barId = 3, limit = 10) {
  try {
    console.log('\n📋 Últimas execuções de sincronização:');
    
    const { data, error } = await supabase
      .from('sync_logs')
      .select('*')
      .eq('bar_id', barId)
      .eq('sistema', 'getin')
      .eq('tipo_sync', 'continuous')
      .order('executado_em', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Erro ao buscar logs:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('📭 Nenhum log encontrado');
      return;
    }

    console.log(`📊 Mostrando ${data.length} execuções mais recentes:`);
    console.log('-' .repeat(100));

    data.forEach((log, index) => {
      const executedAt = new Date(log.executado_em).toLocaleString('pt-BR');
      console.log(`${index + 1}. ${executedAt} - Status: ${log.status}`);
      console.log(`   Período: ${log.periodo_inicio} a ${log.periodo_fim}`);
      console.log(`   Processadas: ${log.reservas_processadas} | Salvas: ${log.reservas_salvas} | Erros: ${log.erros}`);
      if (log.detalhes) {
        console.log(`   Detalhes: ${log.detalhes}`);
      }
      console.log('-' .repeat(50));
    });
  } catch (error) {
    console.error('❌ Erro ao listar logs:', error);
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'sync';
  const barId = parseInt(args[1]) || 3;

  // Opções
  const options = {};
  
  // Parse de argumentos adicionais
  for (let i = 2; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    
    if (key === '--no-cleanup') options.cleanup = false;
    if (key === '--interval') options.interval = parseInt(value) || 4;
  }

  switch (command) {
    case 'sync':
      await syncContinuous(barId, options);
      break;
    
    case 'loop':
      const interval = options.interval || 4;
      await runContinuousLoop(barId, interval);
      break;
    
    case 'logs':
      const limit = parseInt(args[2]) || 10;
      await listSyncLogs(barId, limit);
      break;
    
    default:
      console.log('Uso: node sync-getin-continuous.js [sync|loop|logs] [bar_id] [opções]');
      console.log('');
      console.log('Comandos:');
      console.log('  sync    Executar sincronização uma vez');
      console.log('  loop    Executar em loop contínuo');
      console.log('  logs    Mostrar logs das execuções');
      console.log('');
      console.log('Opções:');
      console.log('  --no-cleanup       Não limpar reservas antigas');
      console.log('  --interval N       Intervalo em horas para o loop (padrão: 4)');
      console.log('');
      console.log('Exemplos:');
      console.log('  node sync-getin-continuous.js sync 3');
      console.log('  node sync-getin-continuous.js loop 3 --interval 2');
      console.log('  node sync-getin-continuous.js logs 3 20');
      console.log('');
      console.log('IMPORTANTE: Este script sincroniza apenas reservas futuras (hoje + 60 dias)');
      console.log('Para backlog histórico, use sync-getin-backlog-90-dias.js');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  syncContinuous,
  runContinuousLoop,
  listSyncLogs,
  calculateFuturePeriod
};
