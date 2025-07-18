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
import { getSupabaseClient } from '@/lib/supabase'
import { getAdminClient } from '@/lib/supabase-admin'
import { withCache } from '@/middleware/cache-middleware'

// Definir interface para usuÃ¡rio
interface UsuarioBar {
  id: number;
  user_id: string;
  email: string;
  nome: string;
  role: string;
  modulos_permitidos: string[];
  ativo: boolean;
  senha_redefinida: boolean;
  bar_id: number;
  criado_em?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id Ã¡Â© obrigatÃ¡Â³rio' },
        { status: 400 }
      )
    }

    // Implementar cache para usuarios
    const usuarios = await withCache(
      '/api/usuarios',
      `usuarios_bar_${bar_id}`,
      async (): Promise<UsuarioBar[]> => {
        // Usar cliente administrativo para operaÃ¡Â§Ã¡Âµes de usuÃ¡Â¡rios
        let adminClient: Awaited<ReturnType<typeof getAdminClient>>
        try {
          adminClient = await getAdminClient()
        } catch (adminError) {
          console.error('ÂÅ’ Erro ao obter cliente administrativo:', adminError)
          throw new Error('ConfiguraÃ¡Â§Ã¡Â£o administrativa nÃ¡Â£o disponÃ¡Â­vel')
        }

        // Buscar usuÃ¡Â¡rios do bar
        const { data: usuarios, error } = await adminClient
          .from('usuarios_bar')
          .select<UsuarioBar>()
          .eq('bar_id', parseInt(bar_id))
          .order('criado_em', { ascending: false })

        if (error) {
          console.error('ÂÅ’ Erro ao buscar usuÃ¡Â¡rios:', error)
          throw new Error('Erro ao buscar usuÃ¡Â¡rios')
        }

        return usuarios || []
      }
    )

    return NextResponse.json({
      success: true,
      usuarios: usuarios || []
    })

  } catch (error) {
    console.error('ÂÅ’ Erro na API de usuÃ¡Â¡rios:', error)
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
        { success: false, error: 'Dados obrigatÃ³rios nÃ£o fornecidos' },
        { status: 400 }
      )
    }

    // PASSO 1: Obter cliente administrativo
    let adminClient: Awaited<ReturnType<typeof getAdminClient>>
    try {
      adminClient = await getAdminClient()
    } catch (adminError) {
      console.error('ÂÅ’ Erro ao obter cliente administrativo:', adminError)
      return NextResponse.json(
        { success: false, error: 'ConfiguraÃ§Ã£o administrativa nÃ£o disponÃ­vel - verifique secrets' },
        { status: 500 }
      )
    }

    // Verificar se usuÃ¡rio jÃ¡ existe no bar
    const { data: usuarioExistente } = await adminClient
      .from('usuarios_bar')
      .select('id')
      .eq('email', email)
      .eq('bar_id', bar_id)
      .single()

    if (usuarioExistente) {
      return NextResponse.json(
        { success: false, error: 'UsuÃ¡rio jÃ¡ existe neste bar' },
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
      console.error('ÂÅ’ Erro ao criar usuÃ¡rio no Auth:', authError)
      return NextResponse.json(
        { success: false, error: `Erro de autenticaÃ§Ã£o: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { success: false, error: 'Falha ao criar usuÃ¡rio de autenticaÃ§Ã£o' },
        { status: 500 }
      )
    }

    // PASSO 2: Criar usuÃ¡rio na tabela usuarios_bar
    const { data: novoUsuario, error } = await adminClient
      .from('usuarios_bar')
      .insert([{
        bar_id: parseInt(bar_id),
        user_id: authUser.user.id, // Usar o ID do usuÃ¡rio criado no Auth
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
      console.error('ÂÅ’ Erro ao criar usuÃ¡rio na tabela:', error)
      // Se falhou ao criar na tabela, remover do Auth tambÃ©m
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar usuÃ¡rio no sistema' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      usuario: novoUsuario
    })

  } catch (error) {
    console.error('ÂÅ’ Erro na API de criaÃ§Ã£o de usuÃ¡rio:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

