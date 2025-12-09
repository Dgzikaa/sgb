import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache em memória para evitar reprocessar dados a cada request
interface CacheEntry {
  data: any;
  timestamp: number;
  version: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const CACHE_VERSION = 2; // v2: Usando contahub_periodo com telefone

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (entry.version !== CACHE_VERSION) {
    cache.delete(key);
    console.log(`🔄 Cache churn invalidado (versão ${entry.version} → ${CACHE_VERSION})`);
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
  cache.set(key, {
    data,
    timestamp: Date.now(),
    version: CACHE_VERSION
  });
}

// Função para buscar TODOS os dados com paginação (contorna limite de 1000 do Supabase)
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

interface ClienteChurn {
  cliente_id: string;
  nome: string;
  telefone: string;
  ultima_visita: string;
  dias_sem_visitar: number;
  visitas_ultimos_30_dias: number;
  visitas_30_60_dias: number;
  valor_ultimos_30_dias: number;
  valor_30_60_dias: number;
  ticket_medio: number;
  total_visitas: number;
  total_gasto: number;
  tendencia_frequencia: 'crescente' | 'estavel' | 'decrescente';
  tendencia_valor: 'crescente' | 'estavel' | 'decrescente';
  score_churn: number;
  nivel_risco: 'baixo' | 'medio' | 'alto' | 'critico';
  acoes_sugeridas: string[];
}

// Algoritmo de Predição de Churn
function calcularScoreChurn(dados: {
  dias_sem_visitar: number;
  visitas_ultimos_30_dias: number;
  visitas_30_60_dias: number;
  valor_ultimos_30_dias: number;
  valor_30_60_dias: number;
  total_visitas: number;
}): { score: number; nivel: 'baixo' | 'medio' | 'alto' | 'critico' } {
  let score = 0;

  // 1. FATOR RECÊNCIA (peso 40%)
  if (dados.dias_sem_visitar > 60) {
    score += 40;
  } else if (dados.dias_sem_visitar > 45) {
    score += 30;
  } else if (dados.dias_sem_visitar > 30) {
    score += 20;
  } else if (dados.dias_sem_visitar > 14) {
    score += 10;
  } else if (dados.dias_sem_visitar > 7) {
    score += 5;
  }

  // 2. FATOR FREQUÊNCIA (peso 25%)
  const variacaoFrequencia = dados.visitas_30_60_dias > 0
    ? ((dados.visitas_ultimos_30_dias - dados.visitas_30_60_dias) / dados.visitas_30_60_dias) * 100
    : (dados.visitas_ultimos_30_dias > 0 ? -100 : 0);

  if (variacaoFrequencia <= -75) {
    score += 25;
  } else if (variacaoFrequencia <= -50) {
    score += 18;
  } else if (variacaoFrequencia <= -25) {
    score += 10;
  } else if (variacaoFrequencia < 0) {
    score += 5;
  }

  // 3. FATOR VALOR MONETÁRIO (peso 25%)
  const variacaoValor = dados.valor_30_60_dias > 0
    ? ((dados.valor_ultimos_30_dias - dados.valor_30_60_dias) / dados.valor_30_60_dias) * 100
    : (dados.valor_ultimos_30_dias > 0 ? -100 : 0);

  if (variacaoValor <= -75) {
    score += 25;
  } else if (variacaoValor <= -50) {
    score += 18;
  } else if (variacaoValor <= -25) {
    score += 10;
  } else if (variacaoValor < 0) {
    score += 5;
  }

  // 4. FATOR ENGAJAMENTO HISTÓRICO (peso 10%)
  if (dados.total_visitas >= 10 && dados.visitas_ultimos_30_dias === 0) {
    score += 10;
  } else if (dados.total_visitas >= 5 && dados.visitas_ultimos_30_dias === 0) {
    score += 7;
  } else if (dados.total_visitas >= 3 && dados.visitas_ultimos_30_dias === 0) {
    score += 5;
  }

  let nivel: 'baixo' | 'medio' | 'alto' | 'critico';
  if (score >= 70) {
    nivel = 'critico';
  } else if (score >= 50) {
    nivel = 'alto';
  } else if (score >= 25) {
    nivel = 'medio';
  } else {
    nivel = 'baixo';
  }

  return { score: Math.min(score, 100), nivel };
}

// Sugestões de ações
function gerarAcoesSugeridas(cliente: Partial<ClienteChurn>): string[] {
  const acoes: string[] = [];

  if (cliente.nivel_risco === 'critico') {
    acoes.push('🚨 URGENTE: Cliente VIP em risco - contato imediato');
    acoes.push('💰 Oferecer cupom de 20-30% de desconto');
    acoes.push('🎁 Convite VIP para próximo evento especial');
    if ((cliente.total_gasto || 0) > 1000) {
      acoes.push('⭐ Cliente alto valor - tratamento prioritário');
    }
  } else if (cliente.nivel_risco === 'alto') {
    acoes.push('📞 Entrar em contato esta semana');
    acoes.push('💳 Oferecer cupom de 15% de desconto');
    acoes.push('📧 Incluir em campanha de reengajamento');
  } else if (cliente.nivel_risco === 'medio') {
    acoes.push('📱 Enviar mensagem personalizada');
    acoes.push('🎉 Convidar para próximo evento');
    acoes.push('💌 Manter em lista de comunicação ativa');
  }

  if (cliente.tendencia_valor === 'decrescente') {
    acoes.push('🍽️ Recomendar novos produtos do cardápio');
    acoes.push('🎯 Oferecer combo promocional');
  }

  if ((cliente.ticket_medio || 0) > 200) {
    acoes.push('💎 Cliente premium - oferecer experiência diferenciada');
  }

  return acoes;
}

// Normalizar telefone
function normalizarTelefone(rawFone: string): string | null {
  if (!rawFone) return null;
  
  let fone = rawFone.toString().trim().replace(/\D/g, '');
  if (!fone || fone.length < 10) return null;

  // Padronizar: 10 dígitos → 11 dígitos (adicionar 9 após DDD)
  const ddds = ['11', '12', '13', '14', '15', '16', '17', '18', '19', '21', '22', '24', '27', '28', '31', '32', '33', '34', '35', '37', '38', '41', '42', '43', '44', '45', '46', '47', '48', '49', '51', '53', '54', '55', '61', '62', '63', '64', '65', '66', '67', '68', '69', '71', '73', '74', '75', '77', '79', '81', '82', '83', '84', '85', '86', '87', '88', '89', '91', '92', '93', '94', '95', '96', '97', '98', '99'];
  
  if (fone.length === 10 && ddds.includes(fone.substring(0, 2))) {
    fone = fone.substring(0, 2) + '9' + fone.substring(2);
  }

  return fone;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nivelRisco = searchParams.get('nivel_risco');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const barIdParam = searchParams.get('bar_id');
    
    if (!barIdParam) {
      return NextResponse.json(
        { error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }
    const barId = parseInt(barIdParam);

    // Verificar cache
    const cacheKey = `churn_prediction_${barId}`;
    const cached = getCached(cacheKey);

    let clientesChurn: ClienteChurn[] = [];
    let stats: any = null;

    if (cached) {
      console.log(`⚡ Cache HIT: Usando dados de churn em cache (${cached.clientes.length} clientes)`);
      clientesChurn = cached.clientes;
      stats = cached.stats;
    } else {
      console.log(`🔍 Cache MISS: Processando dados de churn do ContaHub...`);

      // Calcular datas
      const hoje = new Date();
      const data30DiasAtras = new Date(hoje);
      data30DiasAtras.setDate(data30DiasAtras.getDate() - 30);
      const data60DiasAtras = new Date(hoje);
      data60DiasAtras.setDate(data60DiasAtras.getDate() - 60);

      // Buscar TODOS os dados do ContaHub (usando contahub_periodo que tem telefone)
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

      // Processar dados - agrupar por TELEFONE
      const clientesMap = new Map<string, {
        nome: string;
        telefone: string;
        visitas: { data: Date; valor: number }[];
        totalVisitas: number;
        totalGasto: number;
      }>();

      for (const item of contahubData) {
        const nome = item.cli_nome?.trim();
        const rawFone = item.cli_fone?.toString().trim();
        
        if (!nome || !rawFone || nome === 'MESA' || nome === 'SEM NOME' || nome === 'BALCAO') continue;

        const fone = normalizarTelefone(rawFone);
        if (!fone) continue;

        if (!clientesMap.has(fone)) {
          clientesMap.set(fone, {
            nome,
            telefone: fone,
            visitas: [],
            totalVisitas: 0,
            totalGasto: 0
          });
        }

        const cliente = clientesMap.get(fone)!;
        cliente.totalVisitas++;
        
        const vrCouvert = parseFloat(item.vr_couvert || '0') || 0;
        const vrPagamentos = parseFloat(item.vr_pagamentos || '0') || 0;
        const vrConsumo = vrPagamentos - vrCouvert;
        cliente.totalGasto += vrConsumo;

        if (item.dt_gerencial) {
          cliente.visitas.push({
            data: new Date(item.dt_gerencial),
            valor: vrConsumo
          });
        }
      }

      console.log(`👥 Total de clientes únicos: ${clientesMap.size}`);

      // Calcular métricas de churn para cada cliente
      for (const [telefone, dados] of clientesMap.entries()) {
        // Ordenar visitas por data (mais recente primeiro)
        dados.visitas.sort((a, b) => b.data.getTime() - a.data.getTime());

        const ultimaVisita = dados.visitas[0]?.data;
        if (!ultimaVisita) continue;

        const diasSemVisitar = Math.floor((hoje.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24));

        // Separar visitas por período
        const visitasUltimos30 = dados.visitas.filter(v => v.data >= data30DiasAtras);
        const visitas30a60 = dados.visitas.filter(v => v.data >= data60DiasAtras && v.data < data30DiasAtras);

        const valorUltimos30 = visitasUltimos30.reduce((sum, v) => sum + v.valor, 0);
        const valor30a60 = visitas30a60.reduce((sum, v) => sum + v.valor, 0);

        const ticketMedio = dados.totalVisitas > 0 ? dados.totalGasto / dados.totalVisitas : 0;

        // Calcular tendências
        const tendenciaFrequencia: 'crescente' | 'estavel' | 'decrescente' = 
          visitasUltimos30.length > visitas30a60.length ? 'crescente' :
          visitasUltimos30.length < visitas30a60.length ? 'decrescente' : 'estavel';

        const tendenciaValor: 'crescente' | 'estavel' | 'decrescente' =
          valorUltimos30 > valor30a60 ? 'crescente' :
          valorUltimos30 < valor30a60 ? 'decrescente' : 'estavel';

        // Calcular score de churn
        const { score, nivel } = calcularScoreChurn({
          dias_sem_visitar: diasSemVisitar,
          visitas_ultimos_30_dias: visitasUltimos30.length,
          visitas_30_60_dias: visitas30a60.length,
          valor_ultimos_30_dias: valorUltimos30,
          valor_30_60_dias: valor30a60,
          total_visitas: dados.totalVisitas
        });

        // Só incluir clientes com pelo menos 2 visitas (recorrentes)
        if (dados.totalVisitas < 2) continue;

        const cliente: ClienteChurn = {
          cliente_id: telefone,
          nome: dados.nome,
          telefone,
          ultima_visita: ultimaVisita.toISOString(),
          dias_sem_visitar: diasSemVisitar,
          visitas_ultimos_30_dias: visitasUltimos30.length,
          visitas_30_60_dias: visitas30a60.length,
          valor_ultimos_30_dias: valorUltimos30,
          valor_30_60_dias: valor30a60,
          ticket_medio: ticketMedio,
          total_visitas: dados.totalVisitas,
          total_gasto: dados.totalGasto,
          tendencia_frequencia: tendenciaFrequencia,
          tendencia_valor: tendenciaValor,
          score_churn: score,
          nivel_risco: nivel,
          acoes_sugeridas: []
        };

        cliente.acoes_sugeridas = gerarAcoesSugeridas(cliente);
        clientesChurn.push(cliente);
      }

      // Ordenar por score de churn (maior risco primeiro)
      clientesChurn.sort((a, b) => b.score_churn - a.score_churn);

      // Estatísticas gerais
      stats = {
        total_clientes: clientesChurn.length,
        critico: clientesChurn.filter(c => c.nivel_risco === 'critico').length,
        alto: clientesChurn.filter(c => c.nivel_risco === 'alto').length,
        medio: clientesChurn.filter(c => c.nivel_risco === 'medio').length,
        baixo: clientesChurn.filter(c => c.nivel_risco === 'baixo').length,
        score_medio: clientesChurn.length > 0 
          ? Math.round(clientesChurn.reduce((sum, c) => sum + c.score_churn, 0) / clientesChurn.length)
          : 0,
        valor_total_em_risco: clientesChurn
          .filter(c => c.nivel_risco === 'critico' || c.nivel_risco === 'alto')
          .reduce((sum, c) => sum + c.total_gasto, 0)
      };

      // Salvar no cache
      setCache(cacheKey, { clientes: clientesChurn, stats });
      console.log(`💾 Cache SAVED: ${clientesChurn.length} clientes de churn processados`);
    }

    // Filtrar por nível de risco
    let clientesFiltrados = clientesChurn;
    if (nivelRisco) {
      clientesFiltrados = clientesChurn.filter(c => c.nivel_risco === nivelRisco);
    }

    // Aplicar paginação
    const totalClientes = clientesFiltrados.length;
    const totalPages = Math.ceil(totalClientes / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const clientesPaginados = clientesFiltrados.slice(startIndex, endIndex);

    console.log(`✅ Churn: ${clientesPaginados.length} de ${totalClientes} clientes (página ${page}/${totalPages})`);

    return NextResponse.json({
      success: true,
      data: clientesPaginados,
      stats,
      paginacao: {
        page,
        limit,
        total: totalClientes,
        totalPages,
        hasMore: page < totalPages
      },
      fonte: 'contahub_periodo'
    });

  } catch (error: any) {
    console.error('Erro ao calcular predição de churn:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
