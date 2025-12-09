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
const CACHE_VERSION = 3; // v3: Apenas ContaHub + timezone Brasil

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (entry.version !== CACHE_VERSION) {
    cache.delete(key);
    console.log(`🔄 Cache padroes invalidado (versão ${entry.version} → ${CACHE_VERSION})`);
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

interface PadraoCliente {
  telefone: string;
  nome: string;
  total_visitas: number;
  
  // Padrão de dia da semana
  dia_semana_preferido: string;
  distribuicao_dias: {
    segunda: number;
    terca: number;
    quarta: number;
    quinta: number;
    sexta: number;
    sabado: number;
    domingo: number;
  };
  
  // Padrão de horário
  horario_preferido: string;
  distribuicao_horarios: {
    manha: number;
    tarde: number;
    noite: number;
    madrugada: number;
  };
  
  // Padrão de frequência
  intervalo_medio_visitas: number;
  frequencia: 'alto' | 'medio' | 'baixo';
  
  // Sazonalidade
  mes_mais_ativo: string;
  distribuicao_mensal: Record<string, number>;
  
  // Acompanhamento
  vem_sozinho: boolean;
  tamanho_grupo_medio: number;
  
  // Valor gasto
  total_gasto: number;
  ticket_medio: number;
}

const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ===== FUNÇÕES PARA TRATAR TIMEZONE DO BRASIL (America/Sao_Paulo) =====

/**
 * Cria uma Date a partir de uma string de data (YYYY-MM-DD) 
 * tratando como data no Brasil (sem deslocamento de timezone)
 */
function parseDateBrazil(dateStr: string | Date): Date {
  if (dateStr instanceof Date) {
    const year = dateStr.getFullYear();
    const month = String(dateStr.getMonth() + 1).padStart(2, '0');
    const day = String(dateStr.getDate()).padStart(2, '0');
    dateStr = `${year}-${month}-${day}`;
  }
  
  // Para datas no formato YYYY-MM-DD, adicionar horário meio-dia para evitar
  // problemas de timezone (12:00 no Brasil nunca muda de dia por causa de DST)
  const cleanDate = String(dateStr).split('T')[0];
  return new Date(`${cleanDate}T12:00:00-03:00`);
}

function getDiaSemana(data: Date | string): string {
  const d = parseDateBrazil(data);
  return DIAS_SEMANA[d.getDay()];
}

function getMes(data: Date | string): string {
  const d = parseDateBrazil(data);
  return MESES[d.getMonth()];
}

// ===== FUNÇÃO CORRIGIDA - LIDA COM OBJETOS VAZIOS =====
function getMaxKey<T extends Record<string, number>>(obj: T, defaultValue: string = 'N/A'): string {
  const entries = Object.entries(obj);
  if (entries.length === 0) return defaultValue;
  return entries.reduce((a, b) => b[1] > a[1] ? b : a)[0];
}

function calcularFrequencia(intervaloMedio: number): 'alto' | 'medio' | 'baixo' {
  if (intervaloMedio <= 7) return 'alto';      // Toda semana
  if (intervaloMedio <= 30) return 'medio';     // Todo mês
  return 'baixo';                                // Esporádico
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telefone = searchParams.get('telefone');
    const limite = parseInt(searchParams.get('limite') || '100');
    const barIdParam = searchParams.get('bar_id');
    
    if (!barIdParam) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }
    const barId = parseInt(barIdParam);

    console.log(`🔍 API Padrões de Comportamento - telefone: ${telefone}, limite: ${limite}, bar_id: ${barId}`);

    if (!telefone) {
      return await buscarPadroesTodosClientes(limite, barId);
    } else {
      return await buscarPadraoCliente(telefone, barId);
    }

  } catch (error: any) {
    console.error('❌ Erro ao buscar padrões de comportamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function buscarPadraoCliente(telefone: string, barId: number) {
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
    data: parseDateBrazil(v.dt_gerencial),
    dataOriginal: String(v.dt_gerencial),
    valor: (v.vr_couvert || 0) + (v.vr_pagamentos || 0)
  }));

  const distribuicaoDias = {
    segunda: 0,
    terca: 0,
    quarta: 0,
    quinta: 0,
    sexta: 0,
    sabado: 0,
    domingo: 0
  };

  const distribuicaoHorarios = {
    manha: 0,
    tarde: 0,
    noite: 0,
    madrugada: 0
  };

  const distribuicaoMensal: Record<string, number> = {};
  let totalGasto = 0;

  visitas.forEach(v => {
    const dia = getDiaSemana(v.dataOriginal);
    distribuicaoDias[dia as keyof typeof distribuicaoDias]++;

    // Para ContaHub, assumir noite (horário típico de bar)
    distribuicaoHorarios.noite++;

    const mes = getMes(v.dataOriginal);
    distribuicaoMensal[mes] = (distribuicaoMensal[mes] || 0) + 1;

    totalGasto += v.valor;
  });

  // Calcular intervalo médio entre visitas
  let intervaloTotal = 0;
  for (let i = 1; i < visitas.length; i++) {
    const diff = visitas[i].data.getTime() - visitas[i - 1].data.getTime();
    intervaloTotal += diff / (1000 * 60 * 60 * 24);
  }
  const intervaloMedio = visitas.length > 1 ? Math.round(intervaloTotal / (visitas.length - 1)) : 0;

  const padrao: PadraoCliente = {
    telefone,
    nome: contahubData[0].cli_nome || 'Cliente',
    total_visitas: visitas.length,
    dia_semana_preferido: getMaxKey(distribuicaoDias, 'sexta'),
    distribuicao_dias: distribuicaoDias,
    horario_preferido: 'Noite (18:00-00:00)',
    distribuicao_horarios: distribuicaoHorarios,
    intervalo_medio_visitas: intervaloMedio,
    frequencia: calcularFrequencia(intervaloMedio),
    mes_mais_ativo: getMaxKey(distribuicaoMensal, 'Janeiro'),
    distribuicao_mensal: distribuicaoMensal,
    vem_sozinho: true,
    tamanho_grupo_medio: 1,
    total_gasto: totalGasto,
    ticket_medio: totalGasto > 0 ? Math.round(totalGasto / visitas.length) : 0
  };

  return NextResponse.json({
    success: true,
    data: padrao
  });
}

