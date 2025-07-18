import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { getUserAuth } from '@/lib/auth-helper'

// ForÃ¡Â§a runtime dinÃ¡Â¢mico para evitar erro de static generation
export const dynamic = 'force-dynamic'

export async function PUT(request: NextRequest) {
  try {
    // Obter dados do usuÃ¡Â¡rio autenticado
    const user = await getUserAuth(request)
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'UsuÃ¡Â¡rio nÃ¡Â£o autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { senhaAtual, novaSenha, confirmarSenha } = body

    // ValidaÃ¡Â§Ã¡Âµes bÃ¡Â¡sicas
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      return NextResponse.json(
        { success: false, error: 'Todos os campos sÃ¡Â£o obrigatÃ¡Â³rios' },
        { status: 400 }
      )
    }

    if (novaSenha !== confirmarSenha) {
      return NextResponse.json(
        { success: false, error: 'Nova senha e confirmaÃ¡Â§Ã¡Â£o nÃ¡Â£o coincidem' },
        { status: 400 }
      )
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Nova senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    console.log('Ã°Å¸â€Â Iniciando troca de senha para usuÃ¡Â¡rio:', user.id)

    // Usar cliente administrativo para operaÃ¡Â§Ã¡Âµes com Auth
    const adminClient = await getAdminClient()

    // Buscar dados completos do usuÃ¡Â¡rio
    const { data: userData, error: userError } = await adminClient
      .from('usuarios_bar')
      .select('user_id, email, nome')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('ÂÅ’ Erro ao buscar dados do usuÃ¡Â¡rio:', userError)
      return NextResponse.json(
        { success: false, error: 'UsuÃ¡Â¡rio nÃ¡Â£o encontrado' },
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
        console.log('ÂÅ’ Senha atual incorreta para:', userData.email)
        return NextResponse.json(
          { success: false, error: 'Senha atual incorreta' },
          { status: 400 }
        )
      }
    } catch (authError) {
      console.error('ÂÅ’ Erro na verificaÃ¡Â§Ã¡Â£o da senha atual:', authError)
      return NextResponse.json(
        { success: false, error: 'Erro na verificaÃ¡Â§Ã¡Â£o da senha atual' },
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
        console.error('ÂÅ’ Erro ao atualizar senha no Auth:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar senha' },
          { status: 500 }
        )
      }

      console.log('Å“â€¦ Senha atualizada no Auth para:', userData.email)
    } catch (authUpdateError) {
      console.error('ÂÅ’ Erro na atualizaÃ¡Â§Ã¡Â£o da senha:', authUpdateError)
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
      console.error('ÂÅ’ Erro ao atualizar flag senha_redefinida:', dbUpdateError)
      // NÃ¡Â£o falha aqui, pois a senha jÃ¡Â¡ foi alterada com sucesso
    }

    console.log('Å“â€¦ Senha alterada com sucesso para:', userData.nome)

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso! Por seguranÃ¡Â§a, faÃ¡Â§a login novamente.',
      require_relogin: true
    })

  } catch (error) {
    console.error('ÂÅ’ Erro na API de trocar senha:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

