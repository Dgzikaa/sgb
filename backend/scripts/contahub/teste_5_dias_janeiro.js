const crypto = require('crypto');

console.log('🧪 TESTE CONTAHUB - TODOS OS RELATÓRIOS');
console.log('🎯 Objetivo: Coletar TODOS os tipos de relatórios');
console.log('✅ Parâmetros corretos das queries 77 e 20 mapeados!\n');

// Configurações
const LOGIN_CONFIG = {
  // Usar variáveis de ambiente (serão configuradas via secrets)
  email: process.env.CONTAHUB_EMAIL || 'digao@3768',
  senha: process.env.CONTAHUB_PASSWORD || 'Geladeira@001',
  base_url: 'https://sp.contahub.com',
  empresa_id_bar1: '3768',
  empresa_id_bar2: '3691'
};

// 🎯 MAPEAMENTO COMPLETO DOS RELATÓRIOS CONTAHUB (QUERIES CORRETAS)
const QUERIES_CONTAHUB = [
  { id: 5, nome: 'periodo', descricao: 'Vendas por Período', tipo_dados: 'periodo_completo' },
  { id: 15, nome: 'tempo', descricao: 'Tempos de Produção', tipo_dados: 'tempo' },
  { id: 7, nome: 'pagamentos', descricao: 'Formas de Pagamento', tipo_dados: 'pagamentos' },
  { id: 101, nome: 'fatporhora', descricao: 'Faturamento por Hora', tipo_dados: 'fatporhora' },
  { id: 93, nome: 'clientes_faturamento', descricao: 'Melhores Clientes (Faturamento)', tipo_dados: 'clientes_faturamento' },
  { id: 94, nome: 'clientes_presenca', descricao: 'Melhores Clientes (Presença)', tipo_dados: 'clientes_presenca' },
  { id: 59, nome: 'clientes_cpf', descricao: 'Clientes por CPF', tipo_dados: 'clientes_cpf' },
  { id: 77, nome: 'analitico', descricao: 'Relatório Analítico', tipo_dados: 'analitico' },
  { id: 73, nome: 'nfs', descricao: 'Notas Fiscais', tipo_dados: 'nfs' },
  { id: 20, nome: 'compra_produto_dtnf', descricao: 'Compras por Produto (por DtNF)', tipo_dados: 'compra_produto_dtnf' }
];

// Datas para teste - agora aceita parâmetros da linha de comando
function getDatasParaTeste() {
  const args = process.argv.slice(2);
  const dataInicio = args[0] || '2025-01-31';
  const dataFim = args[1] || '2025-02-04';
  
  console.log(`📅 Parâmetros recebidos - Início: ${dataInicio}, Fim: ${dataFim}`);
  
  // Gerar array de datas entre início e fim
  const datas = [];
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  
  for (let d = new Date(inicio); d <= fim; d.setDate(d.getDate() + 1)) {
    datas.push(d.toISOString().split('T')[0]);
  }
  
  console.log(`📊 Datas a processar: ${datas.join(', ')}`);
  return datas;
}

const DATAS_TESTE = getDatasParaTeste();

// Supabase config
const SUPABASE_CONFIG = {
  url: 'https://uqtgsvujwcbymjmvkjhy.supabase.co',
  service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY
};

