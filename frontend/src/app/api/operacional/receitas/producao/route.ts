import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bar_id,
      receita_codigo,
      receita_nome,
      receita_categoria,
      criado_por_nome,
      inicio_producao,
      fim_producao,
      peso_bruto_proteina,
      peso_limpo_proteina,
      rendimento_real,
      rendimento_esperado,
      percentual_aderencia_receita,
      observacoes,
      insumo_chefe_id,
      insumo_chefe_nome,
      peso_insumo_chefe,
      status,
      // Campos antigos (compatibilidade)
      produto_codigo,
      produto_nome,
      funcionario,
      peso_bruto_g,
      peso_limpo_g,
      peso_final_g,
      rendimento_teorico,
      timestamp_iniciado,
      timestamp_finalizado,
    } = body;

    console.log(`🏭 Receitas: Salvando produção`, {
      bar_id,
      receita: receita_nome || produto_nome,
      criado_por: criado_por_nome || funcionario,
    });

    // Validações básicas
    if (!bar_id || (!receita_codigo && !produto_codigo) || (!rendimento_real && !peso_final_g)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Dados obrigatórios: bar_id, receita_codigo, rendimento_real',
        },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('❌ Erro ao conectar com Supabase');
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao conectar com banco',
        },
        { status: 500 }
      );
    }

    // Adaptar dados para a estrutura da tabela producoes
    const dadosProducao = {
      bar_id,
      receita_codigo: receita_codigo || produto_codigo,
      receita_nome: receita_nome || produto_nome,
      receita_categoria: receita_categoria || null,
      criado_por_nome: criado_por_nome || funcionario || null,
      inicio_producao: inicio_producao || timestamp_iniciado || new Date(Date.now() - 60000).toISOString(),
      fim_producao: fim_producao || timestamp_finalizado || new Date().toISOString(),
      peso_bruto_proteina: peso_bruto_proteina || peso_bruto_g || null,
      peso_limpo_proteina: peso_limpo_proteina || peso_limpo_g || null,
      rendimento_real: rendimento_real || peso_final_g,
      rendimento_esperado: rendimento_esperado || rendimento_teorico || null,
      percentual_aderencia_receita: percentual_aderencia_receita || null,
      observacoes: observacoes || '',
      insumo_chefe_id: insumo_chefe_id || null,
      insumo_chefe_nome: insumo_chefe_nome || null,
      peso_insumo_chefe: peso_insumo_chefe || null,
      status: status || 'concluido',
    };

    console.log('📊 Dados adaptados para tabela producoes:', dadosProducao);

    const { data, error } = await supabase
      .from('producoes')
      .insert([dadosProducao])
      .select();

    if (error) {
      console.error('❌ Erro ao salvar produção:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao salvar dados de produção: ' + error.message,
        },
        { status: 500 }
      );
    }

    console.log(`✅ Produção salva com ID: ${data[0]?.id}`);

    return NextResponse.json({
      success: true,
      data: data[0],
      message: 'Produção registrada com sucesso!',
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// API para buscar histórico de produções
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '3');
    const produtoCodigo = searchParams.get('produto_codigo');
    const funcionario = searchParams.get('funcionario');
    const data = searchParams.get('data'); // Novo parâmetro de data
    const limite = parseInt(searchParams.get('limite') || '50');

    console.log(`📊 Receitas: Buscando histórico de produções`, {
      barId,
      produtoCodigo,
      funcionario,
      data,
      limite,
    });

    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    let query = supabase
      .from('producoes')
      .select('*')
      .eq('bar_id', barId)
      .order('inicio_producao', { ascending: false })
      .limit(limite);

    // Filtro por data específica
    if (data) {
      const dataInicio = `${data}T00:00:00`;
      const dataFim = `${data}T23:59:59`;
      query = query
        .gte('inicio_producao', dataInicio)
        .lte('inicio_producao', dataFim);
    }

    // Filtros opcionais
    if (produtoCodigo) {
      query = query.eq('receita_codigo', produtoCodigo);
    }

    if (funcionario) {
      query = query.eq('criado_por_nome', funcionario);
    }

    const { data: producoes, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar dados: ' + error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: producoes || [],
      total: producoes?.length || 0,
    });
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor',
      },
      { status: 500 }
    );
  }
}
