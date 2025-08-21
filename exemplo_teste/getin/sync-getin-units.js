/**
 * Script de sincronização de unidades GET IN
 * Busca todas as unidades da API e salva no banco de dados
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
 * Busca todas as unidades da API GET IN
 */
async function fetchGetInUnits(credentials) {
  try {
    console.log('📡 Buscando unidades da API GET IN...');
    
    // Usar sempre a URL da API, não a do painel
    const baseUrl = 'https://api.getinapis.com';
    const apiUrl = `${baseUrl}/apis/v2/units`;
    
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
    
    // A API pode retornar tanto um array direto quanto um objeto com success/data
    let units;
    if (result.success && result.data) {
      units = result.data;
    } else if (Array.isArray(result)) {
      units = result;
    } else {
      console.error('❌ Formato de resposta inesperado:', result);
      return null;
    }
    
    console.log(`✅ ${units.length} unidades encontradas na API`);
    
    return units;
  } catch (error) {
    console.error('❌ Erro ao buscar unidades:', error);
    return null;
  }
}

/**
 * Busca detalhes de uma unidade específica
 */
async function fetchGetInUnitDetails(credentials, unitId) {
  try {
    // Usar sempre a URL da API, não a do painel
    const baseUrl = 'https://api.getinapis.com';
    const apiUrl = `${baseUrl}/apis/v2/units/${unitId}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': credentials.api_token,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Erro ao buscar detalhes da unidade ${unitId}`);
      return null;
    }

    const result = await response.json();
    
    // Retornar apenas os dados da unidade, não o objeto completo da resposta
    if (result.success && result.data) {
      return result.data;
    } else {
      return result;
    }
  } catch (error) {
    console.error(`❌ Erro ao buscar detalhes da unidade ${unitId}:`, error);
    return null;
  }
}

/**
 * Verifica se a tabela getin_units existe
 */
async function ensureGetInUnitsTable() {
  try {
    console.log('🔧 Verificando tabela getin_units...');
    
    // Testar se a tabela existe fazendo uma query simples
    const { error } = await supabase
      .from('getin_units')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Tabela getin_units não encontrada:', error.message);
      console.error('💡 Execute a migration para criar as tabelas GET IN');
      return false;
    }
    
    console.log('✅ Tabela getin_units encontrada');
    return true;
  } catch (error) {
    console.error('❌ Erro ao verificar tabela:', error);
    return false;
  }
}

/**
 * Salva ou atualiza uma unidade no banco
 */
async function saveGetInUnit(unit, barId) {
  try {
    const unitData = {
      unit_id: unit.id,
      bar_id: barId,
      name: unit.name,
      slug: unit.slug,
      about: unit.about,
      cuisine_name: unit.cuisine_name,
      city_slug: unit.city_slug,
      price_range: unit.price_range,
      price_range_description: unit.price_range_description,
      cover_image: unit.cover_image,
      profile_image: unit.profile_image,
      website: unit.website,
      telephone: unit.telephone,
      zipcode: unit.zipcode,
      address: unit.address,
      number: unit.number,
      complement: unit.complement,
      neighborhood: unit.neighborhood,
      full_address: unit.full_address,
      coordinates_lat: unit.coordinates?.lat,
      coordinates_lng: unit.coordinates?.lng,
      timezone: unit.timezone,
      payment_description: unit.payment_description,
      opening_hours_description: unit.opening_hours_description,
      amenities: unit.amenities || [],
      reservation_config: unit.reservation || {},
      raw_data: unit,
      updated_at: new Date().toISOString()
    };

    // Tentar inserir, se falhar por duplicata, atualizar
    const { data, error } = await supabase
      .from('getin_units')
      .upsert(unitData, { 
        onConflict: 'unit_id',
        ignoreDuplicates: false 
      })
      .select();

    if (error) {
      console.error(`❌ Erro ao salvar unidade ${unit.id}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Erro ao salvar unidade ${unit.id}:`, error);
    return false;
  }
}

/**
 * Sincroniza todas as unidades
 */
async function syncGetInUnits(barId = 3) {
  try {
    console.log('🚀 Iniciando sincronização de unidades GET IN');
    console.log('=' .repeat(60));

    // 1. Buscar credenciais
    const credentials = await getGetInCredentials(barId);
    if (!credentials) {
      console.error('❌ Credenciais não encontradas');
      return false;
    }

    // 2. Verificar/criar tabela
    const tableReady = await ensureGetInUnitsTable();
    if (!tableReady) {
      console.error('❌ Não foi possível preparar a tabela');
      return false;
    }

    // 3. Buscar unidades da API
    const units = await fetchGetInUnits(credentials);
    if (!units || units.length === 0) {
      console.error('❌ Nenhuma unidade encontrada na API');
      return false;
    }

    // 4. Salvar unidades no banco
    let savedCount = 0;
    let errorCount = 0;

    console.log(`📊 Processando ${units.length} unidades...`);

    for (const unit of units) {
      console.log(`📍 Processando unidade: ${unit.id} - ${unit.name || 'Sem nome'}`);
      
      // Buscar detalhes completos da unidade
      const unitDetails = await fetchGetInUnitDetails(credentials, unit.id);
      const fullUnitData = unitDetails || unit;
      
      const saved = await saveGetInUnit(fullUnitData, barId);
      
      if (saved) {
        savedCount++;
        console.log(`  ✅ Salva com sucesso`);
      } else {
        errorCount++;
        console.log(`  ❌ Erro ao salvar`);
      }

      // Pequena pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📈 Resumo da sincronização:');
    console.log(`✅ Unidades salvas: ${savedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total processadas: ${units.length}`);
    console.log('=' .repeat(60));

    return savedCount > 0;
  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return false;
  }
}

/**
 * Lista unidades salvas no banco
 */
async function listSavedUnits(barId = 3) {
  try {
    console.log('\n📋 Unidades GET IN salvas no banco:');
    
    const { data, error } = await supabase
      .from('getin_units')
      .select('*')
      .eq('bar_id', barId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar unidades:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('📭 Nenhuma unidade encontrada no banco');
      return;
    }

    console.log(`📊 Total de unidades: ${data.length}`);
    console.log('-' .repeat(80));

    data.forEach((unit, index) => {
      console.log(`${index + 1}. ID: ${unit.unit_id}`);
      console.log(`   Nome: ${unit.name || 'N/A'}`);
      console.log(`   Endereço: ${unit.address || 'N/A'}`);
      console.log(`   No-show habilitado: ${unit.no_show_enabled ? 'Sim' : 'Não'}`);
      console.log(`   Status: ${unit.status || 'N/A'}`);
      console.log(`   Criado em: ${new Date(unit.created_at).toLocaleString('pt-BR')}`);
      console.log('-' .repeat(40));
    });
  } catch (error) {
    console.error('❌ Erro ao listar unidades:', error);
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'sync';
  const barId = parseInt(args[1]) || 3;

  switch (command) {
    case 'sync':
      await syncGetInUnits(barId);
      await listSavedUnits(barId);
      break;
    
    case 'list':
      await listSavedUnits(barId);
      break;
    
    default:
      console.log('Uso: node sync-getin-units.js [sync|list] [bar_id]');
      console.log('Exemplos:');
      console.log('  node sync-getin-units.js sync 3    # Sincronizar unidades do bar 3');
      console.log('  node sync-getin-units.js list 3    # Listar unidades salvas do bar 3');
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  syncGetInUnits,
  listSavedUnits,
  getGetInCredentials,
  fetchGetInUnits
};
