import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * API de Histórico do Calendário Operacional
 * Retorna todas as mudanças feitas no calendário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '3');
    const limit = parseInt(searchParams.get('limit') || '100');
    const data = searchParams.get('data'); // Filtrar por data específica
    const tipo_acao = searchParams.get('tipo_acao'); // Filtrar por tipo

    console.log(`📜 Buscando histórico do calendário (bar: ${barId}, limit: ${limit})`);

    let query = supabase
      .from('calendario_historico')
      .select('*')
      .eq('bar_id', barId)
      .order('criado_em', { ascending: false })
      .limit(limit);

    if (data) {
      query = query.eq('data', data);
    }

    if (tipo_acao) {
      query = query.eq('tipo_acao', tipo_acao);
    }

    const { data: historico, error } = await query;

    if (error) {
      console.error('Erro ao buscar histórico:', error);
      throw error;
    }

    // Agrupar por dia
    const porDia = new Map();
    historico?.forEach(item => {
      if (!porDia.has(item.criado_em.split('T')[0])) {
        porDia.set(item.criado_em.split('T')[0], []);
      }
      porDia.get(item.criado_em.split('T')[0]).push(item);
    });

    // Estatísticas
    const stats = {
      total_mudancas: historico?.length || 0,
      por_tipo: {
        create: historico?.filter(h => h.tipo_acao === 'create').length || 0,
        update: historico?.filter(h => h.tipo_acao === 'update').length || 0,
        delete: historico?.filter(h => h.tipo_acao === 'delete').length || 0,
        bulk_update: historico?.filter(h => h.tipo_acao === 'bulk_update').length || 0
      },
      total_dias_afetados: historico?.reduce((sum, h) => sum + (h.qtd_dias_afetados || 1), 0) || 0,
      usuarios_unicos: [...new Set(historico?.map(h => h.usuario_nome).filter(Boolean))].length
    };

    return NextResponse.json({
      success: true,
      data: {
        historico: historico || [],
        stats,
        por_dia: Array.from(porDia.entries()).map(([dia, mudancas]) => ({
          dia,
          qtd_mudancas: mudancas.length
        }))
      }
    });

  } catch (error) {
    console.error('Erro na API de histórico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

