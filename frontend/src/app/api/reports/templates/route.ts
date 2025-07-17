import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'
import { z } from 'zod'

// =====================================================
// SCHEMAS DE VALIDAá‡áƒO
// =====================================================

const TemplateRelatorioCriarSchema = z.object({
  nome: z.string().min(1).max(100),
  descricao: z.string().optional(),
  categoria: z.enum(['checklist', 'produtividade', 'compliance', 'custom']),
  modulo: z.string().default('checklists'),
  tipo_relatorio: z.enum(['tabular', 'dashboard', 'grafico', 'calendario']),
  configuracao_sql: z.string().min(1),
  configuracao_campos: z.record(z.any()),
  configuracao_filtros: z.record(z.any()),
  configuracao_visual: z.record(z.any()).optional(),
  formatos_suportados: z.array(z.enum(['pdf', 'excel', 'csv'])).default(['pdf', 'excel']),
  template_pdf: z.string().optional(),
  configuracao_excel: z.record(z.any()).optional(),
  publico: z.boolean().default(false),
  roles_permitidas: z.array(z.string()).default(['admin', 'financeiro'])
})

const FiltrosTemplatesSchema = z.object({
  categoria: z.string().optional(),
  modulo: z.string().optional(),
  tipo_relatorio: z.string().optional(),
  publico: z.boolean().optional(),
  busca: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

// =====================================================
// GET - LISTAR TEMPLATES DE RELATá“RIOS
// =====================================================
export async function GET(request: NextRequest) {
  try {
    // ðŸ” AUTENTICAá‡áƒO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuá¡rio ná£o autenticado')
    }

    const { searchParams } = new URL(request.url)
    const filtros: any = {}
    
    // Converter pará¢metros para tipos corretos
    for (const [key, value] of searchParams.entries()) {
      if (key === 'page' || key === 'limit') {
        filtros[key] = parseInt(value)
      } else if (key === 'publico') {
        filtros[key] = value === 'true'
      } else {
        filtros[key] = value
      }
    }
    
    const data = FiltrosTemplatesSchema.parse(filtros)
    const supabase = await getAdminClient()
    
    // Construir query base
    let query = supabase
      .from('relatorios_templates')
      .select(`
        *,
        criado_por_usuario:usuarios_bar!criado_por (nome, email)
      `)
      .eq('ativo', true)

    // Aplicar filtros de permissá£o
    if (user.role !== 'admin') {
      query = query.or(`publico.eq.true,roles_permitidas.cs.["${user.role}"]`)
    }

    // Aplicar filtros
    if (data.categoria) {
      query = query.eq('categoria', data.categoria)
    }

    if (data.modulo) {
      query = query.eq('modulo', data.modulo)
    }

    if (data.tipo_relatorio) {
      query = query.eq('tipo_relatorio', data.tipo_relatorio)
    }

    if (data.publico !== undefined) {
      query = query.eq('publico', data.publico)
    }

    if (data.busca) {
      query = query.or(`nome.ilike.%${data.busca}%,descricao.ilike.%${data.busca}%`)
    }

    // Buscar total para paginaá§á£o
    const { count } = await query

    // Buscar templates com paginaá§á£o
    const offset = (data.page - 1) * data.limit
    const { data: templates, error } = await query
      .order('criado_em', { ascending: false })
      .range(offset, offset + data.limit - 1)

    if (error) {
      console.error('Erro ao buscar templates:', error)
      return NextResponse.json({ 
        error: 'Erro ao buscar templates' 
      }, { status: 500 })
    }

    // Estatá­sticas rá¡pidas
    const { data: estatisticas } = await supabase
      .from('relatorios_templates')
      .select('categoria, tipo_relatorio, publico')
      .eq('ativo', true)

    const estatisticasProcessadas = {
      total: count || 0,
      por_categoria: {} as Record<string, number>,
      por_tipo: {} as Record<string, number>,
      publicos: estatisticas?.filter((t: any) => t.publico).length || 0,
      privados: estatisticas?.filter((t: any) => !t.publico).length || 0
    }

    // Processar estatá­sticas
    estatisticas?.forEach((template: any) => {
      estatisticasProcessadas.por_categoria[template.categoria] = 
        (estatisticasProcessadas.por_categoria[template.categoria] || 0) + 1
      
      estatisticasProcessadas.por_tipo[template.tipo_relatorio] = 
        (estatisticasProcessadas.por_tipo[template.tipo_relatorio] || 0) + 1
    })

    return NextResponse.json({
      success: true,
      data: {
        templates: templates || [],
        estatisticas: estatisticasProcessadas,
        paginacao: {
          page: data.page,
          limit: data.limit,
          total: count || 0,
          total_pages: Math.ceil((count || 0) / data.limit)
        }
      }
    })

  } catch (error: any) {
    console.error('Erro na API de listar templates:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Pará¢metros invá¡lidos',
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// =====================================================
// POST - CRIAR TEMPLATE DE RELATá“RIO
// =====================================================
export async function POST(request: NextRequest) {
  try {
    // ðŸ” AUTENTICAá‡áƒO
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuá¡rio ná£o autenticado')
    }

    // Verificar permissáµes (apenas admin e financeiro podem criar templates)
    if (!['admin', 'financeiro'].includes(user.role)) {
      return NextResponse.json({ 
        error: 'Sem permissá£o para criar templates de relatá³rios' 
      }, { status: 403 })
    }

    const body = await request.json()
    const data = TemplateRelatorioCriarSchema.parse(body)
    
    const supabase = await getAdminClient()

    // Verificar se já¡ existe template com o mesmo nome
    const { data: existente } = await supabase
      .from('relatorios_templates')
      .select('id')
      .eq('nome', data.nome)
      .eq('ativo', true)
      .single()

    if (existente) {
      return NextResponse.json({ 
        error: 'Já¡ existe um template com este nome' 
      }, { status: 400 })
    }

    // Validar SQL do template (bá¡sico)
    if (!data.configuracao_sql.toLowerCase().includes('select')) {
      return NextResponse.json({ 
        error: 'SQL do template deve conter ao menos um SELECT' 
      }, { status: 400 })
    }

    // Criar template
    const novoTemplate = {
      ...data,
      criado_por: user.user_id,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }

    const { data: template, error: createError } = await supabase
      .from('relatorios_templates')
      .insert(novoTemplate)
      .select()
      .single()

    if (createError) {
      console.error('Erro ao criar template:', createError)
      return NextResponse.json({ 
        error: 'Erro ao criar template' 
      }, { status: 500 })
    }

    console.log(`ðŸ“Š Template de relatá³rio criado: ${data.nome} (${data.categoria})`)

    return NextResponse.json({
      success: true,
      message: 'Template criado com sucesso',
      data: template
    })

  } catch (error: any) {
    console.error('Erro na API de criar template:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Dados invá¡lidos',
        details: error.errors 
      }, { status: 400 })
    }
    
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    }, { status: 500 })
  }
}

