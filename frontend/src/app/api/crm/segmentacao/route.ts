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
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function getCached(key: string) {
  const entry = cache.get(key);
  if (!entry) return null;
  
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
    timestamp: Date.now()
  });
}

// Função para buscar TODOS os dados com paginação (contorna limite de 1000 do Supabase)
async function fetchAllData(tableName: string, columns: string, filters: any = {}) {
  let allData: any[] = [];
  let from = 0;
  const limit = 1000;
  const MAX_ITERATIONS = 200; // Aumentado para suportar até 200k registros
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
      } else if (key.includes('in_')) {
        query = query.in(key.replace('in_', ''), Array.isArray(value) ? value : [value]);
      } else if (key.includes('not_')) {
        if (key.includes('not_is_')) {
          query = query.not(key.replace('not_is_', ''), 'is', value);
        } else if (key.includes('not_eq_')) {
          query = query.not(key.replace('not_eq_', ''), 'eq', value);
        }
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
    
    // Log de progresso a cada 10k registros
    if (allData.length % 10000 === 0 || data.length < limit) {
      console.log(`  ✓ ${tableName}: ${allData.length} registros carregados`);
    }
    
    if (data.length < limit) {
      break; // Última página
    }
    
    from += limit;
  }
  
  return allData;
}

interface ClienteUnificado {
  identificador: string;
  nome: string;
  email?: string;
  telefone?: string;
  total_visitas: number;
  total_gasto: number;
  ultima_visita: string;
  primeira_visita: string;
  dias_desde_ultima_visita: number;
  ticket_medio: number;
  frequencia_dias: number; // visitas por dia desde primeira visita
}

interface SegmentacaoRFM {
  r_score: number; // Recency (1-5)
  f_score: number; // Frequency (1-5)
  m_score: number; // Monetary (1-5)
  rfm_total: number;
  segmento: string;
  cor: string;
  acoes_sugeridas: string[];
  prioridade: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = parseInt(searchParams.get('bar_id') || '3');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const segmento = searchParams.get('segmento') || 'todos';

    // Verificar cache primeiro (evita reprocessar 90k registros a cada clique)
    const cacheKey = `crm_segmentacao_${barId}`;
    const cached = getCached(cacheKey);

    let clientesSegmentados;
    let stats;

