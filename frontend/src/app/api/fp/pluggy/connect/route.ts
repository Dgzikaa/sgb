import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createPluggyClient } from '@/lib/pluggy/client'

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { conta_id, connector_id, credentials } = body

    if (!conta_id || !connector_id || !credentials) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Verificar se a conta existe e pertence ao usuário
    const { data: conta } = await supabase
      .from('fp_contas')
      .select('*')
      .eq('id', conta_id)
      .eq('usuario_cpf', userData.cpf)
      .single()

    if (!conta) {
      return NextResponse.json({ error: 'Conta não encontrada' }, { status: 404 })
    }

    // Conectar via Pluggy
    const pluggy = createPluggyClient()
    
    const item = await pluggy.createItem({
      connectorId: connector_id,
      credentials
    })

    // Buscar informações do conector
    const connector = await pluggy.getConnector(connector_id)

    // Salvar conexão no banco
    const { data: pluggyItem, error: insertError } = await supabase
      .from('fp_pluggy_items')
      .insert([{
        usuario_cpf: userData.cpf,
        conta_id,
        pluggy_item_id: item.id,
        pluggy_connector_id: connector_id,
        banco_nome: connector.name,
        status: item.status,
        ultima_sincronizacao: new Date().toISOString(),
        ativo: true
      }])
      .select()
      .single()

    if (insertError) throw insertError

    // Sincronizar transações inicialmente (em background)
    fetch(`${request.nextUrl.origin}/api/fp/pluggy/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pluggy_item_id: item.id })
    }).catch(console.error)

    return NextResponse.json({
      success: true,
      message: 'Banco conectado com sucesso! Sincronizando transações...',
      data: {
        item: pluggyItem,
        pluggy_status: item.status
      }
    })
  } catch (error: any) {
    console.error('Erro ao conectar banco:', error)
    return NextResponse.json({ 
      error: error.message || 'Erro ao conectar banco' 
    }, { status: 500 })
  }
}
