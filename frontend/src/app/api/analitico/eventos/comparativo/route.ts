import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '3');
    const tipo = searchParams.get('tipo') || 'semana'; // dia, semana, mes, custom
    const data1 = searchParams.get('data1') || new Date().toISOString().split('T')[0];
    const data2 = searchParams.get('data2');
    const filtroCouvert = searchParams.get('filtro_couvert') || 'todos'; // todos, com_entrada, sem_entrada

    console.log(`📊 Comparativo de Eventos: ${tipo} | Data1: ${data1} | Data2: ${data2} | Filtro: ${filtroCouvert}`);

    // Calcular intervalos baseado no tipo
    let periodo1Inicio: string, periodo1Fim: string;
    let periodo2Inicio: string, periodo2Fim: string;

    const data1Obj = new Date(data1 + 'T12:00:00');

    if (tipo === 'dia') {
      // Dia x Dia
      periodo1Inicio = data1;
      periodo1Fim = data1;

      if (data2) {
        periodo2Inicio = data2;
        periodo2Fim = data2;
      } else {
        // Dia anterior
        const data2Obj = new Date(data1Obj);
        data2Obj.setDate(data2Obj.getDate() - 1);
        periodo2Inicio = data2Obj.toISOString().split('T')[0];
        periodo2Fim = periodo2Inicio;
      }
    } else if (tipo === 'semana') {
      // Semana x Semana (7 dias)
      const fim1 = new Date(data1Obj);
      const inicio1 = new Date(data1Obj);
      inicio1.setDate(inicio1.getDate() - 6);
      periodo1Inicio = inicio1.toISOString().split('T')[0];
      periodo1Fim = fim1.toISOString().split('T')[0];

      if (data2) {
        const data2Obj = new Date(data2 + 'T12:00:00');
        const fim2 = new Date(data2Obj);
        const inicio2 = new Date(data2Obj);
        inicio2.setDate(inicio2.getDate() - 6);
        periodo2Inicio = inicio2.toISOString().split('T')[0];
        periodo2Fim = fim2.toISOString().split('T')[0];
      } else {
        // Semana anterior
        const fim2 = new Date(data1Obj);
        fim2.setDate(fim2.getDate() - 7);
        const inicio2 = new Date(fim2);
        inicio2.setDate(inicio2.getDate() - 6);
        periodo2Inicio = inicio2.toISOString().split('T')[0];
        periodo2Fim = fim2.toISOString().split('T')[0];
      }
    } else if (tipo === 'mes') {
      // Mês x Mês
      const ano1 = data1Obj.getFullYear();
      const mes1 = data1Obj.getMonth();
      periodo1Inicio = new Date(ano1, mes1, 1).toISOString().split('T')[0];
      periodo1Fim = new Date(ano1, mes1 + 1, 0).toISOString().split('T')[0];

      if (data2) {
        const data2Obj = new Date(data2 + 'T12:00:00');
        const ano2 = data2Obj.getFullYear();
        const mes2 = data2Obj.getMonth();
        periodo2Inicio = new Date(ano2, mes2, 1).toISOString().split('T')[0];
        periodo2Fim = new Date(ano2, mes2 + 1, 0).toISOString().split('T')[0];
      } else {
        // Mês anterior
        const mesAnterior = mes1 - 1;
        const anoAnterior = mesAnterior < 0 ? ano1 - 1 : ano1;
        const mesAjustado = mesAnterior < 0 ? 11 : mesAnterior;
        periodo2Inicio = new Date(anoAnterior, mesAjustado, 1).toISOString().split('T')[0];
        periodo2Fim = new Date(anoAnterior, mesAjustado + 1, 0).toISOString().split('T')[0];
      }
    } else {
      // Custom
      periodo1Inicio = data1;
      periodo1Fim = data1;
      periodo2Inicio = data2 || data1;
      periodo2Fim = data2 || data1;
    }

    console.log(`📅 Período 1: ${periodo1Inicio} a ${periodo1Fim}`);
    console.log(`📅 Período 2: ${periodo2Inicio} a ${periodo2Fim}`);

    // Buscar eventos do período 1
    let query1 = supabase
      .from('eventos_base')
      .select('data_evento, nome, real_r, cl_real, te_real, tb_real, m1_r, percent_art_fat')
      .eq('bar_id', barId)
      .gte('data_evento', periodo1Inicio)
      .lte('data_evento', periodo1Fim)
      .eq('ativo', true)
      .order('data_evento', { ascending: true });

    // Buscar eventos do período 2
    let query2 = supabase
      .from('eventos_base')
      .select('data_evento, nome, real_r, cl_real, te_real, tb_real, m1_r, percent_art_fat')
      .eq('bar_id', barId)
      .gte('data_evento', periodo2Inicio)
      .lte('data_evento', periodo2Fim)
      .eq('ativo', true)
      .order('data_evento', { ascending: true });

    const [{ data: eventos1, error: error1 }, { data: eventos2, error: error2 }] = await Promise.all([
      query1,
      query2
    ]);

    if (error1 || error2) {
      console.error('❌ Erro ao buscar eventos:', error1 || error2);
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
    }

    // Filtrar por couvert
    const filtrarCouvert = (eventos: any[]) => {
      if (filtroCouvert === 'com_entrada') {
        return eventos.filter(e => (e.te_real || 0) > 0);
      } else if (filtroCouvert === 'sem_entrada') {
        return eventos.filter(e => (e.te_real || 0) === 0);
      }
      return eventos;
    };

    const eventosFiltrados1 = filtrarCouvert(eventos1 || []);
    const eventosFiltrados2 = filtrarCouvert(eventos2 || []);

    // Calcular totais
    const calcularTotais = (eventos: any[]) => {
      const faturamento = eventos.reduce((sum, e) => sum + (e.real_r || 0), 0);
      const clientes = eventos.reduce((sum, e) => sum + (e.cl_real || 0), 0);
      const total_entradas = eventos.reduce((sum, e) => sum + (e.te_real || 0), 0);
      const total_bebidas = eventos.reduce((sum, e) => sum + (e.tb_real || 0), 0);
      const ticket_medio = clientes > 0 ? faturamento / clientes : 0;

      return {
        faturamento,
        clientes,
        ticket_medio,
        total_entradas,
        total_bebidas
      };
    };

    const totais1 = calcularTotais(eventosFiltrados1);
    const totais2 = calcularTotais(eventosFiltrados2);

    // Calcular variações
    const calcularVariacao = (atual: number, anterior: number) => {
      if (anterior === 0) return atual > 0 ? 100 : 0;
      return ((atual - anterior) / anterior) * 100;
    };

    const comparacao = {
      faturamento_variacao: calcularVariacao(totais1.faturamento, totais2.faturamento),
      clientes_variacao: calcularVariacao(totais1.clientes, totais2.clientes),
      ticket_medio_variacao: calcularVariacao(totais1.ticket_medio, totais2.ticket_medio),
      entradas_variacao: calcularVariacao(totais1.total_entradas, totais2.total_entradas),
      bebidas_variacao: calcularVariacao(totais1.total_bebidas, totais2.total_bebidas)
    };

    // Adicionar flag de couvert nos eventos
    const adicionarCouvertFlag = (eventos: any[]) => {
      return eventos.map(e => ({
        ...e,
        couvert_com_entrada: (e.te_real || 0) > 0
      }));
    };

    const resultado = {
      periodo1: {
        eventos: adicionarCouvertFlag(eventosFiltrados1),
        totais: totais1,
        intervalo: { inicio: periodo1Inicio, fim: periodo1Fim }
      },
      periodo2: {
        eventos: adicionarCouvertFlag(eventosFiltrados2),
        totais: totais2,
        intervalo: { inicio: periodo2Inicio, fim: periodo2Fim }
      },
      comparacao
    };

    console.log(`✅ Comparativo gerado: ${eventosFiltrados1.length} eventos (P1) vs ${eventosFiltrados2.length} eventos (P2)`);

    return NextResponse.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('❌ Erro na API de comparativo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

