const fs = require('fs');
const path = require('path');

// ====================================
// CONFIGURAÇÕES
// ====================================
const API_BASE_URL = process.argv[2] || 'http://localhost:3000';
const BAR_ID = 3; // Ordinário
const BATCH_SIZE = 10; // Processar 10 receitas por vez

// ====================================
// FUNÇÕES AUXILIARES
// ====================================

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Detecta unidade de medida baseado no valor e no nome do insumo
 */
function detectarUnidade(quantidade, nomeInsumo, codigoInsumo) {
  const qtd = parseFloat(quantidade);
  const nome = (nomeInsumo || '').toLowerCase();
  const codigo = (codigoInsumo || '').toLowerCase();

  // Água da Casa, líquidos em geral
  if (nome.includes('água') || nome.includes('leite') || nome.includes('suco') || 
      nome.includes('creme de leite') || nome.includes('vinagre') || nome.includes('azeite') ||
      nome.includes('óleo') || nome.includes('molho') || nome.includes('vinho') ||
      nome.includes('cachaça') || nome.includes('vodka') || nome.includes('whisky') ||
      nome.includes('gin') || nome.includes('rum') || nome.includes('cerveja') ||
      nome.includes('tequila') || nome.includes('licor') || nome.includes('xarope') ||
      nome.includes('calda') || nome.includes('cordial') || nome.includes('shrub')) {
    return qtd >= 1000 ? 'l' : 'ml';
  }

  // Unidades específicas
  if (nome.includes('ovo') || nome.includes('und') || nome.includes('unidade') ||
      nome.includes('pão') || nome.includes('massa de pastel') || nome.includes('baguete') ||
      nome.includes('cápsula')) {
    return 'unid';
  }

  // Maços/folhas
  if (nome.includes('mç') || nome.includes('maço') || nome.includes('folha') ||
      nome.includes('coentro') || nome.includes('salsinha') || nome.includes('cebolinha') ||
      nome.includes('hortelã') || nome.includes('manjericão') || nome.includes('tomilho') ||
      nome.includes('salsa')) {
    return qtd < 10 ? 'unid' : 'g';
  }

  // Receitas como insumo (pc#### ou pd####)
  if (codigo.startsWith('pc') || codigo.startsWith('pd')) {
    return 'g';
  }

  // Sólidos em geral
  // Se a quantidade é >= 1000, considerar kg se não for líquido
  if (qtd >= 1000) {
    return 'g'; // Vamos manter em gramas para padronizar
  }

  // Pequenas quantidades (<= 100g) são temperos/especiarias
  if (qtd <= 100) {
    return 'g';
  }

  // Default: gramas
  return 'g';
}

/**
 * Busca insumo pelo código
 */
async function buscarInsumoPorCodigo(codigo) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/operacional/receitas/insumos?busca=${codigo}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data && data.data.length > 0) {
      // Procura exata pelo código
      const insumo = data.data.find(i => i.codigo === codigo);
      return insumo || null;
    }

    return null;
  } catch (error) {
    console.error(`❌ Erro ao buscar insumo ${codigo}:`, error.message);
    return null;
  }
}

/**
 * Busca receita pelo código
 */
async function buscarReceitaPorCodigo(codigo) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/operacional/receitas?busca=${codigo}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data && data.data.length > 0) {
      // Procura exata pelo código
      const receita = data.data.find(r => r.receita_codigo === codigo);
      return receita || null;
    }

    return null;
  } catch (error) {
    console.error(`❌ Erro ao buscar receita ${codigo}:`, error.message);
    return null;
  }
}

/**
 * Cadastra receita com insumos
 */
