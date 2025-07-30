// Script para popular as tabelas contahub_* com dados dos CSVs
// ATENÇÃO: Este script assume que as tabelas já existem com o schema correto no Supabase
// e que os arquivos CSV estão em exemplo_teste/ com os nomes corretos.

const fs = require('fs');
const path = require('path');
// Usar o pacote do frontend
const { createClient } = require('../../frontend/node_modules/@supabase/supabase-js');

// Função robusta para parsear CSV tratando campos vazios e valores com vírgulas
function parseCSV(content) {
  const lines = content.split('\n').filter(line => line.trim());
  if (lines.length === 0) return { headers: [], data: [] };
  
  const headers = parseCSVLine(lines[0]);
  const data = lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  
  return { headers, data };
}

// Função para parsear uma linha CSV tratando aspas e campos vazios
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // Campo completo, adicionar ao resultado
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Adicionar o último campo
  result.push(current.trim());
  
  // Limpar aspas dos valores e converter campos vazios em null
  return result.map(value => {
    const cleaned = value.replace(/^"/, '').replace(/"$/, '').trim();
    return cleaned === '' ? null : cleaned;
  });
}

// Tentar carregar variáveis do .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '../../frontend/.env.local');
    console.log(`🔍 Procurando .env.local em: ${envPath}`);
    
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envVars = {};
      
      envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            envVars[key] = valueParts.join('=').replace(/"/g, '');
          }
        }
      });
      
      // Aplicar as variáveis ao process.env
      Object.assign(process.env, envVars);
      console.log('✅ Arquivo .env.local carregado com sucesso!');
      console.log(`🔑 Variáveis carregadas: ${Object.keys(envVars).join(', ')}`);
      return true;
    } else {
      console.log('❌ Arquivo .env.local não encontrado');
    }
  } catch (error) {
    console.log('⚠️ Não foi possível carregar .env.local:', error.message);
  }
  return false;
}

// Carregar variáveis de ambiente
loadEnvFile();

// Configuração do Supabase
const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uqtgsvujwcbymjmvkjhy.supabase.co').replace(/"/g, '');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/"/g, '') || '';

// Verificar se as variáveis foram carregadas
if (!SUPABASE_KEY) {
  console.error('❌ Erro: SUPABASE_SERVICE_ROLE_KEY não encontrada!');
  console.error('Verifique se o arquivo ../../frontend/.env.local existe e contém SUPABASE_SERVICE_ROLE_KEY');
  console.error('📋 Variáveis disponíveis no process.env:');
  console.error(Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', '));
  console.error('💡 Ou execute o script com: SUPABASE_SERVICE_ROLE_KEY=sua_chave node populate-contahub-tables.js');
  process.exit(1);
}

// Debug: mostrar as primeiras letras da chave (sem expor completamente)
console.log(`🔑 API Key carregada: ${SUPABASE_KEY.substring(0, 20)}...`);

console.log('✅ Variáveis de ambiente carregadas com sucesso!');
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Arquivos CSV - Todas as tabelas que precisam ser populadas
const CSV_FILES = [
  {
    file: 'analitico.csv',
    tables: ['contahub_analitico'],
  },
  {
    file: 'fatporhora.csv',
    tables: ['contahub_fatporhora'],
  },
  {
    file: 'pagamentos.csv',
    tables: ['contahub_pagamentos'],
  },
  {
    file: 'periodo.csv',
    tables: ['contahub_periodo'],
  },
  {
    file: 'tempo.csv',
    tables: ['contahub_tempo'],
  },
];

