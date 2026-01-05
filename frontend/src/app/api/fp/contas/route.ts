import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

// Helper para pegar CPF do usuário autenticado
async function getUserCPF(supabase: any, user: any) {
  console.log('🔍 DEBUG getUserCPF:', {
    userId: user.id,
    userEmail: user.email
  })

  // Tentar buscar por user_id primeiro
  let { data: userData } = await supabase
    .from('usuarios_bar')
    .select('cpf, user_id, email')
    .eq('user_id', user.id)
    .single()

  console.log('🔍 Resultado busca por user_id:', userData)

  // Se não encontrar por user_id, tentar por email
  if (!userData) {
    const { data: userDataByEmail } = await supabase
      .from('usuarios_bar')
      .select('cpf, user_id, email')
      .eq('email', user.email)
      .single()
    
    console.log('🔍 Resultado busca por email:', userDataByEmail)
    userData = userDataByEmail
  }

  if (!userData?.cpf) {
    throw new Error('CPF não encontrado para o usuário logado')
  }

  // Remover formatação do CPF (apenas números)
  const cpfLimpo = userData.cpf.replace(/[^\d]/g, '')
  console.log('✅ CPF encontrado:', cpfLimpo)
  return cpfLimpo
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // Pegar token do header Authorization
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Verificar usuário pelo token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar CPF do usuário
    const cpf = await getUserCPF(supabase, user)

    // Buscar contas do usuário
    const { data: contas, error } = await supabase
      .from('fp_contas')
      .select('*')
      .eq('usuario_cpf', cpf)
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

    // Buscar CPF do usuário
    const cpf = await getUserCPF(supabase, user)

    const body = await request.json()
    const { nome, banco, tipo, saldo_inicial, cor } = body

    if (!nome || !banco || !tipo) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 })
    }

    // Criar conta
    const { data: conta, error } = await supabase
      .from('fp_contas')
      .insert([{
        usuario_cpf: cpf,
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

    // Buscar CPF do usuário para validação
    const cpf = await getUserCPF(supabase, user.id)

    const body = await request.json()
    const { id, nome, banco, tipo, saldo_inicial, cor, ativa } = body

    if (!id) {
      return NextResponse.json({ error: 'ID da conta é obrigatório' }, { status: 400 })
    }

    // Atualizar conta (validando que pertence ao usuário)
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
      .eq('usuario_cpf', cpf) // Garantir que só atualiza sua própria conta
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

    // Buscar CPF do usuário para validação
    const cpf = await getUserCPF(supabase, user.id)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID da conta é obrigatório' }, { status: 400 })
    }

    // Desativar conta em vez de deletar (soft delete) - validando que pertence ao usuário
    const { error } = await supabase
      .from('fp_contas')
      .update({ ativa: false })
      .eq('id', id)
      .eq('usuario_cpf', cpf) // Garantir que só desativa sua própria conta

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Conta desativada com sucesso' })
  } catch (error: any) {
    console.error('Erro ao desativar conta:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
