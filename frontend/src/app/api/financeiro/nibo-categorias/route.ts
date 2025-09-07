import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Buscar categorias do Nibo com macro-categorias
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [NIBO-CATEGORIAS] Buscando categorias')

    const { data: categorias, error } = await supabase
      .from('nibo_categorias')
      .select('*')
      .eq('ativo', true)
      .order('categoria_macro', { ascending: true })
      .order('categoria_nome', { ascending: true })

    if (error) {
      console.error('❌ [NIBO-CATEGORIAS] Erro ao buscar categorias:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar categorias', details: error.message },
        { status: 500 }
      )
    }

    // Agrupar por macro-categoria
    const categoriasPorMacro = categorias?.reduce((acc, categoria) => {
      const macro = categoria.categoria_macro
      if (!acc[macro]) {
        acc[macro] = []
      }
      acc[macro].push(categoria)
      return acc
    }, {} as Record<string, typeof categorias>) || {}

    // Obter lista única de macro-categorias
    const macroCategorias = Object.keys(categoriasPorMacro).sort()

    const resultado = {
      categorias: categorias || [],
      categorias_por_macro: categoriasPorMacro,
      macro_categorias: macroCategorias,
      total_categorias: categorias?.length || 0
    }

    console.log(`✅ [NIBO-CATEGORIAS] ${resultado.total_categorias} categorias retornadas`)

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('❌ [NIBO-CATEGORIAS] Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
