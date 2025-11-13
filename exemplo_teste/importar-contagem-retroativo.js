/**
 * 📊 IMPORTAÇÃO RETROATIVA - CONTAGEM DE ESTOQUE
 * 
 * Chama a Edge Function do Supabase diretamente para importar
 * contagens retroativas do Google Sheets
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada nas variáveis de ambiente');
  console.log('   Configure: export SUPABASE_SERVICE_ROLE_KEY="sua-chave-aqui"');
  process.exit(1);
}

async function importarData(data) {
  try {
    console.log(`\n📅 Importando data: ${data}...`);
    
    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/sync-contagem-sheets?data=${data}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        },
        body: JSON.stringify({ cronSecret: 'manual_test' })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${data} - Sucesso: ${result.data.sucesso} | Erro: ${result.data.erro} | Não encontrados: ${result.data.naoEncontrados.length}`);
      return result;
    } else {
      console.log(`❌ ${data} - ${result.message || 'Erro desconhecido'}`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ ${data} - Erro:`, error.message);
    return null;
  }
}

async function main() {
  const dataInicial = process.argv[2];
  const dataFinal = process.argv[3];
  
  if (!dataInicial) {
    console.log('❌ Uso: node importar-contagem-retroativo.js DATA_INICIAL [DATA_FINAL]');
    console.log('   Exemplos:');
    console.log('     node importar-contagem-retroativo.js 2025-11-12');
    console.log('     node importar-contagem-retroativo.js 2025-11-12 2025-11-13');
    process.exit(1);
  }
  
  console.log('🚀 IMPORTAÇÃO RETROATIVA - CONTAGEM DE ESTOQUE');
  console.log('='.repeat(60));
  console.log(`📡 Supabase: ${SUPABASE_URL}`);
  console.log(`📅 Período: ${dataInicial}${dataFinal ? ` até ${dataFinal}` : ''}`);
  console.log('='.repeat(60));
  
  const datas = [];
  
  if (dataFinal) {
    // Gerar lista de datas
    const inicio = new Date(dataInicial);
    const fim = new Date(dataFinal);
    
    for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
      datas.push(d.toISOString().split('T')[0]);
    }
  } else {
    datas.push(dataInicial);
  }
  
  console.log(`\n📊 ${datas.length} data(s) para importar\n`);
  
  const stats = {
    total: 0,
    sucesso: 0,
    erro: 0,
  };
  
  for (const data of datas) {
    const resultado = await importarData(data);
    stats.total++;
    
    if (resultado && resultado.success) {
      stats.sucesso++;
    } else {
      stats.erro++;
    }
    
    // Aguardar um pouco entre requisições
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(60));
  console.log(`📅 Datas processadas: ${stats.total}`);
  console.log(`✅ Sucesso: ${stats.sucesso}`);
  console.log(`❌ Erro: ${stats.erro}`);
  console.log('\n✅ Importação concluída!\n');
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error.message);
  process.exit(1);
});

