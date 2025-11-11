/**
 * 📊 IMPORTAÇÃO DIRETA PARA SUPABASE
 * 
 * Este script importa contagens direto para o Supabase
 * sem passar pela API do Next.js
 */

const SPREADSHEET_ID = '1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8';
const API_KEY = 'AIzaSyBKprFuR1gpvoTB4hV16rKlBk3oF0v1BhQ';
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxOTc3MTU2NiwiZXhwIjoyMDM1MzQ3NTY2fQ.sDH6XOFPfSKmLWjQi4d7VzO9xwIYeO4JwCwJBKm2uB8';
const BAR_ID = 3;

function converterData(dataStr) {
  if (!dataStr || !dataStr.includes('/')) return null;
  const partes = dataStr.split('/');
  if (partes.length !== 3) return null;
  const [dia, mes, ano] = partes;
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
}

async function buscarEstruturaPlanilha() {
  try {
    console.log('🔍 Buscando estrutura da planilha...\n');
    
    const range = 'INSUMOS!A1:ZZZ200';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    const linhas = data.values || [];
    
    const linhaDatas = linhas[3] || [];
    const mapeamentoColunas = [];
    
    linhaDatas.forEach((valor, indice) => {
      if (valor && valor.includes('/')) {
        const dataFormatada = converterData(valor);
        if (dataFormatada) {
          mapeamentoColunas.push({
            data: dataFormatada,
            colunaEstoqueFechado: indice,
            colunaPedido: indice + 2,
          });
        }
      }
    });
    
    console.log(`✅ ${mapeamentoColunas.length} datas identificadas`);
    
    const insumos = [];
    
    for (let i = 6; i < linhas.length; i++) {
      const linha = linhas[i];
      if (!linha || linha.length < 7) continue;
      
      const codigo = linha[3]?.trim();
      const nome = linha[6]?.trim();
      const categoria = linha[4]?.trim();
      
      if (!codigo || !nome) continue;
      
      const contagensPorData = {};
      
      mapeamentoColunas.forEach(map => {
        const estoqueFechado = parseFloat(linha[map.colunaEstoqueFechado]) || null;
        const pedido = parseFloat(linha[map.colunaPedido]) || null;
        
        if (estoqueFechado !== null && estoqueFechado > 0) {
          contagensPorData[map.data] = {
            estoque_fechado: estoqueFechado,
            pedido: pedido || 0,
          };
        }
      });
      
      if (Object.keys(contagensPorData).length > 0) {
        insumos.push({ codigo, nome, categoria, contagens: contagensPorData });
      }
    }
    
    console.log(`✅ ${insumos.length} insumos com dados\n`);
    
    return {
      datas: mapeamentoColunas.map(m => m.data),
      insumos,
    };
  } catch (error) {
    console.error('❌ Erro:', error.message);
    throw error;
  }
}

async function buscarInsumosSupabase() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/insumos?ativo=eq.true&select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  
  if (!response.ok) {
    throw new Error(`Erro ao buscar insumos: ${response.status}`);
  }
  
  return await response.json();
}

async function importarContagem(payload) {
  // Verificar se já existe
  const checkUrl = `${SUPABASE_URL}/rest/v1/contagem_estoque_insumos?bar_id=eq.${payload.bar_id}&data_contagem=eq.${payload.data_contagem}&insumo_id=eq.${payload.insumo_id}&select=id`;
  
  const checkResponse = await fetch(checkUrl, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
    },
  });
  
  const existing = await checkResponse.json();
  
  if (existing && existing.length > 0) {
    // Atualizar
    const updateUrl = `${SUPABASE_URL}/rest/v1/contagem_estoque_insumos?id=eq.${existing[0].id}`;
    const response = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
    
    return response.ok;
  } else {
    // Inserir
    const insertUrl = `${SUPABASE_URL}/rest/v1/contagem_estoque_insumos`;
    const response = await fetch(insertUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
    });
    
    return response.ok;
  }
}

