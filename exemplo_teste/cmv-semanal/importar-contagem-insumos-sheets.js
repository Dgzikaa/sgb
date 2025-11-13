import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do frontend
const envPath = path.resolve(__dirname, '../../frontend/.env.local');
config({ path: envPath });

// Validar variáveis obrigatórias
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas!');
  console.error('Certifique-se de que frontend/.env.local existe e contém:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Configurar Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Configurar Google Sheets
const SPREADSHEET_ID = '1QhuD52kQrdCv4XMfKR5NSRMttx6NzVBZO0S8ajQK1H8';
const SHEET_NAME = 'INSUMOS';
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, '../credentials_deboche_ordinario.json');

// Verificar se arquivo de credenciais existe
import fs from 'fs';
if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
  console.error(`❌ Arquivo credentials_deboche_ordinario.json não encontrado em: ${SERVICE_ACCOUNT_PATH}`);
  process.exit(1);
}

// Função para extrair unidade de medida do nome do insumo
function extrairUnidadeMedida(nomeInsumo) {
  const nome = nomeInsumo.toLowerCase().trim();
  
  // Padrões de unidades comuns (ordem importa: mais específico primeiro)
  const padroes = [
    { regex: /\b(kg|kilo|kilogram)\b/i, unidade: 'kg' },
    { regex: /\b(\d+)?g\b(?!alon)/i, unidade: 'g' },
    { regex: /\b(\d+)?\s?(ml|mL)\b/i, unidade: 'ml' },
    { regex: /\b(\d+)?\s?(L|litro|litros)\b/i, unidade: 'L' },
    { regex: /\b(und|unidade|un|unid)\b/i, unidade: 'un' },
    { regex: /\b(cx|caixa|caixas|bdj|bandeja)\b/i, unidade: 'cx' },
    { regex: /\b(pct|pacote|saco)\b/i, unidade: 'pct' },
    { regex: /\b(mç|maço|maco)\b/i, unidade: 'mç' },
    { regex: /\b(lata|lt)\b/i, unidade: 'lata' },
  ];
  
  for (const { regex, unidade } of padroes) {
    if (regex.test(nome)) {
      return unidade;
    }
  }
  
  // Se não encontrou nenhum padrão, retorna 'un' como padrão
  return 'un';
}

