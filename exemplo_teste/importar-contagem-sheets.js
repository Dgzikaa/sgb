/**
 * 📊 IMPORTAÇÃO DE CONTAGEM DE ESTOQUE - GOOGLE SHEETS
 * 
 * Este script importa o histórico completo de contagens diretamente
 * do Google Sheets para o sistema Zykor.
 * 
 * Uso:
 * node exemplo_teste/importar-contagem-sheets.js [data_inicial] [data_final]
 * 
 * Exemplos:
 * node exemplo_teste/importar-contagem-sheets.js
 * node exemplo_teste/importar-contagem-sheets.js 2025-11-01 2025-11-10
 */

const SPREADSHEET_ID = '1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8';
const API_KEY = 'AIzaSyBKprFuR1gpvoTB4hV16rKlBk3oF0v1BhQ';
const API_BASE_URL = process.argv[4] || 'http://localhost:3000';
const BAR_ID = 3;

/**
 * Converte data DD/MM/YYYY para YYYY-MM-DD
 */
function converterData(dataStr) {
  if (!dataStr || !dataStr.includes('/')) return null;
  
  const partes = dataStr.split('/');
  if (partes.length !== 3) return null;
  
  const [dia, mes, ano] = partes;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

/**
 * Busca estrutura completa da planilha
 */
async function buscarEstruturaPlanilha() {
  try {
    console.log('🔍 Buscando estrutura da planilha...\n');
    
    // Buscar linhas 4 e 6 (datas e cabeçalhos) + todos os insumos
    const range = 'INSUMOS!A1:ZZZ200';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erro ao acessar planilha: ${response.status}`);
    }
    
    const data = await response.json();
    const linhas = data.values || [];
    
    if (linhas.length < 7) {
      throw new Error('Planilha não tem dados suficientes');
    }
    
    // Linha 4 (índice 3) = datas
    const linhaDatas = linhas[3] || [];
    
    // Linha 6 (índice 5) = cabeçalhos
    const linhaCabecalhos = linhas[5] || [];
    
    // Identificar colunas com datas e suas posições
    const mapeamentoColunas = [];
    
    linhaDatas.forEach((valor, indice) => {
      if (valor && valor.includes('/2025')) {
        const dataFormatada = converterData(valor);
        if (dataFormatada) {
          // Verifica se as próximas 2 colunas são ESTOQUE FLUTUANTE e PEDIDO
          const colEstoqueFlutuante = indice + 1;
          const colPedido = indice + 2;
          
          mapeamentoColunas.push({
            data: dataFormatada,
            dataOriginal: valor,
            colunaEstoqueFechado: indice,
            colunaEstoqueFlutuante: colEstoqueFlutuante,
            colunaPedido: colPedido,
          });
        }
      }
    });
    
    console.log(`✅ ${mapeamentoColunas.length} datas identificadas`);
    console.log(`   Primeira data: ${mapeamentoColunas[0]?.data}`);
    console.log(`   Última data: ${mapeamentoColunas[mapeamentoColunas.length - 1]?.data}\n`);
    
    // Processar insumos (a partir da linha 7, índice 6)
    const insumos = [];
    
    for (let i = 6; i < linhas.length; i++) {
      const linha = linhas[i];
      
      if (!linha || linha.length < 7) continue;
      
      const codigo = linha[3]?.trim(); // Coluna D
      const nome = linha[6]?.trim();   // Coluna G
      const categoria = linha[4]?.trim(); // Coluna E
      
      if (!codigo || !nome) continue;
      
      // Buscar dados de contagem para cada data
      const contagensPorData = {};
      
      mapeamentoColunas.forEach(map => {
        const estoqueFechado = parseFloat(linha[map.colunaEstoqueFechado]) || null;
        const estoqueFlutuante = parseFloat(linha[map.colunaEstoqueFlutuante]) || null;
        const pedido = parseFloat(linha[map.colunaPedido]) || null;
        
        // Só adiciona se tiver pelo menos estoque fechado
        if (estoqueFechado !== null && estoqueFechado > 0) {
          contagensPorData[map.data] = {
            estoque_fechado: estoqueFechado,
            estoque_flutuante: estoqueFlutuante,
            pedido: pedido || 0,
          };
        }
      });
      
      if (Object.keys(contagensPorData).length > 0) {
        insumos.push({
          codigo,
          nome,
          categoria,
          contagens: contagensPorData,
        });
      }
    }
    
    console.log(`✅ ${insumos.length} insumos com dados de contagem\n`);
    
    return {
      datas: mapeamentoColunas.map(m => m.data),
      insumos,
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar estrutura:', error.message);
    throw error;
  }
}

/**
 * Busca insumo no sistema pelo código
 */
async function buscarInsumoPorCodigo(codigo) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/operacional/receitas/insumos?ativo=true`);
    if (!response.ok) {
      throw new Error('Erro ao buscar insumos');
    }
    
    const data = await response.json();
    const insumo = (data.data || []).find(i => i.codigo === codigo);
    
    return insumo || null;
  } catch (error) {
    console.error(`❌ Erro ao buscar insumo ${codigo}:`, error.message);
    return null;
  }
}

/**
 * Cache de insumos para evitar múltiplas requisições
 */
const cacheInsumos = new Map();

async function buscarInsumoCached(codigo) {
  if (cacheInsumos.has(codigo)) {
    return cacheInsumos.get(codigo);
  }
  
  const insumo = await buscarInsumoPorCodigo(codigo);
  cacheInsumos.set(codigo, insumo);
  return insumo;
}

