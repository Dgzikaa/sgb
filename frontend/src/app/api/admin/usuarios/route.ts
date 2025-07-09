import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { getAdminClient } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    // Usar cliente administrativo para operações de usuários
    let adminClient
    try {
      adminClient = await getAdminClient()
    } catch (adminError) {
      console.error('❌ Erro ao obter cliente administrativo:', adminError)
      return NextResponse.json(
        { success: false, error: 'Configuração administrativa não disponível' },
        { status: 500 }
      )
    }

    // Buscar usuários do bar
    const { data: usuarios, error } = await adminClient
      .from('usuarios_bar')
      .select('*')
      .eq('bar_id', parseInt(bar_id))
      .order('criado_em', { ascending: false })

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar usuários' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      usuarios: usuarios || []
    })

  } catch (error) {
    console.error('❌ Erro na API de usuários:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bar_id, email, nome, password, role, modulos_permitidos } = body

    if (!bar_id || !email || !nome || !password) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      )
    }

    // PASSO 1: Obter cliente administrativo
    let adminClient
    try {
      adminClient = await getAdminClient()
    } catch (adminError) {
      console.error('❌ Erro ao obter cliente administrativo:', adminError)
      return NextResponse.json(
        { success: false, error: 'Configuração administrativa não disponível - verifique secrets' },
        { status: 500 }
      )
    }

    // Verificar se usuário já existe no bar
    const { data: usuarioExistente } = await adminClient
      .from('usuarios_bar')
      .select('id')
      .eq('email', email)
      .eq('bar_id', bar_id)
      .single()

    if (usuarioExistente) {
      return NextResponse.json(
        { success: false, error: 'Usuário já existe neste bar' },
        { status: 400 }
      )
    }

    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        nome,
        role,
        bar_id: parseInt(bar_id)
      }
    })

    if (authError) {
      console.error('❌ Erro ao criar usuário no Auth:', authError)
      return NextResponse.json(
        { success: false, error: `Erro de autenticação: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { success: false, error: 'Falha ao criar usuário de autenticação' },
        { status: 500 }
      )
    }

    // PASSO 2: Criar usuário na tabela usuarios_bar
    const { data: novoUsuario, error } = await adminClient
      .from('usuarios_bar')
      .insert([{
        bar_id: parseInt(bar_id),
        user_id: authUser.user.id, // Usar o ID do usuário criado no Auth
        email,
        nome,
        role: role || 'funcionario',
        modulos_permitidos: modulos_permitidos || ['terminal_producao'],
        ativo: true,
        senha_redefinida: false // Marcar que precisa redefinir a senha
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar usuário na tabela:', error)
      
      // Se falhou ao criar na tabela, remover do Auth também
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      
      return NextResponse.json(
        { success: false, error: 'Erro ao criar usuário no sistema' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      usuario: novoUsuario
    })

  } catch (error) {
    console.error('❌ Erro na API de criação de usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 