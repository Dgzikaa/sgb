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

// Sistema de classificação de intenção MELHORADO
function classifyIntent(message: string): { intent: string; entities: Record<string, string> } {
  const messageLower = message.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove acentos

  const entities: Record<string, string> = {};

  // Detectar dias da semana mencionados
  const diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
  const diasMencionados = diasSemana.filter(dia => messageLower.includes(dia));
  if (diasMencionados.length > 0) {
    entities.dias = diasMencionados.join(',');
  }

  // Detectar comparações
  const isComparativo = /melhor|pior|mais|menos|comparar|versus|vs|ou\s|subindo|caindo|crescendo|diminuindo|aumentando/.test(messageLower);
  const comparaPeriodos = /essa semana.*(passada|anterior)|semana passada.*(essa|atual)|mes passado|ano passado/.test(messageLower);
  
  // Detectar tendência
  const isTendencia = /subindo|caindo|crescendo|diminuindo|aumentando|tendencia|evoluindo|melhorando|piorando/.test(messageLower);

  // Padrões de intenção (ordem importa - mais específico primeiro)
  const patterns: [string, RegExp][] = [
    // Comparativos entre dias
    ['comparativo_dias', /sexta.*sabado|sabado.*sexta|segunda.*terca|melhor dia|pior dia/],
    
    // Comparativos entre períodos
    ['comparativo_periodos', /essa semana.*passada|semana passada|mes passado|veio mais.*semana|mais gente.*semana/],
    
    // Tendência/Evolução
    ['tendencia', /ta (caindo|subindo)|esta (caindo|subindo)|evoluindo|tendencia|melhorando|piorando/],
    
    // Meta com contexto de necessidade
    ['meta_projecao', /quanto.*(falta|precisa|necessario)|falta.*meta|precisa.*dia|fechar.*mes|bater.*meta/],
    
    // Meta geral  
    ['meta', /meta|objetivo|progresso|atingimento|bateu|batemos|atingiu|atingimos/],
    
    // Faturamento
    ['faturamento', /faturamento|faturou|receita|vendas|quanto vendeu|quanto fez|deu quanto/],
    
    // Clientes
    ['clientes', /cliente|pessoa|pax|publico|quantos vieram|visitantes|gente|veio|vieram/],
    
    // Ticket
    ['ticket', /ticket|media|consumo medio|gasto medio/],
    
    // CMV
    ['cmv', /cmv|custo.*mercadoria|margem/],
    
    // Produtos
    ['produto', /produto|mais vendido|top|ranking|item|vende mais|vendeu mais/],
    
    // Operacional
    ['operacional', /horario|pico|movimento|funcionamento|lotado/],
    
    // Resumo geral
    ['resumo', /como foi|como esta|como ta|tudo bem|resumo|novidades|o que mudou|visao geral/],
  ];

  let intent = 'geral';
  for (const [key, pattern] of patterns) {
    if (pattern.test(messageLower)) {
      intent = key;
      break;
    }
  }

  // Se detectou comparação mas não pegou intent específico, forçar comparativo
  if (intent === 'geral' && isComparativo && diasMencionados.length >= 2) {
    intent = 'comparativo_dias';
  }
  if (intent === 'geral' && comparaPeriodos) {
    intent = 'comparativo_periodos';
  }
  if (intent === 'geral' && isTendencia) {
    intent = 'tendencia';
  }

  // Extrair entidades de tempo
  if (/hoje/.test(messageLower)) entities.periodo = 'hoje';
  else if (/ontem/.test(messageLower)) entities.periodo = 'ontem';
  else if (/essa semana|esta semana|semana atual/.test(messageLower)) entities.periodo = 'semana_atual';
  else if (/semana passada|ultima semana/.test(messageLower)) entities.periodo = 'semana_passada';
  else if (/esse mes|este mes|mes atual/.test(messageLower)) entities.periodo = 'mes_atual';
  else if (/mes passado|ultimo mes/.test(messageLower)) entities.periodo = 'mes_passado';

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
      // Buscar produtos e agrupar manualmente (Supabase não suporta GROUP BY direto)
      const { data: vendas } = await supabase
        .from('contahub_analitico')
        .select('prd_desc, grp_desc, qtd, valorfinal')
        .eq('bar_id', barId)
        .gte('trn_dtgerencial', inicioSemana.toISOString().split('T')[0]);

      // Agrupar por produto
      const produtosAgrupados: Record<string, { prd_desc: string; grp_desc: string; qtd: number; valorfinal: number }> = {};
      
      vendas?.forEach(v => {
        if (!v.prd_desc) return;
        const key = v.prd_desc;
        if (!produtosAgrupados[key]) {
          produtosAgrupados[key] = { prd_desc: v.prd_desc, grp_desc: v.grp_desc || '', qtd: 0, valorfinal: 0 };
        }
        produtosAgrupados[key].qtd += v.qtd || 0;
        produtosAgrupados[key].valorfinal += v.valorfinal || 0;
      });

      // Ordenar por valor e pegar top 10
      const topProdutos = Object.values(produtosAgrupados)
        .sort((a, b) => b.valorfinal - a.valorfinal)
        .slice(0, 10);

      return {
        topProdutos
      };
    }

    case 'comparativo_dias': {
      // Buscar eventos da última semana para comparar dias
      const { data: eventos } = await supabase
        .from('eventos_base')
        .select('data_evento, real_r, cl_real, nome')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioSemana.toISOString().split('T')[0])
        .order('data_evento', { ascending: false });

      // Mapear dia da semana
      const diasNome = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const eventosPorDia = eventos?.map(e => ({
        ...e,
        diaSemana: diasNome[new Date(e.data_evento + 'T12:00:00').getDay()],
        diaNum: new Date(e.data_evento + 'T12:00:00').getDay()
      })) || [];

      // Encontrar melhor e pior dia
      const melhorDia = eventosPorDia.reduce((best, e) => 
        (e.real_r || 0) > (best?.real_r || 0) ? e : best, eventosPorDia[0]);
      const piorDia = eventosPorDia.filter(e => e.real_r > 0).reduce((worst, e) => 
        (e.real_r || Infinity) < (worst?.real_r || Infinity) ? e : worst, eventosPorDia[0]);

      // Se mencionou dias específicos, comparar eles
      const diasMencionados = entities.dias?.split(',') || [];

      return {
        eventos: eventosPorDia,
        melhorDia,
        piorDia,
        diasMencionados
      };
    }

    case 'comparativo_periodos': {
      // Semana atual
      const { data: semanaAtual } = await supabase
        .from('eventos_base')
        .select('real_r, cl_real')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioSemana.toISOString().split('T')[0]);

      // Semana passada
      const inicioSemanaPassada = new Date(inicioSemana);
      inicioSemanaPassada.setDate(inicioSemanaPassada.getDate() - 7);
      const fimSemanaPassada = new Date(inicioSemana);
      fimSemanaPassada.setDate(fimSemanaPassada.getDate() - 1);

      const { data: semanaPassada } = await supabase
        .from('eventos_base')
        .select('real_r, cl_real')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioSemanaPassada.toISOString().split('T')[0])
        .lte('data_evento', fimSemanaPassada.toISOString().split('T')[0]);

      const fatAtual = semanaAtual?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;
      const fatPassada = semanaPassada?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;
      const clientesAtual = semanaAtual?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0;
      const clientesPassada = semanaPassada?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0;

      return {
        semanaAtual: { faturamento: fatAtual, clientes: clientesAtual },
        semanaPassada: { faturamento: fatPassada, clientes: clientesPassada },
        variacaoFat: fatPassada > 0 ? ((fatAtual - fatPassada) / fatPassada) * 100 : 0,
        variacaoClientes: clientesPassada > 0 ? ((clientesAtual - clientesPassada) / clientesPassada) * 100 : 0
      };
    }

    case 'tendencia': {
      // Buscar últimas 4 semanas para ver tendência
      const quatroSemanasAtras = new Date(hoje);
      quatroSemanasAtras.setDate(quatroSemanasAtras.getDate() - 28);

      const { data: eventos } = await supabase
        .from('eventos_base')
        .select('data_evento, real_r, cl_real')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', quatroSemanasAtras.toISOString().split('T')[0])
        .order('data_evento', { ascending: true });

      // Agrupar por semana
      const semanas: { semana: number; faturamento: number; clientes: number; ticketMedio: number }[] = [];
      let semanaAtual = 0;
      let fatSemana = 0;
      let cliSemana = 0;

      eventos?.forEach((e, idx) => {
        const semanaEvento = Math.floor(idx / 7);
        if (semanaEvento !== semanaAtual && fatSemana > 0) {
          semanas.push({
            semana: semanaAtual + 1,
            faturamento: fatSemana,
            clientes: cliSemana,
            ticketMedio: cliSemana > 0 ? fatSemana / cliSemana : 0
          });
          fatSemana = 0;
          cliSemana = 0;
          semanaAtual = semanaEvento;
        }
        fatSemana += e.real_r || 0;
        cliSemana += e.cl_real || 0;
      });

      // Adicionar última semana
      if (fatSemana > 0) {
        semanas.push({
          semana: semanaAtual + 1,
          faturamento: fatSemana,
          clientes: cliSemana,
          ticketMedio: cliSemana > 0 ? fatSemana / cliSemana : 0
        });
      }

      // Calcular tendência (comparar última com penúltima)
      const ultima = semanas[semanas.length - 1];
      const penultima = semanas[semanas.length - 2];
      
      let tendenciaFat = 'estavel';
      let tendenciaTicket = 'estavel';
      
      if (ultima && penultima) {
        const varFat = ((ultima.faturamento - penultima.faturamento) / penultima.faturamento) * 100;
        const varTicket = ((ultima.ticketMedio - penultima.ticketMedio) / penultima.ticketMedio) * 100;
        
        tendenciaFat = varFat > 5 ? 'subindo' : varFat < -5 ? 'caindo' : 'estavel';
        tendenciaTicket = varTicket > 5 ? 'subindo' : varTicket < -5 ? 'caindo' : 'estavel';
      }

      return {
        semanas,
        tendenciaFat,
        tendenciaTicket,
        ultimaSemana: ultima,
        penultimaSemana: penultima
      };
    }

    case 'meta_projecao': {
      // Mesma lógica de meta mas focado na projeção
      const { data: eventos } = await supabase
        .from('eventos_base')
        .select('real_r, m1_r')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioMes.toISOString().split('T')[0])
        .lte('data_evento', hoje.toISOString().split('T')[0]);

      const faturamentoMes = eventos?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;

      const { data: metaMensal } = await supabase
        .from('metas_mensais')
        .select('receita_meta')
        .eq('bar_id', barId)
        .eq('ano', hoje.getFullYear())
        .eq('mes', hoje.getMonth() + 1)
        .single();

      const metaMes = metaMensal?.receita_meta || eventos?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0;
      const diasPassados = hoje.getDate();
      const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      const diasRestantes = diasNoMes - diasPassados;
      const faltaParaMeta = Math.max(0, metaMes - faturamentoMes);
      const necessarioPorDia = diasRestantes > 0 ? faltaParaMeta / diasRestantes : 0;
      const mediaDiariaAtual = diasPassados > 0 ? faturamentoMes / diasPassados : 0;
      const projecaoFimMes = mediaDiariaAtual * diasNoMes;

      return {
        faturamentoMes,
        metaMes,
        atingimento: metaMes > 0 ? (faturamentoMes / metaMes * 100) : 0,
        diasPassados,
        diasRestantes,
        faltaParaMeta,
        necessarioPorDia,
        mediaDiariaAtual,
        projecaoFimMes,
        vaiAtingir: projecaoFimMes >= metaMes
      };
    }

    case 'resumo': {
      // Buscar resumo geral
      const { data: eventosRecentes } = await supabase
        .from('eventos_base')
        .select('*')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .order('data_evento', { ascending: false })
        .limit(7);

      const fatSemana = eventosRecentes?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;
      const clientesSemana = eventosRecentes?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0;
      const metaSemana = eventosRecentes?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0;

      return {
        eventosRecentes,
        fatSemana,
        clientesSemana,
        metaSemana,
        atingimento: metaSemana > 0 ? (fatSemana / metaSemana * 100) : 0,
        ticketMedio: clientesSemana > 0 ? fatSemana / clientesSemana : 0
      };
    }

    case 'ticket': {
      // Buscar dados para calcular ticket médio
      const { data: eventos } = await supabase
        .from('eventos_base')
        .select('real_r, cl_real')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioSemana.toISOString().split('T')[0]);

      return {
        eventos: eventos || []
      };
    }

    case 'operacional': {
      // Para operacional, retornamos dados estáticos por enquanto
      return {
        horarios: {
          quarta: '18h às 00h',
          quinta: '18h às 00h',
          sexta: '18h às 02h',
          sabado: '18h às 02h',
          domingo: '12h às 22h'
        }
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

    case 'comparativo_dias': {
      const eventos = data.eventos as { diaSemana: string; real_r: number; cl_real: number; nome: string }[];
      const melhor = data.melhorDia as { diaSemana: string; real_r: number; cl_real: number; nome: string };
      const pior = data.piorDia as { diaSemana: string; real_r: number; cl_real: number; nome: string };
      const diasMencionados = data.diasMencionados as string[];

      if (!eventos || eventos.length === 0) {
        return {
          success: true,
          response: 'Não encontrei dados de eventos para comparar dias.',
          agent: 'Analista Comparativo'
        };
      }

      // Se mencionou dias específicos, comparar eles
      if (diasMencionados && diasMencionados.length >= 2) {
        const dia1 = eventos.find(e => e.diaSemana?.toLowerCase().includes(diasMencionados[0]));
        const dia2 = eventos.find(e => e.diaSemana?.toLowerCase().includes(diasMencionados[1]));

        if (dia1 && dia2) {
          const vencedor = (dia1.real_r || 0) > (dia2.real_r || 0) ? dia1 : dia2;
          const perdedor = vencedor === dia1 ? dia2 : dia1;
          const diff = (vencedor.real_r || 0) - (perdedor.real_r || 0);

          return {
            success: true,
            response: `📊 **${vencedor.diaSemana} foi melhor!**\n\n**${vencedor.diaSemana}** (${vencedor.nome || 'evento'}): ${formatCurrency(vencedor.real_r || 0)}\n**${perdedor.diaSemana}** (${perdedor.nome || 'evento'}): ${formatCurrency(perdedor.real_r || 0)}\n\nDiferença: **${formatCurrency(diff)}** a mais no ${vencedor.diaSemana}`,
            agent: 'Analista Comparativo',
            metrics: [
              { label: vencedor.diaSemana, value: formatCurrency(vencedor.real_r || 0), trend: 'up' },
              { label: perdedor.diaSemana, value: formatCurrency(perdedor.real_r || 0), trend: 'down' },
              { label: 'Diferença', value: formatCurrency(diff), trend: 'neutral' }
            ],
            suggestions: ['Ver clientes por dia', 'Analisar ticket', 'Histórico mensal']
          };
        }
      }

      // Comparação geral
      return {
        success: true,
        response: `📊 **Comparativo de Dias**\n\n🥇 **Melhor**: ${melhor?.diaSemana || '-'} com ${formatCurrency(melhor?.real_r || 0)}\n🥉 **Pior**: ${pior?.diaSemana || '-'} com ${formatCurrency(pior?.real_r || 0)}`,
        agent: 'Analista Comparativo',
        metrics: [
          { label: 'Melhor Dia', value: melhor?.diaSemana || '-', trend: 'up' },
          { label: 'Faturamento', value: formatCurrency(melhor?.real_r || 0), trend: 'up' }
        ],
        suggestions: ['Comparar sexta e sábado', 'Ver evolução semanal', 'Analisar horários']
      };
    }

    case 'comparativo_periodos': {
      const atual = data.semanaAtual as { faturamento: number; clientes: number };
      const passada = data.semanaPassada as { faturamento: number; clientes: number };
      const varFat = data.variacaoFat as number;
      const varCli = data.variacaoClientes as number;

      const fatMelhor = varFat >= 0;
      const cliMelhor = varCli >= 0;

      return {
        success: true,
        response: `📊 **Comparativo Semanal**\n\n**Esta semana:**\n• Faturamento: ${formatCurrency(atual?.faturamento || 0)}\n• Clientes: ${formatNumber(atual?.clientes || 0)}\n\n**Semana passada:**\n• Faturamento: ${formatCurrency(passada?.faturamento || 0)}\n• Clientes: ${formatNumber(passada?.clientes || 0)}\n\n**Variação:**\n• Faturamento: ${fatMelhor ? '📈' : '📉'} ${varFat >= 0 ? '+' : ''}${formatPercent(varFat)}\n• Clientes: ${cliMelhor ? '📈' : '📉'} ${varCli >= 0 ? '+' : ''}${formatPercent(varCli)}`,
        agent: 'Analista Comparativo',
        metrics: [
          { label: 'Fat. Atual', value: formatCurrency(atual?.faturamento || 0), trend: fatMelhor ? 'up' : 'down' },
          { label: 'Fat. Anterior', value: formatCurrency(passada?.faturamento || 0), trend: 'neutral' },
          { label: 'Variação', value: `${varFat >= 0 ? '+' : ''}${formatPercent(varFat)}`, trend: fatMelhor ? 'up' : 'down' }
        ],
        suggestions: ['Ver por dia', 'Analisar produtos', 'Comparar meses']
      };
    }

    case 'tendencia': {
      const tendFat = data.tendenciaFat as string;
      const tendTicket = data.tendenciaTicket as string;
      const ultima = data.ultimaSemana as { faturamento: number; clientes: number; ticketMedio: number };
      const penultima = data.penultimaSemana as { faturamento: number; clientes: number; ticketMedio: number };

      const iconFat = tendFat === 'subindo' ? '📈' : tendFat === 'caindo' ? '📉' : '➡️';
      const iconTicket = tendTicket === 'subindo' ? '📈' : tendTicket === 'caindo' ? '📉' : '➡️';

      const labelFat = tendFat === 'subindo' ? 'crescendo' : tendFat === 'caindo' ? 'caindo' : 'estável';
      const labelTicket = tendTicket === 'subindo' ? 'crescendo' : tendTicket === 'caindo' ? 'caindo' : 'estável';

      return {
        success: true,
        response: `📊 **Análise de Tendência**\n\n**Faturamento**: ${iconFat} ${labelFat}\nÚltima semana: ${formatCurrency(ultima?.faturamento || 0)}\nAnterior: ${formatCurrency(penultima?.faturamento || 0)}\n\n**Ticket Médio**: ${iconTicket} ${labelTicket}\nÚltimo: ${formatCurrency(ultima?.ticketMedio || 0)}\nAnterior: ${formatCurrency(penultima?.ticketMedio || 0)}`,
        agent: 'Analista de Tendências',
        metrics: [
          { label: 'Faturamento', value: labelFat, trend: tendFat === 'subindo' ? 'up' : tendFat === 'caindo' ? 'down' : 'neutral' },
          { label: 'Ticket', value: labelTicket, trend: tendTicket === 'subindo' ? 'up' : tendTicket === 'caindo' ? 'down' : 'neutral' }
        ],
        suggestions: ['Ver últimas 4 semanas', 'Analisar sazonalidade', 'Comparar com ano passado']
      };
    }

    case 'meta_projecao': {
      const fatMes = data.faturamentoMes as number;
      const metaMes = data.metaMes as number;
      const ating = data.atingimento as number;
      const diasRestantes = data.diasRestantes as number;
      const necessario = data.necessarioPorDia as number;
      const mediaAtual = data.mediaDiariaAtual as number;
      const projecao = data.projecaoFimMes as number;
      const vaiAtingir = data.vaiAtingir as boolean;

      const status = vaiAtingir ? '✅ No ritmo atual, a meta será batida!' : '⚠️ Precisa acelerar para bater a meta';

      return {
        success: true,
        response: `📊 **Projeção de Meta**\n\n${status}\n\nRealizado: **${formatCurrency(fatMes)}** (${formatPercent(ating)})\nMeta: **${formatCurrency(metaMes)}**\n\nFaltam **${diasRestantes} dias** e você precisa de **${formatCurrency(necessario)}/dia**.\n\nMédia atual: ${formatCurrency(mediaAtual)}/dia\nProjeção fim do mês: ${formatCurrency(projecao)}`,
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

    case 'resumo': {
      const fatSemana = data.fatSemana as number;
      const clientesSemana = data.clientesSemana as number;
      const ating = data.atingimento as number;
      const ticket = data.ticketMedio as number;

      return {
        success: true,
        response: `📊 **Resumo da Semana**\n\n💰 Faturamento: **${formatCurrency(fatSemana)}**\n👥 Clientes: **${formatNumber(clientesSemana)}**\n🎟️ Ticket Médio: **${formatCurrency(ticket)}**\n📈 Atingimento: **${formatPercent(ating)}**`,
        agent: 'Assistente Zykor',
        metrics: [
          { label: 'Faturamento', value: formatCurrency(fatSemana), trend: 'neutral' },
          { label: 'Clientes', value: formatNumber(clientesSemana), trend: 'neutral' },
          { label: 'Ticket', value: formatCurrency(ticket), trend: 'neutral' },
          { label: 'Meta', value: formatPercent(ating), trend: ating >= 80 ? 'up' : 'down' }
        ],
        suggestions: ['Ver por dia', 'Comparar com semana passada', 'Produtos mais vendidos']
      };
    }

    case 'ticket': {
      // Handler específico para ticket médio
      const eventos = (data as { eventos?: { cl_real: number; real_r: number }[] }).eventos || [];
      const totalClientes = eventos.reduce((acc, e) => acc + (e.cl_real || 0), 0);
      const totalFat = eventos.reduce((acc, e) => acc + (e.real_r || 0), 0);
      const ticketAtual = totalClientes > 0 ? totalFat / totalClientes : 0;

      return {
        success: true,
        response: `🎟️ **Ticket Médio**\n\nO ticket médio da semana está em **${formatCurrency(ticketAtual)}**.\n\nBase: ${formatCurrency(totalFat)} / ${formatNumber(totalClientes)} clientes`,
        agent: 'Analista de Vendas',
        metrics: [
          { label: 'Ticket Médio', value: formatCurrency(ticketAtual), trend: ticketAtual >= 100 ? 'up' : 'neutral' },
          { label: 'Faturamento', value: formatCurrency(totalFat), trend: 'neutral' },
          { label: 'Clientes', value: formatNumber(totalClientes), trend: 'neutral' }
        ],
        suggestions: ['Ver evolução do ticket', 'Comparar por evento', 'Analisar por produto']
      };
    }

    case 'operacional': {
      return {
        success: true,
        response: `⏰ **Informações Operacionais**\n\nO bar opera de **Quarta a Domingo**.\n\n• Quarta/Quinta: 18h às 00h\n• Sexta/Sábado: 18h às 02h\n• Domingo: 12h às 22h\n\nPara análise de pico, me pergunte sobre um dia específico!`,
        agent: 'Assistente Operacional',
        suggestions: ['Movimento de sexta', 'Horário de pico', 'Comparar dias']
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
