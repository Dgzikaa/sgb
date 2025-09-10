#!/usr/bin/env node

/**
 * Script para executar sincronização retroativa de produtos por hora do ContaHub
 * 
 * Como usar:
 * 1. Defina as variáveis de ambiente:
 *    export SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key"
 *    export CONTAHUB_TOKEN="seu_token_contahub"
 * 
 * 2. Execute o script:
 *    node executar-sync-retroativo.js
 */

const { createClient } = require('@supabase/supabase-js');

// Credenciais Supabase - conforme processar-backlog-direto.js
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configuração
const CONFIG = {
  dataInicial: '2025-01-31',
  dataFinal: '2025-09-10',
  barId: 3,
  empId: '3768',
  contahubBaseUrl: 'https://sp.contahub.com',
  batchSize: 50, // Processar 50 registros por vez
  delayBetweenRequests: 300 // 300ms entre requisições
};

// Credenciais ContaHub - conforme processar-backlog-direto.js
const CONTAHUB_EMAIL = 'digao@3768';
const CONTAHUB_PASSWORD = 'Geladeira@001';

// Função para gerar timestamp dinâmico
function generateDynamicTimestamp() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}${String(now.getMilliseconds()).padStart(3, '0')}`;
}

// Função para fazer login no ContaHub
async function loginContaHub() {
  console.log('🔐 Fazendo login no ContaHub...');
  
  // Hash SHA-1 da senha
  const encoder = new TextEncoder();
  const data = encoder.encode(CONTAHUB_PASSWORD);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const passwordSha1 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  const loginData = new URLSearchParams({
    "usr_email": CONTAHUB_EMAIL,
    "usr_password_sha1": passwordSha1
  });
  
  const loginTimestamp = generateDynamicTimestamp();
  const loginResponse = await fetch(`${CONFIG.contahubBaseUrl}/rest/contahub.cmds.UsuarioCmd/login/${loginTimestamp}?emp=0`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'application/json'
    },
    body: loginData,
  });
  
  if (!loginResponse.ok) {
    throw new Error(`Erro no login ContaHub: ${loginResponse.statusText}`);
  }
  
  const setCookieHeaders = loginResponse.headers.get('set-cookie');
  if (!setCookieHeaders) {
    throw new Error('Cookies de sessão não encontrados no login');
  }
  
  console.log('✅ Login ContaHub realizado com sucesso');
  return setCookieHeaders;
}

async function syncProdutosPorHora(dataInicial, dataFinal) {
  console.log(`🚀 INICIANDO SINCRONIZAÇÃO RETROATIVA`);
  console.log(`📅 Período: ${dataInicial} até ${dataFinal}`);
  console.log(`🏢 Bar ID: ${CONFIG.barId}`);
  console.log(`⏰ Delay entre requisições: ${CONFIG.delayBetweenRequests}ms\n`);
  
  const sessionToken = await loginContaHub();
  if (!sessionToken) {
    throw new Error('❌ Login no ContaHub falhou');
  }
  
  const startDate = new Date(dataInicial);
  const endDate = new Date(dataFinal);
  const results = [];
  let totalProcessado = 0;
  let totalInserido = 0;
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    totalProcessado++;
    
    try {
      process.stdout.write(`📅 [${totalProcessado}] ${dateStr} ... `);
      
      // URL da API do ContaHub com timestamp dinâmico
      const queryTimestamp = generateDynamicTimestamp();
      const apiUrl = `${CONFIG.contahubBaseUrl}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=95&d0=${dateStr}&d1=${dateStr}&prod=&grupo=&turno=&emp=${CONFIG.empId}&nfe=1`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Cookie': sessionToken,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}`);
        results.push({ data: dateStr, status: 'erro_http', codigo: response.status });
        continue;
      }
      
      const responseData = await response.json();
      
      // A resposta vem no formato {"list": [...]}
      const data = responseData?.list || responseData;
      
      if (!data || !Array.isArray(data) || data.length === 0) {
        console.log(`⚠️ Sem dados`);
        results.push({ data: dateStr, status: 'sem_dados' });
        continue;
      }
      
      // Processar dados conforme estrutura da tabela contahub_prodporhora
      const recordsToInsert = data.map(item => {
        // Converter hora "22:00" -> 22, "24:00" -> 0 (meia-noite)
        let hora = 0;
        if (item.hora) {
          const horaNum = parseInt(item.hora.split(':')[0]);
          hora = horaNum === 24 ? 0 : horaNum;
        }
        
        return {
          bar_id: CONFIG.barId,
          data_gerencial: dateStr,
          hora: hora,
          produto_id: String(item.prd || 'unknown'),
          produto_descricao: item.prd_desc || 'Produto não identificado',
          grupo_descricao: item.grp_desc || null,
          quantidade: parseFloat(item.qtd) || 0,
          valor_unitario: item.$valorpago && item.qtd ? parseFloat(item.$valorpago) / parseFloat(item.qtd) : 0,
          valor_total: parseFloat(item.$valorpago) || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      });
      
      // Deletar dados existentes
      await supabase
        .from('contahub_prodporhora')
        .delete()
        .eq('data_gerencial', dateStr)
        .eq('bar_id', CONFIG.barId);
      
      // Inserir em lotes
      for (let i = 0; i < recordsToInsert.length; i += CONFIG.batchSize) {
        const batch = recordsToInsert.slice(i, i + CONFIG.batchSize);
        
        const { error } = await supabase
          .from('contahub_prodporhora')
          .insert(batch);
        
        if (error) {
          throw new Error(`Erro no lote ${i}: ${error.message}`);
        }
      }
      
      totalInserido += recordsToInsert.length;
      console.log(`✅ ${recordsToInsert.length} registros`);
      
      results.push({ 
        data: dateStr, 
        status: 'sucesso', 
        registros: recordsToInsert.length 
      });
      
    } catch (error) {
      console.log(`❌ ${error.message}`);
      results.push({ 
        data: dateStr, 
        status: 'erro', 
        erro: error.message 
      });
    }
    
    // Pausa entre requisições
    if (d < endDate) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));
    }
  }
  
  // Resumo final
  const sucessos = results.filter(r => r.status === 'sucesso').length;
  const erros = results.filter(r => r.status === 'erro' || r.status === 'erro_http').length;
  const semDados = results.filter(r => r.status === 'sem_dados').length;
  
  console.log(`\n📊 RESUMO DA SINCRONIZAÇÃO:`);
  console.log(`✅ Sucessos: ${sucessos} dias`);
  console.log(`❌ Erros: ${erros} dias`);
  console.log(`⚠️ Sem dados: ${semDados} dias`);
  console.log(`📦 Total inserido: ${totalInserido.toLocaleString()} registros`);
  console.log(`📅 Período processado: ${totalProcessado} dias`);
  
  // Salvar log no banco
  await supabase
    .from('sync_logs_contahub')
    .insert({
      bar_id: CONFIG.barId,
      data_processamento: new Date().toISOString().split('T')[0],
      tipo_sync: 'prodporhora_retroativo',
      status: erros > 0 ? 'parcial' : 'sucesso',
      detalhes: {
        periodo: `${dataInicial} a ${dataFinal}`,
        sucessos,
        erros,
        sem_dados: semDados,
        total_registros: totalInserido,
        resultados: results
      }
    });
  
  return { sucessos, erros, semDados, totalInserido, results };
}

async function main() {
  try {
    console.log('🔧 Verificando configuração...');
    console.log('✅ Configuração OK\n');
    
    const startTime = Date.now();
    const resultado = await syncProdutosPorHora(CONFIG.dataInicial, CONFIG.dataFinal);
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log(`\n🎉 SINCRONIZAÇÃO CONCLUÍDA!`);
    console.log(`⏱️ Tempo total: ${duration}s`);
    console.log(`📈 Taxa: ${Math.round(resultado.totalInserido / duration)} registros/s`);
    
    if (resultado.erros > 0) {
      console.log(`\n⚠️ Houve ${resultado.erros} erros. Verifique os logs para detalhes.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 ERRO FATAL:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
