import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const barId = parseInt(searchParams.get('bar_id') || '1');

    if (!dataInicio || !dataFim) {
      return NextResponse.json({ error: 'Datas de iná­cio e fim sá£o obrigatá³rias' }, { status: 400 });
    }

    console.log(`ðŸ‘¨€ðŸ³ Analisando gará§ons de ${dataInicio} atá© ${dataFim} para bar ${barId}`);

    // Buscar dados de vendas por gará§om da tabela analá­tico
    const { data: vendasData, error: vendasError } = await supabase
      .from('analitico')
      .select(`
        vd_dtgerencial,
        usr_lancou,
        valorfinal,
        qtd,
        prd_desc,
        grp_desc,
        vd_mesadesc
      `)
      .eq('bar_id', barId)
      .gte('vd_dtgerencial', dataInicio)
      .lte('vd_dtgerencial', dataFim)
      .not('usr_lancou', 'is', null)
      .not('valorfinal', 'is', null);

    if (vendasError) {
      console.error('Erro ao buscar dados de vendas:', vendasError);
      return NextResponse.json({ error: 'Erro ao buscar dados de vendas' }, { status: 500 });
    }

    // Buscar dados de tempo de atendimento da tabela tempo
    const { data: temposData, error: temposError } = await supabase
      .from('tempo')
      .select(`
        t0_lancamento,
        usr_lancou,
        t1_t2,
        prd_desc,
        vd_mesadesc
      `)
      .eq('bar_id', barId)
      .gte('t0_lancamento', dataInicio)
      .lte('t0_lancamento', dataFim)
      .not('usr_lancou', 'is', null)
      .not('t1_t2', 'is', null)
      .gt('t1_t2', 0)
      .lt('t1_t2', 3600); // Filtrar tempos vá¡lidos

    if (temposError) {
      console.error('Erro ao buscar dados de tempo:', temposError);
      return NextResponse.json({ error: 'Erro ao buscar dados de tempo' }, { status: 500 });
    }

    console.log(`ðŸ“Š Dados encontrados - Vendas: ${vendasData?.length || 0}, Tempos: ${temposData?.length || 0}`);

    // Processar dados por gará§om
    const garconsMap = new Map();

    // Processar vendas
    vendasData?.forEach((venda: any) => {
      const garcom = venda.usr_lancou;
      if (!garconsMap.has(garcom)) {
        garconsMap.set(garcom: any, {
          nome: garcom,
          vendas_periodo: 0,
          produtos_vendidos: 0,
          clientes_atendidos: new Set(),
          dias_trabalhados: new Set(),
          mesas_atendidas: new Set(),
          vendas_por_dia: new Map(),
          tempos_atendimento: []
        });
      }

      const dadosGarcom = garconsMap.get(garcom);
      dadosGarcom.vendas_periodo += parseFloat(venda.valorfinal || '0');
      dadosGarcom.produtos_vendidos += parseInt(venda.qtd || '0');
      dadosGarcom.dias_trabalhados.add(venda.vd_dtgerencial);
      
      if (venda.vd_mesadesc) {
        dadosGarcom.mesas_atendidas.add(venda.vd_mesadesc);
      }

      // Vendas por dia
      const data = venda.vd_dtgerencial;
      if (!dadosGarcom.vendas_por_dia.has(data)) {
        dadosGarcom.vendas_por_dia.set(data: any, 0);
      }
      dadosGarcom.vendas_por_dia.set(data: any, dadosGarcom.vendas_por_dia.get(data) + parseFloat(venda.valorfinal || '0'));
    });

    // Processar tempos de atendimento
    temposData?.forEach((tempo: any) => {
      const garcom = tempo.usr_lancou;
      if (garconsMap.has(garcom)) {
        const dadosGarcom = garconsMap.get(garcom);
        dadosGarcom.tempos_atendimento.push(tempo.t1_t2);
      }
    });

    // Calcular estatá­sticas finais
    const garcons = Array.from(garconsMap.values()).map((garcom: any, index: number) => {
      const clientes_atendidos = garcom.mesas_atendidas.size;
      const dias_trabalhados = garcom.dias_trabalhados.size;
      const ticket_medio = clientes_atendidos > 0 ? garcom.vendas_periodo / clientes_atendidos : 0;
      const tempo_medio_atendimento = garcom.tempos_atendimento.length > 0 
        ? Math.round(garcom.tempos_atendimento.reduce((a: number, b: number) => a + b, 0) / garcom.tempos_atendimento.length / 60) // Converter para minutos
        : 0;

      // Converter vendas por dia para array
      const vendas_por_dia = Array.from(garcom.vendas_por_dia.entries()).map((entry: any) => ({
        data: entry[0],
        vendas: entry[1]
      })).sort((a: any, b: any) => a.data.localeCompare(b.data));

      return {
        nome: garcom.nome,
        vendas_periodo: Math.round(garcom.vendas_periodo * 100) / 100,
        produtos_vendidos: garcom.produtos_vendidos,
        clientes_atendidos,
        dias_trabalhados,
        ticket_medio: Math.round(ticket_medio * 100) / 100,
        tempo_medio_atendimento,
        ranking_posicao: index + 1,
        vendas_por_dia
      };
    });

    // Ordenar por vendas (maior para menor)
    garcons.sort((a: any, b: any) => b.vendas_periodo - a.vendas_periodo);

    // Atualizar posiá§áµes do ranking
    garcons.forEach((garcom: any, index: any) => {
      garcom.ranking_posicao = index + 1;
    });

    console.log(`ðŸ‘¨€ðŸ³ Aná¡lise concluá­da: ${garcons.length} gará§ons encontrados`);

    return NextResponse.json({
      success: true,
      garcons,
      meta: {
        data_inicio: dataInicio,
        data_fim: dataFim,
        total_garcons: garcons.length,
        total_vendas: garcons.reduce((sum: any, g: any) => sum + g.vendas_periodo, 0),
        total_clientes: garcons.reduce((sum: any, g: any) => sum + g.clientes_atendidos, 0)
      }
    });

  } catch (error) {
    console.error('Erro interno na API de gará§ons:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