async function cadastrarReceita(codigo, nome, tipo, insumos, rendimento) {
  try {
    console.log(`\n📝 Cadastrando receita: ${codigo} - ${nome}`);
    console.log(`   Tipo: ${tipo}`);
    console.log(`   Rendimento: ${rendimento}g`);
    console.log(`   Insumos: ${insumos.length}`);

    const response = await fetch(`${API_BASE_URL}/api/operacional/receitas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receita_codigo: codigo,
        receita_nome: nome,
        receita_categoria: tipo === 'producao_cozinha' ? 'cozinha' : 'drink',
        tipo_local: tipo === 'producao_cozinha' ? 'cozinha' : 'bar',
        rendimento_esperado: rendimento,
        insumos,
        bar_id: BAR_ID,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      console.error(`❌ Erro ao cadastrar ${codigo}:`, data.error || 'Erro desconhecido');
      return { success: false, error: data.error };
    }

    console.log(`✅ Receita ${codigo} cadastrada com sucesso!`);
    return { success: true, data: data.data };
  } catch (error) {
    console.error(`❌ Erro ao cadastrar ${codigo}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Processa arquivo TSV (Tab Separated Values)
 */
async function processarArquivoTSV(arquivoPath) {
  console.log(`\n📂 Lendo arquivo: ${arquivoPath}\n`);

  const conteudo = fs.readFileSync(arquivoPath, 'utf-8');
  const linhas = conteudo.split('\n').filter(l => l.trim());

  if (linhas.length < 2) {
    console.error('❌ Arquivo vazio ou sem dados!');
    return;
  }

  // Pular primeira linha (cabeçalho)
  const linhasDados = linhas.slice(1);

  console.log(`📊 Total de linhas de dados: ${linhasDados.length}\n`);

  // Agrupar por código de receita
  const receitasMap = new Map();

  for (const linha of linhasDados) {
    const colunas = linha.split('\t');
    
    if (colunas.length < 5) continue;

    const codProduto = colunas[0]?.trim();
    const nomeProduto = colunas[1]?.trim();
    const codInsumo = colunas[2]?.trim();
    const nomeInsumo = colunas[3]?.trim();
    const qtdReceita = colunas[4]?.trim();
    const qtdRend = colunas[5]?.trim();

    if (!codProduto) continue;

    // Inicializar receita se não existir
    if (!receitasMap.has(codProduto)) {
      receitasMap.set(codProduto, {
        codigo: codProduto,
        nome: nomeProduto || codProduto,
        tipo: codProduto.startsWith('pc') ? 'producao_cozinha' : 'producao_drink',
        insumos: [],
        rendimento: 0,
      });
    }

    const receita = receitasMap.get(codProduto);

    // Adicionar insumo
    if (codInsumo && nomeInsumo && qtdReceita) {
      const quantidade = parseFloat(qtdReceita.replace(',', '.'));
      const unidade = detectarUnidade(quantidade, nomeInsumo, codInsumo);

      receita.insumos.push({
        codigo: codInsumo,
        nome: nomeInsumo,
        quantidade,
        unidade,
      });

      // Acumular rendimento
      const rendimento = parseFloat((qtdRend || qtdReceita).replace(',', '.')) || 0;
      receita.rendimento += rendimento;
    }
  }

  console.log(`\n✅ Total de receitas encontradas: ${receitasMap.size}\n`);

  // Processar receitas
  const receitas = Array.from(receitasMap.values());
  let sucessos = 0;
  let erros = 0;
  let jaExistentes = 0;

  for (let i = 0; i < receitas.length; i++) {
    const receita = receitas[i];

    console.log(`\n[${i + 1}/${receitas.length}] Processando: ${receita.codigo} - ${receita.nome}`);

    // Verificar se já existe
    const existe = await buscarReceitaPorCodigo(receita.codigo);
    if (existe) {
      console.log(`⚠️  Receita ${receita.codigo} já existe, pulando...`);
      jaExistentes++;
      continue;
    }

    // Resolver insumos (buscar IDs)
    const insumosResolvidos = [];
    let todosEncontrados = true;

    for (const ins of receita.insumos) {
      // Se for receita (pc#### ou pd####), buscar na tabela de receitas
      if (ins.codigo.startsWith('pc') || ins.codigo.startsWith('pd')) {
        const receitaInsumo = await buscarReceitaPorCodigo(ins.codigo);
        if (receitaInsumo) {
          insumosResolvidos.push({
            insumo_id: null,
            receita_insumo_id: receitaInsumo.id,
            quantidade: ins.quantidade,
            unidade: ins.unidade,
            eh_insumo_chefe: insumosResolvidos.length === 0, // Primeiro é chefe
          });
        } else {
          console.warn(`   ⚠️  Receita-insumo ${ins.codigo} não encontrada`);
          todosEncontrados = false;
        }
      } else if (ins.codigo.startsWith('i')) {
        // Buscar insumo normal
        const insumo = await buscarInsumoPorCodigo(ins.codigo);
        if (insumo) {
          insumosResolvidos.push({
            insumo_id: insumo.id,
            receita_insumo_id: null,
            quantidade: ins.quantidade,
            unidade: ins.unidade,
            eh_insumo_chefe: insumosResolvidos.length === 0, // Primeiro é chefe
          });
        } else {
          console.warn(`   ⚠️  Insumo ${ins.codigo} não encontrado`);
          todosEncontrados = false;
        }
      } else if (!ins.codigo) {
        // Insumo sem código (ex: "Caldo do Cozimento da Carne")
        console.warn(`   ⚠️  Insumo sem código: ${ins.nome}`);
        todosEncontrados = false;
      }

      await delay(50); // Pequeno delay entre buscas
    }

    if (!todosEncontrados) {
      console.warn(`   ⚠️  Alguns insumos não encontrados, pulando receita ${receita.codigo}`);
      erros++;
      continue;
    }

    // Cadastrar receita
    const resultado = await cadastrarReceita(
      receita.codigo,
      receita.nome,
      receita.tipo,
      insumosResolvidos,
      Math.round(receita.rendimento)
    );

    if (resultado.success) {
      sucessos++;
    } else {
      erros++;
    }

    // Delay entre receitas
    await delay(200);

    // A cada lote, pausar um pouco mais
    if ((i + 1) % BATCH_SIZE === 0) {
      console.log(`\n⏸️  Pausa após ${i + 1} receitas...\n`);
      await delay(1000);
    }
  }

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO FINAL');
  console.log('='.repeat(60));
  console.log(`✅ Receitas cadastradas com sucesso: ${sucessos}`);
  console.log(`⚠️  Receitas já existentes: ${jaExistentes}`);
  console.log(`❌ Receitas com erro: ${erros}`);
  console.log(`📦 Total processado: ${receitas.length}`);
  console.log('='.repeat(60) + '\n');
}

// ====================================
// MAIN
// ====================================
async function main() {
  console.log('🚀 IMPORTAÇÃO DE RECEITAS - FORMATO TSV\n');
  console.log(`🌐 URL da API: ${API_BASE_URL}`);
  console.log(`🏢 Bar ID: ${BAR_ID}\n`);

  // Verificar se arquivo existe
  const arquivoPath = path.join(__dirname, 'receitas-estruturado.txt');
  
  if (!fs.existsSync(arquivoPath)) {
    console.error(`❌ Arquivo não encontrado: ${arquivoPath}`);
    console.log(`\n💡 Crie o arquivo e cole os dados da planilha TSV (Tab Separated Values)`);
    process.exit(1);
  }

  await processarArquivoTSV(arquivoPath);
}

main().catch(error => {
  console.error('❌ Erro fatal:', error);
  process.exit(1);
});

