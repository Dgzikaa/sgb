import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ===== CACHE =====
interface CacheEntry {
  data: any;
  timestamp: number;
  version: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const CACHE_VERSION = 2; // v2: Busca TODOS os clientes

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (entry.version !== CACHE_VERSION) {
    cache.delete(key);
    console.log(`🔄 Cache retenção invalidado (versão ${entry.version} → ${CACHE_VERSION})`);
    return null;
  }
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

function setCache(key: string, data: any) {
  cache.set(key, { data, timestamp: Date.now(), version: CACHE_VERSION });
}

// ===== FUNÇÃO PARA BUSCAR TODOS OS DADOS COM PAGINAÇÃO =====
async function fetchAllData(tableName: string, columns: string, filters: any = {}) {
  let allData: any[] = [];
  let from = 0;
  const limit = 1000;
  const MAX_ITERATIONS = 200;
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    
    let query = supabase
      .from(tableName)
      .select(columns)
      .range(from, from + limit - 1);
    
    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (key.includes('gte_')) {
        query = query.gte(key.replace('gte_', ''), value);
      } else if (key.includes('lte_')) {
        query = query.lte(key.replace('lte_', ''), value);
      } else if (key.includes('eq_')) {
        query = query.eq(key.replace('eq_', ''), value);
      } else if (key.includes('not_null_')) {
        query = query.not(key.replace('not_null_', ''), 'is', null);
      }
    });
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`❌ Erro ao buscar ${tableName}:`, error);
      break;
    }
    
    if (!data || data.length === 0) {
      break;
    }
    
    allData.push(...data);
    
    if (allData.length % 10000 === 0 || data.length < limit) {
      console.log(`  ✓ ${tableName}: ${allData.length} registros carregados`);
    }
    
    if (data.length < limit) {
      break;
    }
    
    from += limit;
  }
  
  return allData;
}

interface CohortData {
  cohort: string; // Mês/Ano da primeira visita
  total_clientes: number;
  retencao_mes_0: number; // 100%
  retencao_mes_1: number;
  retencao_mes_2: number;
  retencao_mes_3: number;
  retencao_mes_6: number;
  retencao_mes_12: number;
}

interface JornadaCliente {
  telefone: string;
  nome: string;
  etapa_atual: 'novo' | 'engajado' | 'fiel' | 'em_risco' | 'perdido';
  dias_no_funil: number;
  visitas_totais: number;
  dias_sem_visitar: number;
  ultima_visita: string;
  primeira_visita: string;
  ticket_medio: number;
  total_gasto: number;
  proxima_acao_sugerida: string;
}

