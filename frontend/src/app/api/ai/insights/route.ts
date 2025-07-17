import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { headers } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase-admin';

// Schema de validaá§á£o para filtros
const FilterInsightsSchema = z.object({
  tipo_insight: z.string().optional(),
  categoria: z.string().optional(),
  impacto: z.enum(['baixo', 'medio', 'alto', 'critico']).optional(),
  urgencia: z.enum(['baixa', 'media', 'alta', 'critica']).optional(),
  status: z.enum(['novo', 'lido', 'em_acao', 'resolvido', 'ignorado']).optional(),
  data_inicio: z.string().optional(),
  data_fim: z.string().optional(),
  confianca_minima: z.number().min(0).max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  order_by: z.enum(['created_at', 'confianca', 'impacto', 'urgencia']).default('created_at'),
  order_direction: z.enum(['asc', 'desc']).default('desc')
});

// Schema para atualizaá§á£o de insight
const UpdateInsightSchema = z.object({
  status: z.enum(['novo', 'lido', 'em_acao', 'resolvido', 'ignorado']).optional(),
  acao_tomada: z.string().optional(),
  usuario_avaliacao: z.number().min(1).max(5).optional(),
  usuario_feedback: z.string().optional(),
  util: z.boolean().optional()
});

// ========================================
// ðŸ§  GET /api/ai/insights
// ========================================
export async function GET(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao } = JSON.parse(userData);

    // Verificar permissáµes
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissá£o para acessar insights' }, { status: 403 });
    }

    // Parsear pará¢metros de consulta
    const { searchParams } = new URL(request.url);
    const rawParams = Object.fromEntries(searchParams.entries());
    
    // Converter tipos numá©ricos
    const processedParams = { ...rawParams };
    if (processedParams.page) processedParams.page = parseInt(processedParams.page);
    if (processedParams.limit) processedParams.limit = parseInt(processedParams.limit);
    if (processedParams.confianca_minima) processedParams.confianca_minima = parseFloat(processedParams.confianca_minima);

    const validatedParams = FilterInsightsSchema.parse(processedParams);

    // Criar cliente Supabase
    const supabase = createServiceRoleClient();

    // Construir query base
    let query = supabase
      .from('ai_insights')
      .select(`
        *,
        usuarios_bar!ai_insights_lido_por_fkey(nome)
      `)
      .eq('bar_id', bar_id);

    // Aplicar filtros
    if (validatedParams.tipo_insight) {
      query = query.eq('tipo_insight', validatedParams.tipo_insight);
    }
    if (validatedParams.categoria) {
      query = query.eq('categoria', validatedParams.categoria);
    }
    if (validatedParams.impacto) {
      query = query.eq('impacto', validatedParams.impacto);
    }
    if (validatedParams.urgencia) {
      query = query.eq('urgencia', validatedParams.urgencia);
    }
    if (validatedParams.status) {
      query = query.eq('status', validatedParams.status);
    }
    if (validatedParams.data_inicio) {
      query = query.gte('created_at', validatedParams.data_inicio);
    }
    if (validatedParams.data_fim) {
      query = query.lte('created_at', validatedParams.data_fim);
    }
    if (validatedParams.confianca_minima) {
      query = query.gte('confianca', validatedParams.confianca_minima);
    }

    // Aplicar ordenaá§á£o
    query = query.order(validatedParams.order_by, { 
      ascending: validatedParams.order_direction === 'asc' 
    });

    // Aplicar paginaá§á£o
    const offset = (validatedParams.page - 1) * validatedParams.limit;
    query = query.range(offset, offset + validatedParams.limit - 1);

    const { data: insights, error, count } = await supabase
      .from('ai_insights')
      .select('*', { count: 'exact' })
      .eq('bar_id', bar_id);

    if (error) {
      console.error('Erro ao buscar insights:', error);
      return NextResponse.json({ error: 'Erro ao buscar insights' }, { status: 500 });
    }

    // Calcular estatá­sticas
    const stats = {
      total: count || 0,
      por_status: {
        novo: insights?.filter((i) => i.status === 'novo').length || 0,
        lido: insights?.filter((i) => i.status === 'lido').length || 0,
        em_acao: insights?.filter((i) => i.status === 'em_acao').length || 0,
        resolvido: insights?.filter((i) => i.status === 'resolvido').length || 0,
        ignorado: insights?.filter((i) => i.status === 'ignorado').length || 0
      },
      por_impacto: {
        critico: insights?.filter((i) => i.impacto === 'critico').length || 0,
        alto: insights?.filter((i) => i.impacto === 'alto').length || 0,
        medio: insights?.filter((i) => i.impacto === 'medio').length || 0,
        baixo: insights?.filter((i) => i.impacto === 'baixo').length || 0
      }
    };

    return NextResponse.json({
      success: true,
      data: insights || [],
      pagination: {
        page: validatedParams.page,
        limit: validatedParams.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / validatedParams.limit)
      },
      stats
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ 
        error: 'Pará¢metros invá¡lidos',
        details: error.errors 
      }, { status: 400 });
    }
    
    console.error('Erro na API de insights:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ§  PUT /api/ai/insights
// ========================================
export async function PUT(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao, usuario_id } = JSON.parse(userData);

    // Verificar permissáµes
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissá£o para atualizar insights' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do insight á© obrigatá³rio' }, { status: 400 });
    }

    const validatedData = UpdateInsightSchema.parse(updateData);

    // Verificar se insight existe e pertence ao bar
    const supabase = createServiceRoleClient();
    const { data: existing, error: fetchError } = await supabase
      .from('ai_insights')
      .select('id, status')
      .eq('id', id)
      .eq('bar_id', bar_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Insight ná£o encontrado' }, { status: 404 });
    }

    // Preparar dados para atualizaá§á£o
    const updatePayload = { ...validatedData };

    // Se mudando status para 'lido' pela primeira vez
    if (validatedData.status === 'lido' && existing.status === 'novo') {
      updatePayload.lido_por = usuario_id;
      updatePayload.lido_em = new Date().toISOString();
    }

    // Atualizar insight
    const { data: insight, error } = await supabase
      .from('ai_insights')
      .update(updatePayload)
      .eq('id', id)
      .eq('bar_id', bar_id)
      .select(`
        *,
        usuarios_bar!ai_insights_lido_por_fkey(nome)
      `)
      .single();

    if (error) {
      console.error('Erro ao atualizar insight:', error);
      return NextResponse.json({ error: 'Erro ao atualizar insight' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: insight,
      message: 'Insight atualizado com sucesso'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Dados invá¡lidos',
        details: error.errors
      }, { status: 400 });
    }

    console.error('Erro na API de insights:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

// ========================================
// ðŸ§  POST /api/ai/insights (Marcar máºltiplos como lidos)
// ========================================
export async function POST(request: NextRequest) {
  try {
    const headersList = headers();
    const userData = headersList.get('x-user-data');
    
    if (!userData) {
      return NextResponse.json({ error: 'Usuá¡rio ná£o autenticado' }, { status: 401 });
    }

    const { bar_id, permissao, usuario_id } = JSON.parse(userData);

    // Verificar permissáµes
    if (!['financeiro', 'admin'].includes(permissao)) {
      return NextResponse.json({ error: 'Sem permissá£o para atualizar insights' }, { status: 403 });
    }

    const body = await request.json();
    const { action, ids } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ 
        error: 'Aá§á£o e lista de IDs sá£o obrigatá³rios' 
      }, { status: 400 });
    }

    let updateData = {};
    let successMessage = '';

    switch (action) {
      case 'mark_read':
        updateData = {
          status: 'lido',
          lido_por: usuario_id,
          lido_em: new Date().toISOString()
        };
        successMessage = 'Insights marcados como lidos';
        break;
      
      case 'mark_resolved':
        updateData = { status: 'resolvido' };
        successMessage = 'Insights marcados como resolvidos';
        break;
      
      case 'mark_ignored':
        updateData = { status: 'ignorado' };
        successMessage = 'Insights marcados como ignorados';
        break;
      
      default:
        return NextResponse.json({ error: 'Aá§á£o invá¡lida' }, { status: 400 });
    }

    // Atualizar máºltiplos insights
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('ai_insights')
      .update(updateData)
      .in('id', ids)
      .eq('bar_id', bar_id)
      .select('id, titulo, status');

    if (error) {
      console.error('Erro ao atualizar insights:', error);
      return NextResponse.json({ error: 'Erro ao atualizar insights' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: successMessage,
      updated_count: data?.length || 0
    });

  } catch (error) {
    console.error('Erro na API de insights:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
