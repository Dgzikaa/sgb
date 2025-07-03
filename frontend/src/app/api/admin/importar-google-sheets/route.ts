import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { google_sheets_url, bar_id } = body

    console.log('📊 Iniciando importação do Google Sheets com estrutura correta')

    if (!google_sheets_url) {
      return NextResponse.json({
        success: false,
        error: 'URL do Google Sheets é obrigatória'
      }, { status: 400 })
    }

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // Extrair ID do Google Sheets da URL
    const sheetIdMatch = google_sheets_url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!sheetIdMatch) {
      return NextResponse.json({
        success: false,
        error: 'URL inválida do Google Sheets'
      }, { status: 400 })
    }

    const sheetId = sheetIdMatch[1]
    console.log('📊 ID da planilha:', sheetId)

    // 1. PRIMEIRA ABA: Receitas com insumos
    // URL para primeira aba (gid=468785442) como CSV
    const primeiraAbaUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=468785442`
    
    console.log('📥 Baixando primeira aba (receitas com insumos)...')
    const response1 = await fetch(primeiraAbaUrl)
    if (!response1.ok) {
      throw new Error('Erro ao acessar primeira aba: ' + response1.statusText)
    }

    const csvData1 = await response1.text()
    const lines1 = csvData1.split('\n').filter(line => line.trim())

    // 2. SEGUNDA ABA: Produtos com rendimento  
    // URL para segunda aba (gid=690549737) como CSV
    const segundaAbaUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=690549737`
    
    console.log('📥 Baixando segunda aba (produtos com rendimento)...')
    const response2 = await fetch(segundaAbaUrl)
    if (!response2.ok) {
      throw new Error('Erro ao acessar segunda aba: ' + response2.statusText)
    }

    const csvData2 = await response2.text()
    const lines2 = csvData2.split('\n').filter(line => line.trim())

    // 3. PROCESSAR PRIMEIRA ABA (receitas com insumos)
    // Coluna A: código do produto, B: produto, C: código insumo, D: insumo, E: quantidade
    const produtosMap = new Map()
    const insumosMap = new Map() 
    const receitasData: any[] = []

    console.log(`📊 Processando ${lines1.length} linhas da primeira aba...`)

    for (let i = 1; i < lines1.length; i++) { // Pular cabeçalho
      try {
        const values = lines1[i].split(',').map(v => v.replace(/"/g, '').trim())
        
        if (values.length < 5) continue

        const codProduto = values[0]?.trim()
        const nomeProduto = values[1]?.trim()
        const codInsumo = values[2]?.trim()
        const nomeInsumo = values[3]?.trim()
        const quantidadeStr = values[4]?.replace(/[^\d.,]/g, '').replace(',', '.') || '0'
        const quantidade = parseFloat(quantidadeStr)

        if (!codProduto || !nomeProduto || !codInsumo || !nomeInsumo || quantidade <= 0) continue

        // Coletar produto único
        if (!produtosMap.has(codProduto)) {
          produtosMap.set(codProduto, {
            bar_id: bar_id || 3,
            codigo: codProduto,
            nome: nomeProduto,
            grupo: 'Preparos',
            tipo: 'comida',
            preco_venda: 0,
            custo_producao: 0,
            tempo_preparo_segundos: 600, // 10 minutos padrão
            quantidade_base: 1000, // 1kg padrão
            unidade_final: 'gramas'
          })
        }

        // Coletar insumo único
        if (!insumosMap.has(codInsumo)) {
          insumosMap.set(codInsumo, {
            bar_id: bar_id || 3,
            codigo: codInsumo,
            nome: nomeInsumo,
            categoria: 'Insumos',
            unidade_medida: 'gramas',
            custo_por_unidade: 0,
            estoque_minimo: 1,
            estoque_atual: 100
          })
        }

        // Coletar receita (relação produto-insumo)
        receitasData.push({
          codigo_produto: codProduto,
          codigo_insumo: codInsumo,
          quantidade_necessaria: quantidade
        })

      } catch (error) {
        console.warn(`⚠️ Erro na linha ${i} da primeira aba:`, error)
        continue
      }
    }

    // 4. PROCESSAR SEGUNDA ABA (produtos com rendimento)
    console.log(`📊 Processando ${lines2.length} linhas da segunda aba...`)
    
    for (let i = 4; i < lines2.length; i++) { // Começar na linha 5 (dados reais)
      try {
        const values = lines2[i].split(',').map(v => v.replace(/"/g, '').trim())
        
        if (values.length < 3) continue

        const codProduto = values[0]?.trim()
        const nomeProduto = values[1]?.trim()
        const rendimentoStr = values[2]?.replace(/[^\d.,]/g, '').replace(',', '.') || '0'
        const rendimento = parseFloat(rendimentoStr)

        if (!codProduto || !nomeProduto || rendimento <= 0) continue

        // Atualizar produto com dados da segunda aba
        if (produtosMap.has(codProduto)) {
          const produto = produtosMap.get(codProduto)
          produto.quantidade_base = rendimento // Rendimento em gramas
          produto.nome = nomeProduto // Nome pode ser mais completo na segunda aba
          produtosMap.set(codProduto, produto)
        } else {
          // Produto só existe na segunda aba
          produtosMap.set(codProduto, {
            bar_id: bar_id || 3,
            codigo: codProduto,
            nome: nomeProduto,
            grupo: 'Produtos',
            tipo: 'comida',
            preco_venda: 0,
            custo_producao: 0,
            tempo_preparo_segundos: 600,
            quantidade_base: rendimento,
            unidade_final: 'gramas'
          })
        }

      } catch (error) {
        console.warn(`⚠️ Erro na linha ${i} da segunda aba:`, error)
        continue
      }
    }

    const produtos = Array.from(produtosMap.values())
    const insumos = Array.from(insumosMap.values())

    console.log(`🍽️ ${produtos.length} produtos identificados`)
    console.log(`🥘 ${insumos.length} insumos identificados`) 
    console.log(`📋 ${receitasData.length} relações de receitas encontradas`)

    // 5. LIMPAR DADOS EXISTENTES (para evitar conflitos)
    console.log('🧹 Limpando dados antigos...')
    
    try {
      // Limpar em ordem devido às foreign keys
      const { error: deleteReceitasError } = await supabase
        .from('receitas')
        .delete()
        .eq('bar_id', bar_id || 3)
      
      const { error: deleteProdutosError } = await supabase
        .from('produtos')
        .delete()
        .eq('bar_id', bar_id || 3)
      
      const { error: deleteInsumosError } = await supabase
        .from('insumos')
        .delete()
        .eq('bar_id', bar_id || 3)
      
      if (deleteReceitasError || deleteProdutosError || deleteInsumosError) {
        console.log('⚠️ Avisos na limpeza:', {
          receitas: deleteReceitasError?.message,
          produtos: deleteProdutosError?.message,
          insumos: deleteInsumosError?.message
        })
      }
      
      console.log('✅ Dados antigos removidos')
    } catch (cleanError) {
      console.warn('⚠️ Erro na limpeza (continuando):', cleanError)
    }

    // 6. INSERIR PRODUTOS
    let produtosInseridos = 0
    if (produtos.length > 0) {
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .insert(produtos)
        .select()

      if (produtosError) {
        console.error('❌ Erro ao inserir produtos:', produtosError)
        throw new Error('Erro ao inserir produtos: ' + produtosError.message)
      } else {
        produtosInseridos = produtosData?.length || 0
        console.log(`✅ ${produtosInseridos} produtos inseridos`)
      }
    }

    // 7. INSERIR INSUMOS
    let insumosInseridos = 0
    if (insumos.length > 0) {
      const { data: insumosData, error: insumosError } = await supabase
        .from('insumos')
        .insert(insumos)
        .select()

      if (insumosError) {
        console.error('❌ Erro ao inserir insumos:', insumosError)
        throw new Error('Erro ao inserir insumos: ' + insumosError.message)
      } else {
        insumosInseridos = insumosData?.length || 0
        console.log(`✅ ${insumosInseridos} insumos inseridos`)
      }
    }

    // 8. CRIAR RECEITAS (relacionamentos)
    let receitasInseridas = 0
    if (receitasData.length > 0 && produtosInseridos > 0 && insumosInseridos > 0) {
      // Buscar IDs dos produtos e insumos recém-inseridos
      const { data: produtosDB } = await supabase
        .from('produtos')
        .select('id, codigo')
        .eq('bar_id', bar_id || 3)

      const { data: insumosDB } = await supabase
        .from('insumos')
        .select('id, codigo')
        .eq('bar_id', bar_id || 3)

      const produtoIdMap = new Map()
      const insumoIdMap = new Map()

      produtosDB?.forEach((p: any) => produtoIdMap.set(p.codigo, p.id))
      insumosDB?.forEach((i: any) => insumoIdMap.set(i.codigo, i.id))

      // Filtrar e remover duplicatas (mesmo produto + insumo)
      const receitasUnicas = new Map()
      
      receitasData
        .filter(r => produtoIdMap.has(r.codigo_produto) && insumoIdMap.has(r.codigo_insumo))
        .forEach(r => {
          const produtoId = produtoIdMap.get(r.codigo_produto)
          const insumoId = insumoIdMap.get(r.codigo_insumo)
          const chave = `${produtoId}_${insumoId}`
          
          // Se já existe, somar as quantidades (caso seja duplicata legítima)
          if (receitasUnicas.has(chave)) {
            const existente = receitasUnicas.get(chave)
            existente.quantidade_necessaria += r.quantidade_necessaria
          } else {
            receitasUnicas.set(chave, {
              bar_id: bar_id || 3,
              produto_id: produtoId,
              insumo_id: insumoId,
              quantidade_necessaria: r.quantidade_necessaria,
              custo_unitario: 0,
              rendimento_percentual: 100
            })
          }
        })

      const receitas = Array.from(receitasUnicas.values())

      if (receitas.length > 0) {
        console.log(`📋 Inserindo ${receitas.length} receitas únicas...`)
        
        // Usar insert simples (tabela já foi limpa)
        const { data: receitasDB, error: receitasError } = await supabase
          .from('receitas')
          .insert(receitas)
          .select()

        if (receitasError) {
          console.error('❌ Erro ao inserir receitas:', receitasError)
          throw new Error('Erro ao inserir receitas: ' + receitasError.message)
        } else {
          receitasInseridas = receitasDB?.length || 0
          console.log(`✅ ${receitasInseridas} receitas inseridas`)
        }
      }
    }

    // 9. RESULTADO FINAL
    const resultado = {
      success: true,
      message: 'Importação concluída com sucesso!',
      estatisticas: {
        produtos_inseridos: produtosInseridos,
        insumos_inseridos: insumosInseridos,
        receitas_inseridas: receitasInseridas,
        total_inseridos: produtosInseridos + insumosInseridos + receitasInseridas
      },
      estrutura_usada: {
        primeira_aba: 'Coluna A=CódProduto, B=Produto, C=CódInsumo, D=Insumo, E=Quantidade',
        segunda_aba: 'Coluna A=CódProduto, B=Produto, C=Rendimento'
      }
    }

    console.log('✅ Importação finalizada:', resultado.estatisticas)
    return NextResponse.json(resultado)

  } catch (error) {
    console.error('❌ Erro na importação:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro na importação: ' + (error as Error).message
    }, { status: 500 })
  }
}

// API para verificar dados importados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    const [produtos, insumos, receitas] = await Promise.all([
      supabase.from('produtos').select('*', { count: 'exact', head: true }).eq('bar_id', barId),
      supabase.from('insumos').select('*', { count: 'exact', head: true }).eq('bar_id', barId),
      supabase.from('receitas').select('*', { count: 'exact', head: true }).eq('bar_id', barId)
    ])

    return NextResponse.json({
      success: true,
      estatisticas: {
        produtos: produtos.count || 0,
        insumos: insumos.count || 0,
        receitas: receitas.count || 0
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro ao buscar dados: ' + (error as Error).message
    }, { status: 500 })
  }
} 