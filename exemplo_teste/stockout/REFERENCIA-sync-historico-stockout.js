/**
 * Script para popular dados históricos de stockout desde 01/02/2025
 * SALVA NO BANCO SUPABASE via Edge Function
 * Usa timestamp fixo às 20:00 de cada dia para consistência
 */

const https = require('https');
const crypto = require('crypto');

// Configurações
const DATA_INICIO = '2025-02-01';
const BAR_ID = 3;
const EMP_ID = '3768'; // Fixo para Ordinário
const NFE = '1';       // Fixo
const PRD_DESC = '%20'; // Descrição do produto (espaço = todos)
const GRP = '-29';     // Grupo (-29 = todos)

const DELAY_ENTRE_REQUESTS = 3000; // 3 segundos entre cada request
const CONTAHUB_BASE_URL = 'https://sp.contahub.com';
const SUPABASE_EDGE_FUNCTION_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub-stockout-sync';

// Credenciais do ContaHub
const CONTAHUB_EMAIL = 'digao@3768';
const CONTAHUB_PASSWORD = 'Geladeira@001';

// Service Role Key do Supabase (necessária para chamar Edge Function)
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0';

// Função para fazer delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para gerar timestamp às 20:00 de uma data específica
function gerarTimestamp20h(dataString) {
  // dataString formato: "2025-02-01"
  const [ano, mes, dia] = dataString.split('-');
  
  // Criar data às 20:00 do dia especificado
  const data = new Date(`${ano}-${mes}-${dia}T20:00:00.000-03:00`); // Horário de Brasília
  
  // Converter para timestamp Unix em milissegundos
  const timestamp = data.getTime().toString();
  
  console.log(`📅 ${dataString} → Timestamp: ${timestamp} (20:00:00 Brasília)`);
  return timestamp;
}

// Função para gerar lista de datas
function gerarListaDatas(dataInicio, dataFim) {
  const datas = [];
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T00:00:00');
  
  const atual = new Date(inicio);
  while (atual <= fim) {
    datas.push(atual.toISOString().split('T')[0]);
    atual.setDate(atual.getDate() + 1);
  }
  
  return datas;
}

// Função para fazer hash SHA-1 da senha
function gerarHashSenha(senha) {
  return crypto.createHash('sha1').update(senha).digest('hex');
}

