import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * 📊 AGENTE ANÁLISE DE PERÍODOS
 * 
 * Responsável por:
 * - Comparar períodos (semanas, meses, anos)
 * - Identificar tendências
 * - Calcular variações percentuais
 * - Gerar insights sobre evolução
 */

console.log("📊 Agente Análise de Períodos - Comparativos e Tendências");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnaliseRequest {
  action: 'comparar_semanas' | 'comparar_meses' | 'tendencia' | 'evolucao_anual' | 'resumo_periodo';
  bar_id: number;
  periodo_1?: { inicio: string; fim: string };
  periodo_2?: { inicio: string; fim: string };
  ano?: number;
  mes?: number;
}

interface MetricasPeriodo {
  faturamento_total: number;
  total_eventos: number;
  publico_total: number;
  ticket_medio: number;
  media_por_evento: number;
}

async function calcularMetricasPeriodo(
  supabase: ReturnType<typeof createClient>,
  barId: number,
  inicio: string,
  fim: string
): Promise<MetricasPeriodo> {
  const { data, error } = await supabase
    .from('eventos')
    .select('real_r, pax_r, te_r')
    .eq('bar_id', barId)
    .gte('data_evento', inicio)
    .lte('data_evento', fim);

  if (error) throw error;

  const eventos = data || [];
  const faturamento_total = eventos.reduce((sum, e) => sum + (e.real_r || 0), 0);
  const publico_total = eventos.reduce((sum, e) => sum + (e.pax_r || 0), 0);
  const tickets = eventos.filter(e => e.te_r > 0).map(e => e.te_r);
  
  return {
    faturamento_total,
    total_eventos: eventos.length,
    publico_total,
    ticket_medio: tickets.length > 0 ? tickets.reduce((a, b) => a + b, 0) / tickets.length : 0,
    media_por_evento: eventos.length > 0 ? faturamento_total / eventos.length : 0
  };
}

function calcularVariacao(atual: number, anterior: number): { valor: number; percentual: number; tendencia: string } {
  const diferenca = atual - anterior;
  const percentual = anterior > 0 ? ((diferenca / anterior) * 100) : 0;
  const tendencia = diferenca > 0 ? '📈 Alta' : diferenca < 0 ? '📉 Queda' : '➡️ Estável';
  
  return {
    valor: diferenca,
    percentual: Math.round(percentual * 100) / 100,
    tendencia
  };
}

