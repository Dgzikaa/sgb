const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuração do ContaHub
const CONTAHUB_CONFIG = {
  baseUrl: 'https://beta3.contahub.com.br/api',
  empId: '3768', // Baseado na URL que você mostrou
  token: process.env.CONTAHUB_TOKEN // Você precisa definir isso
};

async function syncProdutosPorHora(dataInicial, dataFinal) {
  console.log(`🚀 Iniciando sincronização de ${dataInicial} até ${dataFinal}`);
  
  const startDate = new Date(dataInicial);
  const endDate = new Date(dataFinal);
  const results = [];
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    
    try {
      console.log(`📅 Processando: ${dateStr}`);
      
      // URL da API do ContaHub para produtos por hora
      const apiUrl = `${CONTAHUB_CONFIG.baseUrl}/rest/contahub.cmds.QueryCmd/execQuery/1757528448438?qry=95&d0=${dateStr}&d1=${dateStr}&prod=&grupo=&turno=&emp=${CONTAHUB_CONFIG.empId}&nfe=1`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${CONTAHUB_CONFIG.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error(`❌ Erro na API para ${dateStr}:`, response.status);
        results.push({ data: dateStr, status: 'erro', erro: `HTTP ${response.status}` });
        continue;
      }
      
      const data = await response.json();
      
      if (!data || !Array.isArray(data)) {
        console.log(`⚠️ Sem dados para ${dateStr}`);
        results.push({ data: dateStr, status: 'sem_dados' });
        continue;
      }
      
      // Processar e inserir dados
      const recordsToInsert = data.map(item => ({
        dt_gerencial: dateStr,
        hora: parseInt(item.hora) || 0,
        grp_desc: item.grp_desc || null,
        prd_desc: item.prd_desc || 'Produto não identificado',
        prd_id: parseInt(item.prd) || null,
        loc_desc: item.loc_desc || null,
        trn_desc: item.trn_desc || null,
        prefixo: item.prefixo || null,
        tipovenda: item.tipovenda || null,
        qtd: parseFloat(item.q) || 0,
        valorpago: parseFloat(item.valorpago) || 0,
        desconto: parseFloat(item.desconto) || 0,
        bar_id: 3,
        raw_data: item
      }));
      
      if (recordsToInsert.length > 0) {
        // Deletar dados existentes para a data
        await supabase
          .from('contahub_prodporhora')
          .delete()
          .eq('dt_gerencial', dateStr)
          .eq('bar_id', 3);
        
        // Inserir novos dados em lotes de 100
        const batchSize = 100;
        for (let i = 0; i < recordsToInsert.length; i += batchSize) {
          const batch = recordsToInsert.slice(i, i + batchSize);
          
          const { error: insertError } = await supabase
            .from('contahub_prodporhora')
            .insert(batch);
          
          if (insertError) {
            console.error(`❌ Erro ao inserir lote para ${dateStr}:`, insertError);
            throw insertError;
          }
        }
        
        console.log(`✅ ${recordsToInsert.length} registros inseridos para ${dateStr}`);
        results.push({ 
          data: dateStr, 
          status: 'sucesso', 
          registros: recordsToInsert.length 
        });
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${dateStr}:`, error.message);
      results.push({ 
        data: dateStr, 
        status: 'erro', 
        erro: error.message 
      });
    }
    
    // Pausa entre requisições para não sobrecarregar a API
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Resumo final
  const sucessos = results.filter(r => r.status === 'sucesso').length;
  const erros = results.filter(r => r.status === 'erro').length;
  const semDados = results.filter(r => r.status === 'sem_dados').length;
  
  console.log(`\n📊 RESUMO DA SINCRONIZAÇÃO:`);
  console.log(`✅ Sucessos: ${sucessos}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`⚠️ Sem dados: ${semDados}`);
  console.log(`📅 Total processado: ${results.length} dias`);
  
  return results;
}

// Executar sincronização
async function main() {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida');
    }
    
    if (!process.env.CONTAHUB_TOKEN) {
      throw new Error('CONTAHUB_TOKEN não definida');
    }
    
    const results = await syncProdutosPorHora('2025-01-31', '2025-09-10');
    
    console.log('\n🎉 Sincronização concluída!');
    console.log('Resultados:', JSON.stringify(results, null, 2));
    
  } catch (error) {
    console.error('💥 Erro na sincronização:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { syncProdutosPorHora };
