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
const CACHE_VERSION = 1;

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
  
  // Padrão de tipo de evento
  tipo_evento_preferido: string;
  distribuicao_eventos: Record<string, number>;
  
  // Padrão de horário
  horario_preferido: string; // Manhã, Tarde, Noite, Madrugada
  distribuicao_horarios: {
    manha: number;      // 06:00-12:00
    tarde: number;      // 12:00-18:00
    noite: number;      // 18:00-00:00
    madrugada: number;  // 00:00-06:00
  };
  
  // Padrão de produtos (futuramente pode integrar com vendas)
  produtos_favoritos?: string[];
  
  // Padrão de frequência
  intervalo_medio_visitas: number; // Em dias
  frequencia: 'alto' | 'medio' | 'baixo'; // Baseado no intervalo
  
  // Sazonalidade
  mes_mais_ativo: string;
  distribuicao_mensal: Record<string, number>;
  
  // Acompanhamento
  vem_sozinho: boolean;
  tamanho_grupo_medio: number;
  
  // Valor gasto (opcional, do ContaHub)
  total_gasto?: number;
  ticket_medio?: number;
}

const DIAS_SEMANA = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function getDiaSemana(data: Date): string {
  return DIAS_SEMANA[data.getDay()];
}

function getHorarioPeriodo(data: Date): 'manha' | 'tarde' | 'noite' | 'madrugada' {
  const hora = data.getHours();
  if (hora >= 6 && hora < 12) return 'manha';
  if (hora >= 12 && hora < 18) return 'tarde';
  if (hora >= 18 && hora < 24) return 'noite';
  return 'madrugada';
}

