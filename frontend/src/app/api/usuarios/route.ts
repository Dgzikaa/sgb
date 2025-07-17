import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { getAdminClient } from '@/lib/supabase-admin'
import { withCache } from '@/middleware/cache-middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bar_id = searchParams.get('bar_id')

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id ·© obrigat·≥rio' },
        { status: 400 }
      )
    }

    // Implementar cache para usuarios
    const usuarios = await withCache(
      '/api/usuarios',
      `usuarios_bar_${bar_id}`,
      async () => {
        // Usar cliente administrativo para opera·ß·µes de usu·°rios
        let adminClient
        try {
          adminClient = await getAdminClient()
        } catch (adminError) {
          console.error('ùå Erro ao obter cliente administrativo:', adminError)
          throw new Error('Configura·ß·£o administrativa n·£o dispon·≠vel')
        }

        // Buscar usu·°rios do bar
        const { data: usuarios, error } = await adminClient
          .from('usuarios_bar')
          .select('*')
          .eq('bar_id', parseInt(bar_id))
          .order('criado_em', { ascending: false })

        if (error) {
          console.error('ùå Erro ao buscar usu·°rios:', error)
          throw new Error('Erro ao buscar usu·°rios')
        }

        return usuarios || []
      }
    )

    return NextResponse.json({
      success: true,
      usuarios: usuarios || []
    })

  } catch (error) {
    console.error('ùå Erro na API de usu·°rios:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { bar_id, email: any, nome, password: any, role, modulos_permitidos } = body

    if (!bar_id || !email || !nome || !password) {
      return NextResponse.json(
        { success: false, error: 'Dados obrigat·≥rios n·£o fornecidos' },
        { status: 400 }
      )
    }

    // PASSO 1: Obter cliente administrativo
    let adminClient
    try {
      adminClient = await getAdminClient()
    } catch (adminError) {
      console.error('ùå Erro ao obter cliente administrativo:', adminError)
      return NextResponse.json(
        { success: false, error: 'Configura·ß·£o administrativa n·£o dispon·≠vel - verifique secrets' },
        { status: 500 }
      )
    }

    // Verificar se usu·°rio j·° existe no bar
    const { data: usuarioExistente } = await adminClient
      .from('usuarios_bar')
      .select('id')
      .eq('email', email)
      .eq('bar_id', bar_id)
      .single()

    if (usuarioExistente) {
      return NextResponse.json(
        { success: false, error: 'Usu·°rio j·° existe neste bar' },
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
      console.error('ùå Erro ao criar usu·°rio no Auth:', authError)
      return NextResponse.json(
        { success: false, error: `Erro de autentica·ß·£o: ${authError.message}` },
        { status: 400 }
      )
    }

    if (!authUser.user) {
      return NextResponse.json(
        { success: false, error: 'Falha ao criar usu·°rio de autentica·ß·£o' },
        { status: 500 }
      )
    }

    // PASSO 2: Criar usu·°rio na tabela usuarios_bar
    const { data: novoUsuario, error } = await adminClient
      .from('usuarios_bar')
      .insert([{
        bar_id: parseInt(bar_id),
        user_id: authUser.user.id, // Usar o ID do usu·°rio criado no Auth
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
      console.error('ùå Erro ao criar usu·°rio na tabela:', error)
      
      // Se falhou ao criar na tabela, remover do Auth tamb·©m
      await adminClient.auth.admin.deleteUser(authUser.user.id)
      
      return NextResponse.json(
        { success: false, error: 'Erro ao criar usu·°rio no sistema' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      usuario: novoUsuario
    })

  } catch (error) {
    console.error('ùå Erro na API de cria·ß·£o de usu·°rio:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 