async function buscarPadroesTodosClientes(limite: number, barId: number = 3) {
  // Verificar cache
  const cacheKey = `padroes_comportamento_${barId}`;
  const cached = getCached(cacheKey);

  if (cached) {
    console.log(`⚡ Cache HIT: Usando dados de padrões em cache (${cached.padroes.length} clientes)`);
    
    const resultado = cached.padroes.slice(0, limite);
    
    return NextResponse.json({
      success: true,
      data: resultado,
      stats: cached.stats,
      fromCache: true
    });
  }

  console.log(`🔍 Cache MISS: Processando dados de padrões do ContaHub...`);

  // ===== BUSCAR DADOS DO CONTAHUB =====
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

  // ===== CONSOLIDAR POR TELEFONE =====
  const clientesMap = new Map<string, {
    telefone: string;
    nome: string;
    visitas: Array<{ data: Date; dataOriginal: string; valor: number }>;
    totalGasto: number;
  }>();

  // Função para normalizar telefone
  const normalizarTelefone = (fone: string): string | null => {
    if (!fone) return null;
    const limpo = fone.replace(/\D/g, '');
    if (limpo.length < 10) return null;
    return limpo.slice(-9);
  };

  // Processar ContaHub
  for (const item of contahubData) {
    const telefoneNorm = normalizarTelefone(item.cli_fone);
    if (!telefoneNorm) continue;

    if (!clientesMap.has(telefoneNorm)) {
      clientesMap.set(telefoneNorm, {
        telefone: telefoneNorm,
        nome: item.cli_nome || 'Cliente',
        visitas: [],
        totalGasto: 0
      });
    }

    const cliente = clientesMap.get(telefoneNorm)!;
    const valor = (item.vr_couvert || 0) + (item.vr_pagamentos || 0);
    
    cliente.visitas.push({
      data: parseDateBrazil(item.dt_gerencial),
      dataOriginal: String(item.dt_gerencial),
      valor
    });
    cliente.totalGasto += valor;
  }

  console.log(`👥 Total de clientes únicos: ${clientesMap.size}`);

  // ===== CALCULAR PADRÕES PARA CADA CLIENTE =====
  const padroes: PadraoCliente[] = [];

  for (const [telefone, dados] of clientesMap.entries()) {
    if (dados.visitas.length < 2) continue; // Mínimo 2 visitas para análise

    dados.visitas.sort((a, b) => a.data.getTime() - b.data.getTime());

    const distribuicaoDias = {
      segunda: 0,
      terca: 0,
      quarta: 0,
      quinta: 0,
      sexta: 0,
      sabado: 0,
      domingo: 0
    };

    const distribuicaoHorarios = {
      manha: 0,
      tarde: 0,
      noite: 0,
      madrugada: 0
    };

    const distribuicaoMensal: Record<string, number> = {};

    dados.visitas.forEach(v => {
      const dia = getDiaSemana(v.dataOriginal);
      distribuicaoDias[dia as keyof typeof distribuicaoDias]++;

      // Para ContaHub, assumir noite (horário típico de bar)
      distribuicaoHorarios.noite++;

      const mes = getMes(v.dataOriginal);
      distribuicaoMensal[mes] = (distribuicaoMensal[mes] || 0) + 1;
    });

    let intervaloTotal = 0;
    for (let i = 1; i < dados.visitas.length; i++) {
      const diff = dados.visitas[i].data.getTime() - dados.visitas[i - 1].data.getTime();
      intervaloTotal += diff / (1000 * 60 * 60 * 24);
    }
    const intervaloMedio = Math.round(intervaloTotal / (dados.visitas.length - 1));

    padroes.push({
      telefone,
      nome: dados.nome,
      total_visitas: dados.visitas.length,
      dia_semana_preferido: getMaxKey(distribuicaoDias, 'sexta'),
      distribuicao_dias: distribuicaoDias,
      horario_preferido: 'Noite (18:00-00:00)',
      distribuicao_horarios: distribuicaoHorarios,
      intervalo_medio_visitas: intervaloMedio,
      frequencia: calcularFrequencia(intervaloMedio),
      mes_mais_ativo: getMaxKey(distribuicaoMensal, 'Janeiro'),
      distribuicao_mensal: distribuicaoMensal,
      vem_sozinho: true,
      tamanho_grupo_medio: 1,
      total_gasto: dados.totalGasto,
      ticket_medio: dados.totalGasto > 0 ? Math.round(dados.totalGasto / dados.visitas.length) : 0
    });
  }

  // Ordenar por total de visitas (clientes mais frequentes primeiro)
  padroes.sort((a, b) => b.total_visitas - a.total_visitas);

  console.log(`✅ Padrões calculados: ${padroes.length} clientes com 2+ visitas`);

  // Estatísticas gerais
  let stats: any = {
    total_clientes_analisados: padroes.length,
    dia_mais_popular: 'N/A',
    horario_mais_popular: 'Noite (18:00-00:00)',
    frequencia_alta: 0,
    frequencia_media: 0,
    frequencia_baixa: 0,
  };

  if (padroes.length > 0) {
    stats = {
      total_clientes_analisados: padroes.length,
      dia_mais_popular: getMaxKey(
        padroes.reduce((acc, p) => {
          acc[p.dia_semana_preferido] = (acc[p.dia_semana_preferido] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        'sexta'
      ),
      horario_mais_popular: 'Noite (18:00-00:00)',
      frequencia_alta: padroes.filter(p => p.frequencia === 'alto').length,
      frequencia_media: padroes.filter(p => p.frequencia === 'medio').length,
      frequencia_baixa: padroes.filter(p => p.frequencia === 'baixo').length,
    };
  }

  // Salvar no cache
  setCache(cacheKey, { padroes, stats });

  // Limitar resultados
  const resultado = padroes.slice(0, limite);

  return NextResponse.json({
    success: true,
    data: resultado,
    stats,
    fromCache: false
  });
}
