import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Buscar receitas com insumos para terminal de produção
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = parseInt(searchParams.get('bar_id') || '3')
    
    console.log(`🍽️ Buscando receitas para bar_id: ${barId}`)

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    // OTIMIZAÇÃO: Buscar TODAS as receitas ATIVAS e insumos em uma única consulta
    const { data: todasReceitas, error: receitasError } = await supabase
      .from('receitas')
      .select(`
        receita_codigo,
        receita_nome,
        receita_categoria,
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
      console.error('❌ Erro ao buscar receitas:', receitasError)
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar receitas: ' + receitasError.message
      }, { status: 500 })
    }

    console.log(`🍽️ ${todasReceitas?.length || 0} registros de receitas encontrados`)

    // Agrupar receitas por código para evitar múltiplas consultas
    const receitasAgrupadas = new Map()
    
    for (const receita of todasReceitas || []) {
      const codigo = receita.receita_codigo
      
      if (!receitasAgrupadas.has(codigo)) {
        // CORREÇÃO: Buscar rendimento_esperado apenas do insumo chefe
        let rendimentoEsperado = 0
        if (receita.insumo_chefe_id && receita.insumo_id === receita.insumo_chefe_id) {
          rendimentoEsperado = receita.rendimento_esperado || 0
        }
        

        
        receitasAgrupadas.set(codigo, {
          receita_codigo: codigo,
          receita_nome: receita.receita_nome,
          receita_categoria: receita.receita_categoria,
          rendimento_esperado: 0, // Será preenchido quando encontrar o insumo chefe
          insumo_chefe_id: receita.insumo_chefe_id,
          tipo_local: receita.receita_categoria?.includes('DRINKS') ? 'bar' : 'cozinha',
          insumos: []
        })
      }
      
      // Adicionar insumo à receita
      if (receita.insumos) {
        const receitaObj = receitasAgrupadas.get(codigo)
        const isChefe = receita.insumo_chefe_id === receita.insumos.id
        
        // Se este é o insumo chefe, aplicar o rendimento esperado à receita
        if (isChefe && receita.rendimento_esperado) {
          receitaObj.rendimento_esperado = receita.rendimento_esperado
          console.log(`🎯 Receita ${codigo}: rendimento ${receita.rendimento_esperado}g aplicado do insumo chefe ${receita.insumos.nome}`)
        }
        
        // DEBUG específico para pc0005
        if (codigo === 'pc0005') {
          console.log(`🔍 pc0005 - insumo: ${receita.insumos.nome}, is_chefe: ${isChefe}, rendimento: ${receita.rendimento_esperado}`)
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
    console.log(`✅ ${receitasComInsumos.length} receitas únicas processadas com insumos`)

    return NextResponse.json({
      success: true,
      receitas: receitasComInsumos,
      total_receitas: receitasComInsumos.length,
      receitas_bar: receitasComInsumos.filter(r => r.tipo_local === 'bar').length,
      receitas_cozinha: receitasComInsumos.filter(r => r.tipo_local === 'cozinha').length
    })

  } catch (error) {
    console.error('❌ Erro interno na API receitas:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor: ' + (error as Error).message
    }, { status: 500 })
  }
} 