const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzE5MjIwNCwiZXhwIjoyMDMyNzY4MjA0fQ.GhrUKgdomainHere'; // Você precisa colocar a service key real
const supabase = createClient(supabaseUrl, supabaseKey);

async function processarClientesDomingos() {
  try {
    console.log('🔍 Processando dados de clientes dos domingos...');
    
    // Ler o arquivo CSV
    const csvContent = fs.readFileSync('exemplo_teste/ordinario/Planilha Estratégica Ordinário - Tab Desemp ContaHub.csv', 'utf-8');
    const lines = csvContent.split('\n');
    
    // Linha 4: Datas de início (segunda-feira) - índice 3
    // Linha 5: Datas de fim (domingo) - índice 4  
    // Linha 20: Clientes Atendidos - índice 19
    
    const linhaInicioSemana = lines[3].split(','); // Linha 4
    const linhaFimSemana = lines[4].split(',');    // Linha 5
    const linhaClientesAtendidos = lines[19].split(','); // Linha 20
    
    console.log('📊 Estrutura encontrada:');
    console.log('- Início semana:', linhaInicioSemana.slice(3, 8)); // Primeiras 5 colunas de dados
    console.log('- Fim semana:', linhaFimSemana.slice(3, 8));
    console.log('- Clientes:', linhaClientesAtendidos.slice(3, 8));
    
    // Mapear domingos com seus valores de clientes
    const domingosDados = [];
    
    // Começar da coluna 3 (primeira coluna de dados) até o final das semanas
    for (let i = 3; i < Math.min(linhaFimSemana.length - 5, 29); i++) { // Até semana 29 aproximadamente
      const dataFimStr = linhaFimSemana[i]?.trim();
      const clientesStr = linhaClientesAtendidos[i]?.trim();
      
      if (!dataFimStr || !clientesStr || dataFimStr === '' || clientesStr === '') continue;
      
      // Converter data de DD/MM/YYYY para YYYY-MM-DD
      const dataMatch = dataFimStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
      if (!dataMatch) continue;
      
      const [, dia, mes, ano] = dataMatch;
      const dataFormatada = `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
      
      // Verificar se é domingo (dia da semana 0)
      const dataObj = new Date(dataFormatada);
      const diaSemana = dataObj.getDay();
      
      if (diaSemana === 0) { // Domingo
        const clientes = parseInt(clientesStr.replace(/[^\d]/g, '')) || 0;
        
        if (clientes > 0) {
          domingosDados.push({
            data: dataFormatada,
            clientes: clientes,
            semana: Math.ceil(dataObj.getTime() / (7 * 24 * 60 * 60 * 1000)) // Aproximação da semana
          });
          
          console.log(`📅 Domingo ${dataFormatada}: ${clientes} clientes`);
        }
      }
    }
    
    console.log(`\n✅ Encontrados ${domingosDados.length} domingos com dados de clientes`);
    
    // Atualizar eventos_base para os domingos
    let atualizados = 0;
    
    for (const domingo of domingosDados) {
      try {
        // Buscar evento de domingo nesta data
        const { data: eventos, error: errorBusca } = await supabase
          .from('eventos_base')
          .select('id, nome, data_evento, cl_real')
          .eq('data_evento', domingo.data)
          .eq('bar_id', 3)
          .eq('ativo', true);
          
        if (errorBusca) {
          console.error(`❌ Erro ao buscar evento ${domingo.data}:`, errorBusca.message);
          continue;
        }
        
        if (!eventos || eventos.length === 0) {
          console.log(`⚠️ Nenhum evento encontrado para ${domingo.data}`);
          continue;
        }
        
        // Atualizar cl_real para todos os eventos deste domingo
        for (const evento of eventos) {
          const { error: errorUpdate } = await supabase
            .from('eventos_base')
            .update({ 
              cl_real: domingo.clientes,
              updated_at: new Date().toISOString()
            })
            .eq('id', evento.id);
            
          if (errorUpdate) {
            console.error(`❌ Erro ao atualizar evento ${evento.id}:`, errorUpdate.message);
          } else {
            console.log(`✅ Atualizado: ${evento.nome} (${domingo.data}) - ${evento.cl_real} → ${domingo.clientes} clientes`);
            atualizados++;
          }
        }
        
      } catch (error) {
        console.error(`❌ Erro ao processar ${domingo.data}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Processamento concluído: ${atualizados} eventos atualizados`);
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Executar
processarClientesDomingos();
