import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioId = params.id
    const body = await request.json()
    const { nome, email, role, modulos_permitidos, ativo } = body

    console.log('🔄 Atualizando usuário:', { usuarioId, nome, email, role, modulos_permitidos, ativo })

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
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

    // Atualizar usuário
    const { data: usuarioAtualizado, error } = await adminClient
      .from('usuarios_bar')
      .update({
        ...(nome && { nome }),
        ...(email && { email }),
        ...(role && { role }),
        ...(modulos_permitidos !== undefined && { modulos_permitidos }),
        ...(ativo !== undefined && { ativo }),
        atualizado_em: new Date().toISOString()
      })
      .eq('id', parseInt(usuarioId))
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar usuário:', error)
      return NextResponse.json(
        { success: false, error: `Erro ao atualizar usuário: ${error.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Usuário atualizado com sucesso:', usuarioAtualizado)

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

    console.log('🗑️ Iniciando exclusão completa do usuário:', usuarioId)

    if (!usuarioId) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário é obrigatório' },
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

    // PASSO 1: Buscar dados do usuário antes de excluir
    console.log('🔍 Buscando dados do usuário...')
    const { data: userData, error: fetchError } = await adminClient
      .from('usuarios_bar')
      .select('user_id, nome, email')
      .eq('id', parseInt(usuarioId))
      .single()

    if (fetchError || !userData) {
      console.error('❌ Usuário não encontrado:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    console.log('✅ Usuário encontrado:', userData.nome, '- Auth ID:', userData.user_id)

    // PASSO 2: Remover da tabela usuarios_bar
    console.log('🗑️ Removendo da tabela usuarios_bar...')
    const { error: tableError } = await adminClient
      .from('usuarios_bar')
      .delete()
      .eq('id', parseInt(usuarioId))

    if (tableError) {
      console.error('❌ Erro ao excluir da tabela:', tableError)
      return NextResponse.json(
        { success: false, error: `Erro ao excluir usuário da tabela: ${tableError.message}` },
        { status: 500 }
      )
    }

    console.log('✅ Usuário removido da tabela usuarios_bar')

    // PASSO 3: Remover do Supabase Auth
    console.log('🔐 Removendo do Supabase Auth...')
    const { error: authError } = await adminClient.auth.admin.deleteUser(userData.user_id)

    if (authError) {
      console.error('❌ Erro ao excluir do Auth:', authError)
      // Não falhar aqui pois o usuário já foi removido da tabela principal
      console.log('⚠️ Usuário removido da tabela mas ficou no Auth - pode precisar limpeza manual')
    } else {
      console.log('✅ Usuário removido do Supabase Auth')
    }

    console.log('🎉 Exclusão completa finalizada para:', userData.nome)

    return NextResponse.json({
      success: true,
      message: `Usuário ${userData.nome} excluído completamente do sistema`,
      details: {
        removedFromTable: true,
        removedFromAuth: !authError
      }
    })

  } catch (error) {
    console.error('❌ Erro na API de exclusão de usuário:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 