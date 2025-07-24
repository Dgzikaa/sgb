import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, checkPermission, authErrorResponse, permissionErrorResponse } from '@/middleware/auth'
import { z } from 'zod'

// =====================================================
// SCHEMA DE VALIDAÇÃO
// =====================================================

const RollbackSchema = z.object({
  versao_destino: z.number().min(1),
  comentario: z.string().optional().default('Rollback automático')
})

// =====================================================
// POST - FAZER ROLLBACK PARA VERSÃO ANTERIOR
// =====================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 🔐 AUTENTICAÇÃO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    // 🔒 PERMISSÕES - Verificar se pode editar checklists
    if (!checkPermission(user, { module: 'checklists', action: 'write' })) {
      return permissionErrorResponse('Sem permissão para fazer rollback de checklists')
    }

    const { id: checklistId } = await params
    const body = await request.json()
    const { versao_destino, comentario } = RollbackSchema.parse(body)
    
    const supabase = await getAdminClient()
    
    // Verificar se checklist existe e pertence ao bar
    const { data: checklistAtual, error: fetchError } = await supabase
      .from('checklists')
      .select('*')
      .eq('id', checklistId)
      .eq('bar_id', user.bar_id)
      .single()

    if (fetchError || !checklistAtual) {
      return NextResponse.json({ error: 'Checklist não encontrado' }, { status: 404 })
    }

    // Buscar a versão de destino no histórico
    const { data: versaoDestino, error: versaoError } = await supabase
      .from('checklist_historico')
      .select('*')
      .eq('checklist_id', checklistId)
      .eq('versao', versao_destino)
      .single()

    if (versaoError || !versaoDestino) {
      return NextResponse.json({ 
        error: `Versão ${versao_destino} não encontrada no histórico` 
      }, { status: 404 })
    }

    // Verificar se não é um rollback desnecessário
    if (checklistAtual.versao === versao_destino) {
      return NextResponse.json({
        success: true,
        message: 'Checklist já está na versão solicitada',
        data: checklistAtual
      })
    }

    // Buscar próximo número de versão para o rollback
    const { data: ultimaVersao } = await supabase
      .from('checklist_historico')
      .select('versao')
      .eq('checklist_id', checklistId)
      .order('versao', { ascending: false })
      .limit(1)
      .single()

    const novaVersao = (ultimaVersao?.versao || 0) + 1

    // Salvar estado atual no histórico ANTES do rollback
    const { error: historicoError } = await supabase
      .from('checklist_historico')
      .insert({
        checklist_id: checklistId,
        versao: novaVersao,
        nome_anterior: checklistAtual.nome,
        estrutura_anterior: checklistAtual.estrutura,
        mudancas_detectadas: [`Rollback para versão ${versao_destino}`],
        comentario: `${comentario} (rollback v${checklistAtual.versao} → v${versao_destino})`,
        usuario_id: user.user_id,
        tipo_mudanca: 'rollback'
      })

    if (historicoError) {
      console.error('Erro ao salvar histórico do rollback:', historicoError)
      return NextResponse.json({ error: 'Erro ao salvar histórico' }, { status: 500 })
    }

    // Restaurar dados da versão de destino
    const dadosRollback = {
      nome: versaoDestino.nome_anterior,
      estrutura: versaoDestino.estrutura_anterior,
      versao: novaVersao,
      atualizado_em: new Date().toISOString(),
      atualizado_por: user.user_id
    }

    // Aplicar o rollback
    const { data: checklistRollback, error: rollbackError } = await supabase
      .from('checklists')
      .update(dadosRollback)
      .eq('id', checklistId)
      .eq('bar_id', user.bar_id)
      .select(`
        *,
        criado_por:usuarios_bar!criado_por (nome, email),
        atualizado_por:usuarios_bar!atualizado_por (nome, email)
      `)
      .single()

    if (rollbackError) {
      console.error('Erro ao fazer rollback:', rollbackError)
      return NextResponse.json({ error: 'Erro ao fazer rollback' }, { status: 500 })
    }

    console.log(`🔄 Rollback executado: ${checklistRollback.nome} (v${checklistAtual.versao} → v${versao_destino} → v${novaVersao})`)

    return NextResponse.json({
      success: true,
      message: `Rollback executado com sucesso para versão ${versao_destino}`,
      data: checklistRollback,
      rollback_info: {
        versao_anterior: checklistAtual.versao,
        versao_destino: versao_destino,
        nova_versao: novaVersao,
        comentario
      }
    })

  } catch (error: unknown) {
    console.error('Erro na API de rollback:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados inválidos',
        details: error.issues 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// =====================================================
// GET - LISTAR VERSÕES DISPONÍVEIS PARA ROLLBACK
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

    const { id: checklistId } = await params
    const supabase = await getAdminClient()
    
    // Verificar se checklist existe e pertence ao bar
    const { data: checklist, error: checklistError } = await supabase
      .from('checklists')
      .select('nome, versao')
      .eq('id', checklistId)
      .eq('bar_id', user.bar_id)
      .single()

    if (checklistError || !checklist) {
      return NextResponse.json({ error: 'Checklist não encontrado' }, { status: 404 })
    }

    // Buscar todas as versões no histórico
    const { data: versoes, error: versoesError } = await supabase
      .from('checklist_historico')
      .select(`
        versao,
        nome_anterior,
        mudancas_detectadas,
        comentario,
        criado_em,
        tipo_mudanca,
        usuario:usuarios_bar!usuario_id (nome, email)
      `)
      .eq('checklist_id', checklistId)
      .neq('versao', 0) // Excluir marcadores especiais
      .order('versao', { ascending: false })

    if (versoesError) {
      console.error('Erro ao buscar versões:', versoesError)
      return NextResponse.json({ error: 'Erro ao buscar histórico' }, { status: 500 })
    }

    // Processar versões para rollback
    const versoesDisponiveis = versoes?.map((versao: any) => ({
      versao: versao.versao,
      nome: versao.nome_anterior,
      mudancas: versao.mudancas_detectadas || [],
      comentario: versao.comentario,
      data: versao.criado_em,
      tipo: versao.tipo_mudanca,
      usuario: versao.usuario?.nome || 'Sistema',
      pode_rollback: versao.versao < checklist.versao,
      e_versao_atual: versao.versao === checklist.versao
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        checklist_atual: {
          nome: checklist.nome,
          versao_atual: checklist.versao
        },
        versoes_disponiveis: versoesDisponiveis,
        total_versoes: versoesDisponiveis.length
      }
    })

  } catch (error: unknown) {
    console.error('Erro na API de versões para rollback:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 