const fs = require('fs');
const path = require('path');

// Função para detectar diferentes abas/seções em um CSV
function detectSheets(content) {
  const lines = content.split('\n').filter(line => line.trim());
  const sheets = [];
  let currentSheet = null;
  let lineIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detectar cabeçalhos que podem indicar nova aba
    if (line.includes(',') && line.split(',').length > 3) {
      const headers = line.split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Verificar se parece ser um cabeçalho de dados (não apenas texto)
      const hasDataHeaders = headers.some(header => 
        header.toLowerCase().includes('data') ||
        header.toLowerCase().includes('valor') ||
        header.toLowerCase().includes('qtd') ||
        header.toLowerCase().includes('hora') ||
        header.toLowerCase().includes('dia') ||
        header.toLowerCase().includes('mes') ||
        header.toLowerCase().includes('ano') ||
        header.toLowerCase().includes('produto') ||
        header.toLowerCase().includes('cliente') ||
        header.toLowerCase().includes('pagamento') ||
        header.toLowerCase().includes('tempo')
      );

      if (hasDataHeaders) {
        // Finalizar aba anterior se existir
        if (currentSheet) {
          currentSheet.endLine = i - 1;
          sheets.push(currentSheet);
        }

        // Iniciar nova aba
        currentSheet = {
          name: `Sheet_${sheets.length + 1}`,
          startLine: i,
          endLine: null,
          headers: headers,
          dataLines: []
        };
      }
    }

    // Adicionar linha de dados à aba atual
    if (currentSheet && i > currentSheet.startLine) {
      currentSheet.dataLines.push(line);
    }
  }

  // Finalizar última aba
  if (currentSheet) {
    currentSheet.endLine = lines.length - 1;
    sheets.push(currentSheet);
  }

  return sheets;
}

