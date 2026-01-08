import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getPluggyClient } from '@/lib/pluggy-client'

// Helper para pegar CPF do usuário autenticado
async function getUserCPF(supabase: any, user: any) {
  const { data: userData } = await supabase
    .from('usuarios_bar')
    .select('cpf')
    .eq('user_id', user.id)
    .limit(1)

  if (!userData || userData.length === 0 || !userData[0].cpf) {
    const { data: userDataByEmail } = await supabase
      .from('usuarios_bar')
      .select('cpf')
      .eq('email', user.email)
      .limit(1)
    
    if (userDataByEmail && userDataByEmail.length > 0) {
      return userDataByEmail[0].cpf.replace(/[^\d]/g, '')
    }
  }

  if (userData && userData.length > 0 && userData[0].cpf) {
    return userData[0].cpf.replace(/[^\d]/g, '')
  }

  throw new Error('CPF não encontrado')
}

// GET - Listar items do usuário
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const authHeader = request.headers.get('authorization')
    console.log('🔍 DEBUG items GET - authHeader:', authHeader ? 'PRESENTE' : 'AUSENTE')
    
    if (!authHeader) {
      console.log('❌ DEBUG items GET - Sem header de autorização')
      return NextResponse.json({ error: 'Não autorizado - Sem header de autorização' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🔍 DEBUG items GET - token extraído:', token.substring(0, 20) + '...')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    console.log('🔍 DEBUG items GET - user:', user ? user.id : 'NULL', 'error:', authError?.message)
    
    if (authError || !user) {
      console.log('❌ DEBUG items GET - Erro ao validar usuário:', authError?.message)
      return NextResponse.json({ error: `Não autorizado - ${authError?.message || 'Usuário não encontrado'}` }, { status: 401 })
    }

    const cpf = await getUserCPF(supabase, user)
    console.log('✅ DEBUG items GET - CPF obtido:', cpf)

    // Buscar items no banco
    const { data: items, error } = await supabase
      .from('fp_pluggy_items')
      .select('*')
      .eq('usuario_cpf', cpf)
      .eq('ativo', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Se não há items, retornar array vazio
    if (!items || items.length === 0) {
      return NextResponse.json({ success: true, data: [] })
    }

    // Para cada item, buscar status atual no Pluggy
    try {
      const pluggyClient = getPluggyClient()
      const itemsComStatus = await Promise.all(
        items.map(async (item: any) => {
          try {
            const pluggyItem = await pluggyClient.getItem(item.pluggy_item_id)
            return {
              ...item,
              status: pluggyItem.status,
              lastUpdatedAt: pluggyItem.lastUpdatedAt,
            }
          } catch (error) {
            return {
              ...item,
              status: 'ERROR',
              error: 'Não foi possível buscar status',
            }
          }
        })
      )
      return NextResponse.json({ success: true, data: itemsComStatus })
    } catch (pluggyError: any) {
      // Se Pluggy não está configurado, retornar items do banco mesmo
      console.warn('Pluggy não configurado, retornando items do banco:', pluggyError.message)
      return NextResponse.json({ success: true, data: items })
    }
  } catch (error: any) {
    console.error('Erro ao listar items:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Salvar item após conexão
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cpf = await getUserCPF(supabase, user)
    const body = await request.json()
    const { itemId, connectorId, connectorName } = body

    if (!itemId || !connectorId) {
      return NextResponse.json({ error: 'Item ID e Connector ID são obrigatórios' }, { status: 400 })
    }

    // Salvar item no banco
    const { data: item, error } = await supabase
      .from('fp_pluggy_items')
      .insert([{
        usuario_cpf: cpf,
        pluggy_item_id: itemId,
        connector_id: connectorId,
        connector_name: connectorName,
        status: 'UPDATED',
        ativo: true,
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: item })
  } catch (error: any) {
    console.error('Erro ao salvar item:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Desconectar banco
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cpf = await getUserCPF(supabase, user)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Buscar item
    const { data: item } = await supabase
      .from('fp_pluggy_items')
      .select('*')
      .eq('id', id)
      .eq('usuario_cpf', cpf)
      .single()

    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado' }, { status: 404 })
    }

    // Deletar no Pluggy
    const pluggyClient = getPluggyClient()
    await pluggyClient.deleteItem(item.pluggy_item_id)

    // Desativar no banco
    const { error } = await supabase
      .from('fp_pluggy_items')
      .update({ ativo: false })
      .eq('id', id)
      .eq('usuario_cpf', cpf)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Banco desconectado' })
  } catch (error: any) {
    console.error('Erro ao desconectar banco:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