// Mapeamento de colunas para cada tabela
const TABLE_COLUMNS = {
  contahub_analitico: [
    'vd_mesadesc','vd_localizacao','itm','trn','trn_desc','prefixo','tipo','tipovenda','ano','mes','trn_dtgerencial','usr_lancou','prd','prd_desc','grp_desc','loc_desc','qtd','desconto','valorfinal','custo','itm_obs','comandaorigem','itemorigem'
  ],
  contahub_pagamentos: [
    'vd','trn','dt_gerencial','hr_lancamento','hr_transacao','dt_transacao','mesa','cli','cliente','vr_pagamentos','pag','valor','taxa','perc','liquido','tipo','meio','cartao','autorizacao','dt_credito','usr_abriu','usr_lancou','usr_aceitou','motivodesconto'
  ],
  contahub_periodo: [
    'dt_gerencial','tipovenda','vd_mesadesc','vd_localizacao','cht_nome','cli_nome','cli_dtnasc','cli_email','cli_fone','usr_abriu','pessoas','qtd_itens','vr_pagamentos','vr_produtos','vr_repique','vr_couvert','vr_desconto','motivo','dt_contabil','ultimo_pedido','vd_dtcontabil'
  ],
  contahub_tempo: [
    'grp_desc','prd_desc','vd_mesadesc','vd_localizacao','itm','t0_lancamento','t1_prodini','t2_prodfim','t3_entrega','t0_t1','t0_t2','t0_t3','t1_t2','t1_t3','t2_t3','prd','prd_idexterno','loc_desc','usr_abriu','usr_lancou','usr_produziu','usr_entregou','usr_transfcancelou','prefixo','tipovenda','ano','mes','dia','dds','diadasemana','hora','itm_qtd'
  ],
  contahub_fatporhora: [
    'vd_dtgerencial','dds','dia','hora','qtd','valor'
  ],
};

// Mapeamento de colunas CSV para colunas da tabela
const CSV_TO_TABLE_MAPPING = {
  contahub_tempo: {
    't0-lancamento': 't0_lancamento',
    't1-prodini': 't1_prodini',
    't2-prodfim': 't2_prodfim',
    't3-entrega': 't3_entrega',
    't0-t1': 't0_t1',
    't0-t2': 't0_t2',
    't0-t3': 't0_t3',
    't1-t2': 't1_t2',
    't1-t3': 't1_t3',
    't2-t3': 't2_t3'
  }
};

// Função para identificar "aba"/sheet no CSV (pelo cabeçalho)
function detectSheet(lines, table) {
  const header = TABLE_COLUMNS[table];
  for (let i = 0; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length >= header.length) {
      // Verificar se os cabeçalhos correspondem (considerando mapeamento)
      const mappedCols = cols.map(col => CSV_TO_TABLE_MAPPING[table]?.[col] || col);
      if (header.every((h, idx) => mappedCols[idx] === h)) {
        return i;
      }
    }
  }
  return -1;
}

