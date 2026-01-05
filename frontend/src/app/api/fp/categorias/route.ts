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

    // Verificar se usuário já tem categorias
    const { data: categorias, error } = await supabase
      .from('fp_categorias')
      .select('*')
      .eq('usuario_cpf', userData.cpf)
      .eq('ativa', true)
      .order('tipo', { ascending: true })
      .order('nome', { ascending: true })

    if (error) throw error

    // Se não tem categorias, criar categorias padrão
    if (!categorias || categorias.length === 0) {
      const { data: templates } = await supabase
        .from('fp_categorias_template')
        .select('*')

      if (templates && templates.length > 0) {
        const novasCategorias = templates.map(t => ({
          usuario_cpf: userData.cpf,
          nome: t.nome,
          tipo: t.tipo,
          cor: t.cor,
          icone: t.icone,
          ativa: true
        }))

        const { data: criadas } = await supabase
          .from('fp_categorias')
          .insert(novasCategorias)
          .select()

        return NextResponse.json({ success: true, data: criadas || [] })
      }
    }

    return NextResponse.json({ success: true, data: categorias })
  } catch (error: any) {
    console.error('Erro ao buscar categorias:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('usuarios')
      .select('cpf')
      .eq('id', session.user.id)
      .single()

    if (!userData?.cpf) {
      return NextResponse.json({ error: 'CPF não encontrado' }, { status: 400 })
    }

    const body = await request.json()
    const { nome, tipo, cor, icone, categoria_pai } = body

    if (!nome || !tipo) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    const { data: categoria, error } = await supabase
      .from('fp_categorias')
      .insert([{
        usuario_cpf: userData.cpf,
        nome,
        tipo,
        cor: cor || '#6B7280',
        icone: icone || 'tag',
        categoria_pai,
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

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, nome, tipo, cor, icone, ativa } = body

    if (!id) {
      return NextResponse.json({ error: 'ID da categoria é obrigatório' }, { status: 400 })
    }

    const { data: categoria, error } = await supabase
      .from('fp_categorias')
      .update({
        nome,
        tipo,
        cor,
        icone,
        ativa
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: categoria })
  } catch (error: any) {
    console.error('Erro ao atualizar categoria:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
