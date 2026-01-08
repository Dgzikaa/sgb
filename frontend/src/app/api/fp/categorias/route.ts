import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

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

// GET - Listar todas as categorias (templates + customizadas do usuário)
export async function GET(request: NextRequest) {
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

    // Buscar categorias template
    const { data: templates, error: templatesError } = await supabase
      .from('fp_categorias_template')
      .select('*')
      .order('nome', { ascending: true })

    if (templatesError) throw templatesError

    // Buscar categorias customizadas do usuário
    const { data: customizadas, error: customError } = await supabase
      .from('fp_categorias')
      .select('*')
      .eq('usuario_cpf', cpf)
      .order('nome', { ascending: true })

    if (customError) throw customError

    // Combinar e marcar origem
    const categoriasCompletas = [
      ...(templates || []).map((c: any) => ({ ...c, origem: 'template', customizada: false })),
      ...(customizadas || []).map((c: any) => ({ ...c, origem: 'customizada', customizada: true }))
    ]

    return NextResponse.json({ success: true, data: categoriasCompletas })
  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Criar categoria customizada
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
    const { nome, tipo, icone, cor } = body

    if (!nome || !tipo) {
      return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
    }

    // Criar categoria customizada
    const { data: categoria, error } = await supabase
      .from('fp_categorias')
      .insert([{
        usuario_cpf: cpf,
        nome,
        tipo,
        icone: icone || '📦',
        cor: cor || '#9CA3AF',
        ativa: true
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: categoria })
  } catch (error: any) {
    console.error('Erro ao criar categoria:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - Atualizar categoria customizada
export async function PUT(request: NextRequest) {
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
    const { id, nome, tipo, icone, cor, ativa } = body

    if (!id) {
      return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
    }

    // Atualizar categoria (validando que pertence ao usuário)
    const { data: categoria, error } = await supabase
      .from('fp_categorias')
      .update({ nome, tipo, icone, cor, ativa })
      .eq('id', id)
      .eq('usuario_cpf', cpf)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: categoria })
  } catch (error: any) {
    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Desativar categoria customizada
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

    // Desativar categoria
    const { error } = await supabase
      .from('fp_categorias')
      .update({ ativa: false })
      .eq('id', id)
      .eq('usuario_cpf', cpf)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Categoria desativada' })
  } catch (error: any) {
    console.error('Erro ao desativar categoria:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
