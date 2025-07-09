import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id');
    const ano = searchParams.get('ano');
    const mes = searchParams.get('mes');
    const view = searchParams.get('view'); // 'comparativa' ou 'anual'

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 });
    }

    let query = supabase
      .from('competencia_mensal')
      .select('*')
      .eq('bar_id', bar_id);

    // Filtros opcionais
    if (ano) {
      query = query.eq('ano', ano);
    }
    if (mes) {
      query = query.eq('mes', mes);
    }

    // Ordenar por ano e mês
    query = query.order('ano', { ascending: true }).order('mes', { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar competências:', error);
      return NextResponse.json({ error: 'Erro ao buscar competências' }, { status: 500 });
    }

    return NextResponse.json({ 
      competencias: data || [],
      total: data?.length || 0 
    });

  } catch (error) {
    console.error('Erro na API de competências:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { bar_id, ano, mes, recalcular_todos } = await request.json();

    if (!bar_id || !ano || !mes) {
      return NextResponse.json({ 
        error: 'bar_id, ano e mes são obrigatórios' 
      }, { status: 400 });
    }

    // Recalcular competência específica
    const { data, error } = await supabase
      .rpc('calcular_competencia_mensal', {
        p_bar_id: bar_id,
        p_ano: ano,
        p_mes: mes
      });

    if (error) {
      console.error('Erro ao recalcular competência:', error);
      return NextResponse.json({ 
        error: 'Erro ao recalcular competência' 
      }, { status: 500 });
    }

    // Se solicitado, recalcular todas as competências
    if (recalcular_todos) {
      const { data: semanasData, error: semanasError } = await supabase
        .from('desempenho_semanal')
        .select('DISTINCT ano, data_inicio')
        .eq('bar_id', bar_id);

      if (!semanasError && semanasData) {
        const competenciasUnicas = new Set<string>();
        
        for (const semana of semanasData) {
          const mesData = new Date(semana.data_inicio).getMonth() + 1;
          const competenciaKey = `${semana.ano}-${mesData}`;
          competenciasUnicas.add(competenciaKey);
        }

        // Recalcular cada competência única
        for (const competencia of competenciasUnicas) {
          const [anoComp, mesComp] = competencia.split('-');
          await supabase.rpc('calcular_competencia_mensal', {
            p_bar_id: bar_id,
            p_ano: parseInt(anoComp),
            p_mes: parseInt(mesComp)
          });
        }
      }
    }

    return NextResponse.json({ 
      message: 'Competência recalculada com sucesso',
      recalculado: true 
    });

  } catch (error) {
    console.error('Erro ao recalcular competência:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 