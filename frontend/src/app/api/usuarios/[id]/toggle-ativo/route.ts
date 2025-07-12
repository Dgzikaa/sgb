import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { bar_id, ativo } = body
    const usuarioId = params.id

    if (!bar_id || !usuarioId || typeof ativo !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'ID do usuário, bar_id e status ativo são obrigatórios' },
        { status: 400 }
      )
    }

    // Obter cliente administrativo
    const adminClient = await getAdminClient()

    // Atualizar status do usuário
    const { data: usuarioAtualizado, error } = await adminClient
      .from('usuarios_bar')
      .update({
        ativo,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', usuarioId)
      .eq('bar_id', bar_id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao alterar status do usuário:', error)
      return NextResponse.json(
        { success: false, error: 'Erro ao alterar status do usuário' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      usuario: usuarioAtualizado,
      message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`
    })

  } catch (error) {
    console.error('❌ Erro na API de alteração de status:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 