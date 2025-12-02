import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    console.log(`🔍 CRM: Iniciando análise de segmentação (Página ${page}, Limite ${limit})...`);

    // 1. Buscar TODOS os dados de eventos Sympla (usando range para remover limite padrão de 1000)
    const { data: symplaData } = await supabase
      .from('sympla_participantes')
      .select('nome_completo, email, pedido_id')
      .eq('bar_id', barId)
      .eq('status_pedido', 'APPROVED')
      .range(0, 99999); // Remove limite padrão de 1000 registros

    // 2. Buscar TODAS as reservas GetIn
    const { data: getinData } = await supabase
      .from('getin_reservas')
      .select('customer_name, customer_email, customer_phone, reservation_date, status')
      .eq('bar_id', barId)
      .in('status', ['seated', 'confirmed'])
      .range(0, 99999); // Remove limite padrão

    // 3. Buscar dados de eventos_base para receita
    const { data: eventosData } = await supabase
      .from('eventos_base')
      .select('data_evento, real_r, cl_real')
      .eq('bar_id', barId)
      .eq('ativo', true)
      .range(0, 99999); // Remove limite padrão

    // 4. Buscar TODOS os dados de pagamentos do ContaHub
    const { data: contahubData } = await supabase
      .from('contahub_pagamentos')
      .select('cli, cliente, vr_pagamentos, dt_transacao')
      .eq('vd', barId.toString())
      .not('cliente', 'is', null)
      .not('cliente', 'eq', '')
      .range(0, 99999); // Remove limite padrão

    console.log(`📊 Dados carregados: Sympla=${symplaData?.length || 0}, GetIn=${getinData?.length || 0}, ContaHub=${contahubData?.length || 0}`);

    // 5. Criar mapa de clientes unificados
    const clientesMap = new Map<string, ClienteUnificado>();

    // Processar Sympla
    if (symplaData) {
      for (const item of symplaData) {
        const nome = item.nome_completo?.trim();
        const email = item.email?.trim().toLowerCase();
        
        if (!nome) continue;

        const id = email || nome.toLowerCase();
        
        if (!clientesMap.has(id)) {
          clientesMap.set(id, {
            identificador: id,
            nome,
            email,
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
      }
    }

    // Processar GetIn
    if (getinData) {
      for (const item of getinData) {
        const nome = item.customer_name?.trim();
        const email = item.customer_email?.trim().toLowerCase();
        const telefone = item.customer_phone?.trim();
        
        if (!nome) continue;

        const id = email || telefone || nome.toLowerCase();
        
        if (!clientesMap.has(id)) {
          clientesMap.set(id, {
            identificador: id,
            nome,
            email,
            telefone,
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
        
        if (item.reservation_date) {
          if (!cliente.ultima_visita || item.reservation_date > cliente.ultima_visita) {
            cliente.ultima_visita = item.reservation_date;
          }
          if (!cliente.primeira_visita || item.reservation_date < cliente.primeira_visita) {
            cliente.primeira_visita = item.reservation_date;
          }
        }
      }
    }

    // Processar ContaHub (dados REAIS de pagamentos)
    if (contahubData) {
      console.log(`💳 Processando ${contahubData.length} pagamentos do ContaHub...`);
      
      for (const item of contahubData) {
        const nome = item.cliente?.trim();
        if (!nome || nome === 'MESA' || nome === 'SEM NOME') continue;

        const id = `contahub_${item.cli || nome.toLowerCase()}`;
        
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

      // Atualizar ticket médio dos clientes ContaHub
      clientesMap.forEach(cliente => {
        if (cliente.identificador.startsWith('contahub_') && cliente.total_visitas > 0) {
          cliente.ticket_medio = cliente.total_gasto / cliente.total_visitas;
        }
      });
    }

    // 6. Enriquecer com dados estimados SOMENTE para Sympla/GetIn (que não têm valor real)
    if (eventosData) {
      const gastoPorEvento = new Map<string, number>();
      
      eventosData.forEach(evento => {
        const ticketMedio = evento.cl_real > 0 ? evento.real_r / evento.cl_real : 0;
        gastoPorEvento.set(evento.data_evento, ticketMedio);
      });

      // Distribuir gastos proporcionalmente APENAS para quem não tem gasto real
      clientesMap.forEach(cliente => {
        // Se já tem gasto real (ContaHub), não sobrescrever
        if (cliente.total_gasto === 0) {
          cliente.total_gasto = cliente.total_visitas * 150; // Estimativa inicial
          cliente.ticket_medio = cliente.total_visitas > 0 ? cliente.total_gasto / cliente.total_visitas : 0;
        }
      });
    }

    // 7. Calcular métricas temporais
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

    console.log(`👥 Total de clientes únicos unificados: ${clientesMap.size}`);

    // 8. Calcular scores RFM
    const clientes = Array.from(clientesMap.values());
    
    // Calcular quintis para cada métrica
    const recencies = clientes.map(c => c.dias_desde_ultima_visita).sort((a, b) => a - b);
    const frequencies = clientes.map(c => c.total_visitas).sort((a, b) => b - a); // Maior é melhor
    const monetaries = clientes.map(c => c.total_gasto).sort((a, b) => b - a); // Maior é melhor

    const getScore = (value: number, sortedArray: number[], reverse: boolean = false) => {
      const quintil = sortedArray.length / 5;
      const index = sortedArray.indexOf(value);
      
      if (reverse) {
        if (index < quintil) return 5;
        if (index < quintil * 2) return 4;
        if (index < quintil * 3) return 3;
        if (index < quintil * 4) return 2;
        return 1;
      } else {
        if (index < quintil) return 1;
        if (index < quintil * 2) return 2;
        if (index < quintil * 3) return 3;
        if (index < quintil * 4) return 4;
        return 5;
      }
    };

    // 9. Segmentar clientes
    const clientesSegmentados = clientes.map(cliente => {
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

    // 10. Ordenar por prioridade e RFM total
    clientesSegmentados.sort((a, b) => {
      if (a.prioridade !== b.prioridade) return b.prioridade - a.prioridade;
      return b.rfm_total - a.rfm_total;
    });

    // 11. Filtrar por segmento se especificado
    let clientesFiltrados = clientesSegmentados;
    if (segmento !== 'todos') {
      clientesFiltrados = clientesSegmentados.filter(c => c.segmento === segmento);
    }

    // 12. Estatísticas gerais (sempre retorna o total)
    const stats = {
      total_clientes: clientesSegmentados.length,
      vips: clientesSegmentados.filter(c => c.segmento.includes('VIP')).length,
      em_risco: clientesSegmentados.filter(c => c.segmento.includes('Risco')).length,
      fieis: clientesSegmentados.filter(c => c.segmento.includes('Fiéis')).length,
      novos: clientesSegmentados.filter(c => c.segmento.includes('Novos')).length,
      inativos: clientesSegmentados.filter(c => c.segmento.includes('Inativos')).length,
      regulares: clientesSegmentados.filter(c => c.segmento.includes('Regulares')).length,
      potencial: clientesSegmentados.filter(c => c.segmento.includes('Potencial')).length,
    };

    // 13. Aplicar paginação
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

