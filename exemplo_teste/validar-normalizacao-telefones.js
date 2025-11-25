/**
 * Script para validar normalização de telefones e garantir precisão dos dados
 * 
 * Este script compara:
 * 1. Clientes únicos SEM normalização
 * 2. Clientes únicos COM normalização
 * 3. Mostra exemplos de telefones que foram agrupados
 */

// Carregar variáveis de ambiente do .env.local
require('dotenv').config({ path: '../frontend/.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  console.error('Certifique-se de que frontend/.env.local existe com:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function validarNormalizacao() {
  console.log('🔍 Validando normalização de telefones...\n');

  const barId = 3;
  const dataInicio = '2025-11-23';
  const dataFim = '2025-11-30';

  // 1. Buscar telefones SEM normalização (formato original)
  console.log('📊 1. Buscando telefones no formato original...');
  const { data: telefonesOriginais, error: error1 } = await supabase
    .from('contahub_periodo')
    .select('cli_fone')
    .eq('bar_id', barId)
    .gte('dt_gerencial', dataInicio)
    .lte('dt_gerencial', dataFim)
    .not('cli_fone', 'is', null)
    .neq('cli_fone', '');

  if (error1) {
    console.error('❌ Erro:', error1);
    process.exit(1);
  }

  const telefonesUnicos = new Set(telefonesOriginais.map(r => r.cli_fone));
  console.log(`   Total registros: ${telefonesOriginais.length}`);
  console.log(`   Telefones únicos: ${telefonesUnicos.size}\n`);

  // 2. Buscar telefones COM normalização (usando função SQL)
  console.log('📊 2. Buscando telefones normalizados...');
  const { data: telefonesNormalizados, error: error2 } = await supabase
    .rpc('get_clientes_unicos_periodo', {
      p_bar_id: barId,
      p_data_inicio: dataInicio,
      p_data_fim: dataFim
    });

  if (error2) {
    console.error('❌ Erro:', error2);
    process.exit(1);
  }

  console.log(`   Telefones únicos normalizados: ${telefonesNormalizados.length}\n`);

  // 3. Mostrar diferença
  const diferenca = telefonesUnicos.size - telefonesNormalizados.length;
  console.log('📈 RESULTADO:');
  console.log(`   Antes (sem normalização): ${telefonesUnicos.size} clientes`);
  console.log(`   Depois (com normalização): ${telefonesNormalizados.length} clientes`);
  console.log(`   Diferença: ${diferenca} duplicatas encontradas e corrigidas\n`);

  if (diferenca > 0) {
    console.log(`✅ Normalização está funcionando! ${diferenca} telefones duplicados foram identificados.\n`);
  } else {
    console.log(`ℹ️ Nenhuma duplicata encontrada neste período.\n`);
  }

  // 4. Mostrar exemplos de telefones e suas normalizações
  console.log('📱 Exemplos de telefones no banco (primeiros 20):');
  const exemplos = Array.from(telefonesUnicos).slice(0, 20);
  
  for (const telefone of exemplos) {
    // Chamar função de normalização no banco
    const { data: normalizado } = await supabase
      .rpc('normalizar_telefone', { telefone });
    
    if (telefone !== normalizado) {
      console.log(`   "${telefone}" → "${normalizado}" ✓ normalizado`);
    } else {
      console.log(`   "${telefone}" (já normalizado)`);
    }
  }

  console.log('\n✅ Validação concluída!');
  console.log('\n💡 IMPORTANTE:');
  console.log('   - Se a diferença for 0, significa que todos os telefones já estão padronizados');
  console.log('   - Se houver diferença, a normalização está corrigindo duplicatas');
  console.log('   - Os dados finais mostrados aos sócios serão mais precisos com normalização\n');
}

validarNormalizacao().catch(console.error);

