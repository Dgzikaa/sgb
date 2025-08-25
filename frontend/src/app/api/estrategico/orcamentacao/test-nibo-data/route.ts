import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('bar_id') || '3';
    const ano = searchParams.get('ano') || '2025';
    const mes = searchParams.get('mes') || '8';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Buscar dados do NIBO para o mês específico
    const { data: niboData, error: niboError } = await supabase
      .from('nibo_agendamentos')
      .select('*')
      .eq('bar_id', barId)
      .gte('data_competencia', `${ano}-${mes.padStart(2, '0')}-01`)
      .lte('data_competencia', `${ano}-${mes.padStart(2, '0')}-31`)
      .not('categoria_nome', 'is', null)
      .order('data_competencia', { ascending: true });

    if (niboError) {
      console.error('Erro ao buscar dados Nibo:', niboError);
      return NextResponse.json(
        { success: false, error: 'Erro ao buscar dados do Nibo' },
        { status: 500 }
      );
    }

    // Agrupar por categoria para análise
    const categoriasSummary = new Map();
    const statusSummary = new Map();
    
    niboData?.forEach(item => {
      // Resumo por categoria
      if (!categoriasSummary.has(item.categoria_nome)) {
        categoriasSummary.set(item.categoria_nome, {
          total: 0,
          paid: 0,
          pending: 0,
          valor_total: 0,
          valor_paid: 0
        });
      }
      
      const catSummary = categoriasSummary.get(item.categoria_nome);
      catSummary.total++;
      catSummary.valor_total += Math.abs(parseFloat(item.valor) || 0);
      
      if (item.status === 'Paid') {
        catSummary.paid++;
        catSummary.valor_paid += Math.abs(parseFloat(item.valor) || 0);
      } else {
        catSummary.pending++;
      }
      
      // Resumo por status
      if (!statusSummary.has(item.status)) {
        statusSummary.set(item.status, 0);
      }
      statusSummary.set(item.status, statusSummary.get(item.status) + 1);
    });

    return NextResponse.json({
      success: true,
      parametros: { barId, ano, mes },
      total_registros: niboData?.length || 0,
      resumo_por_categoria: Object.fromEntries(categoriasSummary),
      resumo_por_status: Object.fromEntries(statusSummary),
      amostra_dados: niboData?.slice(0, 10).map(item => ({
        categoria: item.categoria_nome,
        subcategoria: item.subcategoria,
        status: item.status,
        valor: item.valor,
        data: item.data_competencia,
        tipo: item.tipo
      })) || []
    });

  } catch (error) {
    console.error('Erro na API de teste NIBO:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