// Função para converter valores para tipos corretos
function convertValue(table, col, value) {
  // Tratar valores nulos, vazios ou undefined
  if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
    return null;
  }
  
  // Timestamps (campos de tempo)
  if (col.match(/t0_lancamento|t1_prodini|t2_prodfim|t3_entrega/)) {
    if (!value || value.trim() === '') return null;
    const d = value.replace(/\"/g, '').trim();
    if (d.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) return d;
    return null;
  }
  
  // Datas
  if (col.match(/dt_|data|dtnasc|dtgerencial|dtcontabil|dt_credito|trn_dtgerencial|vd_dtgerencial/)) {
    const d = value.replace(/\"/g, '').replace(/\//g, '-');
    if (d.match(/^\d{4}-\d{2}-\d{2}$/)) return d;
    if (d.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [d1, d2, d3] = d.split('/');
      return `${d3}-${d2}-${d1}`;
    }
    return null;
  }
  
  // Números inteiros
  if (col.match(/qtd|quantidade|pessoas|ano|mes|dia|dds|itm_qtd/)) {
    const numValue = parseInt(value.toString().replace(/\D/g, ''));
    return isNaN(numValue) ? null : numValue;
  }
  
  // Valores monetários - tratar vírgula como separador decimal brasileiro
  if (col.match(/valor|vr_|liquido|taxa|perc|custo|desconto|final|repique|couvert/)) {
    const cleanValue = value.toString().trim();
    // Se tem ponto e vírgula, remover pontos (separadores de milhares) e trocar vírgula por ponto
    if (cleanValue.includes('.') && cleanValue.includes(',')) {
      return parseFloat(cleanValue.replace(/\./g, '').replace(/,/g, '.')) || null;
    }
    // Se só tem vírgula, trocar por ponto (decimal brasileiro)
    if (cleanValue.includes(',') && !cleanValue.includes('.')) {
      return parseFloat(cleanValue.replace(/,/g, '.')) || null;
    }
    // Se só tem ponto, assumir que é decimal americano
    return parseFloat(cleanValue) || null;
  }
  
  // Campos numéricos de tempo (t0_t1, t0_t2, etc.)
  if (col.match(/t0_t1|t0_t2|t0_t3|t1_t2|t1_t3|t2_t3/)) {
    const cleanValue = value.toString().trim();
    if (cleanValue.includes(',')) {
      return parseFloat(cleanValue.replace(/,/g, '.')) || null;
    }
    return parseFloat(cleanValue) || null;
  }
  
  // Retornar string limpa (as aspas já foram removidas no parseCSVLine)
  return value.toString().trim();
}

async function processTableFromCSV(csvPath, table, lines) {
  console.log(`\n🔍 Procurando cabeçalho da tabela ${table}...`);
  const headerIdx = detectSheet(lines, table);
  if (headerIdx === -1) {
    console.log(`❌ Aba/cabeçalho da tabela ${table} não encontrada em ${csvPath}`);
    console.log(`📋 Cabeçalhos esperados: ${TABLE_COLUMNS[table].join(', ')}`);
    return;
  }
  
  console.log(`✅ Cabeçalho encontrado na linha ${headerIdx + 1}`);
  const header = TABLE_COLUMNS[table];
  const dataLines = lines.slice(headerIdx + 1).filter(l => l.trim() && l.split(',').length >= header.length);
  
  console.log(`📊 Total de linhas de dados encontradas: ${dataLines.length}`);
  
  if (dataLines.length === 0) {
    console.log(`⚠️ Nenhum dado encontrado para a tabela ${table}`);
    return;
  }
  
  const records = dataLines.map(line => {
    const cols = parseCSVLine(line);
    const obj = {};
    header.forEach((col, idx) => {
      // Usar mapeamento se existir, senão usar o nome original
      const csvColName = Object.keys(CSV_TO_TABLE_MAPPING[table] || {}).find(key => CSV_TO_TABLE_MAPPING[table][key] === col) || col;
      const csvColIndex = cols.findIndex(c => c === csvColName);
      const rawValue = csvColIndex >= 0 ? cols[csvColIndex] : cols[idx];
      obj[col] = convertValue(table, col, rawValue);
    });
    // Adicionar bar_id = 3 (Ordinário) para todos os registros
    obj.bar_id = 3;
    return obj;
  });
  
  console.log(`🔄 Processando ${records.length} registros para ${table}...`);
  
  // Inserção em lotes
  const batchSize = 100;
  let totalInserted = 0;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    console.log(`📦 Inserindo lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${batch.length} registros)...`);
    
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`❌ Erro ao inserir batch na tabela ${table}:`, error);
      break;
    } else {
      totalInserted += batch.length;
      console.log(`✅ Lote inserido com sucesso. Total inserido: ${totalInserted}/${records.length}`);
    }
  }
  
  console.log(`🎉 Tabela ${table} populada com ${totalInserted} registros!`);
}

async function main() {
  console.log('🚀 Iniciando população das tabelas ContaHub...');
  console.log(`📁 Diretório atual: ${__dirname}`);
  
  for (const { file, tables } of CSV_FILES) {
    console.log(`\n📂 Processando arquivo: ${file}`);
    const csvPath = path.join(__dirname, file);
    
    if (!fs.existsSync(csvPath)) {
      console.error(`❌ Arquivo não encontrado: ${csvPath}`);
      continue;
    }
    
    console.log(`✅ Arquivo encontrado: ${csvPath}`);
    const content = fs.readFileSync(csvPath, 'utf8');
    const lines = content.split(/\r?\n/);
    console.log(`📊 Total de linhas no arquivo: ${lines.length}`);
    
    for (const table of tables) {
      console.log(`\n🎯 Processando tabela: ${table}`);
      await processTableFromCSV(csvPath, table, lines);
    }
  }
  
  console.log('\n🎉 População concluída!');
}

main().catch(console.error); 