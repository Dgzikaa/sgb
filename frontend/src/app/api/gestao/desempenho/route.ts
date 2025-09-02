import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

// GET - Buscar dados de desempenho
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = request.headers.get('x-user-data')
      ? JSON.parse(request.headers.get('x-user-data') || '{}').bar_id
      : null;

    if (!barId) {
      return NextResponse.json(
        { success: false, error: 'Bar não selecionado' },
        { status: 400 }
      );
    }

    const ano = searchParams.get('ano') || new Date().getFullYear().toString();
    const mes = searchParams.get('mes');

    // Usar service_role para dados administrativos (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Obter semana atual baseada na data (método mais preciso)
    const { data: semanaAtualTabela } = await supabase
      .from('desempenho_semanal')
      .select('numero_semana')
      .eq('bar_id', barId)
      .eq('ano', parseInt(ano))
      .lte('data_inicio::date', 'CURRENT_DATE')
      .gte('data_fim::date', 'CURRENT_DATE')
      .single();
    
    const semanaAtual = semanaAtualTabela?.numero_semana || 31;
    console.log(`📅 Semana atual: ${semanaAtual} - Filtrando exibição até esta semana`);

    // Construir query base - FILTRAR ATÉ SEMANA ATUAL
    let query = supabase
      .from('desempenho_semanal')
      .select('*')
      .eq('bar_id', barId)
      .eq('ano', parseInt(ano))
      .lte('numero_semana', semanaAtual) // 🎯 MOSTRAR SÓ ATÉ SEMANA ATUAL
      .order('numero_semana', { ascending: false });

    // Filtrar por mês se especificado
    if (mes && mes !== 'todos') {
      const mesInt = parseInt(mes);
      // Aproximação: considerar semanas 1-4 como mês 1, 5-8 como mês 2, etc.
      const semanaInicio = (mesInt - 1) * 4 + 1;
      const semanaFim = mesInt * 4 + 4;
      
      query = query
        .gte('numero_semana', semanaInicio)
        .lte('numero_semana', semanaFim);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar dados:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados de desempenho' },
        { status: 500 }
      );
    }

    // Calcular resumo
    const resumo = data && data.length > 0 ? {
      total_semanas: data.length,
      faturamento_medio: data.reduce((acc, item) => acc + (item.faturamento_total || 0), 0) / data.length,
      faturamento_total_ano: data.reduce((acc, item) => acc + (item.faturamento_total || 0), 0),
      clientes_medio: data.reduce((acc, item) => acc + (item.clientes_atendidos || 0), 0) / data.length,
      clientes_total_ano: data.reduce((acc, item) => acc + (item.clientes_atendidos || 0), 0),
      ticket_medio_geral: data.reduce((acc, item) => acc + (item.ticket_medio || 0), 0) / data.length,
      atingimento_medio: data.reduce((acc, item) => {
        const atingimento = item.meta_semanal > 0 
          ? (item.faturamento_total / item.meta_semanal) * 100 
          : 0;
        return acc + atingimento;
      }, 0) / data.length,
      cmv_medio: data.reduce((acc, item) => acc + (item.cmv_limpo || 0), 0) / data.length,
    } : null;

    return NextResponse.json({ 
      success: true, 
      data: data || [],
      resumo 
    });

  } catch (error) {
    console.error('Erro na API de desempenho:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir registro de desempenho
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const barId = request.headers.get('x-user-data')
      ? JSON.parse(request.headers.get('x-user-data') || '{}').bar_id
      : null;

    if (!barId || !id) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    // Usar service_role para dados administrativos (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { error } = await supabase
      .from('desempenho_semanal')
      .delete()
      .eq('id', parseInt(id))
      .eq('bar_id', barId);

    if (error) {
      console.error('Erro ao excluir:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao excluir registro' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registro excluído com sucesso' 
    });

  } catch (error) {
    console.error('Erro ao excluir:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar registro de desempenho
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const barId = request.headers.get('x-user-data')
      ? JSON.parse(request.headers.get('x-user-data') || '{}').bar_id
      : null;

    const { id, ...updateData } = body;

    if (!barId || !id) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos' },
        { status: 400 }
      );
    }

    // Usar service_role para dados administrativos (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Atualizar o registro
    const { data, error } = await supabase
      .from('desempenho_semanal')
      .update({
        ...updateData,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', id)
      .eq('bar_id', barId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar:', error);
      return NextResponse.json(
        { success: false, error: 'Erro ao atualizar registro' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Registro atualizado com sucesso',
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
