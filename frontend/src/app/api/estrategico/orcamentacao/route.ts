import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

// GET - Buscar dados de orçamento
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('bar_id');
    const ano = searchParams.get('ano');
    const mes = searchParams.get('mes');

    if (!barId || !ano) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Construir query
    let query = supabase
      .from('orcamentacao')
      .select('*')
      .eq('bar_id', barId)
      .eq('ano', parseInt(ano))
      .order('categoria_nome', { ascending: true })
      .order('subcategoria', { ascending: true });

    // Filtrar por mês se especificado
    if (mes && mes !== 'todos') {
      query = query.eq('mes', parseInt(mes));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar orçamento:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados do orçamento' },
        { status: 500 }
      );
    }

    // Transformar dados para o formato esperado pelo frontend
    const dadosFormatados = data?.map(item => ({
      id: item.id,
      bar_id: item.bar_id,
      ano: item.ano,
      mes: item.mes,
      categoria: item.categoria_nome,
      subcategoria: item.subcategoria,
      valor_planejado: Number(item.valor_planejado),
      valor_realizado: Number(item.valor_realizado),
      percentual_realizado: Number(item.percentual_realizado),
      observacoes: item.observacoes,
      criado_em: item.criado_em,
      atualizado_em: item.atualizado_em
    })) || [];

    return NextResponse.json({
      success: true,
      data: dadosFormatados
    });

  } catch (error) {
    console.error('Erro na API de orçamento:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar valor previsto
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, valor_previsto } = body;

    if (!id || valor_previsto === undefined) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('orcamentacao')
      .update({
        valor_planejado: valor_previsto,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar orçamento:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar valor' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Erro ao atualizar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo registro
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bar_id, ano, mes, categoria, subcategoria, valor_previsto, tipo } = body;

    if (!bar_id || !ano || !mes || !categoria || valor_previsto === undefined) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('orcamentacao')
      .insert({
        bar_id,
        ano,
        mes,
        categoria_nome: categoria,
        subcategoria,
        valor_planejado: valor_previsto,
        valor_realizado: 0,
        tipo: tipo || 'despesa',
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar orçamento:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao criar registro' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('Erro ao criar:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