function getMesAno(data: Date): string {
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${ano}-${mes}`;
}

function getDiferencaMeses(data1: Date, data2: Date): number {
  const anos = data2.getFullYear() - data1.getFullYear();
  const meses = data2.getMonth() - data1.getMonth();
  return anos * 12 + meses;
}

function determinarEtapaJornada(dados: {
  diasSemVisitar: number;
  totalVisitas: number;
  diasComoCliente: number;
}): 'novo' | 'engajado' | 'fiel' | 'em_risco' | 'perdido' {
  const { diasSemVisitar, totalVisitas, diasComoCliente } = dados;

  // Perdido: 90+ dias sem visitar
  if (diasSemVisitar > 90) return 'perdido';

  // Em Risco: 30-90 dias sem visitar
  if (diasSemVisitar > 30) return 'em_risco';

  // Fiel: 10+ visitas e cliente há mais de 180 dias
  if (totalVisitas >= 10 && diasComoCliente > 180) return 'fiel';

  // Engajado: 3+ visitas
  if (totalVisitas >= 3) return 'engajado';

  // Novo: 1-2 visitas
  return 'novo';
}

function getProximaAcao(etapa: string): string {
  switch (etapa) {
    case 'novo':
      return 'Enviar boas-vindas e cupom de segunda visita (15% OFF)';
    case 'engajado':
      return 'Manter engajamento com convites para eventos especiais';
    case 'fiel':
      return 'Incluir em programa VIP e oferecer benefícios exclusivos';
    case 'em_risco':
      return 'Campanha de reengajamento URGENTE com cupom 20-25% OFF';
    case 'perdido':
      return 'Campanha de reativação com cupom agressivo 30% OFF + convite VIP';
    default:
      return '';
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'cohort'; // cohort ou jornada
    const barIdParam = searchParams.get('bar_id');
    
    if (!barIdParam) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }
    const barId = parseInt(barIdParam);

    console.log(`🔍 API Retenção - tipo: ${tipo}, bar_id: ${barId}`);

    if (tipo === 'cohort') {
      return await calcularCohorts(barId);
    } else if (tipo === 'jornada') {
      const telefone = searchParams.get('telefone');
      if (telefone) {
        return await buscarJornadaCliente(telefone, barId);
      } else {
        return await listarJornadasClientes(barId);
      }
    }

    throw new Error('Tipo inválido');

  } catch (error: any) {
    console.error('Erro ao processar retenção:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function calcularCohorts(barId: number) {
  // Verificar cache
  const cacheKey = `cohorts_${barId}`;
  const cached = getCached(cacheKey);
  
  if (cached) {
    console.log(`⚡ Cache HIT: Usando dados de cohorts em cache`);
    return NextResponse.json({
      success: true,
      data: cached,
      fromCache: true
    });
  }

  console.log(`🔍 Cache MISS: Calculando cohorts do ContaHub...`);

  // Buscar dados do ContaHub
  const contahubData = await fetchAllData(
    'contahub_periodo',
    'cli_nome, cli_fone, dt_gerencial, vr_couvert, vr_pagamentos',
    { eq_bar_id: barId }
  );

  // Filtrar clientes válidos
  const dadosValidos = contahubData.filter(item => 
    item.cli_fone && item.cli_fone.trim() !== ''
  );
  console.log(`💳 ContaHub: ${dadosValidos.length} registros válidos`);

  // Consolidar por cliente
  const clientesMap = new Map<string, Date[]>();

  dadosValidos.forEach(item => {
    const telefone = item.cli_fone.replace(/\D/g, '').slice(-9);
    if (telefone.length < 9) return;
    
    if (!clientesMap.has(telefone)) {
      clientesMap.set(telefone, []);
    }
    clientesMap.get(telefone)!.push(new Date(item.dt_gerencial));
  });

  // Para cada cliente, determinar cohort (mês da primeira visita)
  const cohortsMap = new Map<string, {
    clientes: string[];
    retencaoPorMes: Map<number, Set<string>>;
  }>();

  for (const [telefone, visitas] of clientesMap.entries()) {
    visitas.sort((a, b) => a.getTime() - b.getTime());
    const primeiraVisita = visitas[0];
    const cohort = getMesAno(primeiraVisita);

    if (!cohortsMap.has(cohort)) {
      cohortsMap.set(cohort, {
        clientes: [],
        retencaoPorMes: new Map()
      });
    }

    const cohortData = cohortsMap.get(cohort)!;
    cohortData.clientes.push(telefone);

    // Para cada visita, calcular quantos meses após a primeira visita
    visitas.forEach(visitaData => {
      const mesesDepois = getDiferencaMeses(primeiraVisita, visitaData);
      if (!cohortData.retencaoPorMes.has(mesesDepois)) {
        cohortData.retencaoPorMes.set(mesesDepois, new Set());
      }
      cohortData.retencaoPorMes.get(mesesDepois)!.add(telefone);
    });
  }

  // Calcular taxas de retenção
  const cohorts: CohortData[] = [];

  for (const [cohort, data] of cohortsMap.entries()) {
    const totalClientes = data.clientes.length;

    cohorts.push({
      cohort,
      total_clientes: totalClientes,
      retencao_mes_0: 100,
      retencao_mes_1: data.retencaoPorMes.has(1)
        ? Math.round((data.retencaoPorMes.get(1)!.size / totalClientes) * 100)
        : 0,
      retencao_mes_2: data.retencaoPorMes.has(2)
        ? Math.round((data.retencaoPorMes.get(2)!.size / totalClientes) * 100)
        : 0,
      retencao_mes_3: data.retencaoPorMes.has(3)
        ? Math.round((data.retencaoPorMes.get(3)!.size / totalClientes) * 100)
        : 0,
      retencao_mes_6: data.retencaoPorMes.has(6)
        ? Math.round((data.retencaoPorMes.get(6)!.size / totalClientes) * 100)
        : 0,
      retencao_mes_12: data.retencaoPorMes.has(12)
        ? Math.round((data.retencaoPorMes.get(12)!.size / totalClientes) * 100)
        : 0,
    });
  }

  // Ordenar por cohort (mais recente primeiro)
  cohorts.sort((a, b) => b.cohort.localeCompare(a.cohort));

  // Salvar no cache
  setCache(cacheKey, cohorts);

  return NextResponse.json({
    success: true,
    data: cohorts,
    fromCache: false
  });
}

async function buscarJornadaCliente(telefone: string, barId: number) {
  // Normalizar telefone para busca
  const telefoneNorm = telefone.replace(/\D/g, '').slice(-9);
  
  // Buscar visitas do cliente no ContaHub
  const { data: contahubData, error } = await supabase
    .from('contahub_periodo')
    .select('cli_nome, dt_gerencial, vr_couvert, vr_pagamentos')
    .eq('bar_id', barId)
    .ilike('cli_fone', `%${telefoneNorm}%`)
    .order('dt_gerencial', { ascending: true });

  if (error) {
    throw new Error(`Erro ao buscar cliente: ${error.message}`);
  }

  if (!contahubData || contahubData.length === 0) {
    throw new Error('Cliente não encontrado');
  }

  // Processar visitas
  const visitas = contahubData.map(v => ({
    data: new Date(v.dt_gerencial),
    valor: (v.vr_couvert || 0) + (v.vr_pagamentos || 0)
  }));

  const hoje = new Date();
  const primeiraVisita = visitas[0].data;
  const ultimaVisita = visitas[visitas.length - 1].data;
  const diasComoCliente = Math.floor((hoje.getTime() - primeiraVisita.getTime()) / (1000 * 60 * 60 * 24));
  const diasSemVisitar = Math.floor((hoje.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24));

  const totalGasto = visitas.reduce((sum, v) => sum + v.valor, 0);
  const ticketMedio = visitas.length > 0 ? Math.round(totalGasto / visitas.length) : 0;

  // Determinar etapa da jornada
  const etapa = determinarEtapaJornada({
    diasSemVisitar,
    totalVisitas: visitas.length,
    diasComoCliente
  });

  const jornada: JornadaCliente = {
    telefone,
    nome: contahubData[0].cli_nome || 'Cliente',
    etapa_atual: etapa,
    dias_no_funil: diasComoCliente,
    visitas_totais: visitas.length,
    dias_sem_visitar: diasSemVisitar,
    ultima_visita: ultimaVisita.toISOString(),
    primeira_visita: primeiraVisita.toISOString(),
    ticket_medio: ticketMedio,
    total_gasto: totalGasto,
    proxima_acao_sugerida: getProximaAcao(etapa)
  };

  return NextResponse.json({
    success: true,
    data: jornada
  });
}

async function listarJornadasClientes(barId: number) {
  // Verificar cache
  const cacheKey = `jornadas_${barId}`;
  const cached = getCached(cacheKey);
  
  if (cached) {
    console.log(`⚡ Cache HIT: Usando dados de jornadas em cache (${cached.jornadas.length} clientes)`);
    return NextResponse.json({
      success: true,
      data: cached.jornadas,
      stats: cached.stats,
      fromCache: true
    });
  }

  console.log(`🔍 Cache MISS: Processando jornadas de TODOS os clientes...`);

  // Buscar TODOS os dados do ContaHub
  const contahubData = await fetchAllData(
    'contahub_periodo',
    'cli_nome, cli_fone, dt_gerencial, vr_couvert, vr_pagamentos',
    { eq_bar_id: barId }
  );

  // Filtrar clientes válidos
  const dadosValidos = contahubData.filter(item => 
    item.cli_fone && item.cli_fone.trim() !== '' && 
    item.cli_nome && item.cli_nome.trim() !== ''
  );
  console.log(`💳 ContaHub: ${dadosValidos.length} registros válidos (de ${contahubData.length} totais)`);

  // Consolidar
  const clientesMap = new Map<string, {
    nome: string;
    visitas: Array<{ data: Date; valor: number }>;
    totalGasto: number;
  }>();

  dadosValidos.forEach(item => {
    const telefone = item.cli_fone.replace(/\D/g, '').slice(-9);
    if (telefone.length < 9) return;
    
    if (!clientesMap.has(telefone)) {
      clientesMap.set(telefone, {
        nome: item.cli_nome || 'Cliente',
        visitas: [],
        totalGasto: 0
      });
    }
    const cliente = clientesMap.get(telefone)!;
    const valor = (item.vr_couvert || 0) + (item.vr_pagamentos || 0);
    cliente.visitas.push({
      data: new Date(item.dt_gerencial),
      valor
    });
    cliente.totalGasto += valor;
  });

  console.log(`👥 Total de clientes únicos: ${clientesMap.size}`);

  const jornadas: JornadaCliente[] = [];
  const hoje = new Date();

  for (const [telefone, dados] of clientesMap.entries()) {
    dados.visitas.sort((a, b) => a.data.getTime() - b.data.getTime());
    
    const primeiraVisita = dados.visitas[0].data;
    const ultimaVisita = dados.visitas[dados.visitas.length - 1].data;
    const diasComoCliente = Math.floor((hoje.getTime() - primeiraVisita.getTime()) / (1000 * 60 * 60 * 24));
    const diasSemVisitar = Math.floor((hoje.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24));

    const etapa = determinarEtapaJornada({
      diasSemVisitar,
      totalVisitas: dados.visitas.length,
      diasComoCliente
    });

    const ticketMedio = dados.visitas.length > 0 ? Math.round(dados.totalGasto / dados.visitas.length) : 0;

    jornadas.push({
      telefone,
      nome: dados.nome,
      etapa_atual: etapa,
      dias_no_funil: diasComoCliente,
      visitas_totais: dados.visitas.length,
      dias_sem_visitar: diasSemVisitar,
      ultima_visita: ultimaVisita.toISOString(),
      primeira_visita: primeiraVisita.toISOString(),
      ticket_medio: ticketMedio,
      total_gasto: dados.totalGasto,
      proxima_acao_sugerida: getProximaAcao(etapa)
    });
  }

  // Ordenar por visitas (mais frequentes primeiro)
  jornadas.sort((a, b) => b.visitas_totais - a.visitas_totais);

  console.log(`✅ Jornadas processadas: ${jornadas.length} clientes`);

  // Estatísticas
  const stats = {
    total: jornadas.length,
    novo: jornadas.filter(j => j.etapa_atual === 'novo').length,
    engajado: jornadas.filter(j => j.etapa_atual === 'engajado').length,
    fiel: jornadas.filter(j => j.etapa_atual === 'fiel').length,
    em_risco: jornadas.filter(j => j.etapa_atual === 'em_risco').length,
    perdido: jornadas.filter(j => j.etapa_atual === 'perdido').length,
  };

  // Salvar no cache
  setCache(cacheKey, { jornadas, stats });

  return NextResponse.json({
    success: true,
    data: jornadas,
    stats,
    fromCache: false
  });
}
