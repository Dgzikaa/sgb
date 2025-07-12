import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log('📊 PUT /api/usuarios/[id] - Body recebido:', JSON.stringify(body, null, 2))
    
    const { bar_id, nome, email, role, telefone, observacoes, modulos_permitidos, ativo } = body
    const usuarioId = params.id
    
    console.log('🔍 Dados extraídos:', {
      bar_id,
      usuarioId,
      nome,
      email,
      role,
      telefone,
      observacoes,
      modulos_permitidos,
      ativo
    })

    if (!bar_id || !usuarioId) {
      console.error('❌ Dados obrigatórios ausentes:', { bar_id, usuarioId })
      return NextResponse.json(
        { success: false, error: 'ID do usuário e bar_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Debug das variáveis de ambiente
    console.log('🔍 Verificando variáveis de ambiente...')
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurada' : 'Não configurada')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada')
    console.log('SERVICE_ROLE_KEY:', process.env.SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada')

    // Obter cliente administrativo
    console.log('🔧 Obtendo cliente administrativo...')
    let adminClient
    try {
      adminClient = await getAdminClient()
      console.log('✅ Cliente administrativo obtido')
    } catch (adminError) {
      console.error('❌ Erro ao obter cliente administrativo:', adminError)
      return NextResponse.json(
        { success: false, error: 'Erro de configuração do servidor - verifique as variáveis de ambiente' },
        { status: 500 }
      )
    }

    // Atualizar usuário na tabela usuarios_bar
    console.log('🔄 Atualizando usuário na tabela usuarios_bar...')
    const updateData = {
      nome,
      email,
      role,
      telefone,
      observacoes,
      modulos_permitidos,
      ativo,
      atualizado_em: new Date().toISOString()
    }
    
    console.log('📝 Dados para atualização:', JSON.stringify(updateData, null, 2))
    
    const { data: usuarioAtualizado, error } = await adminClient
      .from('usuarios_bar')
      .update(updateData)
      .eq('id', usuarioId)
      .eq('bar_id', bar_id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar usuário:', error)
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar usuário', details: error.message },
        { status: 500 }
      )
    }

    if (!usuarioAtualizado) {
      console.error('❌ Usuário não encontrado ou não atualizado')
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado ou não pôde ser atualizado' },
        { status: 404 }
      )
    }

    console.log('✅ Usuário atualizado com sucesso:', usuarioAtualizado)
    
    return NextResponse.json({
      success: true,
      usuario: usuarioAtualizado
    })

  } catch (error) {
    console.error('❌ Erro na API de edição de usuário:', error)
    console.error('📋 Stack trace:', error instanceof Error ? error.stack : 'N/A')
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { bar_id } = body
    const usuarioId = params.id

    if (!bar_id || !usuarioId) {
      return NextResponse.json(
        { success: false, error: 'ID do usuário e bar_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Obter cliente administrativo
    const adminClient = await getAdminClient()

    // Buscar o usuário antes de excluir para pegar o user_id
    const { data: usuario, error: buscarError } = await adminClient
      .from('usuarios_bar')
      .select('user_id')
      .eq('id', usuarioId)
      .eq('bar_id', bar_id)
      .single()

    if (buscarError || !usuario) {
      console.error('❌ Erro ao buscar usuário:', buscarError)
      return NextResponse.json(
        { success: false, error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Excluir da tabela usuarios_bar
    const { error: excluirError } = await adminClient
      .from('usuarios_bar')
      .delete()
      .eq('id', usuarioId)
      .eq('bar_id', bar_id)

    if (excluirError) {
      console.error('❌ Erro ao excluir usuário da tabela:', excluirError)
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir usuário' },
        { status: 500 }
      )
    }

    // Excluir do Auth (opcional, pode manter para outros bares)
    try {
      await adminClient.auth.admin.deleteUser(usuario.user_id)
    } catch (authError) {
      console.warn('⚠️ Aviso: Não foi possível excluir usuário do Auth:', authError)
      // Não falha a operação, pois o usuário pode ter acesso a outros bares
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