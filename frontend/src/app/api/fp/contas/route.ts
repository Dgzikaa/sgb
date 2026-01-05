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

    // Buscar contas do usuário
    const { data: contas, error } = await supabase
      .from('fp_contas')
      .select('*')
      .eq('usuario_cpf', userData.cpf)
      .eq('ativa', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ success: true, data: contas })
  } catch (error: any) {
    console.error('Erro ao buscar contas:', error)
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
    const { nome, banco, tipo, saldo_inicial, cor } = body

    if (!nome || !banco || !tipo) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Criar conta
    const { data: conta, error } = await supabase
      .from('fp_contas')
      .insert([{
        usuario_cpf: userData.cpf,
        nome,
        banco,
        tipo,
        saldo_inicial: saldo_inicial || 0,
        saldo_atual: saldo_inicial || 0,
        cor: cor || '#3B82F6',
        ativa: true
      }])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: conta })
  } catch (error: any) {
    console.error('Erro ao criar conta:', error)
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
    const { id, nome, banco, tipo, saldo_inicial, cor, ativa } = body

    if (!id) {
      return NextResponse.json({ error: 'ID da conta é obrigatório' }, { status: 400 })
    }

    // Atualizar conta
    const { data: conta, error } = await supabase
      .from('fp_contas')
      .update({
        nome,
        banco,
        tipo,
        saldo_inicial,
        cor,
        ativa
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data: conta })
  } catch (error: any) {
    console.error('Erro ao atualizar conta:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID da conta é obrigatório' }, { status: 400 })
    }

    // Desativar conta em vez de deletar (soft delete)
    const { error } = await supabase
      .from('fp_contas')
      .update({ ativa: false })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Conta desativada com sucesso' })
  } catch (error: any) {
    console.error('Erro ao desativar conta:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
