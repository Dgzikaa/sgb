import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server';
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
      return NextResponse.json({ error: 'Datas de inÃ¡Â­cio e fim sÃ¡Â£o obrigatÃ¡Â³rias' }, { status: 400 });
    }

    console.log(`Ã°Å¸â€˜Â¨â‚¬ÂÃ°Å¸ÂÂ³ Analisando garÃ¡Â§ons de ${dataInicio} atÃ¡Â© ${dataFim} para bar ${barId}`);

    // Buscar dados de vendas por garÃ¡Â§om da tabela analÃ¡Â­tico
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
      .lt('t1_t2', 3600); // Filtrar tempos vÃ¡Â¡lidos

    if (temposError) {
      console.error('Erro ao buscar dados de tempo:', temposError);
      return NextResponse.json({ error: 'Erro ao buscar dados de tempo' }, { status: 500 });
    }

    console.log(`Ã°Å¸â€œÅ  Dados encontrados - Vendas: ${vendasData?.length || 0}, Tempos: ${temposData?.length || 0}`);

    // Processar dados por garÃ¡Â§om
    const garconsMap = new Map();

    // Processar vendas
    vendasData?.forEach((venda: unknown) => {
      const garcom = venda.usr_lancou;
      if (!garconsMap.has(garcom)) {
        garconsMap.set(garcom, {
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
        dadosGarcom.vendas_por_dia.set(data, 0);
      }
      dadosGarcom.vendas_por_dia.set(data, dadosGarcom.vendas_por_dia.get(data) + parseFloat(venda.valorfinal || '0'));
    });

    // Processar tempos de atendimento
    temposData?.forEach((tempo: unknown) => {
      const garcom = tempo.usr_lancou;
      if (garconsMap.has(garcom)) {
        const dadosGarcom = garconsMap.get(garcom);
        dadosGarcom.tempos_atendimento.push(tempo.t1_t2);
      }
    });

    // Calcular estatÃ¡Â­sticas finais
    const garcons = Array.from(garconsMap.values()).map((garcom: unknown, index: number) => {
      const clientes_atendidos = garcom.mesas_atendidas.size;
      const dias_trabalhados = garcom.dias_trabalhados.size;
      const ticket_medio = clientes_atendidos > 0 ? garcom.vendas_periodo / clientes_atendidos : 0;
      const tempo_medio_atendimento = garcom.tempos_atendimento.length > 0 
        ? Math.round(garcom.tempos_atendimento.reduce((a: number, b: number) => a + b, 0) / garcom.tempos_atendimento.length / 60) // Converter para minutos
        : 0;

      // Converter vendas por dia para array
      const vendas_por_dia = Array.from(garcom.vendas_por_dia.entries()).map((entry: unknown) => ({
        data: entry[0],
        vendas: entry[1]
      })).sort((a: unknown, b: unknown) => a.data.localeCompare(b.data));

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
    garcons.sort((a: unknown, b: unknown) => b.vendas_periodo - a.vendas_periodo);

    // Atualizar posiÃ¡Â§Ã¡Âµes do ranking
    garcons.forEach((garcom: unknown, index: number) => {
      garcom.ranking_posicao = index + 1;
    });

    console.log(`Ã°Å¸â€˜Â¨â‚¬ÂÃ°Å¸ÂÂ³ AnÃ¡Â¡lise concluÃ¡Â­da: ${garcons.length} garÃ¡Â§ons encontrados`);

    return NextResponse.json({
      success: true,
      garcons,
      meta: {
        data_inicio: dataInicio,
        data_fim: dataFim,
        total_garcons: garcons.length,
        total_vendas: garcons.reduce((sum: number, g: unknown) => sum + g.vendas_periodo, 0),
        total_clientes: garcons.reduce((sum: number, g: unknown) => sum + g.clientes_atendidos, 0)
      }
    });

  } catch (error) {
    console.error('Erro interno na API de garÃ¡Â§ons:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 

