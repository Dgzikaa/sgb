import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bar_id = parseInt(searchParams.get('bar_id') || '3');
    const categoria = searchParams.get('categoria');
    const descricao = searchParams.get('descricao');
    const contagem_id = searchParams.get('contagem_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!categoria && !descricao && !contagem_id) {
      return NextResponse.json(
        { success: false, error: 'É necessário fornecer categoria/descricao ou contagem_id' },
        { status: 400 }
      );
    }

    // Se tiver contagem_id, buscar histórico específico
    if (contagem_id) {
      const { data, error } = await supabase
        .from('contagem_estoque_historico')
        .select('*')
        .eq('contagem_id', contagem_id)
        .order('data_alteracao', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        data,
        total: data?.length || 0
      });
    }

    // Buscar histórico por produto (categoria + descrição)
    // Primeiro buscar todas as contagens do produto
    let query = supabase
      .from('contagem_estoque_produtos')
      .select('id, data_contagem, estoque_fechado, estoque_flutuante, estoque_total, preco, valor_total, variacao_percentual, alerta_variacao, alerta_preenchimento, observacoes, created_at, updated_at')
      .eq('bar_id', bar_id);

    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    if (descricao) {
      query = query.eq('descricao', descricao);
    }

    const { data: contagens, error: erroContagens } = await query
      .order('data_contagem', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (erroContagens) throw erroContagens;

    // Para cada contagem, buscar seu histórico de alterações
    const historicoCompleto = [];
    
    for (const contagem of contagens || []) {
      const { data: historico } = await supabase
        .from('contagem_estoque_historico')
        .select('*')
        .eq('contagem_id', contagem.id)
        .order('data_alteracao', { ascending: false });

      historicoCompleto.push({
        ...contagem,
        alteracoes: historico || []
      });
    }

    // Calcular estatísticas do histórico
    const estatisticas = {
      total_contagens: contagens?.length || 0,
      total_alteracoes: historicoCompleto.reduce((sum, h) => sum + h.alteracoes.length, 0),
      primeira_contagem: contagens?.[contagens.length - 1]?.data_contagem || null,
      ultima_contagem: contagens?.[0]?.data_contagem || null,
      estoque_atual: contagens?.[0]?.estoque_total || 0,
      valor_atual: contagens?.[0]?.valor_total || 0,
      variacao_total_estoque: contagens && contagens.length > 1 
        ? parseFloat(contagens[0].estoque_total || '0') - parseFloat(contagens[contagens.length - 1].estoque_total || '0')
        : 0,
      alertas_total: contagens?.filter(c => c.alerta_variacao || c.alerta_preenchimento).length || 0
    };

    // Preparar dados para gráfico
    const dadosGrafico = contagens?.map(c => ({
      data: c.data_contagem,
      estoque_fechado: parseFloat(c.estoque_fechado || '0'),
      estoque_flutuante: parseFloat(c.estoque_flutuante || '0'),
      estoque_total: parseFloat(c.estoque_total || '0'),
      preco: parseFloat(c.preco || '0'),
      valor_total: parseFloat(c.valor_total || '0'),
      variacao: c.variacao_percentual,
      tem_alerta: c.alerta_variacao || c.alerta_preenchimento
    })).reverse(); // Inverter para ordem cronológica no gráfico

    return NextResponse.json({
      success: true,
      data: historicoCompleto,
      estatisticas,
      grafico: dadosGrafico,
      total: contagens?.length || 0
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar histórico:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar histórico' },
      { status: 500 }
    );
  }
}

