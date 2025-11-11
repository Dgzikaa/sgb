#!/usr/bin/env node

/**
 * Script para importar histórico DETALHADO de contagens de estoque
 * da planilha "Pedidos e Estoque _ Ordinário - INSUMOS.csv"
 * 
 * Estrutura do CSV:
 * - Linha 3: "COZINHA" com datas separadas por 2 colunas vazias
 * - Linha 4: Números das colunas
 * - Linha 5: Headers (PREÇO, ÁREA, Cód, etc + repetições de ESTOQUE FECHADO, ESTOQUE FLUTUANTE, PEDIDO)
 * - Linha 6+: Dados dos insumos
 * 
 * Execução: node exemplo_teste/importar-historico-detalhado-planilha.js
 */

const fs = require('fs');
const path = require('path');

// Configuração
const API_BASE_URL = process.argv[2] || 'http://localhost:3000';
const BAR_ID = 3; // Ordinário

// Buscar arquivo CSV automaticamente (contorna problemas de encoding)
const arquivos = fs.readdirSync(__dirname);
const arquivoCSV = arquivos.find(f => f.includes('INSUMOS') && f.endsWith('.csv'));
if (!arquivoCSV) {
  console.error('❌ Arquivo CSV de INSUMOS não encontrado!');
  process.exit(1);
}
const ARQUIVO_CSV = path.join(__dirname, arquivoCSV);

console.log(`🌐 URL da API: ${API_BASE_URL}`);
console.log(`📁 Arquivo encontrado: ${arquivoCSV}\n`);

/**
 * Parse valor monetário brasileiro para número
 */
function parseValor(valor) {
  if (!valor || valor.trim() === '' || valor === '-') return 0;
  
  // Remove R$, espaços e converte , para .
  const limpo = valor
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  
  const numero = parseFloat(limpo);
  return isNaN(numero) ? 0 : numero;
}

/**
 * Parse data do formato DD/MM/YYYY
 */
