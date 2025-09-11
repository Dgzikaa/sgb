/**
 * Script para executar coleta retroativa dos dados de contahub_prodporhora
 * Data específica: 10/09/2025
 * 
 * Este script executa a coleta dos dados que não foram coletados porque
 * o pg_cron ainda não estava configurado nessa data.
 */

const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU5MDU3NzIsImV4cCI6MjA0MTQ4MTc3Mn0.9o8nOaZQhVJmNqOJFRE1_Iu9wGhJGOhDCdKJzCqKLqI';

// Data específica que precisa ser coletada
const DATA_COLETA = '2025-09-10';

async function executarColetaRetroativa() {
  console.log(`🚀 Iniciando coleta retroativa para ${DATA_COLETA}`);
  
  try {
    // Chamar a Edge Function de sincronização do ContaHub
    // passando a data específica como parâmetro
    const response = await fetch(`${SUPABASE_URL}/functions/v1/contahub-sync-automatico`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data_especifica: DATA_COLETA,
        tipo_coleta: 'retroativa',
        incluir_prodporhora: true,
        bar_id: 3
      })
    });

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const resultado = await response.json();
    
    console.log('✅ Coleta retroativa executada com sucesso!');
    console.log('📊 Resultado:', JSON.stringify(resultado, null, 2));
    
    // Verificar se os dados foram inseridos
    await verificarDadosInseridos();
    
  } catch (error) {
    console.error('❌ Erro na coleta retroativa:', error);
    throw error;
  }
}

async function verificarDadosInseridos() {
  console.log(`🔍 Verificando dados inseridos para ${DATA_COLETA}...`);
  
  try {
    // Verificar quantos registros foram inseridos na tabela contahub_prodporhora
    const response = await fetch(`${SUPABASE_URL}/rest/v1/contahub_prodporhora?data_gerencial=eq.${DATA_COLETA}&select=count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao verificar dados: ${response.status}`);
    }

    const count = response.headers.get('content-range');
    const totalRegistros = count ? count.split('/')[1] : '0';
    
    console.log(`📈 Total de registros inseridos para ${DATA_COLETA}: ${totalRegistros}`);
    
    if (parseInt(totalRegistros) > 0) {
      console.log('✅ Dados inseridos com sucesso!');
      
      // Mostrar alguns exemplos dos dados inseridos
      const dadosResponse = await fetch(`${SUPABASE_URL}/rest/v1/contahub_prodporhora?data_gerencial=eq.${DATA_COLETA}&limit=5&select=hora,produto_descricao,quantidade,valor_total`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        }
      });
      
      if (dadosResponse.ok) {
        const exemplos = await dadosResponse.json();
        console.log('📋 Exemplos de dados inseridos:');
        exemplos.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.hora}h - ${item.produto_descricao} - Qtd: ${item.quantidade} - Valor: R$ ${item.valor_total}`);
        });
      }
    } else {
      console.log('⚠️ Nenhum dado foi inserido. Verifique se a data está correta ou se houve algum problema na coleta.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados inseridos:', error);
  }
}

// Executar o script
if (typeof window === 'undefined') {
  // Executando no Node.js
  executarColetaRetroativa()
    .then(() => {
      console.log('🎉 Script finalizado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script finalizado com erro:', error);
      process.exit(1);
    });
} else {
  // Executando no browser
  console.log('📝 Para executar este script no browser, chame: executarColetaRetroativa()');
}

// Exportar função para uso externo
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { executarColetaRetroativa, verificarDadosInseridos };
}