// Função para analisar estrutura de uma aba específica
function analyzeSheetStructure(sheet, filename) {
  console.log(`\n📊 Analisando aba: ${sheet.name}`);
  console.log(`   Linhas: ${sheet.startLine + 1} a ${sheet.endLine + 1}`);
  console.log(`   Total de registros: ${sheet.dataLines.length}`);
  
  const columnTypes = {};
  const sampleData = sheet.dataLines.slice(0, Math.min(10, sheet.dataLines.length));
  
  sheet.headers.forEach((header, index) => {
    const values = sampleData.map(line => {
      const parts = line.split(',');
      return parts[index] ? parts[index].trim().replace(/"/g, '') : '';
    }).filter(v => v !== '');
    
    // Determinar tipo baseado nos valores
    let type = 'text';
    if (values.length > 0) {
      const firstValue = values[0];
      if (firstValue.match(/^\d{4}-\d{2}-\d{2}/)) {
        type = 'date';
      } else if (firstValue.match(/^\d+$/)) {
        type = 'integer';
      } else if (firstValue.match(/^\d+\.\d+$/) || firstValue.match(/^\d+,\d+$/)) {
        type = 'decimal';
      } else if (firstValue.match(/^\d{2}:\d{2}/)) {
        type = 'time';
      }
    }
    
    columnTypes[header] = {
      type,
      sample_values: values.slice(0, 3),
      non_empty_count: values.length
    };
  });

  return {
    sheet_name: sheet.name,
    filename: filename,
    total_records: sheet.dataLines.length,
    headers: sheet.headers,
    column_analysis: columnTypes,
    sample_data: sampleData.slice(0, 3)
  };
}

// Função para analisar estrutura completa de CSV
function analyzeCSVStructure(filePath) {
  try {
    console.log(`\n🔍 Analisando: ${path.basename(filePath)}`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const sheets = detectSheets(content);
    
    if (sheets.length === 0) {
      console.log('❌ Nenhuma aba detectada');
      return null;
    }
    
    console.log(`📋 Detectadas ${sheets.length} abas/seções:`);
    
    const sheetAnalyses = [];
    sheets.forEach((sheet, index) => {
      // Tentar identificar o tipo de aba baseado nos cabeçalhos
      const headersLower = sheet.headers.map(h => h.toLowerCase());
      let sheetType = 'unknown';
      
      if (headersLower.some(h => h.includes('analitico') || h.includes('produto') || h.includes('item'))) {
        sheetType = 'analitico';
      } else if (headersLower.some(h => h.includes('pagamento') || h.includes('pag') || h.includes('meio'))) {
        sheetType = 'pagamentos';
      } else if (headersLower.some(h => h.includes('periodo') || h.includes('pessoas') || h.includes('couvert'))) {
        sheetType = 'periodo';
      } else if (headersLower.some(h => h.includes('tempo') || h.includes('t0') || h.includes('t1'))) {
        sheetType = 'tempo';
      } else if (headersLower.some(h => h.includes('hora') || h.includes('fatporhora'))) {
        sheetType = 'fatporhora';
      }
      
      sheet.name = `${sheetType}_${index + 1}`;
      const analysis = analyzeSheetStructure(sheet, path.basename(filePath));
      analysis.sheet_type = sheetType;
      sheetAnalyses.push(analysis);
    });
    
    return {
      filename: path.basename(filePath),
      total_sheets: sheets.length,
      sheets: sheetAnalyses
    };
    
  } catch (error) {
    console.error(`❌ Erro ao analisar ${filePath}:`, error.message);
    return null;
  }
}

// Analisar ambos os arquivos
const csvFiles = [
  'Backup Contahub até 26.07.2025 - Analitico.csv',
  'Backup Contahub até 26.07.2025 (tempo e fatporhora) - FatPorHora.csv'
];

console.log('📊 ANÁLISE ESTRUTURAL COMPLETA DOS ARQUIVOS CSV');
console.log('==============================================');

const results = {};

csvFiles.forEach(filename => {
  const filePath = path.join(__dirname, filename);
  if (fs.existsSync(filePath)) {
    results[filename] = analyzeCSVStructure(filePath);
  } else {
    console.log(`❌ Arquivo não encontrado: ${filename}`);
  }
});

// Gerar mapeamento para tabelas
console.log('\n\n📋 MAPEAMENTO PARA TABELAS SUPABASE');
console.log('====================================');

const tableMappings = {
  'contahub_analitico': {
    source_files: [],
    columns: [],
    description: 'Dados analíticos de vendas e produtos'
  },
  'contahub_pagamentos': {
    source_files: [],
    columns: [],
    description: 'Dados de pagamentos e transações'
  },
  'contahub_periodo': {
    source_files: [],
    columns: [],
    description: 'Dados por período e pessoas'
  },
  'contahub_tempo': {
    source_files: [],
    columns: [],
    description: 'Dados de tempo de produção'
  },
  'contahub_fatporhora': {
    source_files: [],
    columns: [],
    description: 'Faturamento por hora'
  }
};

// Processar resultados e mapear para tabelas
Object.keys(results).forEach(filename => {
  const result = results[filename];
  if (!result) return;
  
  console.log(`\n📄 ${filename} (${result.total_sheets} abas):`);
  
  result.sheets.forEach(sheet => {
    console.log(`\n   📊 Aba: ${sheet.sheet_name} (${sheet.sheet_type})`);
    console.log(`      Registros: ${sheet.total_records}`);
    console.log(`      Colunas: ${sheet.headers.length}`);
    
    // Mapear para tabelas baseado no tipo
    switch (sheet.sheet_type) {
      case 'analitico':
        tableMappings.contahub_analitico.source_files.push({
          file: filename,
          sheet: sheet.sheet_name,
          columns: sheet.headers
        });
        break;
      case 'pagamentos':
        tableMappings.contahub_pagamentos.source_files.push({
          file: filename,
          sheet: sheet.sheet_name,
          columns: sheet.headers
        });
        break;
      case 'periodo':
        tableMappings.contahub_periodo.source_files.push({
          file: filename,
          sheet: sheet.sheet_name,
          columns: sheet.headers
        });
        break;
      case 'tempo':
        tableMappings.contahub_tempo.source_files.push({
          file: filename,
          sheet: sheet.sheet_name,
          columns: sheet.headers
        });
        break;
      case 'fatporhora':
        tableMappings.contahub_fatporhora.source_files.push({
          file: filename,
          sheet: sheet.sheet_name,
          columns: sheet.headers
        });
        break;
    }
    
    // Mostrar colunas
    sheet.headers.forEach(header => {
      const analysis = sheet.column_analysis[header];
      console.log(`      - ${header} (${analysis.type}): ${analysis.sample_values.join(', ')}`);
    });
  });
});

// Salvar análise completa
const analysisOutput = {
  timestamp: new Date().toISOString(),
  files_analyzed: Object.keys(results),
  results,
  table_mappings: tableMappings,
  summary: {
    total_files: Object.keys(results).length,
    total_sheets: Object.values(results).reduce((sum, r) => sum + (r?.total_sheets || 0), 0),
    total_records: Object.values(results).reduce((sum, r) => {
      return sum + (r?.sheets?.reduce((s, sheet) => s + sheet.total_records, 0) || 0);
    }, 0)
  }
};

fs.writeFileSync(
  path.join(__dirname, 'csv-complete-analysis.json'),
  JSON.stringify(analysisOutput, null, 2)
);

console.log('\n✅ Análise completa salva em: csv-complete-analysis.json');
console.log('\n📊 RESUMO FINAL:');
console.log(`   Arquivos analisados: ${analysisOutput.summary.total_files}`);
console.log(`   Total de abas: ${analysisOutput.summary.total_sheets}`);
console.log(`   Total de registros: ${analysisOutput.summary.total_records}`);

console.log('\n🎯 PRÓXIMOS PASSOS:');
console.log('1. Revisar análise completa gerada');
console.log('2. Definir mapeamento específico para cada tabela');
console.log('3. Criar script de população do banco');
console.log('4. Implementar APIs de relatórios'); 