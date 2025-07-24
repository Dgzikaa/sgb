import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, checkPermission, authErrorResponse, permissionErrorResponse } from '@/middleware/auth'
import { z } from 'zod'

// =====================================================
// SCHEMA DE VALIDAÇÃO PARA UPDATE
// =====================================================

const TemplateUpdateSchema = z.object({
  nome: z.string().min(1).max(255).optional(),
  descricao: z.string().optional(),
  categoria: z.enum(['limpeza', 'seguranca', 'qualidade', 'manutencao', 'abertura', 'fechamento', 'auditoria', 'geral']).optional(),
  setor: z.string().min(1).optional(),
  tipo: z.enum(['abertura', 'fechamento', 'manutencao', 'qualidade', 'seguranca', 'limpeza', 'auditoria']).optional(),
  frequencia: z.enum(['diaria', 'semanal', 'quinzenal', 'mensal', 'bimestral', 'trimestral', 'conforme_necessario']).optional(),
  tempo_estimado: z.number().min(1).max(480).optional(),
  publico: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  estrutura: z.object({
    secoes: z.array(z.object({
      nome: z.string(),
      descricao: z.string().optional(),
      cor: z.string().default('bg-blue-500'),
      ordem: z.number(),
      itens: z.array(z.object({
        titulo: z.string(),
        descricao: z.string().optional(),
        tipo: z.enum(['texto', 'numero', 'sim_nao', 'data', 'assinatura', 'foto_camera', 'foto_upload', 'avaliacao']),
        obrigatorio: z.boolean().default(false),
        ordem: z.number(),
        opcoes: z.object({}).optional(),
        condicional: z.object({
          dependeDe: z.string(),
          valor: z.any()
        }).optional(),
        validacao: z.object({}).optional()
      }))
    }))
  }).optional()
})

// =====================================================
// GET - BUSCAR TEMPLATE POR ID
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

    const { id: templateId } = await params
    const supabase = await getAdminClient()
    
    // Buscar template com detalhes completos
    const { data: template, error } = await supabase
      .from('checklist_templates')
      .select(`
        *,
        criado_por:usuarios_bar!criado_por (nome, email),
        template_tags (
          template_tags (id, nome, cor)
        )
      `)
      .eq('id', templateId)
      .single()

    if (error) {
      console.error('Erro ao buscar template:', error)
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Verificar se usuário tem acesso ao template
    if (!template.publico && template.bar_id !== user.bar_id) {
      return permissionErrorResponse('Sem permissão para acessar este template')
    }

    // Buscar estatísticas de uso
    const { data: statsData } = await supabase
      .from('checklists')
      .select('id, status, criado_em')
      .eq('template_origem', templateId)

    const estatisticas = {
      total_usos: statsData?.length || 0,
      usos_completados: statsData?.filter((item: Record<string, unknown>) => item.status === 'completado').length || 0,
      usos_em_andamento: statsData?.filter((item: Record<string, unknown>) => item.status === 'em_andamento').length || 0,
      ultimo_uso: statsData?.[0]?.criado_em || null
    }

    return NextResponse.json({
      success: true,
      data: {
        ...template,
        estatisticas
      }
    })

  } catch (error: unknown) {
    console.error('Erro na API de template GET:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: errorMessage 
    }, { status: 500 })
  }
}

