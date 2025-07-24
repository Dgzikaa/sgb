import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse, AuthenticatedUser } from '@/middleware/auth'
import { z } from 'zod'

// =====================================================
// SCHEMAS DE VALIDAÇÃO
// =====================================================

const AtualizarNotificacaoSchema = z.object({
  status: z.enum(['lida', 'descartada']).optional(),
  dados_extras: z.record(z.string(), z.any()).optional()
})

// =====================================================
// GET - BUSCAR NOTIFICAÇÃO ESPECÍFICA
// =====================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const { id: notificationId } = await params
    const supabase = await getAdminClient()
    
    // Buscar notificação específica
    const { data: notificacao, error } = await supabase
      .from('notificacoes')
      .select(`
        *,
        usuario:usuarios_bar!usuario_id (nome, email, role),
        logs:notificacoes_logs (
          canal, status, tentativa, tentado_em, erro_detalhes
        )
      `)
      .eq('id', notificationId)
      .eq('bar_id', user.bar_id)
      .single()

    if (error) {
      console.error('Erro ao buscar notificação:', error)
      return NextResponse.json({ 
        error: 'Notificação não encontrada' 
      }, { status: 404 })
    }

    // Verificar se o usuário tem acesso a esta notificação
    const temAcesso = notificacao.usuario_id === user.user_id || 
                     notificacao.role_alvo === user.role ||
                     user.role === 'admin'

    if (!temAcesso) {
      return NextResponse.json({ 
        error: 'Sem permissão para acessar esta notificação' 
      }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: notificacao
    })

  } catch (error: unknown) {
    console.error('Erro na API de buscar notificação:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: errorMessage 
    }, { status: 500 })
  }
}

// =====================================================
// PUT - ATUALIZAR NOTIFICAÇÃO (MARCAR COMO LIDA)
// =====================================================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const { id: notificationId } = await params
    const body = await request.json()
    const data = AtualizarNotificacaoSchema.parse(body)
    
    const supabase = await getAdminClient()
    
    // Buscar notificação atual
    const { data: notificacaoAtual, error: fetchError } = await supabase
      .from('notificacoes')
      .select('usuario_id, role_alvo, status')
      .eq('id', notificationId)
      .eq('bar_id', user.bar_id)
      .single()

    if (fetchError || !notificacaoAtual) {
      return NextResponse.json({ 
        error: 'Notificação não encontrada' 
      }, { status: 404 })
    }

    // Verificar permissões
    const temAcesso = notificacaoAtual.usuario_id === user.user_id || 
                     notificacaoAtual.role_alvo === user.role ||
                     user.role === 'admin'

    if (!temAcesso) {
      return NextResponse.json({ 
        error: 'Sem permissão para atualizar esta notificação' 
      }, { status: 403 })
    }

    // Preparar dados de atualização
    const dadosAtualizacao: Record<string, unknown> = {}

    if (data.status) {
      dadosAtualizacao.status = data.status
      
      if (data.status === 'lida') {
        dadosAtualizacao.lida_em = new Date().toISOString()
      }
    }

    if (data.dados_extras) {
      dadosAtualizacao.dados_extras = {
        ...notificacaoAtual.dados_extras,
        ...data.dados_extras
      }
    }

    // Atualizar notificação
    const { data: notificacaoAtualizada, error: updateError } = await supabase
      .from('notificacoes')
      .update(dadosAtualizacao)
      .eq('id', notificationId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar notificação:', updateError)
      return NextResponse.json({ 
        error: 'Erro ao atualizar notificação' 
      }, { status: 500 })
    }

    console.log(`📱 Notificação atualizada: ${notificationId} - ${data.status}`)

    return NextResponse.json({
      success: true,
      message: 'Notificação atualizada com sucesso',
      data: notificacaoAtualizada
    })

  } catch (error: unknown) {
    console.error('Erro na API de atualizar notificação:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: error.issues 
      }, { status: 400 })
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: errorMessage 
    }, { status: 500 })
  }
}