async function buscarInsumosSheets() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: SERVICE_ACCOUNT_PATH,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Buscar dados da planilha INSUMOS (linhas 1-200, colunas A-ZZ)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1:ZZ200`,
    });

    return response.data.values;
  } catch (error) {
    console.error('❌ Erro ao buscar dados do Google Sheets:', error.message);
    throw error;
  }
}

function converterData(dataStr) {
  if (!dataStr) return null;
  
  // Formato: dd/mm/yyyy
  const partes = dataStr.split('/');
  if (partes.length === 3) {
    const [dia, mes, ano] = partes;
    return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
  }
  
  return null;
}

function encontrarColunasPorData(linhaData) {
  const colunas = [];
  
  linhaData.forEach((valor, index) => {
    if (valor && valor.includes('/')) {
      const data = converterData(valor);
      if (data) {
        colunas.push({ index, data, valor });
      }
    }
  });
  
  return colunas;
}

async function importarContagemInsumos() {
  console.log('🚀 Iniciando importação de contagem de insumos do Google Sheets...\n');

  try {
    // 1. Buscar dados da planilha
    console.log('📊 Buscando dados da planilha INSUMOS...');
    const dados = await buscarInsumosSheets();
    
    if (!dados || dados.length === 0) {
      console.log('⚠️ Nenhum dado encontrado na planilha');
      return;
    }

    console.log(`✅ ${dados.length} linhas encontradas\n`);

    // 2. Identificar estrutura da planilha
    // Linha 4 (index 3): Datas
    // Linha 6 (index 5): Headers
    const linhaDatas = dados[3] || []; // Linha 4 (COZINHA com datas)
    const linhaHeaders = dados[5] || []; // Linha 6 (PREÇO, Categoria, INSUMOS, ESTOQUE FECHADO...)

    console.log('📅 Analisando estrutura da planilha...');
    console.log(`Linha de datas (linha 4): ${linhaDatas.slice(0, 10).join(', ')}...`);
    console.log(`Headers (linha 6): ${linhaHeaders.slice(0, 10).join(', ')}...\n`);

    // 3. Encontrar colunas de data e seus índices
    const colunasData = encontrarColunasPorData(linhaDatas);
    console.log(`✅ Encontradas ${colunasData.length} datas para importação:`);
    colunasData.forEach(col => {
      console.log(`   - ${col.valor} → ${col.data} (coluna ${col.index})`);
    });
    console.log('');

    // 4. Buscar todos os insumos do banco
    console.log('🔍 Buscando insumos do banco de dados...');
    const { data: insumosBanco, error: errorInsumos } = await supabase
      .from('insumos')
      .select('id, codigo, nome, tipo_local, categoria, custo_unitario')
      .eq('bar_id', 3);

    if (errorInsumos) {
      throw new Error(`Erro ao buscar insumos: ${errorInsumos.message}`);
    }

    console.log(`✅ ${insumosBanco.length} insumos encontrados no banco\n`);

    // Criar mapa de insumos por nome
    const insumosPorNome = new Map();
    insumosBanco.forEach(insumo => {
      insumosPorNome.set(insumo.nome.toLowerCase().trim(), insumo);
    });

    // 5. Processar cada linha de insumo (a partir da linha 7, index 6)
    let totalImportados = 0;
    let totalErros = 0;

    for (let i = 6; i < dados.length; i++) {
      const linha = dados[i];
      if (!linha || linha.length < 3) continue;

      const preco = linha[0];
      const categoria = linha[4]; // Categoria está na coluna 4
      const nomeInsumo = linha[6]; // Nome do insumo está na coluna 6

      if (!nomeInsumo) continue;

      // Extrair unidade de medida do nome do insumo
      const unidadeMedida = extrairUnidadeMedida(nomeInsumo);

      // Buscar insumo no banco
      const insumo = insumosPorNome.get(nomeInsumo.toLowerCase().trim());
      
      if (!insumo) {
        console.log(`⚠️ Insumo não encontrado no banco: ${nomeInsumo}`);
        totalErros++;
        continue;
      }

      // Processar cada data encontrada
      for (const colData of colunasData) {
        const colIndex = colData.index;
        
        // Buscar ESTOQUE FECHADO, ESTOQUE FLUTUANTE, PEDIDO
        // Assumindo que após cada data há: ESTOQUE FECHADO, ESTOQUE FLUTUANTE, PEDIDO (3 colunas)
        const estoqueFechado = parseFloat(linha[colIndex] || 0) || 0;
        const estoqueFlutuante = parseFloat(linha[colIndex + 1] || 0) || 0;
        const pedido = parseFloat(linha[colIndex + 2] || 0) || 0;

        const estoqueTotal = estoqueFechado + estoqueFlutuante;

        if (estoqueTotal === 0 && pedido === 0) continue;

        // Inserir no banco
        const { error } = await supabase
          .from('contagem_estoque_insumos')
          .upsert({
            bar_id: 3,
            data_contagem: colData.data,
            insumo_id: insumo.id,
            insumo_codigo: insumo.codigo,
            insumo_nome: insumo.nome,
            estoque_inicial: 0, // Será calculado depois
            estoque_final: estoqueTotal,
            quantidade_pedido: pedido,
            tipo_local: insumo.tipo_local,
            categoria: insumo.categoria,
            custo_unitario: insumo.custo_unitario,
            unidade_medida: unidadeMedida, // Extraída do nome
            usuario_contagem: 'importacao_sheets',
          }, {
            onConflict: 'bar_id,data_contagem,insumo_id'
          });

        if (error) {
          console.log(`❌ Erro ao inserir ${nomeInsumo} (${colData.data}): ${error.message}`);
          totalErros++;
        } else {
          totalImportados++;
        }
      }
    }

    console.log('\n📊 RESUMO DA IMPORTAÇÃO:');
    console.log(`✅ Registros importados: ${totalImportados}`);
    console.log(`❌ Erros: ${totalErros}`);
    console.log(`📅 Datas processadas: ${colunasData.length}`);

  } catch (error) {
    console.error('❌ Erro durante a importação:', error);
    throw error;
  }
}

// Executar importação
importarContagemInsumos()
  .then(() => {
    console.log('\n✅ Importação concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na importação:', error);
    process.exit(1);
  });