function getMes(data: Date): string {
  return MESES[data.getMonth()];
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
    const barId = parseInt(searchParams.get('bar_id') || '3');

    console.log(`🔍 API Padrões de Comportamento - telefone: ${telefone}, limite: ${limite}, bar_id: ${barId}`);

    if (!telefone) {
      // Buscar padrões de todos os clientes (top N)
      return await buscarPadroesTodosClientes(limite, barId);
    } else {
      // Buscar padrão de um cliente específico
      return await buscarPadraoCliente(telefone);
    }

  } catch (error: any) {
    console.error('❌ Erro ao buscar padrões de comportamento:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function buscarPadraoCliente(telefone: string) {
  // Buscar visitas do cliente
  const { data: symplaData } = await supabase
    .from('sympla_participantes')
    .select('data_evento, evento_nome')
    .eq('telefone_normalizado', telefone)
    .order('data_evento', { ascending: true });

  const { data: getinData } = await supabase
    .from('getin_reservations')
    .select('data, numero_convidados')
    .eq('telefone_normalizado', telefone)
    .order('data', { ascending: true });

  const { data: userData } = await supabase
    .from('sympla_participantes')
    .select('nome_completo')
    .eq('telefone_normalizado', telefone)
    .limit(1)
    .single();

  if (!symplaData && !getinData) {
    throw new Error('Cliente não encontrado');
  }

  // Consolidar visitas
  const visitas: Array<{ data: Date; tipo: string; convidados?: number }> = [];

  symplaData?.forEach(v => {
    visitas.push({
      data: new Date(v.data_evento),
      tipo: v.evento_nome || 'Evento',
      convidados: 1
    });
  });

  getinData?.forEach(v => {
    visitas.push({
      data: new Date(v.data),
      tipo: 'Reserva GetIn',
      convidados: v.numero_convidados || 1
    });
  });

  visitas.sort((a, b) => a.data.getTime() - b.data.getTime());

  // Análise de padrões
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

  const distribuicaoEventos: Record<string, number> = {};
  const distribuicaoMensal: Record<string, number> = {};
  let totalConvidados = 0;

  visitas.forEach(v => {
    // Dia da semana
    const dia = getDiaSemana(v.data);
    distribuicaoDias[dia as keyof typeof distribuicaoDias]++;

    // Horário
    const horario = getHorarioPeriodo(v.data);
    distribuicaoHorarios[horario]++;

    // Tipo de evento
    distribuicaoEventos[v.tipo] = (distribuicaoEventos[v.tipo] || 0) + 1;

    // Mês
    const mes = getMes(v.data);
    distribuicaoMensal[mes] = (distribuicaoMensal[mes] || 0) + 1;

    // Convidados
    totalConvidados += v.convidados || 1;
  });

  // Calcular intervalo médio entre visitas
  let intervaloTotal = 0;
  for (let i = 1; i < visitas.length; i++) {
    const diff = visitas[i].data.getTime() - visitas[i - 1].data.getTime();
    intervaloTotal += diff / (1000 * 60 * 60 * 24); // Converter para dias
  }
  const intervaloMedio = visitas.length > 1 ? Math.round(intervaloTotal / (visitas.length - 1)) : 0;

  // Determinar horário preferido por descrição
  const horarioPrefKey = getMaxKey(distribuicaoHorarios);
  const horarioDescricoes = {
    manha: 'Manhã (06:00-12:00)',
    tarde: 'Tarde (12:00-18:00)',
    noite: 'Noite (18:00-00:00)',
    madrugada: 'Madrugada (00:00-06:00)'
  };

  const padrao: PadraoCliente = {
    telefone,
    nome: userData?.nome_completo || 'Cliente',
    total_visitas: visitas.length,
    dia_semana_preferido: getMaxKey(distribuicaoDias),
    distribuicao_dias: distribuicaoDias,
    tipo_evento_preferido: getMaxKey(distribuicaoEventos),
    distribuicao_eventos: distribuicaoEventos,
    horario_preferido: horarioDescricoes[horarioPrefKey as keyof typeof horarioDescricoes],
    distribuicao_horarios: distribuicaoHorarios,
    intervalo_medio_visitas: intervaloMedio,
    frequencia: calcularFrequencia(intervaloMedio),
    mes_mais_ativo: getMaxKey(distribuicaoMensal),
    distribuicao_mensal: distribuicaoMensal,
    vem_sozinho: totalConvidados === visitas.length,
    tamanho_grupo_medio: Math.round(totalConvidados / visitas.length)
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
    
    // Aplicar limite no resultado cacheado
    const resultado = cached.padroes.slice(0, limite);
    
    return NextResponse.json({
      success: true,
      data: resultado,
      stats: cached.stats,
      fromCache: true
    });
  }

  console.log(`🔍 Cache MISS: Processando dados de padrões do ContaHub...`);

  // ===== BUSCAR TODOS OS DADOS COM PAGINAÇÃO =====
  
  // 1. Buscar dados do ContaHub (fonte principal - tem telefone)
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
    'telefone_normalizado, nome_completo, data_evento, evento_nome',
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
    visitas: Array<{ data: Date; tipo: string; convidados: number; valor?: number }>;
    totalGasto: number;
  }>();

  // Função para normalizar telefone
  const normalizarTelefone = (fone: string): string | null => {
    if (!fone) return null;
    const limpo = fone.replace(/\D/g, '');
    if (limpo.length < 10) return null;
    // Pegar últimos 9 dígitos
    return limpo.slice(-9);
  };

  // Processar ContaHub (fonte principal)
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
      data: new Date(item.dt_gerencial),
      tipo: 'ContaHub',
      convidados: 1,
      valor
    });
    cliente.totalGasto += valor;
  }

  // Processar Sympla (complementar - não duplicar se já existir no ContaHub)
  for (const item of symplaData) {
    if (!item.telefone_normalizado) continue;
    const telefoneNorm = item.telefone_normalizado.slice(-9);

    if (!clientesMap.has(telefoneNorm)) {
      clientesMap.set(telefoneNorm, {
        telefone: telefoneNorm,
        nome: item.nome_completo || 'Cliente',
        visitas: [],
        totalGasto: 0
      });
    }

    clientesMap.get(telefoneNorm)!.visitas.push({
      data: new Date(item.data_evento),
      tipo: item.evento_nome || 'Evento Sympla',
      convidados: 1
    });
  }

  // Processar GetIn (complementar)
  for (const item of getinData) {
    if (!item.telefone_normalizado) continue;
    const telefoneNorm = item.telefone_normalizado.slice(-9);

    if (!clientesMap.has(telefoneNorm)) {
      clientesMap.set(telefoneNorm, {
        telefone: telefoneNorm,
        nome: item.nome || 'Cliente',
        visitas: [],
        totalGasto: 0
      });
    }

    clientesMap.get(telefoneNorm)!.visitas.push({
      data: new Date(item.data),
      tipo: 'Reserva GetIn',
      convidados: item.numero_convidados || 1
    });
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

    const distribuicaoEventos: Record<string, number> = {};
    const distribuicaoMensal: Record<string, number> = {};
    let totalConvidados = 0;

    dados.visitas.forEach(v => {
      const dia = getDiaSemana(v.data);
      distribuicaoDias[dia as keyof typeof distribuicaoDias]++;

      const horario = getHorarioPeriodo(v.data);
      distribuicaoHorarios[horario]++;

      distribuicaoEventos[v.tipo] = (distribuicaoEventos[v.tipo] || 0) + 1;

      const mes = getMes(v.data);
      distribuicaoMensal[mes] = (distribuicaoMensal[mes] || 0) + 1;

      totalConvidados += v.convidados;
    });

    let intervaloTotal = 0;
    for (let i = 1; i < dados.visitas.length; i++) {
      const diff = dados.visitas[i].data.getTime() - dados.visitas[i - 1].data.getTime();
      intervaloTotal += diff / (1000 * 60 * 60 * 24);
    }
    const intervaloMedio = Math.round(intervaloTotal / (dados.visitas.length - 1));

    const horarioPrefKey = getMaxKey(distribuicaoHorarios, 'noite');
    const horarioDescricoes: Record<string, string> = {
      manha: 'Manhã (06:00-12:00)',
      tarde: 'Tarde (12:00-18:00)',
      noite: 'Noite (18:00-00:00)',
      madrugada: 'Madrugada (00:00-06:00)'
    };

    padroes.push({
      telefone,
      nome: dados.nome,
      total_visitas: dados.visitas.length,
      dia_semana_preferido: getMaxKey(distribuicaoDias, 'sabado'),
      distribuicao_dias: distribuicaoDias,
      tipo_evento_preferido: getMaxKey(distribuicaoEventos, 'ContaHub'),
      distribuicao_eventos: distribuicaoEventos,
      horario_preferido: horarioDescricoes[horarioPrefKey] || 'Noite (18:00-00:00)',
      distribuicao_horarios: distribuicaoHorarios,
      intervalo_medio_visitas: intervaloMedio,
      frequencia: calcularFrequencia(intervaloMedio),
      mes_mais_ativo: getMaxKey(distribuicaoMensal, 'Janeiro'),
      distribuicao_mensal: distribuicaoMensal,
      vem_sozinho: totalConvidados === dados.visitas.length,
      tamanho_grupo_medio: Math.round(totalConvidados / dados.visitas.length) || 1,
      total_gasto: dados.totalGasto,
      ticket_medio: dados.totalGasto > 0 ? Math.round(dados.totalGasto / dados.visitas.length) : 0
    });
  }

  // Ordenar por total de visitas (clientes mais frequentes primeiro)
  padroes.sort((a, b) => b.total_visitas - a.total_visitas);

  console.log(`✅ Padrões calculados: ${padroes.length} clientes com 2+ visitas`);

  // Estatísticas gerais (só calcular se tiver padrões)
  let stats: any = {
    total_clientes_analisados: padroes.length,
    dia_mais_popular: 'N/A',
    horario_mais_popular: 'N/A',
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
        'sabado'
      ),
      horario_mais_popular: getMaxKey(
        padroes.reduce((acc, p) => {
          acc[p.horario_preferido] = (acc[p.horario_preferido] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        'Noite (18:00-00:00)'
      ),
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

