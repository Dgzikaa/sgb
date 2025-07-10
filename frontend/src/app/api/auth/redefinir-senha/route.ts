import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { email, novaSenha, token } = await request.json()

    console.log('🔐 Redefinindo senha para:', { email })

    if (!email || !novaSenha || !token) {
      return NextResponse.json(
        { success: false, error: 'Email, nova senha e token são obrigatórios' },
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

    // Buscar usuário pelo email e validar token
    console.log('🔍 Buscando usuário e validando token...')
    const { data: usuarioData, error: usuarioError } = await adminClient
      .from('usuario_bares')
      .select('user_id, nome, reset_token, reset_token_expiry')
      .eq('email', email)
      .eq('reset_token', token)
      .single()

    if (usuarioError || !usuarioData) {
      console.error('❌ Usuário não encontrado ou token inválido:', usuarioError)
      return NextResponse.json(
        { success: false, error: 'Token inválido ou expirado' },
        { status: 404 }
      )
    }

    // Verificar se o token não expirou
    if (usuarioData.reset_token_expiry) {
      const tokenExpiry = new Date(usuarioData.reset_token_expiry)
      if (tokenExpiry < new Date()) {
        return NextResponse.json(
          { success: false, error: 'Token expirado. Solicite uma nova recuperação de senha' },
          { status: 400 }
        )
      }
    }

    console.log('✅ Usuário encontrado e token válido:', usuarioData.nome)

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

    // Limpar token de reset e marcar que o usuário já redefiniu a senha
    await adminClient
      .from('usuario_bares')
      .update({ 
        senha_redefinida: true,
        reset_token: null,
        reset_token_expiry: null,
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