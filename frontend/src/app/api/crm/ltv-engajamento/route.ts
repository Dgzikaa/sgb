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
const CACHE_VERSION = 2;

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (entry.version !== CACHE_VERSION) {
    cache.delete(key);
    console.log(`🔄 Cache LTV invalidado (versão ${entry.version} → ${CACHE_VERSION})`);
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

interface ClienteLTV {
  telefone: string;
  nome: string;
  
  // Lifetime Value
  ltv_atual: number;
  ltv_projetado_12m: number;
  ltv_projetado_24m: number;
  
  // Métricas de Engajamento
  score_engajamento: number;
  nivel_engajamento: 'baixo' | 'medio' | 'alto' | 'muito_alto';
  
  // Métricas de cálculo
  total_visitas: number;
  primeira_visita: string;
  ultima_visita: string;
  dias_como_cliente: number;
  frequencia_visitas: number;
  ticket_medio: number;
  valor_medio_mensal: number;
  
  // Tendências
  tendencia_valor: 'crescente' | 'estavel' | 'decrescente';
  tendencia_frequencia: 'crescente' | 'estavel' | 'decrescente';
  
  // Potencial
  potencial_crescimento: 'baixo' | 'medio' | 'alto';
  roi_marketing: number;
}

// Calcular score de engajamento (0-100)
function calcularScoreEngajamento(dados: {
  frequenciaVisitas: number;
  diasComoCliente: number;
  totalVisitas: number;
  tendenciaFrequencia: string;
  tendenciaValor: string;
}): { score: number; nivel: 'baixo' | 'medio' | 'alto' | 'muito_alto' } {
  let score = 0;

  // 1. FREQUÊNCIA (40 pontos)
  if (dados.frequenciaVisitas >= 4) score += 40;
  else if (dados.frequenciaVisitas >= 2) score += 30;
  else if (dados.frequenciaVisitas >= 1) score += 20;
  else if (dados.frequenciaVisitas >= 0.5) score += 10;
  else score += 5;

  // 2. LONGEVIDADE (25 pontos)
  if (dados.diasComoCliente > 365) score += 25;
  else if (dados.diasComoCliente > 180) score += 20;
  else if (dados.diasComoCliente > 90) score += 15;
  else if (dados.diasComoCliente > 30) score += 10;
  else score += 5;

  // 3. VOLUME (20 pontos)
  if (dados.totalVisitas >= 50) score += 20;
  else if (dados.totalVisitas >= 25) score += 15;
  else if (dados.totalVisitas >= 10) score += 10;
  else if (dados.totalVisitas >= 5) score += 5;

  // 4. TENDÊNCIA FREQUÊNCIA (10 pontos)
  if (dados.tendenciaFrequencia === 'crescente') score += 10;
  else if (dados.tendenciaFrequencia === 'estavel') score += 5;

  // 5. TENDÊNCIA VALOR (5 pontos)
  if (dados.tendenciaValor === 'crescente') score += 5;
  else if (dados.tendenciaValor === 'estavel') score += 3;

  let nivel: 'baixo' | 'medio' | 'alto' | 'muito_alto';
  if (score >= 80) nivel = 'muito_alto';
  else if (score >= 60) nivel = 'alto';
  else if (score >= 35) nivel = 'medio';
  else nivel = 'baixo';

  return { score, nivel };
}

// Calcular tendência
function calcularTendencia(valoresAntigos: number[], valoresRecentes: number[]): 'crescente' | 'estavel' | 'decrescente' {
  const mediaAntiga = valoresAntigos.length > 0
    ? valoresAntigos.reduce((a, b) => a + b, 0) / valoresAntigos.length
    : 0;
  
  const mediaRecente = valoresRecentes.length > 0
    ? valoresRecentes.reduce((a, b) => a + b, 0) / valoresRecentes.length
    : 0;

  if (mediaAntiga === 0 && mediaRecente === 0) return 'estavel';
  if (mediaAntiga === 0) return 'crescente';
  
  if (mediaRecente > mediaAntiga * 1.1) return 'crescente';
  if (mediaRecente < mediaAntiga * 0.9) return 'decrescente';
  return 'estavel';
}

// Função para normalizar telefone
const normalizarTelefone = (fone: string): string | null => {
  if (!fone) return null;
  const limpo = fone.replace(/\D/g, '');
  if (limpo.length < 10) return null;
  return limpo.slice(-9);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telefone = searchParams.get('telefone');
    const limite = parseInt(searchParams.get('limite') || '100');
    const barId = parseInt(searchParams.get('bar_id') || '3');

    console.log(`🔍 API LTV Engajamento - telefone: ${telefone}, limite: ${limite}, bar_id: ${barId}`);

    if (telefone) {
      return await calcularLTVCliente(telefone);
    } else {
      return await calcularLTVTodosClientes(limite, barId);
    }

  } catch (error: any) {
    console.error('❌ Erro ao calcular LTV:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function calcularLTVCliente(telefone: string) {
  const telefoneNorm = normalizarTelefone(telefone) || telefone;
  
  // Buscar dados do ContaHub
  const { data: contahubData } = await supabase
    .from('contahub_periodo')
    .select('cli_nome, cli_fone, dt_gerencial, vr_couvert, vr_pagamentos')
    .ilike('cli_fone', `%${telefoneNorm}%`)
    .order('dt_gerencial', { ascending: true });

  // Buscar histórico do Sympla
  const { data: symplaData } = await supabase
    .from('sympla_participantes')
    .select('data_evento, nome_completo')
    .ilike('telefone_normalizado', `%${telefoneNorm}%`)
    .order('data_evento', { ascending: true });

  // Buscar histórico do GetIn
  const { data: getinData } = await supabase
    .from('getin_reservations')
    .select('data, nome, numero_convidados')
    .ilike('telefone_normalizado', `%${telefoneNorm}%`)
    .order('data', { ascending: true });

  if (!contahubData?.length && !symplaData?.length && !getinData?.length) {
    throw new Error('Cliente não encontrado');
  }

  // Consolidar visitas com valores reais
  const visitas: Array<{ data: Date; valor: number }> = [];
  let nomeCliente = 'Cliente';

  // Priorizar ContaHub (tem valores reais)
  contahubData?.forEach(v => {
    const valor = (v.vr_couvert || 0) + (v.vr_pagamentos || 0);
    visitas.push({
      data: new Date(v.dt_gerencial),
      valor: valor
    });
    if (!nomeCliente || nomeCliente === 'Cliente') {
      nomeCliente = v.cli_nome || 'Cliente';
    }
  });

  // Sympla (valor estimado se não tiver ContaHub)
  symplaData?.forEach(v => {
    visitas.push({
      data: new Date(v.data_evento),
      valor: 100
    });
    if (!nomeCliente || nomeCliente === 'Cliente') {
      nomeCliente = v.nome_completo || 'Cliente';
    }
  });

  // GetIn
  getinData?.forEach(v => {
    const valorEstimado = (v.numero_convidados || 1) * 120;
    visitas.push({
      data: new Date(v.data),
      valor: valorEstimado
    });
    if (!nomeCliente || nomeCliente === 'Cliente') {
      nomeCliente = v.nome || 'Cliente';
    }
  });

  visitas.sort((a, b) => a.data.getTime() - b.data.getTime());

  // Cálculos base
  const hoje = new Date();
  const primeiraVisita = visitas[0].data;
  const ultimaVisita = visitas[visitas.length - 1].data;
  const diasComoCliente = Math.floor((hoje.getTime() - primeiraVisita.getTime()) / (1000 * 60 * 60 * 24));
  const mesesComoCliente = diasComoCliente / 30;

  const ltvAtual = visitas.reduce((sum, v) => sum + v.valor, 0);
  const frequenciaVisitas = visitas.length / Math.max(mesesComoCliente, 1);
  const ticketMedio = ltvAtual / visitas.length;
  const valorMedioMensal = ltvAtual / Math.max(mesesComoCliente, 1);

  // Tendências
  const metade = Math.floor(visitas.length / 2);
  const valoresAntigos = visitas.slice(0, metade).map(v => v.valor);
  const valoresRecentes = visitas.slice(metade).map(v => v.valor);
  const tendenciaValor = calcularTendencia(valoresAntigos, valoresRecentes);

  // Tendência de frequência
  const data90DiasAtras = new Date();
  data90DiasAtras.setDate(data90DiasAtras.getDate() - 90);
  const data180DiasAtras = new Date();
  data180DiasAtras.setDate(data180DiasAtras.getDate() - 180);

  const visitasUltimos90 = visitas.filter(v => v.data >= data90DiasAtras).length;
  const visitas90a180 = visitas.filter(v => v.data >= data180DiasAtras && v.data < data90DiasAtras).length;

  const tendenciaFrequencia = visitasUltimos90 > visitas90a180 ? 'crescente' :
    visitasUltimos90 < visitas90a180 ? 'decrescente' : 'estavel';

  // Projeções de LTV
  let fatorAjuste = 1.0;
  if (tendenciaValor === 'crescente' && tendenciaFrequencia === 'crescente') {
    fatorAjuste = 1.3;
  } else if (tendenciaValor === 'crescente' || tendenciaFrequencia === 'crescente') {
    fatorAjuste = 1.15;
  } else if (tendenciaValor === 'decrescente' && tendenciaFrequencia === 'decrescente') {
    fatorAjuste = 0.7;
  } else if (tendenciaValor === 'decrescente' || tendenciaFrequencia === 'decrescente') {
    fatorAjuste = 0.85;
  }

  const ltvProjetado12m = valorMedioMensal * 12 * fatorAjuste;
  const ltvProjetado24m = valorMedioMensal * 24 * fatorAjuste;

  // Score de engajamento
  const { score, nivel } = calcularScoreEngajamento({
    frequenciaVisitas,
    diasComoCliente,
    totalVisitas: visitas.length,
    tendenciaFrequencia,
    tendenciaValor
  });

  // Potencial de crescimento
  let potencialCrescimento: 'baixo' | 'medio' | 'alto';
  if (score >= 70 && (tendenciaValor === 'crescente' || tendenciaFrequencia === 'crescente')) {
    potencialCrescimento = 'alto';
  } else if (score >= 40) {
    potencialCrescimento = 'medio';
  } else {
    potencialCrescimento = 'baixo';
  }

  // ROI de Marketing
  const custoMarketingEstimado = 50;
  const roiMarketing = (ltvProjetado12m / custoMarketingEstimado);

  const resultado: ClienteLTV = {
    telefone,
    nome: nomeCliente,
    ltv_atual: Math.round(ltvAtual),
    ltv_projetado_12m: Math.round(ltvProjetado12m),
    ltv_projetado_24m: Math.round(ltvProjetado24m),
    score_engajamento: score,
    nivel_engajamento: nivel,
    total_visitas: visitas.length,
    primeira_visita: primeiraVisita.toISOString(),
    ultima_visita: ultimaVisita.toISOString(),
    dias_como_cliente: diasComoCliente,
    frequencia_visitas: Math.round(frequenciaVisitas * 10) / 10,
    ticket_medio: Math.round(ticketMedio),
    valor_medio_mensal: Math.round(valorMedioMensal),
    tendencia_valor: tendenciaValor,
    tendencia_frequencia: tendenciaFrequencia,
    potencial_crescimento: potencialCrescimento,
    roi_marketing: Math.round(roiMarketing * 10) / 10
  };

  return NextResponse.json({
    success: true,
    data: resultado
  });
}

async function calcularLTVTodosClientes(limite: number, barId: number = 3) {
  // Verificar cache
  const cacheKey = `ltv_engajamento_${barId}`;
  const cached = getCached(cacheKey);

  if (cached) {
    console.log(`⚡ Cache HIT: Usando dados de LTV em cache (${cached.resultados.length} clientes)`);
    
    const resultado = cached.resultados.slice(0, limite);
    
    return NextResponse.json({
      success: true,
      data: resultado,
      stats: cached.stats,
      fromCache: true
    });
  }

  console.log(`🔍 Cache MISS: Processando dados de LTV do ContaHub...`);

  // ===== BUSCAR TODOS OS DADOS COM PAGINAÇÃO =====
  
  // 1. Buscar dados do ContaHub (fonte principal - tem valores reais)
  console.log(`📊 Buscando dados do ContaHub para bar ${barId}...`);
  const contahubDataRaw = await fetchAllData(
    'contahub_periodo',
    'cli_nome, cli_fone, dt_gerencial, vr_couvert, vr_pagamentos',
    { eq_bar_id: barId }
  );

  // Filtrar clientes válidos
  const contahubData = contahubDataRaw.filter(item => 
    item.cli_fone && item.cli_fone.trim() !== '' && 
    item.cli_nome && item.cli_nome.trim() !== ''
  );
  console.log(`💳 ContaHub: ${contahubData.length} registros válidos (de ${contahubDataRaw.length} totais)`);

  // 2. Buscar dados do Sympla (complementar)
  console.log(`📊 Buscando dados do Sympla...`);
  const symplaData = await fetchAllData(
    'sympla_participantes',
    'telefone_normalizado, nome_completo, data_evento',
    { not_null_telefone_normalizado: true }
  );
  console.log(`🎫 Sympla: ${symplaData.length} registros`);

  // 3. Buscar dados do GetIn (complementar)
  console.log(`📊 Buscando dados do GetIn...`);
  const getinData = await fetchAllData(
    'getin_reservations',
    'telefone_normalizado, nome, data, numero_convidados',
    { not_null_telefone_normalizado: true }
  );
  console.log(`📅 GetIn: ${getinData.length} registros`);

  // ===== CONSOLIDAR POR TELEFONE =====
  const clientesMap = new Map<string, {
    telefone: string;
    nome: string;
    visitas: Array<{ data: Date; valor: number }>;
  }>();

  // Processar ContaHub (fonte principal com valores reais)
  for (const item of contahubData) {
    const telefoneNorm = normalizarTelefone(item.cli_fone);
    if (!telefoneNorm) continue;

    if (!clientesMap.has(telefoneNorm)) {
      clientesMap.set(telefoneNorm, {
        telefone: telefoneNorm,
        nome: item.cli_nome || 'Cliente',
        visitas: []
      });
    }

    const valor = (item.vr_couvert || 0) + (item.vr_pagamentos || 0);
    
    clientesMap.get(telefoneNorm)!.visitas.push({
      data: new Date(item.dt_gerencial),
      valor: valor
    });
  }

  // Processar Sympla
  for (const item of symplaData) {
    if (!item.telefone_normalizado) continue;
    const telefoneNorm = item.telefone_normalizado.slice(-9);

    if (!clientesMap.has(telefoneNorm)) {
      clientesMap.set(telefoneNorm, {
        telefone: telefoneNorm,
        nome: item.nome_completo || 'Cliente',
        visitas: []
      });
    }

    clientesMap.get(telefoneNorm)!.visitas.push({
      data: new Date(item.data_evento),
      valor: 100
    });
  }

  // Processar GetIn
  for (const item of getinData) {
    if (!item.telefone_normalizado) continue;
    const telefoneNorm = item.telefone_normalizado.slice(-9);

    if (!clientesMap.has(telefoneNorm)) {
      clientesMap.set(telefoneNorm, {
        telefone: telefoneNorm,
        nome: item.nome || 'Cliente',
        visitas: []
      });
    }

    const valorEstimado = (item.numero_convidados || 1) * 120;
    clientesMap.get(telefoneNorm)!.visitas.push({
      data: new Date(item.data),
      valor: valorEstimado
    });
  }

  console.log(`👥 Total de clientes únicos: ${clientesMap.size}`);

  // ===== CALCULAR LTV PARA CADA CLIENTE =====
  const resultados: ClienteLTV[] = [];
  const hoje = new Date();

  for (const [telefone, dados] of clientesMap.entries()) {
    if (dados.visitas.length < 1) continue;

    dados.visitas.sort((a, b) => a.data.getTime() - b.data.getTime());

    const primeiraVisita = dados.visitas[0].data;
    const ultimaVisita = dados.visitas[dados.visitas.length - 1].data;
    const diasComoCliente = Math.floor((hoje.getTime() - primeiraVisita.getTime()) / (1000 * 60 * 60 * 24));
    const mesesComoCliente = diasComoCliente / 30;

    const ltvAtual = dados.visitas.reduce((sum, v) => sum + v.valor, 0);
    const frequenciaVisitas = dados.visitas.length / Math.max(mesesComoCliente, 1);
    const ticketMedio = ltvAtual / dados.visitas.length;
    const valorMedioMensal = ltvAtual / Math.max(mesesComoCliente, 1);

    // Tendências
    const metade = Math.floor(dados.visitas.length / 2);
    const valoresAntigos = dados.visitas.slice(0, metade).map(v => v.valor);
    const valoresRecentes = dados.visitas.slice(metade).map(v => v.valor);
    const tendenciaValor = calcularTendencia(valoresAntigos, valoresRecentes);

    const data90DiasAtras = new Date();
    data90DiasAtras.setDate(data90DiasAtras.getDate() - 90);
    const data180DiasAtras = new Date();
    data180DiasAtras.setDate(data180DiasAtras.getDate() - 180);

    const visitasUltimos90 = dados.visitas.filter(v => v.data >= data90DiasAtras).length;
    const visitas90a180 = dados.visitas.filter(v => v.data >= data180DiasAtras && v.data < data90DiasAtras).length;

    const tendenciaFrequencia = visitasUltimos90 > visitas90a180 ? 'crescente' :
      visitasUltimos90 < visitas90a180 ? 'decrescente' : 'estavel';

    // Projeções
    let fatorAjuste = 1.0;
    if (tendenciaValor === 'crescente' && tendenciaFrequencia === 'crescente') {
      fatorAjuste = 1.3;
    } else if (tendenciaValor === 'crescente' || tendenciaFrequencia === 'crescente') {
      fatorAjuste = 1.15;
    } else if (tendenciaValor === 'decrescente' && tendenciaFrequencia === 'decrescente') {
      fatorAjuste = 0.7;
    } else if (tendenciaValor === 'decrescente' || tendenciaFrequencia === 'decrescente') {
      fatorAjuste = 0.85;
    }

    const ltvProjetado12m = valorMedioMensal * 12 * fatorAjuste;
    const ltvProjetado24m = valorMedioMensal * 24 * fatorAjuste;

    const { score, nivel } = calcularScoreEngajamento({
      frequenciaVisitas,
      diasComoCliente,
      totalVisitas: dados.visitas.length,
      tendenciaFrequencia,
      tendenciaValor
    });

    let potencialCrescimento: 'baixo' | 'medio' | 'alto';
    if (score >= 70 && (tendenciaValor === 'crescente' || tendenciaFrequencia === 'crescente')) {
      potencialCrescimento = 'alto';
    } else if (score >= 40) {
      potencialCrescimento = 'medio';
    } else {
      potencialCrescimento = 'baixo';
    }

    const custoMarketingEstimado = 50;
    const roiMarketing = (ltvProjetado12m / custoMarketingEstimado);

    resultados.push({
      telefone,
      nome: dados.nome,
      ltv_atual: Math.round(ltvAtual),
      ltv_projetado_12m: Math.round(ltvProjetado12m),
      ltv_projetado_24m: Math.round(ltvProjetado24m),
      score_engajamento: score,
      nivel_engajamento: nivel,
      total_visitas: dados.visitas.length,
      primeira_visita: primeiraVisita.toISOString(),
      ultima_visita: ultimaVisita.toISOString(),
      dias_como_cliente: diasComoCliente,
      frequencia_visitas: Math.round(frequenciaVisitas * 10) / 10,
      ticket_medio: Math.round(ticketMedio),
      valor_medio_mensal: Math.round(valorMedioMensal),
      tendencia_valor: tendenciaValor,
      tendencia_frequencia: tendenciaFrequencia,
      potencial_crescimento: potencialCrescimento,
      roi_marketing: Math.round(roiMarketing * 10) / 10
    });
  }

  // Ordenar por LTV projetado (maior valor primeiro)
  resultados.sort((a, b) => b.ltv_projetado_12m - a.ltv_projetado_12m);

  console.log(`✅ LTV calculado: ${resultados.length} clientes processados`);

  // Estatísticas
  const stats = {
    total_clientes: resultados.length,
    ltv_total_atual: resultados.reduce((sum, c) => sum + c.ltv_atual, 0),
    ltv_total_projetado_12m: resultados.reduce((sum, c) => sum + c.ltv_projetado_12m, 0),
    ltv_medio_atual: resultados.length > 0 ? Math.round(resultados.reduce((sum, c) => sum + c.ltv_atual, 0) / resultados.length) : 0,
    ltv_medio_projetado_12m: resultados.length > 0 ? Math.round(resultados.reduce((sum, c) => sum + c.ltv_projetado_12m, 0) / resultados.length) : 0,
    engajamento_muito_alto: resultados.filter(c => c.nivel_engajamento === 'muito_alto').length,
    engajamento_alto: resultados.filter(c => c.nivel_engajamento === 'alto').length,
    engajamento_medio: resultados.filter(c => c.nivel_engajamento === 'medio').length,
    engajamento_baixo: resultados.filter(c => c.nivel_engajamento === 'baixo').length,
  };

  // Salvar no cache
  setCache(cacheKey, { resultados, stats });

  return NextResponse.json({
    success: true,
    data: resultados.slice(0, limite),
    stats,
    fromCache: false
  });
}
