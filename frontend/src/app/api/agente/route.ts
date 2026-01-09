import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// ===== SISTEMA DE CACHE PARA QUERIES FREQUENTES =====
interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number; // Time to live em ms
}

const queryCache = new Map<string, CacheEntry>();

// TTLs por tipo de consulta (em minutos)
const CACHE_TTLS: Record<string, number> = {
  faturamento_ontem: 60,       // 1 hora (dados não mudam)
  faturamento_semana: 30,      // 30 min
  faturamento_mes: 15,         // 15 min (pode estar atualizando)
  produtos_top: 60,            // 1 hora
  clientes: 30,                // 30 min
  cmv: 60,                     // 1 hora
  meta: 60,                    // 1 hora
  default: 15                  // 15 min padrão
};

function getCacheKey(intent: string, entities: Record<string, string>, barId: number): string {
  return `${intent}:${barId}:${JSON.stringify(entities)}`;
}

function getFromCache(key: string): unknown | null {
  const entry = queryCache.get(key);
  if (!entry) return null;
  
  const now = Date.now();
  if (now - entry.timestamp > entry.ttl) {
    queryCache.delete(key);
    return null;
  }
  
  console.log(`📦 Cache HIT: ${key}`);
  return entry.data;
}

function setCache(key: string, data: unknown, ttlKey: string): void {
  const ttl = (CACHE_TTLS[ttlKey] || CACHE_TTLS.default) * 60 * 1000;
  queryCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
  console.log(`💾 Cache SET: ${key} (TTL: ${ttl/1000/60}min)`);
}

// Limpar cache antigo periodicamente (max 100 entries)
function cleanupCache(): void {
  if (queryCache.size > 100) {
    const entries = Array.from(queryCache.entries());
    const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = sorted.slice(0, 50);
    toDelete.forEach(([key]) => queryCache.delete(key));
    console.log(`🧹 Cache cleanup: removed ${toDelete.length} entries`);
  }
}

// ===== TIPOS PARA AS TABELAS DO SUPABASE =====

// Tipos para as tabelas do Supabase
interface EventoBase {
  id?: number;
  bar_id?: number;
  data_evento?: string;
  nome?: string;
  real_r?: number;
  m1_r?: number;
  cl_real?: number;
  ativo?: boolean;
}

interface ContaHubAnalitico {
  prd_desc?: string;
  grp_desc?: string;
  qtd?: number;
  valorfinal?: number;
  trn_dtgerencial?: string;
}

interface CMVSemanal {
  cmv_percentual?: number;
  custo_total?: number;
  faturamento?: number;
}

interface MetaMensal {
  receita_meta?: number;
}

interface ChatContext {
  barName: string;
  currentTopic?: string; // Tema atual da conversa
  previousMessages: { role: string; content: string; agent?: string }[];
  timeOfDay?: 'morning' | 'afternoon' | 'night';
  dayOfWeek?: number;
}

interface AgentResponse {
  success: boolean;
  response: string;
  agent?: string;
  metrics?: { label: string; value: string; trend?: 'up' | 'down' | 'neutral'; percentage?: number }[];
  suggestions?: string[];
  deepLinks?: { label: string; href: string }[];
  chartData?: { label: string; value: number; color?: string }[];
  insight?: { type: 'success' | 'warning' | 'info'; text: string };
  data?: {
    faturamento?: number;
    publico?: number;
    atingimento?: number;
    cmv?: number;
    ticketMedio?: number;
    variacaoFaturamento?: number;
    variacaoPublico?: number;
  };
}

