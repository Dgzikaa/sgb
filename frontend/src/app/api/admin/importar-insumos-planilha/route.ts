import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Iniciando importação de insumos da planilha Google Sheets')

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // URLs alternativas para testar
    const SHEETS_URLS = [
      'https://docs.google.com/spreadsheets/d/1nbGQv7Vxl8OG7ZH2Wg-lsUqNG3dVEuuAKM1mbjZWXWU/export?format=csv&gid=678210128',
      'https://docs.google.com/spreadsheets/d/1nbGQv7Vxl8OG7ZH2Wg-lsUqNG3dVEuuAKM1mbjZWXWU/export?format=csv&gid=0'
    ]

    let csvData = ''
    let urlUsada = ''

    // Tentar diferentes URLs
    for (const url of SHEETS_URLS) {
      try {
        console.log('📥 Tentando baixar da URL:', url)
        const response = await fetch(url)
        
        if (response.ok) {
          csvData = await response.text()
          urlUsada = url
          console.log('✅ Sucesso com URL:', url)
          break
        } else {
          console.log('❌ Falha HTTP:', response.status, 'para URL:', url)
        }
      } catch (error) {
        console.log('❌ Erro de fetch para URL:', url, error)
      }
    }

    if (!csvData) {
      return NextResponse.json({ 
        success: false, 
        error: 'Não foi possível baixar dados de nenhuma URL da planilha' 
      }, { status: 500 })
    }

    console.log('📄 CSV baixado com sucesso, tamanho:', csvData.length, 'caracteres')
    console.log('🔍 Primeiras 500 caracteres do CSV:', csvData.substring(0, 500))

    // Parse do CSV
    const lines = csvData.split('\n').filter(line => line.trim())
    console.log('📊 Total de linhas encontradas:', lines.length)
    console.log('🔍 Primeira linha (cabeçalho):', lines[0])
    console.log('🔍 Segunda linha (exemplo):', lines[1])
    console.log('🔍 Terceira linha (exemplo):', lines[2])

    const insumosParaImportar = []

    // Os dados reais estão da linha 5 até 428 (índices 4 a 427)
    const START_LINE = 4  // linha 5 (índice base 0)
    const END_LINE = Math.min(427, lines.length - 1) // linha 428 ou fim do arquivo
    
    console.log(`🔍 Processando linhas ${START_LINE + 1} até ${END_LINE + 1}`)

    // Processar cada linha do intervalo específico
    for (let i = START_LINE; i <= END_LINE; i++) {
      const line = lines[i]?.trim()
      if (!line) {
        console.log(`⚠️ Linha ${i + 1} está vazia, pulando...`)
        continue
      }

      // Parse da linha CSV melhorado - split mais robusto
      let columns = []
      let currentField = ''
      let insideQuotes = false
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
          columns.push(currentField.trim())
          currentField = ''
        } else {
          currentField += char
        }
      }
      columns.push(currentField.trim()) // último campo
      
      // Mapeamento correto - planilha começa na coluna B
      const codigo = columns[1]?.trim() || ''  // Coluna B = código
      const nome = columns[2]?.trim() || ''    // Coluna C = nome
      const categoriaHint = columns[3]?.trim() || '' // Coluna D = categoria (bar/cozinha)
      
      console.log(`🔍 Linha ${i + 1}: código="${codigo}", nome="${nome}", categoria="${categoriaHint}"`)

      // Validar se tem código e nome válidos
      if (codigo && codigo.length > 0 && nome && nome.length > 0) {
        // Determinar categoria baseado na coluna C
        let categoria = 'cozinha' // Default
        let unidade_medida = 'g' // Default
        
        const categoriaUpper = categoriaHint.toUpperCase()
        
        // Se a categoria indica bar/bebidas
        if (categoriaUpper.includes('BAR') || categoriaUpper.includes('AMBEV') || 
            categoriaUpper.includes('BEBIDA') || categoriaUpper.includes('VINHO') ||
            categoriaUpper.includes('CERVEJA') || categoriaUpper.includes('LICOR')) {
          categoria = 'bar'
          unidade_medida = 'ml'
        }

        // Usar o código original da planilha (não gerar novo)
        const insumo = {
          codigo: codigo,  // Código original da planilha
          nome: nome,
          categoria: categoria,
          unidade_medida: unidade_medida
        }
        
        insumosParaImportar.push(insumo)
        console.log(`✅ Insumo válido adicionado: ${codigo} - ${nome} (${categoria})`)
      } else {
        console.log(`❌ Insumo inválido - código: "${codigo}", nome: "${nome}"`)
      }
    }

    console.log(`📊 ${insumosParaImportar.length} insumos válidos encontrados na planilha`)

    if (insumosParaImportar.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Nenhum insumo válido encontrado na planilha' 
      }, { status: 400 })
    }

    // LIMPEZA APENAS DE INSUMOS (manter receitas e produtos)
    console.log('🧹 Limpando apenas insumos...')

    // Limpar apenas insumos
    const { error: deleteInsumosError } = await supabase
      .from('insumos')
      .delete()
      .gte('id', 0)

    if (deleteInsumosError) {
      console.error('❌ Erro ao limpar insumos:', deleteInsumosError)
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao limpar insumos: ' + deleteInsumosError.message 
      }, { status: 500 })
    }
    console.log('✅ Insumos limpos (receitas e produtos mantidos)')

    // Inserir novos insumos em lotes (Supabase tem limite de ~1000 registros por vez)
    const BATCH_SIZE = 100
    let totalInseridos = 0
    
    for (let i = 0; i < insumosParaImportar.length; i += BATCH_SIZE) {
      const batch = insumosParaImportar.slice(i, i + BATCH_SIZE)
      
      console.log(`📥 Inserindo lote ${Math.floor(i/BATCH_SIZE) + 1}: ${batch.length} insumos`)
      
      const { data: insertData, error: insertError } = await supabase
        .from('insumos')
        .insert(
          batch.map(insumo => ({
            codigo: insumo.codigo,
            nome: insumo.nome,
            categoria: insumo.categoria,
            unidade_medida: insumo.unidade_medida,
            bar_id: 3,
            ativo: true
          }))
        )
        .select()

      if (insertError) {
        console.error('❌ Erro ao inserir lote:', insertError)
        return NextResponse.json({ 
          success: false, 
          error: `Erro ao inserir lote ${Math.floor(i/BATCH_SIZE) + 1}: ` + insertError.message 
        }, { status: 500 })
      }

      totalInseridos += insertData?.length || 0
      console.log(`✅ Lote ${Math.floor(i/BATCH_SIZE) + 1} inserido: ${insertData?.length || 0} insumos`)
    }

    console.log(`✅ ${totalInseridos} insumos importados com sucesso da planilha`)

    return NextResponse.json({
      success: true,
      message: `${totalInseridos} insumos importados com sucesso da planilha Google Sheets`,
      data: {
        total_importados: totalInseridos,
        insumos_bar: insumosParaImportar.filter(i => i.categoria === 'bar').length,
        insumos_cozinha: insumosParaImportar.filter(i => i.categoria === 'cozinha').length,
        planilha_url: urlUsada,
        linhas_processadas: lines.length - 1
      }
    })

  } catch (error) {
    console.error('❌ Erro interno:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro interno do servidor: ' + String(error) 
    }, { status: 500 })
  }
} 