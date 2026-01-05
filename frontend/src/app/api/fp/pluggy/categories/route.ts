import { NextRequest, NextResponse } from 'next/server'
import { getPluggyClient } from '@/lib/pluggy-client'

/**
 * GET /api/fp/pluggy/categories
 * Lista todas as categorias disponíveis no Pluggy
 * Ref: https://docs.pluggy.ai/reference/categories-list
 */
export async function GET(request: NextRequest) {
  try {
    const pluggyClient = getPluggyClient()
    
    console.log('📋 Buscando categorias do Pluggy...')
    
    const categories = await pluggyClient.request('/categories', {
      method: 'GET'
    })

    const results = categories.results || []

    console.log(`✅ ${results.length} categorias encontradas`)

    // Organizar categorias por hierarquia (principais e subcategorias)
    const categoriasPrincipais = results.filter((c: any) => !c.parentId)
    const subcategorias = results.filter((c: any) => c.parentId)

    return NextResponse.json({
      success: true,
      data: {
        all: results,
        main: categoriasPrincipais,
        sub: subcategorias
      },
      total: results.length
    })
  } catch (error: any) {
    console.error('❌ Erro ao buscar categorias:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao buscar categorias'
    }, { status: 500 })
  }
}