// Mapeamento de intents para deep links
const DEEP_LINKS: Record<string, { label: string; href: string }[]> = {
  faturamento: [
    { label: 'Ver Planejamento Comercial', href: '/estrategico/planejamento-comercial' },
    { label: 'Análise de Eventos', href: '/analitico/eventos' }
  ],
  clientes: [
    { label: 'Ver Clientes', href: '/analitico/clientes' },
    { label: 'CRM Inteligente', href: '/crm' }
  ],
  cmv: [
    { label: 'DRE Completo', href: '/ferramentas/dre' },
    { label: 'Orçamentação', href: '/estrategico/orcamentacao' }
  ],
  meta: [
    { label: 'Planejamento Comercial', href: '/estrategico/planejamento-comercial' },
    { label: 'Visão Mensal', href: '/estrategico/visao-mensal' }
  ],
  meta_projecao: [
    { label: 'Visão Geral Estratégica', href: '/estrategico/visao-geral' },
    { label: 'Desempenho', href: '/estrategico/desempenho' }
  ],
  produto: [
    { label: 'Produtos Analítico', href: '/analitico/produtos' },
    { label: 'Estoque', href: '/ferramentas/contagem-estoque' }
  ],
  comparativo_dias: [
    { label: 'Análise Semanal', href: '/analitico/semanal' },
    { label: 'Comparativo de Eventos', href: '/analitico/comparativo-eventos' }
  ],
  comparativo_periodos: [
    { label: 'Visão Mensal', href: '/estrategico/visao-mensal' },
    { label: 'Comparativo de Eventos', href: '/analitico/comparativo-eventos' }
  ],
  tendencia: [
    { label: 'Evolução Mensal', href: '/estrategico/visao-mensal' },
    { label: 'Dashboard Principal', href: '/home' }
  ]
};