// Função para fazer login no ContaHub
async function loginContaHub(email, senha) {
  return new Promise((resolve, reject) => {
    console.log('🔐 Fazendo login no ContaHub...');
    
    const senhaHash = gerarHashSenha(senha);
    const loginData = `usr_email=${encodeURIComponent(email)}&usr_password_sha1=${senhaHash}`;
    
    const timestampLogin = Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const loginPath = `/rest/contahub.cmds.UsuarioCmd/login/${timestampLogin}?emp=0`;
    
    const options = {
      hostname: 'sp.contahub.com',
      port: 443,
      path: loginPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(loginData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const cookies = res.headers['set-cookie'];
          if (cookies) {
            console.log('✅ Login realizado com sucesso');
            resolve(cookies.join('; '));
          } else {
            reject(new Error('Cookies de sessão não encontrados'));
          }
        } else {
          reject(new Error(`Erro no login: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(loginData);
    req.end();
  });
}

// Função para buscar dados do ContaHub
async function buscarDadosContaHub(sessionCookie, timestamp) {
  return new Promise((resolve, reject) => {
    const queryPath = `/rest/contahub.cmds.ProdutoCmd/getProdutos/${timestamp}?emp=${EMP_ID}&prd_desc=${PRD_DESC}&grp=${GRP}&nfe=${NFE}`;
    
    console.log(`🔗 Buscando produtos: ${CONTAHUB_BASE_URL}${queryPath}`);
    
    const options = {
      hostname: 'sp.contahub.com',
      port: 443,
      path: queryPath,
      method: 'GET',
      headers: {
        'Cookie': sessionCookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error(`Erro ao parsear JSON: ${error.message}`));
          }
        } else {
          reject(new Error(`Erro na requisição: ${res.statusCode} - ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Função para processar dados de stockout
function processarDadosStockout(rawData, dataReferencia) {
  if (!rawData?.list || !Array.isArray(rawData.list)) {
    return {
      total_produtos: 0,
      produtos_ativos: 0,
      produtos_inativos: 0,
      percentual_stockout: '0.00%',
      produtos: []
    };
  }

  const produtos = [];
  let produtosAtivos = 0;
  let produtosInativos = 0;

  for (const item of rawData.list) {
    // Extrair informações do produto
    const produtoId = item.prd || item.prd_id || item.id || 'unknown';
    const produtoDescricao = item.prd_desc || item.descricao || 'Produto sem nome';
    const grupoDescricao = item.loc_desc || item.grp_desc || item.grupo || 'Sem grupo';
    
    // Determinar se o produto está ativo
    // No ContaHub, produtos ativos têm prd_ativo = 'S' e prd_venda = 'S'
    const ativoContahub = (item.prd_ativo === 'S') && 
                         (item.prd_venda === 'S') &&
                         (item.loc_inativo !== 'S');

    if (ativoContahub) {
      produtosAtivos++;
    } else {
      produtosInativos++;
    }

    produtos.push({
      produto_id: String(produtoId),
      produto_descricao: produtoDescricao,
      grupo_descricao: grupoDescricao,
      ativo_contahub: ativoContahub,
      raw_data: item
    });
  }

  const totalProdutos = produtos.length;
  const percentualStockout = totalProdutos > 0 ? ((produtosInativos / totalProdutos) * 100).toFixed(2) : '0.00';

  return {
    data_referencia: dataReferencia,
    total_produtos: totalProdutos,
    produtos_ativos: produtosAtivos,
    produtos_inativos: produtosInativos,
    percentual_stockout: `${percentualStockout}%`,
    produtos
  };
}

// Função para salvar dados no banco via Edge Function
async function salvarNoBanco(dadosProcessados, dataReferencia) {
  return new Promise((resolve, reject) => {
    console.log(`💾 Salvando no banco: ${dadosProcessados.total_produtos} produtos para ${dataReferencia}`);
    
    const postData = JSON.stringify({
      data_date: dataReferencia,
      bar_id: BAR_ID,
      produtos_data: dadosProcessados.produtos,
      force_save: true // Força salvar mesmo que já exista
    });
    
    const url = new URL(SUPABASE_EDGE_FUNCTION_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            if (result.success) {
              console.log(`✅ Salvo no banco: ${result.summary?.total_produtos || 0} produtos`);
              resolve(result);
            } else {
              reject(new Error(`Erro da Edge Function: ${result.error}`));
            }
          } catch (error) {
            reject(new Error(`Erro ao parsear resposta: ${error.message}`));
          }
        } else {
          reject(new Error(`Erro HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

// Função principal
async function main() {
  console.log('🚀 Iniciando coleta histórica de stockout COM SALVAMENTO NO BANCO...');
  console.log(`📅 Período: ${DATA_INICIO} até ontem`);
  console.log(`🏪 Bar ID: ${BAR_ID} (EMP: ${EMP_ID})`);
  console.log(`🕒 Timestamp: Sempre às 20:00 de cada dia`);
  console.log(`⏱️ Delay entre requests: ${DELAY_ENTRE_REQUESTS}ms`);
  console.log(`💾 Salvamento: Banco Supabase via Edge Function`);
  console.log('');

  // Verificar credenciais
  if (!CONTAHUB_EMAIL || !CONTAHUB_PASSWORD) {
    console.error('❌ Erro: Credenciais do ContaHub não configuradas');
    process.exit(1);
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não configurada');
    process.exit(1);
  }

  // Calcular data de ontem
  const ontem = new Date();
  ontem.setDate(ontem.getDate() - 1);
  const dataFim = ontem.toISOString().split('T')[0];

  // Gerar lista de datas
  const datas = gerarListaDatas(DATA_INICIO, dataFim);
  console.log(`📊 Total de datas para processar: ${datas.length}`);
  console.log('');

  const resultados = {
    sucessos: [],
    erros: [],
    total: datas.length,
    configuracao: {
      data_inicio: DATA_INICIO,
      data_fim: dataFim,
      bar_id: BAR_ID,
      emp_id: EMP_ID,
      endpoint: 'ProdutoCmd/getProdutos',
      timestamp_fixo: '20:00:00',
      salvamento: 'banco_supabase'
    }
  };

  try {
    // Fazer login no ContaHub
    const sessionCookie = await loginContaHub(CONTAHUB_EMAIL, CONTAHUB_PASSWORD);

    // Processar cada data
    for (let i = 0; i < datas.length; i++) {
      const data = datas[i];
      const progresso = `[${i + 1}/${datas.length}]`;
      
      console.log(`\n${progresso} Processando ${data}...`);
      
      try {
        // Gerar timestamp às 20:00 para esta data
        const timestamp = gerarTimestamp20h(data);
        
        // Buscar dados do ContaHub
        const rawData = await buscarDadosContaHub(sessionCookie, timestamp);
        
        // Processar dados de stockout
        const dadosProcessados = processarDadosStockout(rawData, data);
        
        // Salvar no banco via Edge Function
        const resultadoBanco = await salvarNoBanco(dadosProcessados, data);
        
        console.log(`✅ ${data}: ${dadosProcessados.total_produtos} produtos, ${dadosProcessados.percentual_stockout} stockout - SALVO NO BANCO`);
        
        resultados.sucessos.push({
          ...dadosProcessados,
          timestamp_usado: timestamp,
          raw_data_size: rawData?.list?.length || 0,
          banco_resultado: resultadoBanco.summary
        });
        
      } catch (error) {
        console.error(`❌ Erro em ${data}:`, error.message);
        resultados.erros.push({
          data,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // Delay entre requests (exceto no último)
      if (i < datas.length - 1) {
        console.log(`⏳ Aguardando ${DELAY_ENTRE_REQUESTS}ms...`);
        await delay(DELAY_ENTRE_REQUESTS);
      }
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error.message);
    process.exit(1);
  }

  // Relatório final
  console.log('\n' + '='.repeat(80));
  console.log('📊 RELATÓRIO FINAL - COLETA HISTÓRICA STOCKOUT (BANCO)');
  console.log('='.repeat(80));
  console.log(`📅 Período processado: ${DATA_INICIO} até ${dataFim}`);
  console.log(`🏪 Bar ID: ${BAR_ID} (EMP: ${EMP_ID})`);
  console.log(`🕒 Timestamp: Sempre às 20:00 de cada dia`);
  console.log(`💾 Salvamento: Banco Supabase`);
  console.log(`✅ Sucessos: ${resultados.sucessos.length}`);
  console.log(`❌ Erros: ${resultados.erros.length}`);
  console.log(`📊 Total: ${resultados.total}`);
  console.log(`📈 Taxa de sucesso: ${((resultados.sucessos.length / resultados.total) * 100).toFixed(2)}%`);

  if (resultados.sucessos.length > 0) {
    console.log('\n✅ RESUMO DOS SUCESSOS:');
    resultados.sucessos.forEach(r => {
      console.log(`  ${r.data_referencia}: ${r.total_produtos} produtos, ${r.percentual_stockout} stockout`);
    });

    // Estatísticas gerais
    const totalRegistros = resultados.sucessos.reduce((sum, r) => sum + r.total_produtos, 0);
    const totalAtivos = resultados.sucessos.reduce((sum, r) => sum + r.produtos_ativos, 0);
    const totalInativos = resultados.sucessos.reduce((sum, r) => sum + r.produtos_inativos, 0);
    const mediaStockout = resultados.sucessos.reduce((sum, r) => {
      return sum + parseFloat(r.percentual_stockout.replace('%', ''));
    }, 0) / resultados.sucessos.length;

    console.log('\n📈 ESTATÍSTICAS GERAIS:');
    console.log(`  Total de registros salvos no banco: ${totalRegistros}`);
    console.log(`  Total de produtos ativos: ${totalAtivos}`);
    console.log(`  Total de produtos inativos: ${totalInativos}`);
    console.log(`  Média de stockout do período: ${mediaStockout.toFixed(2)}%`);
  }

  if (resultados.erros.length > 0) {
    console.log('\n❌ ERROS ENCONTRADOS:');
    resultados.erros.forEach(r => {
      console.log(`  ${r.data}: ${r.error}`);
    });
  }

  // Salvar relatório de execução
  const nomeArquivo = `stockout-historico-banco-${new Date().toISOString().split('T')[0]}.json`;
  const fs = require('fs');
  fs.writeFileSync(nomeArquivo, JSON.stringify(resultados, null, 2));
  console.log(`\n💾 Relatório de execução salvo em: ${nomeArquivo}`);

  console.log('\n🎉 Coleta histórica concluída!');
  console.log(`💾 Dados salvos no banco Supabase: ${resultados.sucessos.length} dias`);
  console.log('📋 Próximos passos:');
  console.log('  1. Verificar dados na tabela contahub_stockout');
  console.log('  2. Acessar a interface web em /analitico/stockout');
  console.log('  3. Configurar sync automático diário às 20h');
}

// Executar script
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

console.log('📦 Script de coleta histórica de stockout (BANCO) iniciado...');
console.log('⚠️  IMPORTANTE: Este script pode demorar várias horas para completar');
console.log('⚠️  Não interrompa o processo para evitar dados incompletos');
console.log('⚠️  Credenciais já configuradas no script');
console.log('');