// =====================================================
// DELETE - EXCLUIR NOTIFICAÇÃO
// =====================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const { id: notificationId } = await params
    const supabase = await getAdminClient()
    
    // Buscar notificação
    const { data: notificacao, error: fetchError } = await supabase
      .from('notificacoes')
      .select('usuario_id, role_alvo, titulo')
      .eq('id', notificationId)
      .eq('bar_id', user.bar_id)
      .single()

    if (fetchError || !notificacao) {
      return NextResponse.json({ 
        error: 'Notificação não encontrada' 
      }, { status: 404 })
    }

    // Verificar permissões (apenas admin ou próprio usuário pode excluir)
    const podeExcluir = user.role === 'admin' || 
                       notificacao.usuario_id === user.user_id

    if (!podeExcluir) {
      return NextResponse.json({ 
        error: 'Sem permissão para excluir esta notificação' 
      }, { status: 403 })
    }

    // Excluir notificação (hard delete por enquanto)
    const { error: deleteError } = await supabase
      .from('notificacoes')
      .delete()
      .eq('id', notificationId)

    if (deleteError) {
      console.error('Erro ao excluir notificação:', deleteError)
      return NextResponse.json({ 
        error: 'Erro ao excluir notificação' 
      }, { status: 500 })
    }

    console.log(`🗑️ Notificação excluída: ${notificationId} - ${notificacao.titulo}`)

    return NextResponse.json({
      success: true,
      message: 'Notificação excluída com sucesso'
    })

  } catch (error: unknown) {
    console.error('Erro na API de excluir notificação:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: errorMessage 
    }, { status: 500 })
  }
}

// =====================================================
// ENDPOINTS ESPECIAIS
// =====================================================

// Endpoint para marcar múltiplas notificações como lidas
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    // notificationId removido - não utilizado
    await params

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'mark_all_read') {
      return await marcarTodasComoLidas(user, request)
    }

    if (action === 'clear_old') {
      return await limparNotificacoesAntigas(user, request)
    }

    return NextResponse.json({ 
      error: 'Ação não suportada' 
    }, { status: 400 })

  } catch (error: unknown) {
    console.error('Erro na API PATCH de notificações:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: errorMessage 
    }, { status: 500 })
  }
}

// =====================================================
// FUNÇÕES AUXILIARES
// =====================================================

async function marcarTodasComoLidas(user: AuthenticatedUser, request: NextRequest) {
  const supabase = await getAdminClient()
  
  const { searchParams } = new URL(request.url)
  const modulo = searchParams.get('modulo')
  
  let query = supabase
    .from('notificacoes')
    .update({ 
      status: 'lida', 
      lida_em: new Date().toISOString() 
    })
    .eq('bar_id', user.bar_id)
    .in('status', ['pendente', 'enviada'])
    .or(`usuario_id.eq.${user.user_id},role_alvo.eq.${user.role}`)

  if (modulo) {
    query = query.eq('modulo', modulo)
  }

  const { count, error } = await query

  if (error) {
    console.error('Erro ao marcar todas como lidas:', error)
    return NextResponse.json({ 
      error: 'Erro ao marcar notificações como lidas' 
    }, { status: 500 })
  }

  console.log(`📱 ${count} notificações marcadas como lidas para usuário ${user.user_id}`)

  return NextResponse.json({
    success: true,
    message: `${count} notificações marcadas como lidas`,
    count
  })
}

async function limparNotificacoesAntigas(user: AuthenticatedUser, request: NextRequest) {
  const supabase = await getAdminClient()
  
  const { searchParams } = new URL(request.url)
  const dias = parseInt(searchParams.get('dias') || '7')
  
  const dataLimite = new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString()
  
  const { count, error } = await supabase
    .from('notificacoes')
    .delete()
    .eq('bar_id', user.bar_id)
    .eq('status', 'lida')
    .or(`usuario_id.eq.${user.user_id},role_alvo.eq.${user.role}`)
    .lt('lida_em', dataLimite)

  if (error) {
    console.error('Erro ao limpar notificações antigas:', error)
    return NextResponse.json({ 
      error: 'Erro ao limpar notificações antigas' 
    }, { status: 500 })
  }

  console.log(`🧹 ${count} notificações antigas removidas para usuário ${user.user_id}`)

  return NextResponse.json({
    success: true,
    message: `${count} notificações antigas removidas`,
    count
  })
} 