// Função para fazer login no ContaHub
async function fazerLogin() {
  const crypto = require('crypto');
  const passwordSha1 = crypto.createHash('sha1').update(LOGIN_CONFIG.senha).digest('hex');
  
  const loginData = new URLSearchParams({
    "usr_email": LOGIN_CONFIG.email,
    "usr_password_sha1": passwordSha1
  });

  console.log('🔐 Fazendo login no ContaHub...');
  
  const response = await fetch(`${LOGIN_CONFIG.base_url}/rest/contahub.cmds.UsuarioCmd/login/17421701611337?emp=0`, {
    method: "POST",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: loginData.toString()
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const setCookieHeaders = response.headers.get('set-cookie');
  if (!setCookieHeaders) {
    throw new Error('No cookies received from ContaHub');
  }

  console.log('✅ Login ContaHub realizado com sucesso');
  return setCookieHeaders;
}

// Função para tentar diferentes valores de parâmetros para queries problemáticas
function getParameterVariations(queryId) {
  const variations = {
    7: [     // meio - formas de pagamento
      { meio: '' },          // vazio primeiro
      { meio: '*' },         // asterisco  
      { meio: '%25' }        // % URL encoded
    ],
    93: [    // nome - clientes por faturamento
      { nome: '' },          // vazio primeiro
      { nome: '*' },         // asterisco
      { nome: '%25' }        // % URL encoded
    ],
    94: [    // nome - clientes por presença
      { nome: '' },          // vazio primeiro
      { nome: '*' },         // asterisco
      { nome: '%25' }        // % URL encoded
    ],
    77: [    // PARÂMETROS CORRETOS baseados na URL fornecida!
      { produto: '', grupo: '', local: '', turno: '', mesa: '' }    // todos vazios - exato como funciona
    ],
    20: [    // PARÂMETROS CORRETOS baseados na URL fornecida!
      { prod: '', grupo: '', forn: '' }    // todos vazios - exato como funciona
    ]
  };
  
  return variations[queryId] || [{}];
}

// Função para coletar um relatório específico (com retry de parâmetros)
async function coletarRelatorio(query, data, cookies, barId = 3) {
  const empresaId = barId === 3 ? LOGIN_CONFIG.empresa_id_bar1 : LOGIN_CONFIG.empresa_id_bar2;
  
  console.log(`📊 ${query.descricao}: ${data} (Query ${query.id})`);
  
  // Se a query não precisar de parâmetros especiais, usar versão simples
  if (![7, 93, 94, 77, 20].includes(query.id)) {
    return await tentarQuery(query, data, cookies, empresaId, {});
  }
  
  // Para queries que precisam de parâmetros, tentar diferentes valores
  const variations = getParameterVariations(query.id);
  
  for (let i = 0; i < variations.length; i++) {
    const params = variations[i];
    const tentativa = i + 1;
    
    // Criar string descritiva dos parâmetros
    const paramDesc = Object.entries(params).map(([key, value]) => `${key}="${value}"`).join(', ');
    console.log(`   🔄 Tentativa ${tentativa}/${variations.length} com ${paramDesc}`);
    
    try {
      const resultado = await tentarQuery(query, data, cookies, empresaId, params);
      if (resultado.sucesso) {
        console.log(`   ✅ Sucesso na tentativa ${tentativa}!`);
        return resultado;
      }
    } catch (error) {
      console.log(`   ❌ Tentativa ${tentativa} falhou: ${error.message}`);
      
      // Pausa entre tentativas para não sobrecarregar
      if (i < variations.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Última tentativa - retornar erro
        return {
          sucesso: false,
          query,
          data,
          barId,
          erro: `Todas as ${variations.length} tentativas falharam. Último erro: ${error.message}`
        };
      }
    }
  }
}

// Função auxiliar para tentar uma query específica COM PAGINAÇÃO
async function tentarQuery(query, data, cookies, empresaId, params = {}) {
  const limite = 1000; // Manter limite conservador
  let offset = 0;
  let todosRegistros = [];
  let totalPaginas = 0;
  let dadosCompletos = null;
  let urlBase = ''; // Salvar URL base para o return
  
  console.log(`   🔄 Iniciando coleta paginada (limite: ${limite} por página)...`);
  
  while (true) {
    totalPaginas++;
    const timestamp = Date.now();
    let queryUrl = `${LOGIN_CONFIG.base_url}/rest/contahub.cmds.QueryCmd/execQuery/${timestamp}?qry=${query.id}&d0=${data}&d1=${data}&emp=${empresaId}&nfe=1&limit=${limite}&offset=${offset}`;
    
    // Adicionar parâmetros se necessário
    Object.entries(params).forEach(([paramName, paramValue]) => {
      queryUrl += `&${paramName}=${paramValue}`;
    });
    
    // Salvar URL base na primeira página
    if (totalPaginas === 1) {
      urlBase = queryUrl.replace(`&offset=${offset}`, '');
    }
    
    try {
      // Log da URL para debug (só na primeira página)
      if (totalPaginas === 1) {
        console.log(`   🔗 URL base: ${queryUrl.replace(LOGIN_CONFIG.base_url, '...')}`);
      }
      console.log(`   📄 Página ${totalPaginas} (offset: ${offset})...`);
      
      const response = await fetch(queryUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Cookie": cookies,
          "Accept": "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      });

      if (!response.ok) {
        // Tentar capturar o body do erro para mais detalhes
        let errorBody;
        try {
          errorBody = await response.text();
        } catch (e) {
          errorBody = 'Não foi possível ler o body do erro';
        }
        
        console.error(`   ❌ Query ${query.id} página ${totalPaginas} failed: ${response.status} ${response.statusText}`);
        console.error(`   📄 Response body: ${errorBody.substring(0, 200)}...`);
        
        throw new Error(`Query ${query.id} página ${totalPaginas} failed: ${response.status}`);
      }

      const responseText = await response.text();
      let dados;
      try {
        dados = JSON.parse(responseText);
      } catch (parseError) {
        console.error(`   📄 Response text: ${responseText.substring(0, 200)}...`);
        throw new Error(`JSON parse error página ${totalPaginas}: ${parseError.message}`);
      }

      const registrosPagina = dados?.list || [];
      console.log(`   📋 ${registrosPagina.length} registros na página ${totalPaginas}`);
      
      // Primeira página: salvar metadados completos
      if (totalPaginas === 1) {
        dadosCompletos = { ...dados };
        dadosCompletos.list = []; // Limpar a lista, vamos acumular
      }
      
      // Adicionar registros da página atual
      todosRegistros.push(...registrosPagina);
      
      // Se a página trouxe menos registros que o limite, acabaram os dados
      if (registrosPagina.length < limite) {
        console.log(`   ✅ Coleta finalizada! Última página com ${registrosPagina.length} registros`);
        break;
      }
      
      // Preparar próxima página
      offset += limite;
      
      // Pausa entre páginas para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 300));
      
    } catch (error) {
      console.error(`   ❌ Erro na query ${query.id} página ${totalPaginas}: ${error.message}`);
      throw error; // Re-throw para a função pai tratar
    }
  }
  
  // Combinar todos os dados
  dadosCompletos.list = todosRegistros;
  
  console.log(`   🎉 Coleta paginada concluída: ${todosRegistros.length} registros em ${totalPaginas} páginas`);
  
  return {
    sucesso: true,
    query,
    data,
    barId: 3, // Fixo para o exemplo
    empresaId,
    dados_completos: dadosCompletos,
    total_registros: todosRegistros.length,
    total_paginas: totalPaginas,
    query_url: urlBase // URL base sem offset
  };
}

// Função para salvar relatório completo no Supabase
async function salvarRelatorioCompleto(resultado) {
  if (!SUPABASE_CONFIG.service_role_key) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não configurada - dados não serão salvos');
    return { salvos: 0, erro: 'Chave do Supabase não configurada' };
  }

  const { createClient } = require('../../node_modules/@supabase/supabase-js');
  const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.service_role_key);
  
  if (!resultado.sucesso) {
    return { salvos: 0, erro: resultado.erro };
  }

  // Gerar hash único para deduplicação
  const hashData = JSON.stringify({ 
    bar_id: resultado.barId, 
    data: resultado.data, 
    query_id: resultado.query.id,
    tipo: resultado.query.tipo_dados
  });
  const hash = crypto.createHash('md5').update(hashData).digest('hex');

  const dadoParaSalvar = {
    bar_id: resultado.barId,
    sistema: 'contahub',
    tipo_dados: resultado.query.tipo_dados,
    data: {
      // Incluir metadados dentro do próprio JSON
      metadados: {
        query_id: resultado.query.id,
        query_nome: resultado.query.nome,
        query_descricao: resultado.query.descricao,
        total_registros: resultado.total_registros,
        empresa_id: resultado.empresaId,
        query_url: resultado.query_url
      },
      // Dados completos do relatório
      ...resultado.dados_completos
    },
    hash: hash,
    data_referencia: resultado.data,
    processado: false
  };

  try {
    const { data: inserido, error } = await supabase
      .from('sistema_raw')
      .insert([dadoParaSalvar])
      .select('id');

    if (error) {
      // Se erro for de duplicação, ignorar
      if (error.code === '23505') {
        console.log(`   ⚠️ Relatório já existe (duplicado ignorado)`);
        return { salvos: 0, erro: 'Duplicado' };
      }
      throw error;
    }

    console.log(`   💾 Relatório completo salvo na sistema_raw (ID: ${inserido[0].id})`);
    return { salvos: 1, erro: null, id: inserido[0].id };
    
  } catch (error) {
    console.error(`   ❌ Erro ao salvar: ${error.message}`);
    return { salvos: 0, erro: error.message };
  }
}

// Função principal
async function executarTeste() {
  const inicioTempo = Date.now();
  
  try {
    console.log('🚀 Iniciando coleta COMPLETA do ContaHub...\n');
    console.log(`📋 Queries a coletar: ${QUERIES_CONTAHUB.length}`);
    console.log(`📅 Datas: ${DATAS_TESTE.length}`);
    console.log(`🎯 Total esperado: ${QUERIES_CONTAHUB.length * DATAS_TESTE.length} relatórios\n`);
    
    // 1. Fazer login
    const cookies = await fazerLogin();
    
    // 2. Coletar todos os relatórios para cada data
    const resultados = [];
    let totalSalvos = 0;
    let totalErros = 0;
    
    for (const data of DATAS_TESTE) {
      console.log(`\n📅 === PROCESSANDO DATA: ${data} ===`);
      
      for (const query of QUERIES_CONTAHUB) {
        try {
          const resultado = await coletarRelatorio(query, data, cookies, 3); // Bar 3 (Ordinário)
          
          // Salvar relatório completo
          const resultadoSalvar = await salvarRelatorioCompleto(resultado);
          resultado.salvamento = resultadoSalvar;
          
          if (resultadoSalvar.salvos > 0) {
            totalSalvos++;
          } else {
            totalErros++;
          }
          
          resultados.push(resultado);
          
          // Pausa entre requests para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`❌ Erro crítico na query ${query.id} para ${data}: ${error.message}`);
          totalErros++;
          resultados.push({ 
            sucesso: false,
            query,
            data, 
            erro: error.message,
            salvamento: { salvos: 0, erro: error.message }
          });
        }
      }
    }
    
    // 4. Relatório final
    const tempoTotal = (Date.now() - inicioTempo) / 1000;
    
    console.log('\n' + '='.repeat(70));
    console.log('🎯 RELATÓRIO FINAL - COLETA COMPLETA');
    console.log('='.repeat(70));
    console.log(`⏱️  Tempo total: ${tempoTotal.toFixed(1)} segundos`);
    console.log(`📅 Datas processadas: ${DATAS_TESTE.length}`);
    console.log(`📊 Queries processadas: ${QUERIES_CONTAHUB.length}`);
    console.log(`💾 Relatórios salvos: ${totalSalvos}`);
    console.log(`❌ Erros: ${totalErros}`);
    console.log(`🎯 Total esperado: ${QUERIES_CONTAHUB.length * DATAS_TESTE.length}`);
    
    console.log('\n📋 Resumo por tipo de relatório:');
    QUERIES_CONTAHUB.forEach(query => {
      const resultadosQuery = resultados.filter(r => r.query.id === query.id);
      const sucessos = resultadosQuery.filter(r => r.sucesso).length;
      const total = resultadosQuery.length;
      const status = sucessos === total ? '✅' : sucessos > 0 ? '⚠️' : '❌';
      console.log(`   ${status} ${query.descricao}: ${sucessos}/${total} sucessos`);
    });
    
    console.log('\n📅 Resumo por data:');
    DATAS_TESTE.forEach(data => {
      const resultadosData = resultados.filter(r => r.data === data);
      const sucessos = resultadosData.filter(r => r.sucesso).length;
      const total = resultadosData.length;
      const status = sucessos === total ? '✅' : sucessos > 0 ? '⚠️' : '❌';
      console.log(`   ${status} ${data}: ${sucessos}/${total} sucessos`);
    });
    
    console.log('\n✅ COLETA COMPLETA FINALIZADA!');
    console.log('📝 Próximo passo: Executar processamento dos dados na sistema_raw');
    
    // JSON final para o resultado
    const resultadoFinal = {
      sucesso: true,
      datas_processadas: DATAS_TESTE.length,
      queries_processadas: QUERIES_CONTAHUB.length,
      relatorios_salvos: totalSalvos,
      erros: totalErros,
      tempo_total: tempoTotal,
      total_esperado: QUERIES_CONTAHUB.length * DATAS_TESTE.length
    };
    
    console.log('\n📊 RESULTADO JSON:');
    console.log(JSON.stringify(resultadoFinal));
    
    return resultadoFinal;
    
  } catch (error) {
    console.error('💥 Erro crítico no teste:', error);
    return {
      sucesso: false,
      erro: error.message
    };
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  console.log('🧪 Executando coleta COMPLETA do ContaHub...\n');
  executarTeste().catch(console.error);
}

module.exports = { executarTeste, DATAS_TESTE, QUERIES_CONTAHUB }; 