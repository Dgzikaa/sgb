import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar CPF do usuário
    const { data: userData } = await supabase
      .from('usuarios')
      .select('cpf')
      .eq('id', session.user.id)
      .single()

    if (!userData?.cpf) {
      return NextResponse.json({ error: 'CPF não encontrado' }, { status: 400 })
    }

    // Buscar conexões Pluggy do usuário
    const { data: items, error } = await supabase
      .from('fp_pluggy_items')
      .select(`
        *,
        conta:fp_contas(id, nome, banco)
      `)
      .eq('usuario_cpf', userData.cpf)
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: items || []
    })
  } catch (error: any) {
    console.error('Erro ao buscar conexões:', error)
    return NextResponse.json({ 
      error: error.message || 'Erro ao buscar conexões' 
    }, { status: 500 })
  }
}
