#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env

/**
 * Script para importar registros manuais do CSV para a tabela dre_manual
 * 
 * Colunas do CSV:
 * 0: Data de competência (DD/MM/YYYY)
 * 3: Descrição
 * 7: Valor (R$ X.XXX,XX)
 * 10: Categoria 1 (ex: Custo Bebidas)
 * 13: Categoria Macro (ex: Custo insumos (CMV))
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co'
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTMxMTE2NiwiZXhwIjoyMDY2ODg3MTY2fQ.cGdHBTSYbNv_qgm6K94DjGXDW46DtiSL3c5428c0WQ0'
const CSV_FILE_PATH = '../[Ordinário] DRE e DFC - Base DRE [Manual].csv'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Função para converter data DD/MM/YYYY para YYYY-MM-DD
function convertDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null
  
  const parts = dateStr.split('/')
  if (parts.length !== 3) return null
  
  const day = parts[0].padStart(2, '0')
  const month = parts[1].padStart(2, '0')
  const year = parts[2]
  
  return `${year}-${month}-${day}`
}

// Função para converter valor "R$ X.XXX,XX" para número
function convertValue(valueStr) {
  if (!valueStr || valueStr.trim() === '') return 0
  
  // Remove "R$", espaços e converte vírgula para ponto
  let cleanValue = valueStr
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '') // Remove pontos de milhares
    .replace(',', '.') // Converte vírgula decimal para ponto
    .trim()
  
  // Se começar com "-", manter o sinal
  const isNegative = cleanValue.startsWith('-')
  if (isNegative) {
    cleanValue = cleanValue.substring(1)
  }
  
  const numValue = parseFloat(cleanValue)
  return isNegative ? -numValue : numValue
}

// Função para mapear categoria macro para o formato correto
function mapCategoriaMarco(categoriaMarco) {
  const mapping = {
    'Receita': 'Receita',
    'Custos Variáveis': 'Custos Variáveis', 
    'Custo insumos (CMV)': 'Custo insumos (CMV)',
    'Mão-deObra': 'Mão-de-Obra',
    'Mão-de-Obra': 'Mão-de-Obra',
    'Despesas Comerciais': 'Despesas Comerciais',
    'Despesas Administrativas': 'Despesas Administrativas',
    'Despesas Operacionais': 'Despesas Operacionais',
    'Despesas de Ocupação (Contas)': 'Despesas de Ocupação (Contas)',
    'Não Operacionais': 'Não Operacionais',
    'Investimentos': 'Investimentos',
    'SÓCIOS': 'Sócios',
    'Sócios': 'Sócios'
  }
  
  return mapping[categoriaMarco] || 'Outras Despesas'
}

// Função para mapear categorias do CSV para as categorias corretas na tabela nibo_categorias
function mapCategoria(categoria) {
  const mapping = {
    'RECURSOS HUMANOS': 'Recursos Humanos',
    'SALARIO FUNCIONARIOS': 'SALARIO FUNCIONARIOS',
    'ALUGUEL/CONDOMÍNIO/IPTU': 'ALUGUEL/CONDOMÍNIO/IPTU',
    'ÁGUA': 'ÁGUA',
    'MANUTENÇÃO': 'MANUTENÇÃO',
    'INTERNET': 'INTERNET',
    'VALE TRANSPORTE': 'VALE TRANSPORTE',
    'ALIMENTAÇÃO': 'ALIMENTAÇÃO',
    'GÁS': 'GÁS',
    'FREELA ATENDIMENTO': 'FREELA ATENDIMENTO',
    'FREELA BAR': 'FREELA BAR',
    'FREELA COZINHA': 'FREELA COZINHA',
    'FREELA LIMPEZA': 'FREELA LIMPEZA',
    'FREELA SEGURANÇA': 'FREELA SEGURANÇA',
    'IMPOSTO': 'IMPOSTO',
    'ADICIONAIS': 'ADICIONAIS',
    'LUZ': 'LUZ',
    'Luz': 'LUZ', // Mapeamento para capitalização
    'PRO LABORE': 'PRO LABORE',
    'PROVISÃO TRABALHISTA': 'PROVISÃO TRABALHISTA',
    'COMISSÃO 10%': 'COMISSÃO 10%',
    'TAXA MAQUININHA': 'TAXA MAQUININHA'
  }
  
  return mapping[categoria] || categoria
}

async function processCSV() {
  console.log('📁 Lendo arquivo CSV...')
  
  try {
    const csvContent = await Deno.readTextFile(CSV_FILE_PATH)
    const lines = csvContent.split('\n')
    
    console.log(`📊 Total de linhas no CSV: ${lines.length}`)
    
    const records = []
    let processedLines = 0
    let skippedLines = 0
    
    // Pular header (linha 0) e linhas vazias/inválidas
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) {
        skippedLines++
        continue
      }
      
      // Parse CSV (considerando vírgulas dentro de aspas)
      const columns = []
      let currentColumn = ''
      let insideQuotes = false
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
          columns.push(currentColumn.trim())
          currentColumn = ''
        } else {
          currentColumn += char
        }
      }
      columns.push(currentColumn.trim()) // Última coluna
      
      // Verificar se temos colunas suficientes
      if (columns.length < 14) {
        skippedLines++
        continue
      }
      
      const dataCompetencia = convertDate(columns[0])
      const descricao = columns[3]?.trim()
      const valorStr = columns[7]?.trim()
      const categoria = columns[10]?.trim()
      const categoriaMarco = columns[13]?.trim()
      
      // Pular linhas sem dados essenciais
      if (!dataCompetencia || !descricao || !valorStr || !categoria || !categoriaMarco) {
        skippedLines++
        continue
      }
      
      // Pular linhas com data inválida (1899)
      if (dataCompetencia.startsWith('1899')) {
        skippedLines++
        continue
      }
      
      const valor = convertValue(valorStr)
      const categoriaMacroMapeada = mapCategoriaMarco(categoriaMarco)
      const categoriaMapeada = mapCategoria(categoria)
      
      records.push({
        data_competencia: dataCompetencia,
        descricao: descricao,
        valor: valor,
        categoria: categoriaMapeada, // Categoria específica do Nibo (mapeada)
        categoria_macro: categoriaMacroMapeada, // Macro-categoria DRE
        observacoes: `Importado do CSV - Linha ${i + 1}`,
        usuario_criacao: 'import_csv'
      })
      
      processedLines++
      
      // Log de progresso a cada 1000 registros
      if (processedLines % 1000 === 0) {
        console.log(`📝 Processadas ${processedLines} linhas...`)
      }
    }
    
    console.log(`✅ Processamento concluído:`)
    console.log(`   📊 Linhas processadas: ${processedLines}`)
    console.log(`   ⏭️  Linhas ignoradas: ${skippedLines}`)
    console.log(`   📋 Registros para inserir: ${records.length}`)
    
    if (records.length === 0) {
      console.log('⚠️  Nenhum registro válido encontrado')
      return
    }
    
    // Mostrar alguns exemplos
    console.log('\n📋 Exemplos de registros:')
    records.slice(0, 3).forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.data_competencia} | ${record.descricao} | R$ ${record.valor.toFixed(2)} | ${record.categoria} -> ${record.categoria_macro}`)
    })
    
    // Confirmar inserção
    console.log(`\n❓ Deseja inserir ${records.length} registros na tabela dre_manual? (y/N)`)
    const confirmation = prompt('Confirmar inserção:')
    
    if (confirmation?.toLowerCase() !== 'y') {
      console.log('❌ Operação cancelada pelo usuário')
      return
    }
    
    // Inserir em lotes de 1000 (limite do Supabase)
    console.log('\n💾 Inserindo registros no banco...')
    const batchSize = 1000
    let totalInserted = 0
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize)
      
      console.log(`📤 Inserindo lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(records.length / batchSize)} (${batch.length} registros)...`)
      
      const { data, error } = await supabase
        .from('dre_manual')
        .insert(batch)
      
      if (error) {
        console.error(`❌ Erro ao inserir lote ${Math.floor(i / batchSize) + 1}:`, error)
        break
      }
      
      totalInserted += batch.length
      console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} inserido com sucesso`)
      
      // Pequena pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log(`\n🎉 Importação concluída!`)
    console.log(`   📊 Total inserido: ${totalInserted} registros`)
    
    // Verificar dados inseridos
    const { data: countData, error: countError } = await supabase
      .from('dre_manual')
      .select('categoria_macro', { count: 'exact' })
      .eq('usuario_criacao', 'import_csv')
    
    if (!countError) {
      console.log(`   ✅ Verificação: ${countData?.length || 0} registros encontrados na tabela`)
    }
    
  } catch (error) {
    console.error('❌ Erro ao processar CSV:', error)
  }
}

// Executar
if (import.meta.main) {
  await processCSV()
}