// =====================================================
// PUT - ATUALIZAR TEMPLATE
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

    // 🔒 PERMISSÕES - Verificar se pode editar templates
    if (!checkPermission(user, { module: 'checklists', action: 'write' })) {
      return permissionErrorResponse('Sem permissão para editar templates')
    }

    const { id: templateId } = await params
    const body = await request.json()
    const data = TemplateUpdateSchema.parse(body)
    
    const supabase = await getAdminClient()
    
    // Verificar se template existe e se pode ser editado
    const { data: template } = await supabase
      .from('checklist_templates')
      .select('id, nome, predefinido, publico, bar_id, criado_por')
      .eq('id', templateId)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Não permitir editar templates predefinidos do sistema
    if (template.predefinido) {
      return NextResponse.json({ 
        error: 'Templates predefinidos do sistema não podem ser editados' 
      }, { status: 403 })
    }

    // Verificar permissões
    if (template.publico) {
      // Template público só pode ser editado por admin
      if (!checkPermission(user, { module: 'checklists', action: 'admin' })) {
        return permissionErrorResponse('Apenas administradores podem editar templates públicos')
      }
    } else {
      // Template privado só pode ser editado pelo criador ou admin do bar
      if (template.criado_por !== user.user_id && template.bar_id !== user.bar_id) {
        return permissionErrorResponse('Sem permissão para editar este template')
      }
    }

    // Verificar se mudança de nome não conflita
    if (data.nome && data.nome !== template.nome) {
      const { data: existente } = await supabase
        .from('checklist_templates')
        .select('id')
        .eq('nome', data.nome)
        .eq('bar_id', template.publico ? null : user.bar_id)
        .neq('id', templateId)
        .single()

      if (existente) {
        return NextResponse.json({ 
          error: 'Já existe um template com este nome' 
        }, { status: 400 })
      }
    }

    // Preparar dados para atualização
    const updateData: Record<string, unknown> = {
      ...data,
      atualizado_em: new Date().toISOString()
    }

    // Remover tags do updateData - será tratado separadamente
    const tags = updateData.tags
    delete updateData.tags

    // Atualizar template
    const { data: templateAtualizado, error: updateError } = await supabase
      .from('checklist_templates')
      .update(updateData)
      .eq('id', templateId)
      .select()
      .single()

    if (updateError) {
      console.error('Erro ao atualizar template:', updateError)
      return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 })
    }

    // Atualizar tags se fornecidas
    if (tags !== undefined) {
      // Remover todas as tags existentes
      await supabase
        .from('checklist_tags')
        .delete()
        .eq('template_id', templateId)

      // Adicionar novas tags
      if (tags.length > 0) {
        for (const tagNome of tags) {
          // Buscar ou criar tag
          let { data: tag } = await supabase
            .from('template_tags')
            .select('id')
            .eq('nome', tagNome)
            .single()

          if (!tag) {
            const { data: novaTag } = await supabase
              .from('template_tags')
              .insert({ nome: tagNome })
              .select()
              .single()
            tag = novaTag
          }

          if (tag) {
            // Associar tag ao template
            await supabase
              .from('checklist_tags')
              .insert({
                template_id: templateId,
                tag_id: tag.id
              })
          }
        }
      }
    }

    console.log('✅ Template atualizado:', templateAtualizado.nome)

    return NextResponse.json({
      success: true,
      message: 'Template atualizado com sucesso',
      data: templateAtualizado
    })

  } catch (error: unknown) {
    console.error('Erro na API de template PUT:', error)
    
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
// DELETE - REMOVER TEMPLATE
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

    const { id: templateId } = await params
    const supabase = await getAdminClient()
    
    // Verificar se template existe e se pode ser excluído
    const { data: template } = await supabase
      .from('checklist_templates')
      .select('id, nome, predefinido, publico, bar_id, criado_por')
      .eq('id', templateId)
      .single()

    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }

    // Não permitir deletar templates predefinidos do sistema
    if (template.predefinido) {
      return NextResponse.json({ 
        error: 'Templates predefinidos do sistema não podem ser removidos' 
      }, { status: 403 })
    }

    // Verificar permissões
    if (template.publico) {
      // Template público só pode ser deletado por admin
      if (!checkPermission(user, { module: 'checklists', action: 'admin' })) {
        return permissionErrorResponse('Apenas administradores podem deletar templates públicos')
      }
    } else {
      // Template privado só pode ser deletado pelo criador ou admin do bar
      if (template.criado_por !== user.user_id && template.bar_id !== user.bar_id) {
        return permissionErrorResponse('Sem permissão para deletar este template')
      }
    }

    // Verificar se template está sendo usado
    const { data: checklists } = await supabase
      .from('checklists')
      .select('id')
      .eq('template_origem', templateId)
      .limit(1)

    if (checklists && checklists.length > 0) {
      return NextResponse.json({ 
        error: 'Template não pode ser removido pois está sendo usado por checklists existentes' 
      }, { status: 400 })
    }

    // Deletar template (cascade remove tags automaticamente)
    const { error: deleteError } = await supabase
      .from('checklist_templates')
      .delete()
      .eq('id', templateId)

    if (deleteError) {
      console.error('Erro ao deletar template:', deleteError)
      return NextResponse.json({ error: 'Erro ao deletar template' }, { status: 500 })
    }

    console.log('✅ Template deletado:', template.nome)

    return NextResponse.json({
      success: true,
      message: 'Template deletado com sucesso'
    })

  } catch (error: unknown) {
    console.error('Erro na API de template DELETE:', error)
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: errorMessage 
    }, { status: 500 })
  }
} 