import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId') || '3';
    
    console.log('📊 Carregando dados do dashboard para bar:', barId);

    // Buscar receitas
    const { data: receitas } = await supabase
      .from('contaazul_financeiro')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('tipo', 'RECEITA')
      .order('data_vencimento', { ascending: false })
      .limit(50);

    // Buscar despesas
    const { data: despesas } = await supabase
      .from('contaazul_financeiro')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('tipo', 'DESPESA')
      .order('data_vencimento', { ascending: false })
      .limit(50);

    // Buscar categorias
    const { data: categorias } = await supabase
      .from('contaazul_categorias')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .order('nome');

    // Buscar contas financeiras
    const { data: contas } = await supabase
      .from('contaazul_contas_financeiras')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .order('nome');

    // Calcular estatísticas
    const totalReceitas = receitas?.length || 0;
    const totalDespesas = despesas?.length || 0;
    
    const valorTotalReceitas = receitas?.reduce((sum, r) => sum + parseFloat(r.valor || '0'), 0) || 0;
    const valorTotalDespesas = despesas?.reduce((sum, d) => sum + parseFloat(d.valor || '0'), 0) || 0;
    
    const saldo = valorTotalReceitas - valorTotalDespesas;

    const estatisticas = {
      total_receitas: totalReceitas,
      total_despesas: totalDespesas,
      valor_total_receitas: valorTotalReceitas,
      valor_total_despesas: valorTotalDespesas,
      saldo: saldo
    };

    console.log('📈 Estatísticas calculadas:', estatisticas);

    // Informações adicionais sobre sincronização
    const { data: ultimasSincronizacoes } = await supabase
      .from('contaazul_sincronizacao')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .order('data_inicio', { ascending: false })
      .limit(5);

    // Status dos dados brutos
    const { data: dadosBrutos } = await supabase
      .from('contaazul_raw_data')
      .select('tipo_dados, pagina')
      .eq('bar_id', parseInt(barId));

    return NextResponse.json({
      success: true,
      receitas: receitas || [],
      despesas: despesas || [],
      categorias: categorias || [],
      contas: contas || [],
      estatisticas,
      informacoes_adicionais: {
        ultimas_sincronizacoes: ultimasSincronizacoes || [],
        dados_brutos_coletados: dadosBrutos || [],
        periodo_dados: '2024-01-01 até 2027-01-01',
        ultima_atualizacao: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao carregar dados do dashboard:', error);
    return NextResponse.json({ 
      error: 'Erro ao carregar dados do dashboard', 
      details: error.message 
    }, { status: 500 });
  }
} 