function formatarMoeda(valor: number): string {
  return `R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: AnaliseRequest = await req.json();
    const { action, bar_id, periodo_1, periodo_2, ano, mes } = request;

    console.log(`📊 Análise: ${action} para bar_id=${bar_id}`);

    let resposta: Record<string, unknown> = {};
    let textoResposta = '';

    switch (action) {
      case 'comparar_semanas':
        // Comparar últimas 2 semanas por padrão
        const hoje = new Date();
        const fimSemana1 = periodo_1?.fim || hoje.toISOString().split('T')[0];
        const inicioSemana1 = periodo_1?.inicio || new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const fimSemana2 = periodo_2?.fim || inicioSemana1;
        const inicioSemana2 = periodo_2?.inicio || new Date(new Date(inicioSemana1).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const metricasSemana1 = await calcularMetricasPeriodo(supabase, bar_id, inicioSemana1, fimSemana1);
        const metricasSemana2 = await calcularMetricasPeriodo(supabase, bar_id, inicioSemana2, fimSemana2);

        const varFaturamento = calcularVariacao(metricasSemana1.faturamento_total, metricasSemana2.faturamento_total);
        const varPublico = calcularVariacao(metricasSemana1.publico_total, metricasSemana2.publico_total);
        const varTicket = calcularVariacao(metricasSemana1.ticket_medio, metricasSemana2.ticket_medio);

        textoResposta = `📊 **Comparativo Semanal**\n\n` +
          `**Semana Atual** (${inicioSemana1} a ${fimSemana1}):\n` +
          `💰 Faturamento: ${formatarMoeda(metricasSemana1.faturamento_total)}\n` +
          `👥 Público: ${metricasSemana1.publico_total} pessoas\n` +
          `🎟️ Ticket Médio: ${formatarMoeda(metricasSemana1.ticket_medio)}\n\n` +
          `**Semana Anterior** (${inicioSemana2} a ${fimSemana2}):\n` +
          `💰 Faturamento: ${formatarMoeda(metricasSemana2.faturamento_total)}\n` +
          `👥 Público: ${metricasSemana2.publico_total} pessoas\n` +
          `🎟️ Ticket Médio: ${formatarMoeda(metricasSemana2.ticket_medio)}\n\n` +
          `**Variações:**\n` +
          `${varFaturamento.tendencia} Faturamento: ${varFaturamento.percentual > 0 ? '+' : ''}${varFaturamento.percentual}%\n` +
          `${varPublico.tendencia} Público: ${varPublico.percentual > 0 ? '+' : ''}${varPublico.percentual}%\n` +
          `${varTicket.tendencia} Ticket: ${varTicket.percentual > 0 ? '+' : ''}${varTicket.percentual}%`;

        resposta = {
          semana_atual: metricasSemana1,
          semana_anterior: metricasSemana2,
          variacoes: {
            faturamento: varFaturamento,
            publico: varPublico,
            ticket: varTicket
          }
        };
        break;

      case 'comparar_meses':
        const anoAtual = ano || new Date().getFullYear();
        const mesAtual = mes || new Date().getMonth() + 1;
        const mesAnterior = mesAtual === 1 ? 12 : mesAtual - 1;
        const anoMesAnterior = mesAtual === 1 ? anoAtual - 1 : anoAtual;

        const inicioMesAtual = `${anoAtual}-${String(mesAtual).padStart(2, '0')}-01`;
        const fimMesAtual = new Date(anoAtual, mesAtual, 0).toISOString().split('T')[0];
        const inicioMesAnt = `${anoMesAnterior}-${String(mesAnterior).padStart(2, '0')}-01`;
        const fimMesAnt = new Date(anoMesAnterior, mesAnterior, 0).toISOString().split('T')[0];

        const metricasMesAtual = await calcularMetricasPeriodo(supabase, bar_id, inicioMesAtual, fimMesAtual);
        const metricasMesAnterior = await calcularMetricasPeriodo(supabase, bar_id, inicioMesAnt, fimMesAnt);

        const varFatMes = calcularVariacao(metricasMesAtual.faturamento_total, metricasMesAnterior.faturamento_total);

        textoResposta = `📅 **Comparativo Mensal**\n\n` +
          `**${String(mesAtual).padStart(2, '0')}/${anoAtual}:**\n` +
          `💰 ${formatarMoeda(metricasMesAtual.faturamento_total)} | 📅 ${metricasMesAtual.total_eventos} eventos | 👥 ${metricasMesAtual.publico_total} pessoas\n\n` +
          `**${String(mesAnterior).padStart(2, '0')}/${anoMesAnterior}:**\n` +
          `💰 ${formatarMoeda(metricasMesAnterior.faturamento_total)} | 📅 ${metricasMesAnterior.total_eventos} eventos | 👥 ${metricasMesAnterior.publico_total} pessoas\n\n` +
          `${varFatMes.tendencia} **Variação:** ${varFatMes.percentual > 0 ? '+' : ''}${varFatMes.percentual}% no faturamento`;

        resposta = {
          mes_atual: metricasMesAtual,
          mes_anterior: metricasMesAnterior,
          variacao: varFatMes
        };
        break;

      case 'evolucao_anual':
        const anoAnalise = ano || new Date().getFullYear();
        const evolucaoMensal: Array<{ mes: number; metricas: MetricasPeriodo }> = [];

        for (let m = 1; m <= 12; m++) {
          const inicioM = `${anoAnalise}-${String(m).padStart(2, '0')}-01`;
          const fimM = new Date(anoAnalise, m, 0).toISOString().split('T')[0];
          
          const metricas = await calcularMetricasPeriodo(supabase, bar_id, inicioM, fimM);
          evolucaoMensal.push({ mes: m, metricas });
        }

        const totalAnual = evolucaoMensal.reduce((sum, m) => sum + m.metricas.faturamento_total, 0);
        const melhorMes = evolucaoMensal.reduce((best, m) => 
          m.metricas.faturamento_total > best.metricas.faturamento_total ? m : best
        );

        textoResposta = `📈 **Evolução Anual ${anoAnalise}**\n\n`;
        
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        evolucaoMensal.forEach((m) => {
          const barra = '█'.repeat(Math.min(Math.round(m.metricas.faturamento_total / 10000), 20));
          textoResposta += `${meses[m.mes - 1]}: ${barra} ${formatarMoeda(m.metricas.faturamento_total)}\n`;
        });

        textoResposta += `\n**Resumo:**\n`;
        textoResposta += `💰 Total: ${formatarMoeda(totalAnual)}\n`;
        textoResposta += `🏆 Melhor mês: ${meses[melhorMes.mes - 1]} (${formatarMoeda(melhorMes.metricas.faturamento_total)})`;

        resposta = {
          ano: anoAnalise,
          evolucao_mensal: evolucaoMensal,
          total_anual: totalAnual,
          melhor_mes: { mes: melhorMes.mes, valor: melhorMes.metricas.faturamento_total }
        };
        break;

      case 'resumo_periodo':
        if (!periodo_1) {
          throw new Error('periodo_1 é obrigatório para resumo');
        }

        const metricasPeriodo = await calcularMetricasPeriodo(
          supabase, 
          bar_id, 
          periodo_1.inicio, 
          periodo_1.fim
        );

        textoResposta = `📋 **Resumo do Período**\n` +
          `📅 ${periodo_1.inicio} a ${periodo_1.fim}\n\n` +
          `💰 Faturamento: ${formatarMoeda(metricasPeriodo.faturamento_total)}\n` +
          `📅 Eventos: ${metricasPeriodo.total_eventos}\n` +
          `👥 Público Total: ${metricasPeriodo.publico_total} pessoas\n` +
          `🎟️ Ticket Médio: ${formatarMoeda(metricasPeriodo.ticket_medio)}\n` +
          `📊 Média por Evento: ${formatarMoeda(metricasPeriodo.media_por_evento)}`;

        resposta = {
          periodo: periodo_1,
          metricas: metricasPeriodo
        };
        break;
    }

    console.log(`✅ Análise concluída`);

    return new Response(JSON.stringify({
      success: true,
      action,
      resposta: textoResposta,
      dados: resposta
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Erro no Agente Análise de Períodos:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