// Função para inferir contexto da conversa
function inferContextFromHistory(
  message: string,
  previousMessages: { role: string; content: string; agent?: string }[]
): string | null {
  const messageLower = message.toLowerCase();
  
  // Perguntas vagas que precisam de contexto
  const vaguePatterns = [
    /^e (ontem|hoje|amanha)/i,
    /^e (a|o) /i,
    /^comparando/i,
    /^mas e/i,
    /^e se/i,
    /^quanto/i,
    /^como/i,
    /^qual/i
  ];
  
  const isVague = vaguePatterns.some(p => p.test(messageLower)) && messageLower.length < 30;
  
  if (isVague && previousMessages.length > 0) {
    // Pegar o último agente/tema usado
    const lastAssistant = [...previousMessages].reverse().find(m => m.role === 'assistant' && m.agent);
    if (lastAssistant?.agent) {
      // Mapear agente para intent
      const agentToIntent: Record<string, string> = {
        'Analista Financeiro': 'faturamento',
        'Analista de Clientes': 'clientes',
        'Analista de Custos': 'cmv',
        'Analista de Metas': 'meta',
        'Analista de Produtos': 'produto',
        'Analista Comparativo': 'comparativo_periodos',
        'Analista de Tendências': 'tendencia'
      };
      return agentToIntent[lastAssistant.agent] || null;
    }
  }
  
  return null;
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
    ['resumo', /como foi|como esta|como ta|tudo bem|resumo|novidades|o que mudou|visao geral|insights|desempenho/],
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
  supabase: SupabaseClient,
  intent: string,
  entities: Record<string, string>,
  barId: number
): Promise<Record<string, unknown>> {
  // Verificar cache primeiro
  const cacheKey = getCacheKey(intent, entities, barId);
  const cachedData = getFromCache(cacheKey);
  if (cachedData) {
    return cachedData as Record<string, unknown>;
  }
  
  // Limpar cache antigo
  cleanupCache();
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

      const { data: eventosRaw } = await supabase
        .from('eventos_base')
        .select('data_evento, real_r, m1_r, cl_real, nome')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', dataInicio)
        .lte('data_evento', dataFim)
        .order('data_evento', { ascending: false });

      const eventos = eventosRaw as EventoBase[] | null;
      const total = eventos?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;
      const metaTotal = eventos?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0;
      const clientesTotal = eventos?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0;
      const diasComDados = eventos?.filter(e => (e.real_r || 0) > 0).length || 0;

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

      const { data: eventosClientesRaw } = await supabase
        .from('eventos_base')
        .select('data_evento, cl_real, real_r, nome')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', dataInicio)
        .lte('data_evento', dataFim)
        .order('data_evento', { ascending: false });

      const eventosClientes = eventosClientesRaw as EventoBase[] | null;
      const clientesTotal = eventosClientes?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0;
      const faturamento = eventosClientes?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;

      return {
        clientes: clientesTotal,
        faturamento,
        ticketMedio: clientesTotal > 0 ? faturamento / clientesTotal : 0,
        eventos: eventosClientes,
        periodo: entities.periodo || 'ontem'
      };
    }

    case 'cmv': {
      const { data: cmvRaw } = await supabase
        .from('cmv_semanal')
        .select('*')
        .eq('bar_id', barId)
        .order('data_inicio', { ascending: false })
        .limit(2);

      const cmv = cmvRaw as CMVSemanal[] | null;
      return {
        cmvAtual: cmv?.[0]?.cmv_percentual || 0,
        cmvAnterior: cmv?.[1]?.cmv_percentual || 0,
        metaCMV: 34,
        custoTotal: cmv?.[0]?.custo_total || 0,
        faturamento: cmv?.[0]?.faturamento || 0
      };
    }

    case 'meta': {
      const { data: eventosMetaRaw } = await supabase
        .from('eventos_base')
        .select('real_r, m1_r')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioMes.toISOString().split('T')[0])
        .lte('data_evento', hoje.toISOString().split('T')[0]);

      const eventosMeta = eventosMetaRaw as EventoBase[] | null;
      const faturamentoMes = eventosMeta?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;
      const metaMesEventos = eventosMeta?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0;

      // Buscar meta mensal da tabela de metas
      const { data: metaMensalRaw } = await supabase
        .from('metas_mensais')
        .select('receita_meta')
        .eq('bar_id', barId)
        .eq('ano', hoje.getFullYear())
        .eq('mes', hoje.getMonth() + 1)
        .single();

      const metaMensal = metaMensalRaw as MetaMensal | null;
      const diasPassados = hoje.getDate();
      const diasNoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate();
      const diasRestantes = diasNoMes - diasPassados;
      const metaFinal = metaMensal?.receita_meta || metaMesEventos;

      return {
        faturamentoMes,
        metaMes: metaFinal,
        atingimento: metaFinal > 0 
          ? (faturamentoMes / metaFinal * 100) 
          : 0,
        diasPassados,
        diasRestantes,
        mediaDiaria: diasPassados > 0 ? faturamentoMes / diasPassados : 0,
        necessarioPorDia: diasRestantes > 0 
          ? (metaFinal - faturamentoMes) / diasRestantes 
          : 0
      };
    }

    case 'produto': {
      // Buscar produtos e agrupar manualmente (Supabase não suporta GROUP BY direto)
      const { data: vendasRaw } = await supabase
        .from('contahub_analitico')
        .select('prd_desc, grp_desc, qtd, valorfinal')
        .eq('bar_id', barId)
        .gte('trn_dtgerencial', inicioSemana.toISOString().split('T')[0]);

      const vendas = vendasRaw as ContaHubAnalitico[] | null;
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
      const { data: eventosCompDiasRaw } = await supabase
        .from('eventos_base')
        .select('data_evento, real_r, cl_real, nome')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioSemana.toISOString().split('T')[0])
        .order('data_evento', { ascending: false });

      const eventosCompDias = eventosCompDiasRaw as EventoBase[] | null;
      // Mapear dia da semana
      const diasNome = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const eventosPorDia = eventosCompDias?.map(e => ({
        ...e,
        diaSemana: diasNome[new Date((e.data_evento || '') + 'T12:00:00').getDay()],
        diaNum: new Date((e.data_evento || '') + 'T12:00:00').getDay()
      })) || [];

      // Encontrar melhor e pior dia
      const melhorDia = eventosPorDia.reduce((best, e) => 
        (e.real_r || 0) > (best?.real_r || 0) ? e : best, eventosPorDia[0]);
      const piorDia = eventosPorDia.filter(e => (e.real_r || 0) > 0).reduce((worst, e) => 
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
      const { data: semanaAtualRaw } = await supabase
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

      const { data: semanaPassadaRaw } = await supabase
        .from('eventos_base')
        .select('real_r, cl_real')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioSemanaPassada.toISOString().split('T')[0])
        .lte('data_evento', fimSemanaPassada.toISOString().split('T')[0]);

      const semanaAtualData = semanaAtualRaw as EventoBase[] | null;
      const semanaPassadaData = semanaPassadaRaw as EventoBase[] | null;
      const fatAtual = semanaAtualData?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;
      const fatPassada = semanaPassadaData?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;
      const clientesAtual = semanaAtualData?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0;
      const clientesPassada = semanaPassadaData?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0;

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

      const { data: eventosTendenciaRaw } = await supabase
        .from('eventos_base')
        .select('data_evento, real_r, cl_real')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', quatroSemanasAtras.toISOString().split('T')[0])
        .order('data_evento', { ascending: true });

      const eventosTendencia = eventosTendenciaRaw as EventoBase[] | null;
      // Agrupar por semana
      const semanas: { semana: number; faturamento: number; clientes: number; ticketMedio: number }[] = [];
      let semanaAtualNum = 0;
      let fatSemana = 0;
      let cliSemana = 0;

      eventosTendencia?.forEach((e, idx) => {
        const semanaEvento = Math.floor(idx / 7);
        if (semanaEvento !== semanaAtualNum && fatSemana > 0) {
          semanas.push({
            semana: semanaAtualNum + 1,
            faturamento: fatSemana,
            clientes: cliSemana,
            ticketMedio: cliSemana > 0 ? fatSemana / cliSemana : 0
          });
          fatSemana = 0;
          cliSemana = 0;
          semanaAtualNum = semanaEvento;
        }
        fatSemana += e.real_r || 0;
        cliSemana += e.cl_real || 0;
      });

      // Adicionar última semana
      if (fatSemana > 0) {
        semanas.push({
          semana: semanaAtualNum + 1,
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
      const { data: eventosProjecaoRaw } = await supabase
        .from('eventos_base')
        .select('real_r, m1_r')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioMes.toISOString().split('T')[0])
        .lte('data_evento', hoje.toISOString().split('T')[0]);

      const eventosProjecao = eventosProjecaoRaw as EventoBase[] | null;
      const faturamentoMes = eventosProjecao?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;

      const { data: metaMensalProjecaoRaw } = await supabase
        .from('metas_mensais')
        .select('receita_meta')
        .eq('bar_id', barId)
        .eq('ano', hoje.getFullYear())
        .eq('mes', hoje.getMonth() + 1)
        .single();

      const metaMensalProjecao = metaMensalProjecaoRaw as MetaMensal | null;
      const metaMes = metaMensalProjecao?.receita_meta || eventosProjecao?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0;
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
      const { data: eventosRecentesRaw } = await supabase
        .from('eventos_base')
        .select('*')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .order('data_evento', { ascending: false })
        .limit(7);

      const eventosRecentes = eventosRecentesRaw as EventoBase[] | null;
      const fatSemana = eventosRecentes?.reduce((acc, e) => acc + (e.real_r || 0), 0) || 0;
      const clientesSemana = eventosRecentes?.reduce((acc, e) => acc + (e.cl_real || 0), 0) || 0;
      const metaSemana = eventosRecentes?.reduce((acc, e) => acc + (e.m1_r || 0), 0) || 0;

      // Buscar CMV também para o resumo
      const { data: cmvResumoRaw } = await supabase
        .from('cmv_semanal')
        .select('cmv_percentual')
        .eq('bar_id', barId)
        .order('data_inicio', { ascending: false })
        .limit(1);

      const cmvResumo = (cmvResumoRaw as CMVSemanal[] | null)?.[0]?.cmv_percentual || 0;

      return {
        eventosRecentes,
        fatSemana,
        clientesSemana,
        metaSemana,
        atingimento: metaSemana > 0 ? (fatSemana / metaSemana * 100) : 0,
        ticketMedio: clientesSemana > 0 ? fatSemana / clientesSemana : 0,
        cmv: cmvResumo
      };
    }

    case 'ticket': {
      // Buscar dados para calcular ticket médio
      const { data: eventosTicketRaw } = await supabase
        .from('eventos_base')
        .select('real_r, cl_real')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .gte('data_evento', inicioSemana.toISOString().split('T')[0]);

      const eventosTicket = eventosTicketRaw as EventoBase[] | null;
      return {
        eventos: eventosTicket || []
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
      const { data: eventosDefaultRaw } = await supabase
        .from('eventos_base')
        .select('*')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .order('data_evento', { ascending: false })
        .limit(7);

      const eventosDefault = eventosDefaultRaw as EventoBase[] | null;
      return {
        eventosRecentes: eventosDefault
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

      let insightType: 'success' | 'warning' | 'info' = 'info';
      let insightText = '';
      
      if (ating >= 100) {
        insightType = 'success';
        insightText = 'Meta batida! Continue assim para superar ainda mais.';
      } else if (ating >= 80) {
        insightType = 'info';
        insightText = 'No caminho certo! Mantenha o ritmo.';
      } else {
        insightType = 'warning';
        insightText = 'Atenção: precisa acelerar para bater a meta.';
      }

      return {
        success: true,
        response: `O faturamento ${periodoLabel} foi de **${formatCurrency(fat)}**.\n\n${meta > 0 ? `Isso representa **${formatPercent(ating)}** da meta de ${formatCurrency(meta)}.\n\n` : ''}${clientes > 0 ? `Foram atendidos **${formatNumber(clientes)} clientes** com ticket médio de ${formatCurrency(ticket)}.` : ''}`,
        agent: 'Analista Financeiro',
        metrics: [
          { label: 'Faturamento', value: formatCurrency(fat), trend: ating >= 100 ? 'up' : 'down', percentage: ating },
          { label: 'Meta', value: formatPercent(ating), trend: ating >= 100 ? 'up' : ating >= 80 ? 'neutral' : 'down' },
          { label: 'Clientes', value: formatNumber(clientes), trend: 'neutral' },
          { label: 'Ticket', value: formatCurrency(ticket), trend: ticket >= 100 ? 'up' : 'neutral' }
        ],
        suggestions: ['Comparar com semana passada', 'Ver produtos mais vendidos', 'Analisar por dia'],
        deepLinks: DEEP_LINKS.faturamento,
        insight: { type: insightType, text: insightText }
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

      let insightType: 'success' | 'warning' | 'info' = 'info';
      let insightText = '';
      
      if (cmvAtual <= metaCMV) {
        insightType = 'success';
        insightText = 'CMV dentro da meta! Bom controle de custos.';
      } else if (cmvAtual <= metaCMV + 2) {
        insightType = 'warning';
        insightText = 'Atenção: próximo do limite. Monitore compras e desperdício.';
      } else {
        insightType = 'warning';
        insightText = 'CMV acima do limite! Revisar fornecedores e controle de estoque.';
      }

      return {
        success: true,
        response: `O CMV da última semana está em **${formatPercent(cmvAtual)}**.\n\nA meta é manter abaixo de ${formatPercent(metaCMV)}.${variacao !== 0 ? ` Comparado com a semana anterior, ${variacao > 0 ? 'subiu' : 'caiu'} ${formatPercent(Math.abs(variacao))}.` : ''}`,
        agent: 'Analista de Custos',
        metrics: [
          { label: 'CMV Atual', value: formatPercent(cmvAtual), trend: cmvAtual <= metaCMV ? 'up' : 'down' },
          { label: 'Meta', value: formatPercent(metaCMV), trend: 'neutral' },
          { label: 'Variação', value: `${variacao >= 0 ? '+' : ''}${formatPercent(variacao)}`, trend: variacao <= 0 ? 'up' : 'down' }
        ],
        suggestions: ['Ver produtos com maior custo', 'Analisar desperdício', 'Comparar por categoria'],
        deepLinks: DEEP_LINKS.cmv,
        insight: { type: insightType, text: insightText }
      };
    }

    case 'meta': {
      const fatMes = data.faturamentoMes as number;
      const metaMes = data.metaMes as number;
      const ating = data.atingimento as number;
      const diasRestantes = data.diasRestantes as number;
      const necessario = data.necessarioPorDia as number;

      let insightType: 'success' | 'warning' | 'info' = 'info';
      let insightText = '';
      
      if (ating >= 100) {
        insightType = 'success';
        insightText = 'Meta do mês já batida! Excelente trabalho!';
      } else if (ating >= 80) {
        insightType = 'info';
        insightText = 'Caminho certo, continue assim!';
      } else {
        insightType = 'warning';
        insightText = 'Vamos acelerar! Foco nos próximos eventos.';
      }

      return {
        success: true,
        response: `O progresso da meta mensal está em **${formatPercent(ating)}**!\n\nFaturamento: ${formatCurrency(fatMes)} de ${formatCurrency(metaMes)}\n\n${diasRestantes > 0 && ating < 100 ? `Faltam **${diasRestantes} dias** e será necessário **${formatCurrency(necessario)}/dia** para bater a meta.` : ''}`,
        agent: 'Analista de Metas',
        metrics: [
          { label: 'Realizado', value: formatCurrency(fatMes), trend: 'neutral', percentage: ating },
          { label: 'Meta', value: formatCurrency(metaMes), trend: 'neutral' },
          { label: 'Atingimento', value: formatPercent(ating), trend: ating >= 80 ? 'up' : 'down' },
          { label: 'Necessário/dia', value: formatCurrency(necessario), trend: 'neutral' }
        ],
        suggestions: ['Ver faturamento por dia', 'Analisar semana atual', 'Melhores eventos do mês'],
        deepLinks: DEEP_LINKS.meta,
        insight: { type: insightType, text: insightText }
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

      let insightType: 'success' | 'warning' | 'info' = 'info';
      let insightText = '';
      
      if (fatMelhor && cliMelhor) {
        insightType = 'success';
        insightText = 'Ótimo! Tanto faturamento quanto clientes cresceram.';
      } else if (!fatMelhor && !cliMelhor) {
        insightType = 'warning';
        insightText = 'Atenção: queda em faturamento e clientes.';
      } else {
        insightType = 'info';
        insightText = fatMelhor ? 'Faturamento subiu mesmo com menos clientes - ticket aumentou!' : 'Mais clientes, mas faturamento menor - verifique o ticket.';
      }

      return {
        success: true,
        response: `📊 **Comparativo Semanal**\n\n**Esta semana:**\n• Faturamento: ${formatCurrency(atual?.faturamento || 0)}\n• Clientes: ${formatNumber(atual?.clientes || 0)}\n\n**Semana passada:**\n• Faturamento: ${formatCurrency(passada?.faturamento || 0)}\n• Clientes: ${formatNumber(passada?.clientes || 0)}\n\n**Variação:**\n• Faturamento: ${fatMelhor ? '📈' : '📉'} ${varFat >= 0 ? '+' : ''}${formatPercent(varFat)}\n• Clientes: ${cliMelhor ? '📈' : '📉'} ${varCli >= 0 ? '+' : ''}${formatPercent(varCli)}`,
        agent: 'Analista Comparativo',
        metrics: [
          { label: 'Fat. Atual', value: formatCurrency(atual?.faturamento || 0), trend: fatMelhor ? 'up' : 'down' },
          { label: 'Fat. Anterior', value: formatCurrency(passada?.faturamento || 0), trend: 'neutral' },
          { label: 'Variação', value: `${varFat >= 0 ? '+' : ''}${formatPercent(varFat)}`, trend: fatMelhor ? 'up' : 'down' }
        ],
        suggestions: ['Ver por dia', 'Analisar produtos', 'Comparar meses'],
        deepLinks: DEEP_LINKS.comparativo_periodos,
        chartData: [
          { label: 'Passada', value: passada?.faturamento || 0, color: 'bg-gray-500' },
          { label: 'Atual', value: atual?.faturamento || 0, color: fatMelhor ? 'bg-green-500' : 'bg-red-500' }
        ],
        insight: { type: insightType, text: insightText }
      };
    }

    case 'tendencia': {
      const tendFat = data.tendenciaFat as string;
      const tendTicket = data.tendenciaTicket as string;
      const ultima = data.ultimaSemana as { faturamento: number; clientes: number; ticketMedio: number };
      const penultima = data.penultimaSemana as { faturamento: number; clientes: number; ticketMedio: number };
      const semanas = data.semanas as { semana: number; faturamento: number }[] || [];

      const iconFat = tendFat === 'subindo' ? '📈' : tendFat === 'caindo' ? '📉' : '➡️';
      const iconTicket = tendTicket === 'subindo' ? '📈' : tendTicket === 'caindo' ? '📉' : '➡️';

      const labelFat = tendFat === 'subindo' ? 'crescendo' : tendFat === 'caindo' ? 'caindo' : 'estável';
      const labelTicket = tendTicket === 'subindo' ? 'crescendo' : tendTicket === 'caindo' ? 'caindo' : 'estável';

      let insightType: 'success' | 'warning' | 'info' = 'info';
      let insightText = '';
      
      if (tendFat === 'subindo' && tendTicket === 'subindo') {
        insightType = 'success';
        insightText = 'Excelente! Faturamento e ticket médio em alta.';
      } else if (tendFat === 'caindo') {
        insightType = 'warning';
        insightText = 'Faturamento em queda. Analise eventos e promoções.';
      } else {
        insightType = 'info';
        insightText = 'Tendência estável. Bom momento para experimentar novidades.';
      }

      // Gerar dados do gráfico das últimas semanas
      const chartData = semanas.slice(-4).map((s, idx) => ({
        label: `S${idx + 1}`,
        value: s.faturamento,
        color: idx === semanas.length - 1 
          ? (tendFat === 'subindo' ? 'bg-green-500' : tendFat === 'caindo' ? 'bg-red-500' : 'bg-blue-500')
          : 'bg-gray-500'
      }));

      return {
        success: true,
        response: `📊 **Análise de Tendência**\n\n**Faturamento**: ${iconFat} ${labelFat}\nÚltima semana: ${formatCurrency(ultima?.faturamento || 0)}\nAnterior: ${formatCurrency(penultima?.faturamento || 0)}\n\n**Ticket Médio**: ${iconTicket} ${labelTicket}\nÚltimo: ${formatCurrency(ultima?.ticketMedio || 0)}\nAnterior: ${formatCurrency(penultima?.ticketMedio || 0)}`,
        agent: 'Analista de Tendências',
        metrics: [
          { label: 'Faturamento', value: labelFat, trend: tendFat === 'subindo' ? 'up' : tendFat === 'caindo' ? 'down' : 'neutral' },
          { label: 'Ticket', value: labelTicket, trend: tendTicket === 'subindo' ? 'up' : tendTicket === 'caindo' ? 'down' : 'neutral' }
        ],
        suggestions: ['Ver últimas 4 semanas', 'Analisar sazonalidade', 'Comparar com ano passado'],
        deepLinks: DEEP_LINKS.tendencia,
        chartData: chartData.length > 0 ? chartData : undefined,
        insight: { type: insightType, text: insightText }
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
      
      // Buscar CMV do data se disponível
      const cmv = (data.cmv as number) || 0;

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
        suggestions: ['Ver por dia', 'Comparar com semana passada', 'Produtos mais vendidos'],
        // Dados brutos para o dashboard
        data: {
          faturamento: fatSemana,
          publico: clientesSemana,
          atingimento: ating,
          cmv: cmv,
          ticketMedio: ticket
        }
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

// ===== FUNÇÕES DE MÉTRICAS E HISTÓRICO =====
async function registrarMetrica(
  supabase: SupabaseClient,
  dados: {
    bar_id: number;
    session_id?: string;
    agent_name: string;
    intent: string;
    query: string;
    response_time_ms: number;
    success: boolean;
    cache_hit: boolean;
    error_message?: string;
  }
) {
  try {
    await supabase.from('agente_uso').insert({
      bar_id: dados.bar_id,
      session_id: dados.session_id || null,
      agent_name: dados.agent_name,
      intent: dados.intent,
      query: dados.query,
      response_time_ms: dados.response_time_ms,
      success: dados.success,
      cache_hit: dados.cache_hit,
      error_message: dados.error_message || null
    });
  } catch (error) {
    console.error('Erro ao registrar métrica:', error);
  }
}

async function salvarHistorico(
  supabase: SupabaseClient,
  dados: {
    bar_id: number;
    session_id: string;
    role: 'user' | 'assistant';
    content: string;
    agent_used?: string;
    metrics?: unknown;
    suggestions?: string[];
    deep_links?: unknown;
    chart_data?: unknown;
  }
) {
  try {
    await supabase.from('agente_historico').insert({
      bar_id: dados.bar_id,
      session_id: dados.session_id,
      role: dados.role,
      content: dados.content,
      agent_used: dados.agent_used || null,
      metrics: dados.metrics || null,
      suggestions: dados.suggestions || null,
      deep_links: dados.deep_links || null,
      chart_data: dados.chart_data || null
    });
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let cacheHit = false;
  
  try {
    const body = await request.json();
    const { message, barId = 3, context = {}, sessionId } = body;
    const chatContext = context as ChatContext;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Mensagem é obrigatória' }, { status: 400 });
    }

    // Inicializar Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Salvar mensagem do usuário no histórico
    if (sessionId) {
      await salvarHistorico(supabase, {
        bar_id: barId,
        session_id: sessionId,
        role: 'user',
        content: message
      });
    }

    // Classificar intenção
    let { intent, entities } = classifyIntent(message);

    // Se a intenção for "geral", tentar inferir do contexto da conversa
    if (intent === 'geral' && chatContext.previousMessages?.length > 0) {
      const inferredIntent = inferContextFromHistory(message, chatContext.previousMessages);
      if (inferredIntent) {
        intent = inferredIntent;
        console.log(`[Agente] Intenção inferida do contexto: ${inferredIntent}`);
      }
    }

    // Verificar cache
    const cacheKey = getCacheKey(intent, entities, barId);
    let data = getFromCache(cacheKey) as Record<string, unknown> | null;
    
    if (data) {
      cacheHit = true;
    } else {
      // Buscar dados relevantes
      data = await fetchDataForIntent(supabase, intent, entities, barId);
      
      // Cachear o resultado
      setCache(cacheKey, data, intent);
    }

    // Formatar resposta
    const response = formatResponse(intent, data, chatContext);
    const responseTime = Date.now() - startTime;

    // Registrar métrica de uso
    await registrarMetrica(supabase, {
      bar_id: barId,
      session_id: sessionId,
      agent_name: response.agent || 'Assistente Zykor',
      intent,
      query: message,
      response_time_ms: responseTime,
      success: response.success,
      cache_hit: cacheHit
    });

    // Salvar resposta no histórico
    if (sessionId) {
      await salvarHistorico(supabase, {
        bar_id: barId,
        session_id: sessionId,
        role: 'assistant',
        content: response.response,
        agent_used: response.agent,
        metrics: response.metrics,
        suggestions: response.suggestions,
        deep_links: response.deepLinks,
        chart_data: response.chartData
      });
    }

    // Adicionar metadata de performance
    return NextResponse.json({
      ...response,
      _meta: {
        responseTime,
        cacheHit,
        intent,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error('Erro no agente:', error);
    
    // Registrar erro nas métricas
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    await registrarMetrica(supabase, {
      bar_id: 3,
      agent_name: 'Sistema',
      intent: 'erro',
      query: '',
      response_time_ms: responseTime,
      success: false,
      cache_hit: false,
      error_message: String(error)
    });
    
    return NextResponse.json({
      success: false,
      response: 'Desculpe, ocorreu um erro ao processar sua solicitação. Tente novamente.',
      error: String(error)
    }, { status: 500 });
  }
}

// ===== ENDPOINT DE FEEDBACK =====
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { metricaId, rating, feedback } = body;

    if (!metricaId || !rating) {
      return NextResponse.json({ 
        success: false, 
        error: 'metricaId e rating são obrigatórios' 
      }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error } = await supabase
      .from('agente_uso')
      .update({
        feedback_rating: rating,
        feedback_text: feedback || null
      })
      .eq('id', metricaId);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Feedback registrado com sucesso!' });
  } catch (error) {
    console.error('Erro ao registrar feedback:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}

// ===== ENDPOINT PARA CARREGAR HISTÓRICO =====
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const barId = searchParams.get('barId') || '3';

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (sessionId) {
      // Carregar histórico de uma sessão específica
      const { data, error } = await supabase
        .from('agente_historico')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return NextResponse.json({ success: true, historico: data });
    } else {
      // Listar últimas sessões do bar
      const { data, error } = await supabase
        .from('agente_historico')
        .select('session_id, created_at, content')
        .eq('bar_id', parseInt(barId))
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Agrupar por sessão
      const sessoes: Record<string, { session_id: string; primeira_mensagem: string; data: string }> = {};
      data?.forEach(msg => {
        if (!sessoes[msg.session_id]) {
          sessoes[msg.session_id] = {
            session_id: msg.session_id,
            primeira_mensagem: msg.content.substring(0, 50) + '...',
            data: msg.created_at
          };
        }
      });

      return NextResponse.json({ 
        success: true, 
        sessoes: Object.values(sessoes).slice(0, 10)
      });
    }
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
    return NextResponse.json({
      success: false,
      error: String(error)
    }, { status: 500 });
  }
}
