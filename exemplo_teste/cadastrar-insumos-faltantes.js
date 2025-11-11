#!/usr/bin/env node

/**
 * Script para cadastrar insumos faltantes (SALÃO/Bar e FUNCIONÁRIOS)
 * identificados durante a importação do histórico
 */

const fs = require('fs');
const path = require('path');

// Configuração
const API_BASE_URL = process.argv[2] || 'http://localhost:3000';
const BAR_ID = 3; // Ordinário

// Buscar arquivo CSV
const arquivos = fs.readdirSync(__dirname);
const arquivoCSV = arquivos.find(f => f.includes('INSUMOS') && f.endsWith('.csv'));
const ARQUIVO_CSV = path.join(__dirname, arquivoCSV);

console.log(`🌐 URL da API: ${API_BASE_URL}`);
console.log(`📁 Arquivo: ${arquivoCSV}\n`);

// Lista de códigos não encontrados (extraída do último output)
const codigosNaoEncontrados = [
  'i0144', 'i0145', 'i0058', 'i0061', 'i0063', 'i0065', 'i0484', 'i0068',
  'i0303', 'i0070', 'i0071', 'i0074', 'i0075', 'i0076', 'i0077', 'i0078',
  'i0080', 'i0083', 'i0236', 'i0002', 'i0003', 'i0021', 'i0020', 'i0230',
  'i0004', 'i0005', 'i0105', 'i0006', 'i0271', 'i0007', 'i0008', 'i0009',
  'i0012', 'i0304', 'i0013', 'i0014', 'i0270', 'i0536', 'i0528', 'i0239',
  'i0272', 'i0001', 'i0264', 'i0562', 'i0561', 'i0269', 'i0010', 'i0016',
  'i0017', 'i0237', 'i0238', 'i0018', 'i0019', 'i0265', 'i0558', 'i0523',
  'i0341', 'i0024', 'i0330', 'i0022', 'i0023', 'i0268', 'i0524', 'i0025',
  'i0529', 'i0273', 'i0028', 'i0576', 'i0274', 'i0527', 'i0526', 'i0030',
  'i0026', 'i0525', 'i0305', 'i0259', 'i0033', 'i0034', 'i0064', 'i0036',
  'i0037', 'i0039', 'i0040', 'i0042', 'i0087', 'i0088', 'i0089', 'i0090',
  'i0091', 'i0559', 'i0307', 'i0067', 'i0244', 'i0169', 'i0298', 'i0280',
  'i0085', 'i0328', 'i0329', 'i0191', 'i0563', 'i0568', 'i0313', 'i0193',
  'i0194', 'i0333', 'i0195', 'i0567', 'i0196', 'i0566', 'i0056', 'i0049',
  'i0052', 'i0053', 'i0050', 'i0051', 'i0054', 'i0057'
];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Iniciando cadastro de insumos faltantes...\n');

  // Ler CSV
  const conteudo = fs.readFileSync(ARQUIVO_CSV, 'utf-8');
  const linhas = conteudo.split('\n');

  // Procurar por todos os insumos faltantes no CSV
  const insumosPorCodigo = {};
  
  for (let i = 602; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha || linha.trim() === '') continue;
    
    const colunas = linha.split(',');
    const codigo = colunas[4];
    const nome = colunas[7];
    const preco = colunas[0]; // Preço está na coluna 0
    const area = colunas[1]; // Área está na coluna 1
    const categoria = colunas[5]; // Categoria está na coluna 5
    
    if (codigo && codigosNaoEncontrados.includes(codigo)) {
      // Limpar valores
      const precoLimpo = preco.replace(/[R$\s"]/g, '').replace(',', '.').trim();
      const nomeLimpo = nome.replace(/^"/, '').replace(/"$/, '').trim();
      const categoriaLimpa = categoria.replace(/["\(\)]/g, '').trim();
      
      // Determinar tipo_local baseado na área
      let tipo_local = 'cozinha';
      if (area && area.toUpperCase().includes('SALÃO')) {
        tipo_local = 'bar';
      } else if (area && area.toUpperCase().includes('FUNCIONÁRIO')) {
        tipo_local = 'funcionarios';
      }
      
      // Detectar unidade de medida do nome
      let unidade_medida = 'unid'; // Padrão
      const nomeUpper = nomeLimpo.toUpperCase();
      
      if (nomeUpper.includes(' KG') || nomeUpper.endsWith('KG')) {
        unidade_medida = 'kg';
      } else if (nomeUpper.includes(' G') || nomeUpper.endsWith('G') || nomeUpper.match(/\d+G/)) {
        unidade_medida = 'g';
      } else if (nomeUpper.includes(' ML') || nomeUpper.endsWith('ML') || nomeUpper.match(/\d+ML/)) {
        unidade_medida = 'ml';
      } else if (nomeUpper.includes(' L') || nomeUpper.includes('LITRO') || nomeUpper.match(/\d+L\b/)) {
        unidade_medida = 'l';
      } else if (nomeUpper.includes('UND') || nomeUpper.includes('UNIDADE')) {
        unidade_medida = 'unid';
      } else if (nomeUpper.includes('PCÇ') || nomeUpper.includes('PCT') || nomeUpper.includes('PACOTE')) {
        unidade_medida = 'pct';
      }
      
      insumosPorCodigo[codigo] = {
        codigo,
        nome: nomeLimpo,
        categoria: categoriaLimpa || 'geral',
        tipo_local,
        custo_unitario: parseFloat(precoLimpo) || 0,
        unidade_medida,
        observacoes: `Importado automaticamente - ${area || 'N/A'}`,
        bar_id: BAR_ID,
      };
    }
  }

  const insumosParaCadastrar = Object.values(insumosPorCodigo);
  console.log(`📦 Total de insumos para cadastrar: ${insumosParaCadastrar.length}\n`);

  let cadastrados = 0;
  let erros = 0;

  for (const insumo of insumosParaCadastrar) {
    try {
      console.log(`📝 Cadastrando ${insumo.codigo} - ${insumo.nome}...`);
      
      const response = await fetch(`${API_BASE_URL}/api/operacional/receitas/insumos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(insumo),
      });

      const data = await response.json();

      if (data.success) {
        console.log(`   ✅ Cadastrado com sucesso`);
        cadastrados++;
      } else {
        console.log(`   ⚠️  ${data.error || 'Erro desconhecido'}`);
        erros++;
      }

      // Delay para não sobrecarregar API
      await delay(100);
    } catch (error) {
      console.error(`   ❌ Erro: ${error.message}`);
      erros++;
    }
  }

  console.log(`\n============================================================`);
  console.log(`📊 RESUMO DO CADASTRO`);
  console.log(`============================================================`);
  console.log(`✅ Cadastrados: ${cadastrados}`);
  console.log(`❌ Erros: ${erros}`);
  console.log(`============================================================\n`);

  console.log('✅ Cadastro concluído! Agora execute novamente o script de importação:');
  console.log('   node exemplo_teste/importar-historico-detalhado-planilha.js\n');
}

main().catch(console.error);