    if (cached) {
      console.log(`⚡ Cache HIT: Usando dados em cache (${cached.clientes.length} clientes)`);
      clientesSegmentados = cached.clientes;
      stats = cached.stats;
    } else {
      console.log(`🔍 Cache MISS: Processando dados do ContaHub...`);

      // Buscar APENAS ContaHub - ÚNICA fonte com dados REAIS de consumo
      const contahubDataRaw = await fetchAllData(
        'contahub_pagamentos', 
        'cli, cliente, vr_pagamentos, dt_transacao', 
        {
          eq_bar_id: barId
        }
      );

      // Filtrar clientes válidos (remover null e vazio)
      const contahubData = contahubDataRaw.filter(item => 
        item.cliente && item.cliente.trim() !== ''
      );

      console.log(`💳 ContaHub: ${contahubData.length} pagamentos válidos (de ${contahubDataRaw.length} totais)`);

      // 5. Processar APENAS ContaHub - dados REAIS de consumo
      const clientesMap = new Map<string, ClienteUnificado>();
    
    console.log(`💳 Processando ${contahubData.length} pagamentos do ContaHub...`);
    
    for (const item of contahubData) {
      const nome = item.cliente?.trim();
      
      // Filtrar clientes inválidos
      if (!nome || nome === 'MESA' || nome === 'SEM NOME' || nome === 'BALCAO') continue;

      // Usar ID do cliente como identificador único
      const id = `cli_${item.cli}`;
      
      if (!clientesMap.has(id)) {
        clientesMap.set(id, {
          identificador: id,
          nome,
          total_visitas: 0,
          total_gasto: 0,
          ultima_visita: '',
          primeira_visita: '',
          dias_desde_ultima_visita: 0,
          ticket_medio: 0,
          frequencia_dias: 0
        });
      }

      const cliente = clientesMap.get(id)!;
      cliente.total_visitas++;
      cliente.total_gasto += parseFloat(item.vr_pagamentos || '0');
      
      if (item.dt_transacao) {
        const dataTransacao = item.dt_transacao.toString();
        
        if (!cliente.ultima_visita || dataTransacao > cliente.ultima_visita) {
          cliente.ultima_visita = dataTransacao;
        }
        if (!cliente.primeira_visita || dataTransacao < cliente.primeira_visita) {
          cliente.primeira_visita = dataTransacao;
        }
      }
    }

    // Calcular ticket médio para cada cliente
    clientesMap.forEach(cliente => {
      if (cliente.total_visitas > 0) {
        cliente.ticket_medio = cliente.total_gasto / cliente.total_visitas;
      }
    });

    // 6. Calcular métricas temporais
    const hoje = new Date();
    clientesMap.forEach(cliente => {
      if (cliente.ultima_visita) {
        const ultimaVisitaDate = new Date(cliente.ultima_visita);
        cliente.dias_desde_ultima_visita = Math.floor((hoje.getTime() - ultimaVisitaDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      if (cliente.primeira_visita && cliente.ultima_visita) {
        const primeiraVisitaDate = new Date(cliente.primeira_visita);
        const ultimaVisitaDate = new Date(cliente.ultima_visita);
        const diasEntrePrimeiraEUltima = Math.max(1, Math.floor((ultimaVisitaDate.getTime() - primeiraVisitaDate.getTime()) / (1000 * 60 * 60 * 24)));
        cliente.frequencia_dias = cliente.total_visitas / Math.max(1, diasEntrePrimeiraEUltima);
      }
    });

    console.log(`👥 Total de clientes únicos com dados REAIS: ${clientesMap.size}`);

    // 7. Calcular scores RFM (MELHORADO - usa percentis em vez de indexOf)
    const clientes = Array.from(clientesMap.values());
    
    // Ordenar métricas
    const recencies = clientes.map(c => c.dias_desde_ultima_visita).sort((a, b) => a - b);
    const frequencies = clientes.map(c => c.total_visitas).sort((a, b) => a - b);
    const monetaries = clientes.map(c => c.total_gasto).sort((a, b) => a - b);

    // Função de score baseada em percentis (mais preciso)
    const getScore = (value: number, sortedArray: number[], reverse: boolean = false) => {
      const total = sortedArray.length;
      
      // Encontrar posição do valor no array ordenado
      let position = 0;
      for (let i = 0; i < sortedArray.length; i++) {
        if (sortedArray[i] <= value) position = i;
        else break;
      }
      
      const percentil = position / total;
      
      if (reverse) {
        // Para Recency: menor valor = melhor score
        if (percentil <= 0.2) return 5;
        if (percentil <= 0.4) return 4;
        if (percentil <= 0.6) return 3;
        if (percentil <= 0.8) return 2;
        return 1;
      } else {
        // Para Frequency/Monetary: maior valor = melhor score
        if (percentil <= 0.2) return 1;
        if (percentil <= 0.4) return 2;
        if (percentil <= 0.6) return 3;
        if (percentil <= 0.8) return 4;
        return 5;
      }
    };

    // 8. Segmentar clientes
    clientesSegmentados = clientes.map(cliente => {
      const r_score = getScore(cliente.dias_desde_ultima_visita, recencies, true); // Menor recência = melhor
      const f_score = getScore(cliente.total_visitas, frequencies);
      const m_score = getScore(cliente.total_gasto, monetaries);
      const rfm_total = r_score + f_score + m_score;

      let segmento = '';
      let cor = '';
      let acoes_sugeridas: string[] = [];
      let prioridade = 0;

      // Segmentação inteligente
      if (r_score >= 4 && f_score >= 4 && m_score >= 4) {
        segmento = '💎 VIP Champions';
        cor = 'purple';
        prioridade = 5;
        acoes_sugeridas = [
          'Programa de fidelidade exclusivo',
          'Convite para eventos VIP',
          'Benefícios e recompensas especiais'
        ];
      } else if (r_score >= 4 && (f_score >= 3 || m_score >= 3)) {
        segmento = '⭐ Clientes Fiéis';
        cor = 'blue';
        prioridade = 4;
        acoes_sugeridas = [
          'Manter engajamento com novidades',
          'Oferecer programa de indicação',
          'Recompensas por frequência'
        ];
      } else if (r_score >= 3 && f_score <= 2 && m_score >= 3) {
        segmento = '💰 Grande Potencial';
        cor = 'green';
        prioridade = 4;
        acoes_sugeridas = [
          'Incentivo para aumentar frequência',
          'Benefícios por volume de gasto',
          'Campanhas de reativação'
        ];
      } else if (r_score <= 2 && f_score >= 4) {
        segmento = '⚠️ Em Risco (Churn)';
        cor = 'orange';
        prioridade = 5;
        acoes_sugeridas = [
          'URGENTE: Campanha de reconquista',
          'Contato personalizado (WhatsApp)',
          'Promoção exclusiva de retorno',
          'Pesquisa de satisfação'
        ];
      } else if (r_score >= 4 && f_score <= 2) {
        segmento = '🌱 Novos Promissores';
        cor = 'teal';
        prioridade = 3;
        acoes_sugeridas = [
          'Onboarding personalizado',
          'Incentivo para segunda visita',
          'Apresentar experiências do bar'
        ];
      } else if (r_score <= 2 && f_score <= 2 && m_score <= 2) {
        segmento = '😴 Inativos';
        cor = 'gray';
        prioridade = 1;
        acoes_sugeridas = [
          'Considerar remoção da base ativa',
          'Campanha de baixo custo (email/redes)',
        ];
      } else {
        segmento = '📊 Regulares';
        cor = 'indigo';
        prioridade = 2;
        acoes_sugeridas = [
          'Manter comunicação regular',
          'Campanhas sazonais',
          'Benefícios para aumentar ticket'
        ];
      }

      const segmentacao: SegmentacaoRFM = {
        r_score,
        f_score,
        m_score,
        rfm_total,
        segmento,
        cor,
        acoes_sugeridas,
        prioridade
      };

      return {
        ...cliente,
        ...segmentacao
      };
    });

      // 9. Ordenar por prioridade e RFM total
      clientesSegmentados.sort((a, b) => {
        if (a.prioridade !== b.prioridade) return b.prioridade - a.prioridade;
        return b.rfm_total - a.rfm_total;
      });

      // 11. Estatísticas gerais (sempre retorna o total)
      stats = {
        total_clientes: clientesSegmentados.length,
        vips: clientesSegmentados.filter(c => c.segmento.includes('VIP')).length,
        em_risco: clientesSegmentados.filter(c => c.segmento.includes('Risco')).length,
        fieis: clientesSegmentados.filter(c => c.segmento.includes('Fiéis')).length,
        novos: clientesSegmentados.filter(c => c.segmento.includes('Novos')).length,
        inativos: clientesSegmentados.filter(c => c.segmento.includes('Inativos')).length,
        regulares: clientesSegmentados.filter(c => c.segmento.includes('Regulares')).length,
        potencial: clientesSegmentados.filter(c => c.segmento.includes('Potencial')).length,
      };

      // Salvar no cache (5 minutos)
      setCache(cacheKey, { clientes: clientesSegmentados, stats });
      console.log(`💾 Cache SAVED: ${clientesSegmentados.length} clientes processados`);
    }

    // 10. Filtrar por segmento se especificado (APÓS o cache)
    let clientesFiltrados = clientesSegmentados || [];
    if (segmento !== 'todos' && clientesSegmentados) {
      clientesFiltrados = clientesSegmentados.filter(c => c.segmento === segmento);
    }

    // Validação de segurança
    if (!clientesFiltrados || !Array.isArray(clientesFiltrados)) {
      console.error('❌ clientesFiltrados está undefined ou não é array:', clientesFiltrados);
      clientesFiltrados = [];
    }

    if (!stats) {
      console.error('❌ stats está undefined');
      stats = {
        total_clientes: 0,
        vips: 0,
        em_risco: 0,
        fieis: 0,
        novos: 0,
        inativos: 0,
        regulares: 0,
        potencial: 0,
      };
    }

    // 12. Aplicar paginação
    const totalClientes = clientesFiltrados.length;
    const totalPages = Math.ceil(totalClientes / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const clientesPaginados = clientesFiltrados.slice(startIndex, endIndex);

    console.log(`✅ CRM: ${clientesPaginados.length} de ${totalClientes} clientes (página ${page}/${totalPages})`);

    return NextResponse.json({
      success: true,
      clientes: clientesPaginados,
      estatisticas: stats,
      paginacao: {
        page,
        limit,
        total: totalClientes,
        totalPages,
        hasMore: page < totalPages
      }
    });

  } catch (error: any) {
    console.error('❌ Erro na API de CRM:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

