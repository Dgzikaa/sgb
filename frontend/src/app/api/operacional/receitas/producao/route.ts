import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bar_id,
      produto_codigo,
      produto_nome,
      funcionario,
      peso_bruto_g,
      peso_limpo_g,
      peso_final_g,
      quantidade_produzida,
      rendimento_teorico,
      rendimento_real,
      tempo_total_segundos,
      observacoes,
      fator_correcao,
      desvio,
      timestamp_iniciado,
      timestamp_finalizado,
    } = body;

    console.log(`🏭 Receitas: Salvando produção`, {
      bar_id,
      produto: produto_nome,
      funcionario,
      peso_bruto_g,
      peso_limpo_g,
      tempo: tempo_total_segundos,
    });

    // Validações básicas
    if (!bar_id || !produto_codigo || !funcionario || !peso_bruto_g) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Dados obrigatórios: bar_id, produto_codigo, funcionario, peso_bruto_g',
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

    // Buscar receita_id baseada no produto_codigo
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('id, codigo, nome')
      .eq('codigo', produto_codigo)
      .single();

    if (produtoError || !produto) {
      console.error('❌ Produto não encontrado:', produto_codigo);
      return NextResponse.json(
        {
          success: false,
          error: 'Produto não encontrado: ' + produto_codigo,
        },
        { status: 400 }
      );
    }

    // Calcular timestamps de forma inteligente
    const fimProducao = new Date(timestamp_finalizado || Date.now());
    let inicioProducao;

    if (timestamp_iniciado) {
      // Se foi informado timestamp de início, usar ele
      inicioProducao = new Date(timestamp_iniciado);
    } else if (tempo_total_segundos && tempo_total_segundos > 0) {
      // Se temos tempo total, calcular início = fim - tempo
      inicioProducao = new Date(
        fimProducao.getTime() - tempo_total_segundos * 1000
      );
    } else {
      // Caso padrão: início = agora - 1 minuto
      inicioProducao = new Date(fimProducao.getTime() - 60000);
    }

    // Adaptar dados para a estrutura da tabela producoes
    const dadosProducao = {
      bar_id,
      receita_codigo: produto.codigo,
      receita_nome: produto.nome,
      receita_categoria: null,
      criado_por_nome: null,
      inicio_producao: inicioProducao.toISOString(),
      fim_producao: fimProducao.toISOString(),
      peso_bruto_proteina: peso_bruto_g,
      peso_limpo_proteina: peso_limpo_g,
      rendimento_real: peso_final_g || rendimento_real,
      rendimento_esperado: rendimento_teorico || null,
      percentual_aderencia_receita: rendimento_teorico > 0
        ? (rendimento_real / rendimento_teorico) * 100
        : 0,
      observacoes: observacoes || '',
      status: 'finalizada',
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
      .select(
        `
        *,
        produtos!receita_id (
          codigo,
          nome,
          tipo_local
        )
      `
      )
      .eq('bar_id', barId)
      .order('fim_producao', { ascending: false })
      .limit(limite);

    // Filtro por data específica
    if (data) {
      const dataInicio = `${data}T00:00:00`;
      const dataFim = `${data}T23:59:59`;
      query = query
        .gte('fim_producao', dataInicio)
        .lte('fim_producao', dataFim);
    }

    // Filtros opcionais (adaptar para a nova estrutura)
    if (produtoCodigo) {
      // Buscar pelo ID do produto em vez do código
      const { data: produto } = await supabase
        .from('produtos')
        .select('id')
        .eq('codigo', produtoCodigo)
        .single();

      if (produto) {
        query = query.eq('receita_id', produto.id);
      }
    }

    const { data: producoes, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar histórico:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar dados',
        },
        { status: 500 }
      );
    }

    // Transformar dados para incluir informações do produto
    const producoesComProdutos =
      producoes?.map((producao: any) => ({
        ...producao,
        produto_codigo: producao.produtos?.codigo,
        produto_nome: producao.produtos?.nome,
        tipo_local: producao.produtos?.tipo_local,
      })) || [];

    return NextResponse.json({
      success: true,
      data: producoesComProdutos,
      total: producoesComProdutos.length,
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
