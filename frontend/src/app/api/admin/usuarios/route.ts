import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

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

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Falha na conexão com o banco' },
        { status: 500 }
      )
    }

    // Buscar usuários do bar
    const { data: usuarios, error } = await supabase
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

    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Falha na conexão com o banco' },
        { status: 500 }
      )
    }

    // Verificar se usuário já existe no bar
    const { data: usuarioExistente } = await supabase
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

    // Gerar UUID para o usuário
    const user_id = crypto.randomUUID()

    // Inserir usuário
    const { data: novoUsuario, error } = await supabase
      .from('usuarios_bar')
      .insert([{
        bar_id: parseInt(bar_id),
        user_id,
        email,
        nome,
        role: role || 'funcionario',
        modulos_permitidos: modulos_permitidos || ['terminal_producao'],
        ativo: true
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar usuário:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao criar usuário' },
        { status: 500 }
      )
    }

    // TODO: Aqui você pode integrar com Supabase Auth para criar o usuário de autenticação
    // Por enquanto, vamos apenas criar na tabela usuarios_bar

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