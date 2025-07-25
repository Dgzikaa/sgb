import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

// Função para buscar dados financeiros gerais
async function buscarDadosFinanceiros(supabase: unknown, barId: number) {
  console.log(`💰 Buscando dados financeiros para bar ${barId}...`);

  // Buscar dados de receitas e despesas (tabelas gerais)
  const { data: receitas, error: errorReceitas } = await supabase
    .from('receitas')
    .select('valor, categoria, data_competencia, status')
    .eq('bar_id', barId)
    .gte('data_competencia', '2025-01-01')
    .lte('data_competencia', '2025-12-31')
    .eq('ativo', true);

  if (errorReceitas) {
    console.error('❌ Erro ao buscar receitas:', errorReceitas);
    throw errorReceitas;
  }

  const { data: despesas, error: errorDespesas } = await supabase
    .from('despesas')
    .select('valor, categoria, data_competencia, status')
    .eq('bar_id', barId)
    .gte('data_competencia', '2025-01-01')
    .lte('data_competencia', '2025-12-31')
    .eq('ativo', true);

  if (errorDespesas) {
    console.error('❌ Erro ao buscar despesas:', errorDespesas);
    throw errorDespesas;
  }

  return {
    receitas: receitas || [],
    despesas: despesas || [],
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');

    if (!barId) {
      return NextResponse.json(
        { error: 'Bar ID é obrigatório' },
        { status: 400 }
      );
    }

    const supabase = createSupabaseClient();

    console.log(`💰 BUSCANDO DADOS FINANCEIROS PARA BAR ${barId} - 2025`);

    // 1. BUSCAR DADOS FINANCEIROS
    const dadosFinanceiros = await buscarDadosFinanceiros(
      supabase,
      parseInt(barId)
    );

    // 2. CALCULAR TOTAIS
    const totalReceitas = dadosFinanceiros.receitas.reduce(
      (sum: number, r: any) => sum + (parseFloat(r.valor) || 0),
      0
    );
    const totalDespesas = dadosFinanceiros.despesas.reduce(
      (sum: number, d: any) => sum + (parseFloat(d.valor) || 0),
      0
    );
    const saldoLiquido = totalReceitas - totalDespesas;

    // 3. AGRUPAR POR CATEGORIA
    const receitasPorCategoria = dadosFinanceiros.receitas.reduce(
      (acc: any, r: any) => {
        const categoria = r.categoria || 'Sem categoria';
        acc[categoria] = (acc[categoria] || 0) + (parseFloat(r.valor) || 0);
        return acc;
      },
      {}
    );

    const despesasPorCategoria = dadosFinanceiros.despesas.reduce(
      (acc: any, d: any) => {
        const categoria = d.categoria || 'Sem categoria';
        acc[categoria] = (acc[categoria] || 0) + (parseFloat(d.valor) || 0);
        return acc;
      },
      {}
    );

    // 4. AGRUPAR POR MÊS
    const receitasPorMes = dadosFinanceiros.receitas.reduce(
      (acc: any, r: any) => {
        const mes = r.data_competencia?.substring(0, 7) || '2025-01';
        acc[mes] = (acc[mes] || 0) + (parseFloat(r.valor) || 0);
        return acc;
      },
      {}
    );

    const despesasPorMes = dadosFinanceiros.despesas.reduce(
      (acc: any, d: any) => {
        const mes = d.data_competencia?.substring(0, 7) || '2025-01';
        acc[mes] = (acc[mes] || 0) + (parseFloat(d.valor) || 0);
        return acc;
      },
      {}
    );

    const resultado = {
      resumo: {
        totalReceitas,
        totalDespesas,
        saldoLiquido,
        margemLucro:
          totalReceitas > 0 ? (saldoLiquido / totalReceitas) * 100 : 0,
      },
      receitasPorCategoria,
      despesasPorCategoria,
      receitasPorMes,
      despesasPorMes,
      totalRegistros: {
        receitas: dadosFinanceiros.receitas.length,
        despesas: dadosFinanceiros.despesas.length,
      },
    };

    console.log(
      `✅ Dados financeiros processados: ${dadosFinanceiros.receitas.length} receitas, ${dadosFinanceiros.despesas.length} despesas`
    );

    return NextResponse.json(resultado);
  } catch (error) {
    console.error('❌ Erro no dashboard financeiro:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
