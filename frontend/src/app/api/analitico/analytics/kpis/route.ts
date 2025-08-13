import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const barId = searchParams.get('bar_id') || '3';
    const categoria = searchParams.get('categoria'); // 'operacional', 'financeiro', 'qualidade', 'eficiencia'
    const dataReferencia =
      searchParams.get('data') || new Date().toISOString().split('T')[0];

    const supabase = await getAdminClient();

    // Query base
    let query = supabase
      .from('sistema_kpis')
      .select(
        `
        *,
        bars(nome)
      `
      )
      .eq('bar_id', parseInt(barId))
      .eq('data_referencia', dataReferencia)
      .order('categoria_kpi', { ascending: true });

    // Filtro por categoria se especificado
    if (categoria) {
      query = query.eq('categoria_kpi', categoria);
    }

    const { data: kpis, error } = await query;

    if (error) {
      throw error;
    }

    // Calcular estatísticas resumidas
    const resumo = {
      total_kpis: kpis?.length || 0,
      kpis_atingidos:
        kpis?.filter((kpi: any) => kpi.status_meta === 'atingido').length || 0,
      kpis_criticos:
        kpis?.filter((kpi: any) => kpi.status_meta === 'critico').length || 0,
      percentual_sucesso: kpis?.length
        ? Math.round(
            (kpis.filter((kpi: any) => kpi.status_meta === 'atingido').length /
              kpis.length) *
              100
          )
        : 0,
      data_referencia: dataReferencia,
      categorias: [
        ...new Set(kpis?.map((kpi: any) => kpi.categoria_kpi) || []),
      ],
    };

    return NextResponse.json({
      success: true,
      data: {
        kpis,
        resumo,
      },
    });
  } catch (error) {
    console.error('❌ Erro ao buscar KPIs:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao buscar KPIs do sistema',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bar_id,
      categoria_kpi,
      nome_kpi,
      valor_atual,
      valor_meta,
      valor_minimo,
      valor_maximo,
      unidade = 'numero',
      descricao,
      periodo_tipo = 'mensal',
      data_referencia,
    } = body;

    // Validação básica
    if (
      !bar_id ||
      !categoria_kpi ||
      !nome_kpi ||
      valor_atual === undefined ||
      valor_meta === undefined
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Campos obrigatórios: bar_id, categoria_kpi, nome_kpi, valor_atual, valor_meta',
        },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Inserir ou atualizar KPI
    const { data: kpi, error } = await supabase
      .from('sistema_kpis')
      .upsert(
        {
          bar_id: parseInt(bar_id),
          categoria_kpi,
          nome_kpi,
          valor_atual: parseFloat(valor_atual),
          valor_meta: parseFloat(valor_meta),
          valor_minimo: valor_minimo ? parseFloat(valor_minimo) : null,
          valor_maximo: valor_maximo ? parseFloat(valor_maximo) : null,
          unidade,
          descricao,
          periodo_tipo,
          data_referencia:
            data_referencia || new Date().toISOString().split('T')[0],
          atualizado_em: new Date().toISOString(),
        },
        {
          onConflict: 'bar_id,categoria_kpi,nome_kpi,data_referencia',
        }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: kpi,
      message: 'KPI registrado/atualizado com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro ao registrar KPI:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao registrar KPI',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, valor_atual } = body;

    if (!id || valor_atual === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Campos obrigatórios: id, valor_atual',
        },
        { status: 400 }
      );
    }

    const supabase = await getAdminClient();

    // Atualizar apenas o valor atual do KPI
    const { data: kpi, error } = await supabase
      .from('sistema_kpis')
      .update({
        valor_atual: parseFloat(valor_atual),
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: kpi,
      message: 'KPI atualizado com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro ao atualizar KPI:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao atualizar KPI',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
