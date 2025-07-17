import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Buscar receitas com insumos para terminal de produÃ¡Â§Ã¡Â£o
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    
    console.log(`Ã°Å¸ÂÂ½Ã¯Â¸Â Buscando receitas para bar_id: ${barId}`)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // OTIMIZAÃ¡â€¡Ã¡Æ’O: Buscar TODAS as receitas ATIVAS e insumos em uma Ã¡Âºnica consulta
    const { data: todasReceitas, error: receitasError } = await supabase
      .from('receitas')
      .select(`
        receita_codigo,
        receita_nome,
        receita_categoria,
        tipo_local,
        insumo_chefe_id,
        rendimento_esperado,
        insumo_id,
        quantidade_necessaria,
        ativo,
        insumos!receitas_insumo_id_fkey(
          id,
          codigo,
          nome,
          unidade_medida,
          categoria
        )
      `)
      .eq('bar_id', barId)
      .eq('ativo', true)
      .order('receita_codigo')

    if (receitasError) {
      console.error('ÂÅ’ Erro ao buscar receitas:', receitasError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar receitas: ' + receitasError.message
      }, { status: 500 })
    }

    console.log(`Ã°Å¸ÂÂ½Ã¯Â¸Â ${todasReceitas?.length || 0} registros de receitas encontrados`)

    // Agrupar receitas por cÃ¡Â³digo para evitar mÃ¡Âºltiplas consultas
    const receitasAgrupadas = new Map()
    
    for (const receita of todasReceitas || []) {
      const codigo = receita.receita_codigo
      
      if (!receitasAgrupadas.has(codigo)) {
        // CORREÃ¡â€¡Ã¡Æ’O: Buscar rendimento_esperado apenas do insumo chefe
        let rendimentoEsperado = 0
        if (receita.insumo_chefe_id && receita.insumo_id === receita.insumo_chefe_id) {
          rendimentoEsperado = receita.rendimento_esperado || 0
        }
        

        
        receitasAgrupadas.set(codigo, {
          receita_codigo: codigo,
          receita_nome: receita.receita_nome,
          receita_categoria: receita.receita_categoria,
          rendimento_esperado: 0, // SerÃ¡Â¡ preenchido quando encontrar o insumo chefe
          insumo_chefe_id: receita.insumo_chefe_id,
          tipo_local: receita.receita_categoria?.includes('DRINKS') ? 'bar' : 'cozinha',
          insumos: []
        })
      }
      
      // Adicionar insumo Ã¡Â  receita
      if (receita.insumos) {
        const receitaObj = receitasAgrupadas.get(codigo)
        const isChefe = receita.insumo_chefe_id === receita.insumos.id
        
        // Se este Ã¡Â© o insumo chefe, aplicar o rendimento esperado Ã¡Â  receita
        if (isChefe && receita.rendimento_esperado) {
          receitaObj.rendimento_esperado = receita.rendimento_esperado
          console.log(`Ã°Å¸Å½Â¯ Receita ${codigo}: rendimento ${receita.rendimento_esperado}g aplicado do insumo chefe ${receita.insumos.nome}`)
        }
        
        // DEBUG especÃ¡Â­fico para pc0005
        if (codigo === 'pc0005') {
          console.log(`Ã°Å¸â€Â pc0005 - insumo: ${receita.insumos.nome}, is_chefe: ${isChefe}, rendimento: ${receita.rendimento_esperado}`)
        }
        
        receitaObj.insumos.push({
          id: receita.insumos.id,
          codigo: receita.insumos.codigo,
          nome: receita.insumos.nome,
          quantidade_necessaria: receita.quantidade_necessaria,
          unidade_medida: receita.insumos.unidade_medida,
          categoria: receita.insumos.categoria,
          is_chefe: isChefe
        })
      }
    }

    const receitasComInsumos = Array.from(receitasAgrupadas.values())
    console.log(`Å“â€¦ ${receitasComInsumos.length} receitas Ã¡Âºnicas processadas com insumos`)

    return NextResponse.json({
      success: true,
      receitas: receitasComInsumos,
      total_receitas: receitasComInsumos.length,
      receitas_bar: receitasComInsumos.filter((r) => r.tipo_local === 'bar').length,
      receitas_cozinha: receitasComInsumos.filter((r) => r.tipo_local === 'cozinha').length
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno na API receitas:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 