async function main() {
  const dataInicial = process.argv[2];
  const dataFinal = process.argv[3];
  
  console.log('🚀 IMPORTAÇÃO DIRETA PARA SUPABASE\n');
  console.log('='.repeat(60));
  console.log(`📊 Planilha: ${SPREADSHEET_ID}`);
  console.log(`🗄️  Supabase: ${SUPABASE_URL}`);
  console.log(`🏪 Bar ID: ${BAR_ID}`);
  
  if (dataInicial && dataFinal) {
    console.log(`📅 Período: ${dataInicial} até ${dataFinal}`);
  } else {
    console.log(`📅 Período: TODAS as datas`);
  }
  
  console.log('='.repeat(60));
  console.log('');
  
  // Buscar estrutura
  const estrutura = await buscarEstruturaPlanilha();
  
  let datasParaProcessar = estrutura.datas;
  if (dataInicial && dataFinal) {
    datasParaProcessar = estrutura.datas.filter(d => d >= dataInicial && d <= dataFinal);
    console.log(`📅 Datas filtradas: ${datasParaProcessar.length}\n`);
  }
  
  // Buscar insumos do Supabase
  console.log('🔄 Carregando insumos do Supabase...\n');
  const insumosSistema = await buscarInsumosSupabase();
  
  const mapaInsumos = new Map();
  insumosSistema.forEach(insumo => {
    mapaInsumos.set(insumo.codigo, insumo);
  });
  
  console.log(`✅ ${mapaInsumos.size} insumos carregados\n`);
  
  // Estatísticas
  const stats = {
    total: 0,
    sucesso: 0,
    erro: 0,
    insumosNaoEncontrados: new Set(),
  };
  
  console.log('📊 Iniciando importação...\n');
  
  for (const data of datasParaProcessar) {
    console.log(`📅 Processando ${data}...`);
    
    let sucessoData = 0;
    let erroData = 0;
    
    for (const insumoSheet of estrutura.insumos) {
      const contagemData = insumoSheet.contagens[data];
      if (!contagemData) continue;
      
      const insumoSistema = mapaInsumos.get(insumoSheet.codigo);
      if (!insumoSistema) {
        stats.insumosNaoEncontrados.add(insumoSheet.codigo);
        continue;
      }
      
      stats.total++;
      
      const payload = {
        bar_id: BAR_ID,
        data_contagem: data,
        insumo_id: insumoSistema.id,
        insumo_codigo: insumoSistema.codigo,
        insumo_nome: insumoSistema.nome,
        estoque_inicial: null,
        estoque_final: contagemData.estoque_fechado,
        quantidade_pedido: contagemData.pedido,
        tipo_local: insumoSistema.tipo_local,
        categoria: insumoSistema.categoria || insumoSheet.categoria,
        unidade_medida: insumoSistema.unidade_medida,
        custo_unitario: insumoSistema.custo_unitario || 0,
        observacoes: 'Importado Google Sheets',
        usuario_contagem: 'Importação',
        updated_at: new Date().toISOString(),
      };
      
      const sucesso = await importarContagem(payload);
      
      if (sucesso) {
        stats.sucesso++;
        sucessoData++;
      } else {
        stats.erro++;
        erroData++;
      }
      
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    
    console.log(`   ✅ ${sucessoData} sucesso | ❌ ${erroData} erro\n`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMO');
  console.log('='.repeat(60));
  console.log(`📅 Datas: ${datasParaProcessar.length}`);
  console.log(`📦 Total: ${stats.total}`);
  console.log(`✅ Sucesso: ${stats.sucesso}`);
  console.log(`❌ Erro: ${stats.erro}`);
  console.log(`⚠️  Não encontrados: ${stats.insumosNaoEncontrados.size}`);
  
  if (stats.insumosNaoEncontrados.size > 0) {
    console.log('\n⚠️  Códigos não encontrados:');
    Array.from(stats.insumosNaoEncontrados).slice(0, 20).forEach(codigo => {
      console.log(`   - ${codigo}`);
    });
  }
  
  console.log('\n✅ Importação concluída!\n');
}

main().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});

