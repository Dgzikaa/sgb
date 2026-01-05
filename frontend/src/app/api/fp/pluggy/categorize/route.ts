import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getPluggyClient } from '@/lib/pluggy-client'

/**
 * POST /api/fp/pluggy/categorize
 * Categoriza uma transação usando a API de Enrichment do Pluggy
 * Ref: https://docs.pluggy.ai/reference/categorize
 * 
 * Use este endpoint para categorizar transações importadas manualmente (CSV/OFX)
 * ou para obter sugestões de categoria para transações existentes
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createServerClient()
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { description, amount, date } = body

    if (!description) {
      return NextResponse.json({ 
        success: false,
        error: 'Descrição da transação é obrigatória' 
      }, { status: 400 })
    }

    const pluggyClient = getPluggyClient()
    
    console.log('🤖 Categorizando transação:', description)

    // Chamar API de categorização do Pluggy
    // @ts-ignore
    const result = await pluggyClient.request('/categorize', {
      method: 'POST',
      body: JSON.stringify({
        description,
        amount: amount || 0,
        date: date || new Date().toISOString().split('T')[0]
      })
    })

    console.log('✅ Categoria sugerida:', result.category?.description)

    return NextResponse.json({
      success: true,
      data: {
        categoryId: result.category?.id,
        categoryName: result.category?.description,
        categoryParentId: result.category?.parentId,
        categoryParentName: result.category?.parentDescription,
        confidence: result.confidence || null
      }
    })
  } catch (error: any) {
    console.error('❌ Erro ao categorizar:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erro ao categorizar transação'
    }, { status: 500 })
  }
}
