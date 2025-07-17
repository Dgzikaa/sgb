import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { getUserAuth } from '@/lib/auth-helper'

// ForÃ§a runtime dinÃ¢mico para evitar erro de static generation
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    // Obter dados do usuÃ¡rio autenticado
    const user = await getUserAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UsuÃ¡rio nÃ£o autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { senhaAtual, novaSenha, confirmarSenha } = body

    // ValidaÃ§Ãµes bÃ¡sicas
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos sÃ£o obrigatÃ³rios' },
        { status: 400 }
      )
    }

    if (novaSenha !== confirmarSenha) {
      return NextResponse.json(
        { success: false, error: 'Nova senha e confirmaÃ§Ã£o nÃ£o coincidem' },
        { status: 400 }
      )
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    console.log('ðŸ” Iniciando troca de senha para usuÃ¡rio:', user.id)

    // Usar cliente administrativo para operaÃ§Ãµes com Auth
    const adminClient = await getAdminClient()

    // Buscar dados completos do usuÃ¡rio
    const { data: userData, error: userError } = await adminClient
      .from('usuarios_bar')
      .select('user_id, email, nome')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('âŒ Erro ao buscar dados do usuÃ¡rio:', userError)
      return NextResponse.json(
        { success: false, error: 'UsuÃ¡rio nÃ£o encontrado' },
        { status: 404 }
      )
    }

    // Verificar senha atual fazendo login
    try {
      const { error: signInError } = await adminClient.auth.signInWithPassword({
        email: userData.email,
        password: senhaAtual
      })

      if (signInError) {
        console.log('âŒ Senha atual incorreta para:', userData.email)
        return NextResponse.json(
          { success: false, error: 'Senha atual incorreta' },
          { status: 400 }
        )
      }
    } catch (authError) {
      console.error('âŒ Erro na verificaÃ§Ã£o da senha atual:', authError)
      return NextResponse.json(
        { success: false, error: 'Erro na verificaÃ§Ã£o da senha atual' },
        { status: 500 }
      )
    }

    // Atualizar senha no Supabase Auth
    try {
      const { error: updateError } = await adminClient.auth.admin.updateUserById(
        userData.user_id,
        { 
          password: novaSenha,
          user_metadata: {
            senha_alterada_em: new Date().toISOString(),
            senha_alterada_pelo_usuario: true
          }
        }
      )

      if (updateError) {
        console.error('âŒ Erro ao atualizar senha no Auth:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar senha' },
          { status: 500 }
        )
      }

      console.log('âœ… Senha atualizada no Auth para:', userData.email)
    } catch (authUpdateError) {
      console.error('âŒ Erro na atualizaÃ§Ã£o da senha:', authUpdateError)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar senha' },
        { status: 500 }
      )
    }

    // Atualizar flag na tabela usuarios_bar
    const { error: dbUpdateError } = await adminClient
      .from('usuarios_bar')
      .update({
        senha_redefinida: true,
        ultima_atividade: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .eq('id', user.id)

    if (dbUpdateError) {
      console.error('âŒ Erro ao atualizar flag senha_redefinida:', dbUpdateError)
      // NÃ£o falha aqui, pois a senha jÃ¡ foi alterada com sucesso
    }

    console.log('âœ… Senha alterada com sucesso para:', userData.nome)

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso! Por seguranÃ§a, faÃ§a login novamente.',
      require_relogin: true
    })

  } catch (error) {
    console.error('âŒ Erro na API de trocar senha:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
