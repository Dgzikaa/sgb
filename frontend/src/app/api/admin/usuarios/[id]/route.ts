import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioId = params.id
    const body = await request.json()
    const { nome, email, role, modulos_permitidos, ativo } = body

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
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

    // Atualizar usuário
    const { data: usuarioAtualizado, error } = await supabase
      .from('usuarios_bar')
      .update({
        nome,
        email,
        role,
        modulos_permitidos,
        ativo,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', parseInt(usuarioId))
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar usuário:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      usuario: usuarioAtualizado
    })

  } catch (error) {
    console.error('❌ Erro na API de atualização de usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioId = params.id

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
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

    // Excluir usuário (soft delete)
    const { error } = await supabase
      .from('usuarios_bar')
      .update({ 
        ativo: false,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', parseInt(usuarioId))

    if (error) {
      console.error('❌ Erro ao excluir usuário:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário excluído com sucesso'
    })

  } catch (error) {
    console.error('❌ Erro na API de exclusão de usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 