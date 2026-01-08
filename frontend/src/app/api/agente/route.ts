import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface ChatContext {
  barName: string;
  previousMessages: { role: string; content: string }[];
}

interface AgentResponse {
  success: boolean;
  response: string;
  agent?: string;
  metrics?: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[];
  suggestions?: string[];
}

// Sistema de classificação de intenção
function classifyIntent(message: string): { intent: string; entities: Record<string, string> } {
  const messageLower = message.toLowerCase();
  
  // Padrões de intenção
  const patterns = {
    faturamento: /faturamento|receita|vendas|quanto faturou|quanto vendeu/,
    clientes: /cliente|pessoa|pax|público|quantos vieram|visitantes/,
    ticket: /ticket|média|consumo médio|gasto médio/,
    cmv: /cmv|custo|mercadoria vendida/,
    meta: /meta|objetivo|progresso|atingimento/,
    comparativo: /comparar|comparação|versus|vs|semana passada|mês passado/,
    produto: /produto|mais vendido|top|ranking|item/,
    periodo: /hoje|ontem|semana|mês|ano|período|data/,
    operacional: /horário|pico|movimento|funcionamento/,
  };

  let intent = 'geral';
  for (const [key, pattern] of Object.entries(patterns)) {
    if (pattern.test(messageLower)) {
      intent = key;
      break;
    }
  }

  // Extrair entidades de tempo
  const entities: Record<string, string> = {};
  if (/hoje/.test(messageLower)) entities.periodo = 'hoje';
  else if (/ontem/.test(messageLower)) entities.periodo = 'ontem';
  else if (/essa semana|esta semana|semana atual/.test(messageLower)) entities.periodo = 'semana_atual';
  else if (/semana passada|última semana/.test(messageLower)) entities.periodo = 'semana_passada';
  else if (/esse mês|este mês|mês atual/.test(messageLower)) entities.periodo = 'mes_atual';
  else if (/mês passado|último mês/.test(messageLower)) entities.periodo = 'mes_passado';

  return { intent, entities };
}

// Buscar dados do banco baseado na intenção
async function fetchDataForIntent(
  supabase: ReturnType<typeof createClient>,
  intent: string,
  entities: Record<string, string>,
  barId: number
): Promise<Record<string, unknown>> {
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  
  const inicioSemana = new Date(hoje);
  inicioSemana.setDate(hoje.getDate() - hoje.getDay());
  
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  switch (intent) {
    case 'faturamento': {
      // Buscar faturamento do período
      let dataInicio = inicioSemana.toISOString().split('T')[0];
      let dataFim = hoje.toISOString().split('T')[0];
      
      if (entities.periodo === 'ontem') {
        dataInicio = ontem.toISOString().split('T')[0];
        dataFim = ontem.toISOString().split('T')[0];
      } else if (entities.periodo === 'mes_atual') {
        dataInicio = inicioMes.toISOString().split('T')[0];
      }

      const { data: eventos } = await supabase
        .from('eventos_base')
        .select('data_evento, real_r, m1_r, cl_real, nome')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', dataInicio)
        .lte('data_evento', dataFim)
        .order('data_evento', { ascending: false });

      const total = eventos?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;
      const metaTotal = eventos?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0;
      const clientesTotal = eventos?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0;
      const diasComDados = eventos?.filter(e => e.real_r > 0).length || 0;

      return {
        faturamento: total,
        meta: metaTotal,
        atingimento: metaTotal > 0 ? (total / metaTotal * 100) : 0,
        clientes: clientesTotal,
        ticketMedio: clientesTotal > 0 ? total / clientesTotal : 0,
        diasComDados,
        eventos,
        periodo: entities.periodo || 'semana_atual'
      };
    }

    case 'clientes': {
      let dataInicio = ontem.toISOString().split('T')[0];
      let dataFim = ontem.toISOString().split('T')[0];
      
      if (entities.periodo === 'semana_atual') {
        dataInicio = inicioSemana.toISOString().split('T')[0];
        dataFim = hoje.toISOString().split('T')[0];
      }

      const { data: eventos } = await supabase
        .from('eventos_base')
        .select('data_evento, cl_real, real_r, nome')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', dataInicio)
        .lte('data_evento', dataFim)
        .order('data_evento', { ascending: false });

      const clientesTotal = eventos?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0;
      const faturamento = eventos?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;

      return {
        clientes: clientesTotal,
        faturamento,
        ticketMedio: clientesTotal > 0 ? faturamento / clientesTotal : 0,
        eventos,
        periodo: entities.periodo || 'ontem'
      };
    }

    case 'cmv': {
      const { data: cmv } = await supabase
        .from('cmv_semanal')
        .select('*')
        .eq('bar_id', barId)
        .order('data_inicio', { ascending: false })
        .limit(2);

      return {
        cmvAtual: cmv?.[0]?.cmv_percentual || 0,
        cmvAnterior: cmv?.[1]?.cmv_percentual || 0,
        metaCMV: 34,
        custoTotal: cmv?.[0]?.custo_total || 0,
        faturamento: cmv?.[0]?.faturamento || 0
      };
    }

    case 'meta': {
      const { data: eventos } = await supabase
        .from('eventos_base')
        .select('real_r, m1_r')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioMes.toISOString().split('T')[0])
        .lte('data_evento', hoje.toISOString().split('T')[0]);

      const faturamentoMes = eventos?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;
      const metaMes = eventos?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0;

      // Buscar meta mensal da tabela de metas
      const { data: metaMensal } = await supabase
        .from('metas_mensais')
        .select('receita_meta')
        .eq('bar_id', barId)
        .eq('ano', hoje.getFullYear())
        .eq('mes', hoje.getMonth() + 1)
        .single();

      const diasPassados = hoje.getDate();
      const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      const diasRestantes = diasNoMes - diasPassados;

      return {
        faturamentoMes,
        metaMes: metaMensal?.receita_meta || metaMes,
        atingimento: (metaMensal?.receita_meta || metaMes) > 0 
          ? (faturamentoMes / (metaMensal?.receita_meta || metaMes) * 100) 
          : 0,
        diasPassados,
        diasRestantes,
        mediaDiaria: diasPassados > 0 ? faturamentoMes / diasPassados : 0,
        necessarioPorDia: diasRestantes > 0 
          ? ((metaMensal?.receita_meta || metaMes) - faturamentoMes) / diasRestantes 
          : 0
      };
    }

    case 'produto': {
      const { data: produtos } = await supabase
        .from('contahub_analitico')
        .select('prd_desc, grp_desc, qtd, valorfinal')
        .eq('bar_id', barId)
        .gte('trn_dtgerencial', inicioSemana.toISOString().split('T')[0])
        .order('valorfinal', { ascending: false })
        .limit(10);

      return {
        topProdutos: produtos
      };
    }

    default: {
      // Buscar resumo geral
      const { data: eventosRecentes } = await supabase
        .from('eventos_base')
        .select('*')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .order('data_evento', { ascending: false })
        .limit(7);

      return {
        eventosRecentes
      };
    }
  }
}