/**
 * Importa uma contagem para o sistema
 */
async function importarContagem(data_contagem, insumo_id, estoque_final, quantidade_pedido) {
  try {
    const payload = {
      bar_id: BAR_ID,
      data_contagem,
      insumo_id,
      estoque_final,
      quantidade_pedido: quantidade_pedido || 0,
      observacoes: 'Importado do Google Sheets',
      usuario_contagem: 'Importação Automática',
    };
    
    const response = await fetch(`${API_BASE_URL}/api/estoque/contagem-insumos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    
    if (response.ok && result.success) {
      return { success: true, data: result.data };
    } else {
      return { success: false, error: result.error || 'Erro desconhecido' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Função principal
 */
async function main() {
  const dataInicial = process.argv[2];
  const dataFinal = process.argv[3];
  
  console.log('🚀 IMPORTAÇÃO DE CONTAGEM DE ESTOQUE - GOOGLE SHEETS\n');
  console.log('='.repeat(60));
  console.log(`📡 API: ${API_BASE_URL}`);
  console.log(`📊 Planilha: ${SPREADSHEET_ID}`);
  console.log(`🏪 Bar ID: ${BAR_ID}`);
  
  if (dataInicial && dataFinal) {
    console.log(`📅 Período: ${dataInicial} até ${dataFinal}`);
  } else {
    console.log(`📅 Período: TODAS as datas disponíveis`);
  }
  
  console.log('='.repeat(60));
  console.log('');
  
  // 1. Buscar estrutura da planilha
  const estrutura = await buscarEstruturaPlanilha();
  
  // Filtrar datas se especificado
  let datasParaProcessar = estrutura.datas;
  if (dataInicial && dataFinal) {
    datasParaProcessar = estrutura.datas.filter(
      d => d >= dataInicial && d <= dataFinal
    );
    console.log(`📅 Datas filtradas: ${datasParaProcessar.length}\n`);
  }
  
  if (datasParaProcessar.length === 0) {
    console.log('⚠️ Nenhuma data para processar!');
    return;
  }
  
  // 2. Buscar todos os insumos do sistema (cache)
  console.log('🔄 Carregando insumos do sistema...\n');
  const responseInsumos = await fetch(`${API_BASE_URL}/api/operacional/receitas/insumos?ativo=true`);
  
  if (!responseInsumos.ok) {
    const errorText = await responseInsumos.text();
    console.error('❌ Erro ao buscar insumos:', responseInsumos.status, responseInsumos.statusText);
    console.error('   Resposta:', errorText.substring(0, 200));
    throw new Error(`API retornou status ${responseInsumos.status}`);
  }
  
  const dataInsumos = await responseInsumos.json();
  const insumosSistema = dataInsumos.data || [];
  
  insumosSistema.forEach(insumo => {
    cacheInsumos.set(insumo.codigo, insumo);
  });
  
  console.log(`✅ ${insumosSistema.length} insumos carregados\n`);
  
  // 3. Estatísticas
  const stats = {
    totalContagens: 0,
    contagensSucesso: 0,
    contagensErro: 0,
    insumosNaoEncontrados: new Set(),
    datasProcessadas: new Set(),
  };
  
  // 4. Processar data por data
  console.log('📊 Iniciando importação...\n');
  
  for (const data of datasParaProcessar) {
    console.log(`📅 Processando ${data}...`);
    
    let contagensData = 0;
    let sucessoData = 0;
    let erroData = 0;
    
    for (const insumoSheet of estrutura.insumos) {
      const contagemData = insumoSheet.contagens[data];
      
      if (!contagemData) continue;
      
      // Buscar insumo no sistema
      const insumoSistema = cacheInsumos.get(insumoSheet.codigo);
      
      if (!insumoSistema) {
        stats.insumosNaoEncontrados.add(insumoSheet.codigo);
        continue;
      }
      
      // Importar contagem
      const resultado = await importarContagem(
        data,
        insumoSistema.id,
        contagemData.estoque_fechado,
        contagemData.pedido
      );
      
      stats.totalContagens++;
      contagensData++;
      
      if (resultado.success) {
        stats.contagensSucesso++;
        sucessoData++;
      } else {
        stats.contagensErro++;
        erroData++;
      }
      
      // Aguardar um pouco para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    stats.datasProcessadas.add(data);
    console.log(`   ✅ ${sucessoData} sucesso | ❌ ${erroData} erro | Total: ${contagensData} contagens\n`);
    
    // Aguardar entre datas
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // 5. Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(60));
  console.log(`📅 Datas processadas: ${stats.datasProcessadas.size}`);
  console.log(`📦 Total de contagens: ${stats.totalContagens}`);
  console.log(`✅ Sucesso: ${stats.contagensSucesso}`);
  console.log(`❌ Erro: ${stats.contagensErro}`);
  console.log(`⚠️  Insumos não encontrados: ${stats.insumosNaoEncontrados.size}`);
  
  if (stats.insumosNaoEncontrados.size > 0) {
    console.log('\n⚠️  Códigos não encontrados no sistema:');
    const codigos = Array.from(stats.insumosNaoEncontrados).slice(0, 20);
    codigos.forEach(codigo => {
      console.log(`   - ${codigo}`);
    });
    if (stats.insumosNaoEncontrados.size > 20) {
      console.log(`   ... e mais ${stats.insumosNaoEncontrados.size - 20} códigos`);
    }
  }
  
  console.log('\n✅ Importação concluída!\n');
}

// Executar
main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});