// =====================================================
// FUNá‡á•ES UTILITáRIAS
// =====================================================

async function obterTemplatesPorCategoria(categoria: string, userRole: string) {
  const supabase = await getAdminClient()
  
  let query = supabase
    .from('relatorios_templates')
    .select('id, nome, descricao, tipo_relatorio')
    .eq('categoria', categoria)
    .eq('ativo', true)

  // Aplicar filtros de permissá£o
  if (userRole !== 'admin') {
    query = query.or(`publico.eq.true,roles_permitidas.cs.["${userRole}"]`)
  }

  const { data, error } = await query.order('nome')

  if (error) {
    console.error('Erro ao buscar templates por categoria:', error)
    return []
  }

  return data || []
}

async function validarSqlTemplate(sql: string): Promise<{ valido: boolean, erro?: string }> {
  try {
    // Validaá§áµes bá¡sicas de seguraná§a
    const sqlLower = sql.toLowerCase()
    
    // Deve conter SELECT
    if (!sqlLower.includes('select')) {
      return { valido: false, erro: 'SQL deve conter ao menos um SELECT' }
    }

    // Ná£o deve conter comandos perigosos
    const comandosProibidos = ['drop', 'delete', 'update', 'insert', 'create', 'alter', 'truncate']
    for (const comando of comandosProibidos) {
      if (sqlLower.includes(comando)) {
        return { valido: false, erro: `Comando ná£o permitido: ${comando.toUpperCase()}` }
      }
    }

    // Deve referenciar $bar_id para seguraná§a multi-tenant
    if (!sql.includes('$bar_id')) {
      return { valido: false, erro: 'SQL deve incluir filtro por $bar_id para seguraná§a' }
    }

    return { valido: true }

  } catch (error) {
    return { valido: false, erro: 'Erro na validaá§á£o do SQL' }
  }
} 