// Formatar resposta baseada nos dados
function formatResponse(
  intent: string,
  data: Record<string, unknown>,
  context: ChatContext
): AgentResponse {
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) =>
    new Intl.NumberFormat('pt-BR').format(Math.round(value));

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  switch (intent) {
    case 'faturamento': {
      const fat = data.faturamento as number;
      const meta = data.meta as number;
      const ating = data.atingimento as number;
      const clientes = data.clientes as number;
      const ticket = data.ticketMedio as number;
      const periodo = data.periodo as string;

      const periodoLabel = periodo === 'ontem' ? 'ontem' : 
                          periodo === 'mes_atual' ? 'este mês' : 'essa semana';

      let status = '';
      if (ating >= 100) status = '🎉 Meta batida!';
      else if (ating >= 80) status = '📈 Próximo da meta';
      else status = '⚠️ Precisa de atenção';

      return {
        success: true,
        response: `O faturamento ${periodoLabel} foi de **${formatCurrency(fat)}**.\n\n${meta > 0 ? `Isso representa **${formatPercent(ating)}** da meta de ${formatCurrency(meta)}. ${status}\n\n` : ''}${clientes > 0 ? `Foram atendidos **${formatNumber(clientes)} clientes** com ticket médio de ${formatCurrency(ticket)}.` : ''}`,
        agent: 'Analista Financeiro',
        metrics: [
          { label: 'Faturamento', value: formatCurrency(fat), trend: ating >= 100 ? 'up' : 'down' },
          { label: 'Meta', value: formatPercent(ating), trend: ating >= 100 ? 'up' : ating >= 80 ? 'neutral' : 'down' },
          { label: 'Clientes', value: formatNumber(clientes), trend: 'neutral' },
          { label: 'Ticket', value: formatCurrency(ticket), trend: ticket >= 100 ? 'up' : 'neutral' }
        ],
        suggestions: ['Comparar com semana passada', 'Ver produtos mais vendidos', 'Analisar por dia']
      };
    }

    case 'clientes': {
      const clientes = data.clientes as number;
      const fat = data.faturamento as number;
      const ticket = data.ticketMedio as number;
      const periodo = data.periodo as string;

      const periodoLabel = periodo === 'ontem' ? 'ontem' : 
                          periodo === 'semana_atual' ? 'essa semana' : 'no período';

      return {
        success: true,
        response: `${periodoLabel.charAt(0).toUpperCase() + periodoLabel.slice(1)} tivemos **${formatNumber(clientes)} clientes**!\n\nO faturamento foi de ${formatCurrency(fat)} com ticket médio de **${formatCurrency(ticket)}**.`,
        agent: 'Analista de Clientes',
        metrics: [
          { label: 'Clientes', value: formatNumber(clientes), trend: 'neutral' },
          { label: 'Faturamento', value: formatCurrency(fat), trend: 'neutral' },
          { label: 'Ticket Médio', value: formatCurrency(ticket), trend: ticket >= 100 ? 'up' : 'neutral' }
        ],
        suggestions: ['Ver clientes VIP', 'Analisar retenção', 'Horário de pico']
      };
    }

    case 'cmv': {
      const cmvAtual = data.cmvAtual as number;
      const cmvAnterior = data.cmvAnterior as number;
      const metaCMV = data.metaCMV as number;
      const variacao = cmvAnterior > 0 ? cmvAtual - cmvAnterior : 0;

      let status = '';
      if (cmvAtual <= metaCMV) status = '✅ Dentro da meta!';
      else if (cmvAtual <= metaCMV + 2) status = '⚠️ Atenção, próximo do limite';
      else status = '🚨 Acima do limite, revisar urgente!';

      return {
        success: true,
        response: `O CMV da última semana está em **${formatPercent(cmvAtual)}**.\n\n${status}\n\nA meta é manter abaixo de ${formatPercent(metaCMV)}.${variacao !== 0 ? ` Comparado com a semana anterior, ${variacao > 0 ? 'subiu' : 'caiu'} ${formatPercent(Math.abs(variacao))}.` : ''}`,
        agent: 'Analista de Custos',
        metrics: [
          { label: 'CMV Atual', value: formatPercent(cmvAtual), trend: cmvAtual <= metaCMV ? 'up' : 'down' },
          { label: 'Meta', value: formatPercent(metaCMV), trend: 'neutral' },
          { label: 'Variação', value: `${variacao >= 0 ? '+' : ''}${formatPercent(variacao)}`, trend: variacao <= 0 ? 'up' : 'down' }
        ],
        suggestions: ['Ver produtos com maior custo', 'Analisar desperdício', 'Comparar por categoria']
      };
    }

    case 'meta': {
      const fatMes = data.faturamentoMes as number;
      const metaMes = data.metaMes as number;
      const ating = data.atingimento as number;
      const diasRestantes = data.diasRestantes as number;
      const necessario = data.necessarioPorDia as number;

      let status = '';
      if (ating >= 100) status = '🎉 Meta do mês já batida!';
      else if (ating >= 80) status = '📈 Caminho certo, continue assim!';
      else status = '💪 Vamos acelerar!';

      return {
        success: true,
        response: `O progresso da meta mensal está em **${formatPercent(ating)}**!\n\n${status}\n\nFaturamento: ${formatCurrency(fatMes)} de ${formatCurrency(metaMes)}\n\n${diasRestantes > 0 && ating < 100 ? `Faltam **${diasRestantes} dias** e será necessário **${formatCurrency(necessario)}/dia** para bater a meta.` : ''}`,
        agent: 'Analista de Metas',
        metrics: [
          { label: 'Realizado', value: formatCurrency(fatMes), trend: 'neutral' },
          { label: 'Meta', value: formatCurrency(metaMes), trend: 'neutral' },
          { label: 'Atingimento', value: formatPercent(ating), trend: ating >= 80 ? 'up' : 'down' },
          { label: 'Necessário/dia', value: formatCurrency(necessario), trend: 'neutral' }
        ],
        suggestions: ['Ver faturamento por dia', 'Analisar semana atual', 'Melhores eventos do mês']
      };
    }

    case 'produto': {
      const produtos = data.topProdutos as { prd_desc: string; qtd: number; valorfinal: number }[];

      if (!produtos || produtos.length === 0) {
        return {
          success: true,
          response: 'Não encontrei dados de produtos para esse período.',
          agent: 'Analista de Produtos'
        };
      }

      const lista = produtos.slice(0, 5).map((p, i) => 
        `${i + 1}. **${p.prd_desc}** - ${formatCurrency(p.valorfinal)} (${formatNumber(p.qtd)} un.)`
      ).join('\n');

      return {
        success: true,
        response: `🏆 **Top 5 Produtos da Semana**\n\n${lista}`,
        agent: 'Analista de Produtos',
        suggestions: ['Ver por categoria', 'Analisar margem', 'Comparar com semana passada']
      };
    }

    default: {
      return {
        success: true,
        response: `Entendi sua pergunta. Para ajudar melhor, posso analisar:\n\n• **Faturamento** - vendas e receitas\n• **Clientes** - público e ticket médio\n• **CMV** - custos de mercadoria\n• **Metas** - progresso mensal\n• **Produtos** - mais vendidos\n\nSobre o que você quer saber?`,
        agent: 'Assistente Zykor',
        suggestions: ['Faturamento da semana', 'Como está a meta?', 'CMV atual']
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, barId = 3, context = {} } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Classificar intenção
    const { intent, entities } = classifyIntent(message);

    // Buscar dados relevantes
    const data = await fetchDataForIntent(supabase, intent, entities, barId);

    // Formatar resposta
    const response = formatResponse(intent, data, context as ChatContext);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro no agente:', error);
    return NextResponse.json({
      success: false,
      response: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
      error: String(error)
    }, { status: 500 });
  }
}
