import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { email, novaSenha, token } = await request.json()

    console.log('🔐 Redefinindo senha para:', { email })

    if (!email || !novaSenha) {
      return NextResponse.json(
        { success: false, error: 'Email e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { success: false, error: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    // Obter cliente administrativo
    let adminClient
    try {
      adminClient = await getAdminClient()
    } catch (adminError) {
      console.error('❌ Erro ao obter cliente administrativo:', adminError)
      return NextResponse.json(
        { success: false, error: 'Erro de configuração do sistema' },
        { status: 500 }
      )
    }

    // Buscar usuário pelo email
    console.log('🔍 Buscando usuário no banco...')
    const { data: usuarioData, error: usuarioError } = await adminClient
      .from('usuarios_bar')
      .select('user_id, nome')
      .eq('email', email)
      .single()

    if (usuarioError || !usuarioData) {
      console.error('❌ Usuário não encontrado:', usuarioError)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Usuário encontrado:', usuarioData.nome)

    // Atualizar senha no Supabase Auth
    console.log('🔑 Atualizando senha no Auth...')
    const { data, error } = await adminClient.auth.admin.updateUserById(
      usuarioData.user_id,
      { 
        password: novaSenha,
        email_confirm: true 
      }
    )

    if (error) {
      console.error('❌ Erro ao atualizar senha:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar senha: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ Senha atualizada com sucesso')

    // Opcionalmente, marcar que o usuário já redefiniu a senha
    await adminClient
      .from('usuarios_bar')
      .update({ 
        senha_redefinida: true,
        atualizado_em: new Date().toISOString()
      })
      .eq('user_id', usuarioData.user_id)

    return NextResponse.json({
      success: true,
      message: 'Senha redefinida com sucesso',
      user: {
        id: data.user?.id,
        email: data.user?.email
      }
    })

  } catch (error) {
    console.error('🔥 Erro inesperado:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 