#!/usr/bin/env node

/**
 * Script para importar histórico de contagens de estoque da planilha
 * 
 * Formato esperado do CSV/Excel:
 * data_contagem,insumo_codigo,estoque_final,quantidade_pedido
 * 
 * Execução: node exemplo_teste/importar-historico-estoque.js arquivo.csv
 */

const fs = require('fs');
const path = require('path');

// Configuração
const API_BASE_URL = process.argv[3] || 'http://localhost:3000';
const BAR_ID = 3; // Ordinário

console.log(`🌐 URL da API: ${API_BASE_URL}\n`);

/**
 * Lê arquivo CSV e retorna array de objetos
 */
function lerCSV(caminhoArquivo) {
  const conteudo = fs.readFileSync(caminhoArquivo, 'utf-8');
  const linhas = conteudo.split('\n').filter(linha => linha.trim());
  
  if (linhas.length === 0) {
    throw new Error('Arquivo vazio');
  }

  // Primeira linha são os headers
  const headers = linhas[0].split(',').map(h => h.trim());
  console.log('📋 Headers encontrados:', headers);

  // Processar linhas de dados
  const dados = [];
  for (let i = 1; i < linhas.length; i++) {
    const valores = linhas[i].split(',').map(v => v.trim());
    const objeto = {};
    
    headers.forEach((header, index) => {
      objeto[header] = valores[index];
    });

    dados.push(objeto);
  }

  return dados;
}

/**
 * Importa uma contagem para o sistema
 */
async function importarContagem(contagem) {
  const {
    data_contagem,
    insumo_codigo,
    estoque_final,
    quantidade_pedido = 0,
    estoque_inicial = null,
    observacoes = 'Importado da planilha',
  } = contagem;

  try {
    // Buscar insumo pelo código
    const responseInsumo = await fetch(`${API_BASE_URL}/api/operacional/receitas/insumos?ativo=true`);
    if (!responseInsumo.ok) {
      throw new Error('Erro ao buscar insumos');
    }

    const dataInsumos = await responseInsumo.json();
    const insumo = (dataInsumos.data || []).find(i => i.codigo === insumo_codigo);

    if (!insumo) {
      console.error(`❌ Insumo ${insumo_codigo} não encontrado`);
      return { success: false, error: 'Insumo não encontrado', codigo: insumo_codigo };
    }

    // Criar/atualizar contagem
    const payload = {
      bar_id: BAR_ID,
      data_contagem,
      insumo_id: insumo.id,
      estoque_final: parseFloat(estoque_final),
      quantidade_pedido: parseFloat(quantidade_pedido) || 0,
      observacoes,
      usuario_contagem: 'Importação',
    };

    const response = await fetch(`${API_BASE_URL}/api/estoque/contagem-insumos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`✅ ${data_contagem} - ${insumo_codigo} (${insumo.nome}): ${estoque_final}${insumo.unidade_medida}`);
      return { success: true, data: result.data };
    } else {
      console.error(`❌ ${data_contagem} - ${insumo_codigo}: ${result.error || 'Erro desconhecido'}`);
      return { success: false, error: result.error, codigo: insumo_codigo };
    }
  } catch (error) {
    console.error(`❌ ${data_contagem} - ${insumo_codigo}: ${error.message}`);
    return { success: false, error: error.message, codigo: insumo_codigo };
  }
}

/**
 * Função principal
 */
async function main() {
  const caminhoArquivo = process.argv[2];

  if (!caminhoArquivo) {
    console.error('❌ Uso: node importar-historico-estoque.js arquivo.csv [API_URL]');
    console.error('   Exemplo: node importar-historico-estoque.js historico.csv');
    console.error('   Exemplo: node importar-historico-estoque.js historico.csv http://localhost:3000');
    process.exit(1);
  }

  if (!fs.existsSync(caminhoArquivo)) {
    console.error(`❌ Arquivo não encontrado: ${caminhoArquivo}`);
    process.exit(1);
  }

  console.log('🚀 Iniciando importação de histórico de estoque...\n');
  console.log(`📁 Arquivo: ${caminhoArquivo}\n`);

  // Ler CSV
  let dados;
  try {
    dados = lerCSV(caminhoArquivo);
    console.log(`📊 Total de registros a importar: ${dados.length}\n`);
  } catch (error) {
    console.error('❌ Erro ao ler arquivo:', error.message);
    process.exit(1);
  }

  // Agrupar por data para processar em ordem
  const dadosPorData = {};
  dados.forEach(d => {
    if (!dadosPorData[d.data_contagem]) {
      dadosPorData[d.data_contagem] = [];
    }
    dadosPorData[d.data_contagem].push(d);
  });

  const datas = Object.keys(dadosPorData).sort();
  console.log(`📅 Datas encontradas: ${datas.join(', ')}\n`);

  const resultados = {
    sucesso: 0,
    erro: 0,
    erros: [],
  };

  // Processar data por data
  for (const data of datas) {
    console.log(`\n📅 Processando ${data} (${dadosPorData[data].length} itens)...`);

    const contagensData = dadosPorData[data];
    
    // Processar em lotes de 5 para não sobrecarregar
    const BATCH_SIZE = 5;
    for (let i = 0; i < contagensData.length; i += BATCH_SIZE) {
      const batch = contagensData.slice(i, i + BATCH_SIZE);
      const promises = batch.map(contagem => importarContagem(contagem));
      const results = await Promise.all(promises);

      results.forEach(result => {
        if (result.success) {
          resultados.sucesso++;
        } else {
          resultados.erro++;
          resultados.erros.push(result);
        }
      });

      // Aguardar um pouco entre lotes
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(60));
  console.log(`✅ Sucesso: ${resultados.sucesso}`);
  console.log(`❌ Erros: ${resultados.erro}`);
  console.log(`📦 Total: ${dados.length}`);
  console.log(`📅 Datas processadas: ${datas.length}`);

  if (resultados.erros.length > 0) {
    console.log('\n❌ Registros com erro:');
    const errosUnicos = {};
    resultados.erros.forEach(erro => {
      const chave = `${erro.codigo}: ${erro.error}`;
      if (!errosUnicos[chave]) {
        errosUnicos[chave] = 0;
      }
      errosUnicos[chave]++;
    });

    Object.entries(errosUnicos).forEach(([erro, quantidade]) => {
      console.log(`   - ${erro} (${quantidade}x)`);
    });
  }

  console.log('\n✅ Importação concluída!\n');
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

