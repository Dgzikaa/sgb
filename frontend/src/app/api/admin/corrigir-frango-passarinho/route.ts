import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Corrigindo receitas do Frango a Passarinho...')

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // 1. Buscar o produto Frango a Passarinho
    const { data: produto } = await supabase
      .from('produtos')
      .select('id')
      .eq('codigo', 'pc0005')
      .single()

    if (!produto) {
      return NextResponse.json({ error: 'Produto pc0005 não encontrado' }, { status: 404 })
    }

    // 2. Deletar receitas erradas existentes
    await supabase
      .from('receitas')
      .delete()
      .eq('produto_id', produto.id)

    // 3. Buscar os insumos corretos baseados na planilha
    const insumosCorretos = [
      { codigo: 'i0095', quantidade: 50 },   // Alho em pó
      { codigo: 'i0149', quantidade: 3 },    // Pimenta jalapeno sem semente
      { codigo: 'i0158', quantidade: 3 },    // Salsa
      { codigo: 'i0123', quantidade: 1000 }, // Leite 1L Integral (insumo chefe)
    ]

    const receitasParaInserir = []

    for (const insumoCorreto of insumosCorretos) {
      const { data: insumo } = await supabase
        .from('insumos')
        .select('id')
        .eq('codigo', insumoCorreto.codigo)
        .single()

      if (insumo) {
        receitasParaInserir.push({
          produto_id: produto.id,
          insumo_id: insumo.id,
          quantidade_necessaria: insumoCorreto.quantidade,
          bar_id: 3
        })
      } else {
        console.log(`⚠️ Insumo ${insumoCorreto.codigo} não encontrado`)
      }
    }

    // 4. Inserir receitas corretas
    if (receitasParaInserir.length > 0) {
      const { data: receitas, error } = await supabase
        .from('receitas')
        .insert(receitasParaInserir)
        .select()

      if (error) {
        throw new Error('Erro ao inserir receitas: ' + error.message)
      }

      console.log(`✅ ${receitas.length} receitas corretas inseridas`)
    }

    return NextResponse.json({
      success: true,
      message: `Frango a Passarinho corrigido com ${receitasParaInserir.length} insumos corretos`,
      insumos_corrigidos: insumosCorretos.map(i => `${i.codigo} (${i.quantidade})`)
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro ao corrigir: ' + String(error) 
    }, { status: 500 })
  }
} 