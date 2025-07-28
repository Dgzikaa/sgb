// Script de backup das tabelas NIBO usando MCP Supabase
// Este script deve ser executado em um ambiente que tenha acesso ao MCP

const tabelas = [
  'nibo_agendamentos',
  'nibo_categorias', 
  'nibo_usuarios',
  'nibo_contas_bancarias',
  'nibo_logs_sincronizacao',
  'nibo_stakeholders',
  'nibo_centros_custo'
];

async function backupTabelaNIBO(tabela) {
  console.log(`📊 Fazendo backup da tabela: ${tabela}`);
  
  try {
    // Usar MCP para consultar a tabela
    const resultado = await mcp_supabase_sql_query({
      sql: `SELECT * FROM ${tabela}`
    });
    
    if (resultado.error) {
      console.error(`❌ Erro ao consultar ${tabela}:`, resultado.error);
      return null;
    }
    
    const dados = resultado.data || [];
    console.log(`✅ ${tabela}: ${dados.length} registros encontrados`);
    
    // Criar arquivo JSON com os dados
    const backupData = {
      tabela: tabela,
      data_exportacao: new Date().toISOString(),
      total_registros: dados.length,
      dados: dados
    };
    
    const filename = `${tabela}_backup_${new Date().toISOString().split('T')[0]}.json`;
    
    // Fazer upload para o bucket usando MCP
    const uploadResult = await mcp_supabase_storage_upload_file({
      bucket: 'nibo',
      path: filename,
      file: JSON.stringify(backupData, null, 2),
      contentType: 'application/json'
    });
    
    if (uploadResult.error) {
      console.error(`❌ Erro no upload de ${filename}:`, uploadResult.error);
      return null;
    }
    
    console.log(`✅ Backup salvo: ${filename}`);
    return {
      tabela,
      registros: dados.length,
      arquivo: filename,
      sucesso: true
    };
    
  } catch (error) {
    console.error(`❌ Erro ao processar ${tabela}:`, error);
    return {
      tabela,
      registros: 0,
      arquivo: null,
      sucesso: false,
      erro: error.message
    };
  }
}

async function executarBackupCompleto() {
  console.log('🚀 Iniciando backup completo das tabelas NIBO...');
  console.log(`📅 Data: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`🎯 Projeto: uqtgsvujwcbymjmvkjhy`);
  console.log(`📦 Bucket: nibo`);
  console.log('─'.repeat(50));
  
  const resultados = [];
  
  for (const tabela of tabelas) {
    const resultado = await backupTabelaNIBO(tabela);
    if (resultado) {
      resultados.push(resultado);
    }
  }
  
  console.log('─'.repeat(50));
  console.log('📋 RESUMO DO BACKUP:');
  console.table(resultados);
  
  const sucessos = resultados.filter(r => r.sucesso).length;
  const total = resultados.length;
  
  console.log(`\n🎉 Backup concluído: ${sucessos}/${total} tabelas processadas com sucesso!`);
  
  if (sucessos === total) {
    console.log('✅ Todos os backups foram salvos no bucket NIBO com sucesso!');
  } else {
    console.log('⚠️ Alguns backups falharam. Verifique os logs acima.');
  }
  
  return resultados;
}

// Executar o backup
executarBackupCompleto().catch(console.error); 