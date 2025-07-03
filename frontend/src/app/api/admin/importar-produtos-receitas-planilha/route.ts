import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Iniciando importação COMPLETA das 77 receitas')

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // URLs das abas específicas
    const PRODUTOS_RENDIMENTO_URL = 'https://docs.google.com/spreadsheets/d/1nbGQv7Vxl8OG7ZH2Wg-lsUqNG3dVEuuAKM1mbjZWXWU/export?format=csv&gid=690549737' // Produtos com rendimento
    const RECEITAS_URL = 'https://docs.google.com/spreadsheets/d/1nbGQv7Vxl8OG7ZH2Wg-lsUqNG3dVEuuAKM1mbjZWXWU/export?format=csv&gid=468785442' // Receitas (produto x insumo)

    // 1. LIMPAR DADOS ANTIGOS
    console.log('🧹 Limpando dados antigos...')
    await supabase.from('receitas').delete().eq('bar_id', 3)
    console.log('✅ Dados antigos removidos')

    // 2. BUSCAR RENDIMENTOS DA PRIMEIRA ABA
    console.log('📥 Importando rendimentos esperados...')
    const produtosResponse = await fetch(PRODUTOS_RENDIMENTO_URL)
    if (!produtosResponse.ok) {
      throw new Error('Erro ao baixar produtos: HTTP ' + produtosResponse.status)
    }

    const produtosData = await produtosResponse.text()
    const produtosLines = produtosData.split('\n').filter(line => line.trim())
    
    const rendimentoMap = new Map() // código -> {nome, rendimento, categoria}
    const categoriasMap = new Map() // código -> categoria baseada no tipo

    console.log(`📊 PRIMEIRA ABA - Total de linhas: ${produtosLines.length}`)
    console.log(`📊 Primeiras 10 linhas da primeira aba:`)
    for (let i = 0; i < Math.min(10, produtosLines.length); i++) {
      console.log(`Linha ${i}: ${produtosLines[i]}`)
    }

    // Processar produtos (pular header - linha 4 em diante, linha 3 é cabeçalho)
    for (let i = 4; i < produtosLines.length; i++) {
      const line = produtosLines[i]?.trim()
      if (!line || line.includes('#N/A') || line.includes('#REF!')) continue

      // Parse CSV básico
      const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''))
      
      const codigoProduto = columns[0]?.trim() || ''
      const nomeProduto = columns[1]?.trim() || ''
      const rendimentoStr = columns[2]?.trim() || ''

      // Log das primeiras 20 linhas para debug
      if (i <= 24) {
        console.log(`📋 Linha ${i}: [${codigoProduto}] [${nomeProduto}] [${rendimentoStr}]`)
      }

      // Validar se é um produto válido (RELAXADO PARA IMPORTAR TODAS AS RECEITAS)
      if ((codigoProduto.startsWith('pc') || codigoProduto.startsWith('pd')) && nomeProduto) {
        const rendimento = parseFloat(rendimentoStr.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        
        // Aceitar mesmo sem rendimento válido
        if (rendimento >= 0) {
          // Categorizar baseado no código e nome
          let categoria = ''
          if (codigoProduto.startsWith('pd')) {
            // Drinks
            if (nomeProduto.toLowerCase().includes('caipirinha')) categoria = 'DRINKS - CAIPIRINHAS'
            else if (nomeProduto.toLowerCase().includes('suco')) categoria = 'DRINKS - SUCOS'
            else if (nomeProduto.toLowerCase().includes('xarope')) categoria = 'DRINKS - XAROPES'
            else if (nomeProduto.toLowerCase().includes('cordial')) categoria = 'DRINKS - CORDIAIS'
            else if (nomeProduto.toLowerCase().includes('espuma')) categoria = 'DRINKS - ESPUMAS'
            else if (nomeProduto.toLowerCase().includes('água') || nomeProduto.toLowerCase().includes('chá')) categoria = 'DRINKS - BASES'
            else categoria = 'DRINKS - OUTROS'
          } else {
            // Comidas
            if (nomeProduto.toLowerCase().includes('preparo') || nomeProduto.toLowerCase().includes('base') || nomeProduto.toLowerCase().includes('caldo')) categoria = 'COZINHA - PREPAROS'
            else if (nomeProduto.toLowerCase().includes('coxinha') || nomeProduto.toLowerCase().includes('dadinho') || nomeProduto.toLowerCase().includes('empada') || nomeProduto.toLowerCase().includes('croquete')) categoria = 'COZINHA - SALGADOS'
            else if (nomeProduto.toLowerCase().includes('ganache') || nomeProduto.toLowerCase().includes('calda') || nomeProduto.toLowerCase().includes('doce')) categoria = 'COZINHA - DOCES'
            else if (nomeProduto.toLowerCase().includes('carne') || nomeProduto.toLowerCase().includes('frango') || nomeProduto.toLowerCase().includes('lombo')) categoria = 'COZINHA - CARNES'
            else categoria = 'COZINHA - OUTROS'
          }

          rendimentoMap.set(codigoProduto, {
            nome: nomeProduto,
            rendimento: rendimento,
            categoria: categoria
          })
          
          console.log(`✅ Produto: ${codigoProduto} - ${nomeProduto} (${categoria}) - Rendimento: ${rendimento}g`)
        } else {
          console.log(`⚠️ Rendimento inválido para ${codigoProduto}: [${rendimentoStr}]`)
        }
      } else {
        if (i <= 24) {
          console.log(`⚠️ Linha ${i} rejeitada: código=[${codigoProduto}] nome=[${nomeProduto}] rend=[${rendimentoStr}]`)
        }
      }
    }

    console.log(`📊 ${rendimentoMap.size} produtos com rendimento encontrados`)

    // 3. BUSCAR INSUMOS PARA MAPEAMENTO
    const { data: insumosBanco } = await supabase
      .from('insumos')
      .select('id, codigo, nome')
      .eq('bar_id', 3)

    const insumoMap = new Map()
    insumosBanco?.forEach((i: any) => insumoMap.set(i.codigo, i))
    console.log(`📊 ${insumoMap.size} insumos disponíveis`)

    // 4. IMPORTAR RECEITAS DA SEGUNDA ABA
    console.log('📥 Importando receitas...')
    const receitasResponse = await fetch(RECEITAS_URL)
    if (!receitasResponse.ok) {
      throw new Error('Erro ao baixar receitas: HTTP ' + receitasResponse.status)
    }

    const receitasData = await receitasResponse.text()
    const receitasLines = receitasData.split('\n').filter(line => line.trim())
    
    const receitasParaImportar = []
    let receitasProcessadas = 0
    let receitasValidas = 0
    let produtosSemRendimento = 0
    let insumosNaoEncontrados = 0
    const insumosRejeitados = new Set()
    const produtosRejeitados = new Set()

    console.log(`📊 Total de linhas para processar: ${receitasLines.length - 3}`)

    // Processar receitas (pular header - linha 3 em diante)  
    for (let i = 3; i < receitasLines.length; i++) {
      const line = receitasLines[i]?.trim()
      if (!line) continue

      receitasProcessadas++

      // Parse CSV robusto para lidar com vírgulas dentro de aspas
      const columns = []
      let currentField = ''
      let insideQuotes = false
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j]
        if (char === '"') {
          insideQuotes = !insideQuotes
        } else if (char === ',' && !insideQuotes) {
          columns.push(currentField.trim().replace(/^"|"$/g, ''))
          currentField = ''
        } else {
          currentField += char
        }
      }
      columns.push(currentField.trim().replace(/^"|"$/g, ''))
      
      // A = código produto, B = nome produto, C = código insumo, D = nome insumo, E = quantidade
      const codigoProduto = columns[0]?.trim() || ''
      const nomeProduto = columns[1]?.trim() || ''
      const codigoInsumo = columns[2]?.trim() || ''
      const nomeInsumo = columns[3]?.trim() || ''
      const quantidadeStr = columns[4]?.trim() || ''

      // Log detalhado para debugging
      if (receitasProcessadas <= 10) {
        console.log(`📋 Linha ${i}: ${codigoProduto} | ${nomeProduto} | ${codigoInsumo} | ${nomeInsumo} | ${quantidadeStr}`)
      }

      // Validar dados
      if ((codigoProduto.startsWith('pc') || codigoProduto.startsWith('pd')) && codigoInsumo.startsWith('i') && quantidadeStr) {
        const quantidade = parseFloat(quantidadeStr.replace(/[^\d.,]/g, '').replace(',', '.'))
        
        if (quantidade > 0) {
          // Buscar insumo no mapeamento
          const insumo = insumoMap.get(codigoInsumo)
          const produtoInfo = rendimentoMap.get(codigoProduto)
          
          if (insumo) {
            // Se não tem info do produto, criar uma padrão
            const produtoFinal = produtoInfo || {
              nome: nomeProduto || `Produto ${codigoProduto}`,
              rendimento: 0,
              categoria: codigoProduto.startsWith('pd') ? 'DRINKS - OUTROS' : 'COZINHA - OUTROS'
            }
            receitasParaImportar.push({
              bar_id: 3,
              receita_codigo: codigoProduto,
              receita_nome: produtoFinal.nome,
              receita_categoria: produtoFinal.categoria,
              insumo_id: insumo.id,
              quantidade_necessaria: quantidade,
              rendimento_esperado: produtoFinal.rendimento
            })
            
            receitasValidas++
            if (receitasValidas <= 20) {
              console.log(`✅ Receita: ${codigoProduto} (${produtoFinal.nome}) -> ${codigoInsumo} (${insumo.nome}) = ${quantidade}g`)
            }
          } else {
            // Apenas contabilizar insumos não encontrados
            insumosNaoEncontrados++
            insumosRejeitados.add(codigoInsumo)
            if (receitasProcessadas <= 50) {
              console.log(`⚠️ Rejeitado: insumo não encontrado ${codigoInsumo} para produto ${codigoProduto}`)
            }
          }
        }
      }
    }

    console.log(`📊 ESTATÍSTICAS DE IMPORTAÇÃO:`)
    console.log(`• Linhas processadas: ${receitasProcessadas}`)
    console.log(`• Receitas válidas: ${receitasValidas}`)
    console.log(`• Produtos sem rendimento: ${produtosSemRendimento}`)
    console.log(`• Insumos não encontrados: ${insumosNaoEncontrados}`)
    console.log(`• Primeiros insumos rejeitados: ${Array.from(insumosRejeitados).slice(0, 10).join(', ')}`)
    console.log(`• Primeiros produtos rejeitados: ${Array.from(produtosRejeitados).slice(0, 10).join(', ')}`)

    // 5. INSERIR RECEITAS NO BANCO
    if (receitasParaImportar.length > 0) {
      console.log(`💾 Inserindo ${receitasParaImportar.length} receitas no banco...`)
      
      // Inserir em lotes de 100 para evitar timeout
      const loteSize = 100
      let totalInseridas = 0
      
      for (let i = 0; i < receitasParaImportar.length; i += loteSize) {
        const lote = receitasParaImportar.slice(i, i + loteSize)
        
        const { error: receitasError } = await supabase
          .from('receitas')
          .insert(lote)

        if (receitasError) {
          console.error(`❌ Erro no lote ${Math.floor(i/loteSize) + 1}:`, receitasError)
          continue
        }
        
        totalInseridas += lote.length
        console.log(`✅ Lote ${Math.floor(i/loteSize) + 1}: ${lote.length} receitas inseridas`)
      }

      console.log(`🎉 Importação concluída: ${totalInseridas} receitas inseridas`)
    }

    // 6. ESTATÍSTICAS FINAIS
    const { data: stats } = await supabase
      .from('receitas')
      .select('receita_codigo, receita_categoria')
      .eq('bar_id', 3)

    const receitasUnicas = new Set(stats?.map((r: any) => r.receita_codigo) || []).size
    const categorias = new Set(stats?.map((r: any) => r.receita_categoria) || []).size

    return NextResponse.json({
      success: true,
      message: 'Receitas importadas com sucesso!',
      data: {
        produtos_importados: receitasUnicas,
        produtos_bebida: Array.from(new Set(stats?.filter((r: any) => r.receita_categoria?.includes('DRINKS')).map((r: any) => r.receita_codigo) || [])).length,
        produtos_comida: Array.from(new Set(stats?.filter((r: any) => r.receita_categoria?.includes('COZINHA')).map((r: any) => r.receita_codigo) || [])).length,
        receitas_importadas: receitasParaImportar.length,
        receitas_processadas: receitasProcessadas,
        receitas_validas: receitasValidas,
        receitas_unicas: receitasUnicas,
        categorias_diferentes: categorias,
        produtos_com_rendimento: rendimentoMap.size,
        insumos_disponiveis: insumoMap.size,
        // Debugging info
        produtos_sem_rendimento: produtosSemRendimento,
        insumos_nao_encontrados: insumosNaoEncontrados,
        total_linhas_planilha: receitasLines.length - 3,
        insumos_rejeitados_sample: Array.from(insumosRejeitados).slice(0, 5).join(', '),
        produtos_rejeitados_sample: Array.from(produtosRejeitados).slice(0, 5).join(', ')
      }
    })

  } catch (error) {
    console.error('❌ Erro na importação:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na importação: ' + (error as Error).message
    }, { status: 500 })
  }
} 