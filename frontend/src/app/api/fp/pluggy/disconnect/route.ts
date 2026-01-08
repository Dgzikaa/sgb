import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { createPluggyClient } from '@/lib/pluggy/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { pluggy_item_id } = body

    if (!pluggy_item_id) {
      return NextResponse.json({ error: 'pluggy_item_id é obrigatório' }, { status: 400 })
    }

    // Buscar conexão
    const { data: pluggyItem } = await supabase
      .from('fp_pluggy_items')
      .select('*')
      .eq('pluggy_item_id', pluggy_item_id)
      .single()

    if (!pluggyItem) {
      return NextResponse.json({ error: 'Conexão não encontrada' }, { status: 404 })
    }

    // Deletar no Pluggy
    try {
      const pluggy = createPluggyClient()
      await pluggy.deleteItem(pluggy_item_id)
    } catch (error) {
      console.error('Erro ao deletar item no Pluggy:', error)
      // Continua mesmo se der erro no Pluggy
    }

    // Desativar conexão no banco
    const { error } = await supabase
      .from('fp_pluggy_items')
      .update({
        ativo: false,
        status: 'DISCONNECTED'
      })
      .eq('pluggy_item_id', pluggy_item_id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Banco desconectado com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao desconectar banco:', error)
    return NextResponse.json({ 
      error: error.message || 'Erro ao desconectar banco' 
    }, { status: 500 })
  }
}