function parseData(dataStr) {
  if (!dataStr || dataStr.trim() === '') return null;
  
  const partes = dataStr.trim().split('/');
  if (partes.length !== 3) return null;
  
  const [dia, mes, ano] = partes;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/**
 * Cria/atualiza contagem de estoque
 */
async function criarContagem(dados) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/estoque/contagem-insumos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error || 'Erro desconhecido' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando importação de histórico detalhado...\n');

  // Verificar se arquivo existe
  if (!fs.existsSync(ARQUIVO_CSV)) {
    console.error('❌ Arquivo não encontrado:', ARQUIVO_CSV);
    process.exit(1);
  }

  // Ler arquivo
  console.log('📖 Lendo arquivo CSV...');
  const conteudo = fs.readFileSync(ARQUIVO_CSV, 'utf-8');
  const linhas = conteudo.split('\n');
  
  console.log(`📊 Total de linhas: ${linhas.length}\n`);

  // Linha 4 (índice 3) tem "COZINHA" e as datas
  const linhaDatas = linhas[3].split(',');
  
  // Parse datas - elas aparecem a cada 3 colunas após as 7 primeiras
  const datas = [];
  for (let i = 7; i < linhaDatas.length; i += 3) {
    const dataStr = linhaDatas[i];
    const dataParsed = parseData(dataStr);
    if (dataParsed) {
      datas.push({
        data: dataParsed,
        dataOriginal: dataStr,
        indiceEstoqueFechado: i,
        indicePedido: i + 2,
      });
    }
  }

  console.log(`✅ Encontradas ${datas.length} datas`);
  if (datas.length > 0) {
    console.log(`   Primeira: ${datas[0].dataOriginal} (${datas[0].data})`);
    console.log(`   Última: ${datas[datas.length - 1].dataOriginal} (${datas[datas.length - 1].data})\n`);
  }

  // Baseado no debug, as colunas corretas são:
  // Coluna 4 = Código (i####)
  // Coluna 7 = Nome do insumo
  const indiceCodigo = 4;
  const indiceInsumo = 7;

  console.log('📋 Índices de colunas:');
  console.log(`   Código: ${indiceCodigo}`);
  console.log(`   Insumo: ${indiceInsumo}\n`);

  // Processar TODAS as linhas de insumos (COZINHA + SALÃO/Bar + FUNCIONÁRIOS)
  // Começam na linha 603, índice 602
  const linhasInsumos = [];
  for (let i = 602; i < linhas.length; i++) {
    const linha = linhas[i];
    
    // Parar apenas se linha vazia OU se acabou o arquivo
    if (!linha || linha.trim() === '') {
      continue; // Pula linha vazia mas continua
    }

    // Só adicionar linhas que tenham código de insumo (iXXXX)
    // Isso vai pegar COZINHA, SALÃO e FUNCIONÁRIOS automaticamente
    if (linha.match(/,i\d{4},/)) {
      linhasInsumos.push(linha);
    }
  }

  console.log(`🔍 Insumos encontrados na planilha: ${linhasInsumos.length}\n`);

  // Cache de insumos do banco
  console.log('📥 Buscando insumos cadastrados no sistema...');
  const responseInsumos = await fetch(`${API_BASE_URL}/api/operacional/receitas/insumos?ativo=true`);
  const dataInsumos = await responseInsumos.json();
  const insumosCadastrados = dataInsumos.data || [];
  const mapaInsumos = {};
  insumosCadastrados.forEach(ins => {
    mapaInsumos[ins.codigo] = ins;
  });
  console.log(`✅ ${insumosCadastrados.length} insumos cadastrados no sistema\n`);

  // Estatísticas
  const stats = {
    insumosProcessados: 0,
    insumosNaoEncontrados: 0,
    contagensCriadas: 0,
    contagensErro: 0,
    datasProcessadas: new Set(),
  };

  // Processar cada insumo
  console.log('🔄 Processando insumos...\n');

  for (const linhaInsumo of linhasInsumos) {
    const colunas = linhaInsumo.split(',');
    
    const codigo = colunas[indiceCodigo]?.trim();
    const nomeInsumo = colunas[indiceInsumo]?.trim();

    // Debug primeira linha
    if (stats.insumosProcessados === 0) {
      console.log('🔍 DEBUG - Primeira linha:');
      console.log(`   Código (índice ${indiceCodigo}): "${codigo}"`);
      console.log(`   Nome (índice ${indiceInsumo}): "${nomeInsumo}"`);
      console.log(`   Total colunas: ${colunas.length}`);
    }

    if (!codigo || codigo === '' || !nomeInsumo || nomeInsumo === '') {
      continue;
    }

    stats.insumosProcessados++;

    // Buscar insumo no cache
    const insumo = mapaInsumos[codigo];
    
    if (!insumo) {
      console.log(`⚠️  ${codigo} (${nomeInsumo}) - Não encontrado no sistema`);
      stats.insumosNaoEncontrados++;
      continue;
    }

    console.log(`📦 ${codigo} - ${insumo.nome}`);

    // Processar datas
    let contagensInsumo = 0;
    let errosInsumo = 0;

    for (const dataInfo of datas) {
      const estoqueFechado = parseValor(colunas[dataInfo.indiceEstoqueFechado]);
      const pedido = parseValor(colunas[dataInfo.indicePedido]);

      // Só criar contagem se houver estoque fechado OU pedido
      if (estoqueFechado === 0 && pedido === 0) {
        continue;
      }

      // Criar contagem
      const payload = {
        bar_id: BAR_ID,
        data_contagem: dataInfo.data,
        insumo_id: insumo.id,
        estoque_final: estoqueFechado,
        quantidade_pedido: pedido,
        observacoes: 'Importado da planilha',
      };

      const resultado = await criarContagem(payload);

      if (resultado.success) {
        contagensInsumo++;
        stats.contagensCriadas++;
        stats.datasProcessadas.add(dataInfo.data);
      } else {
        errosInsumo++;
        stats.contagensErro++;
      }

      // Aguardar um pouco para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log(`   ✅ ${contagensInsumo} contagens | ❌ ${errosInsumo} erros\n`);

    // Aguardar entre insumos
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(60));
  console.log(`📦 Insumos processados: ${stats.insumosProcessados}`);
  console.log(`⚠️  Insumos não encontrados: ${stats.insumosNaoEncontrados}`);
  console.log(`✅ Contagens criadas: ${stats.contagensCriadas}`);
  console.log(`❌ Contagens com erro: ${stats.contagensErro}`);
  console.log(`📅 Datas processadas: ${stats.datasProcessadas.size}`);
  console.log('='.repeat(60));
  console.log('\n✅ Importação concluída!\n');
}

// Executar
main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});
