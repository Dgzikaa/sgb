import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ClienteChurn {
  telefone: string;
  nome: string;
  ultima_visita: string;
  dias_sem_visitar: number;
  visitas_ultimos_90_dias: number;
  visitas_90_180_dias: number;
  valor_ultimos_90_dias: number;
  valor_90_180_dias: number;
  tendencia_frequencia: 'crescente' | 'estavel' | 'decrescente';
  tendencia_valor: 'crescente' | 'estavel' | 'decrescente';
  score_churn: number;
  nivel_risco: 'baixo' | 'medio' | 'alto' | 'critico';
  acoes_sugeridas: string[];
}

// Algoritmo de Predição de Churn
function calcularScoreChurn(dados: {
  dias_sem_visitar: number;
  visitas_ultimos_90_dias: number;
  visitas_90_180_dias: number;
  valor_ultimos_90_dias: number;
  valor_90_180_dias: number;
}): { score: number; nivel: 'baixo' | 'medio' | 'alto' | 'critico' } {
  let score = 0;

  // 1. FATOR RECÊNCIA (peso 35%)
  // Quanto mais tempo sem visitar, maior o risco
  if (dados.dias_sem_visitar > 90) {
    score += 35;
  } else if (dados.dias_sem_visitar > 60) {
    score += 25;
  } else if (dados.dias_sem_visitar > 30) {
    score += 15;
  } else if (dados.dias_sem_visitar > 15) {
    score += 5;
  }

  // 2. FATOR FREQUÊNCIA (peso 30%)
  // Compara visitas dos últimos 90 dias vs. período anterior
  const variacaoFrequencia = dados.visitas_90_180_dias > 0
    ? ((dados.visitas_ultimos_90_dias - dados.visitas_90_180_dias) / dados.visitas_90_180_dias) * 100
    : 0;

  if (variacaoFrequencia < -50) {
    score += 30; // Queda drástica
  } else if (variacaoFrequencia < -25) {
    score += 20; // Queda significativa
  } else if (variacaoFrequencia < 0) {
    score += 10; // Leve queda
  }

  // 3. FATOR VALOR MONETÁRIO (peso 25%)
  // Compara gastos dos últimos 90 dias vs. período anterior
  const variacaoValor = dados.valor_90_180_dias > 0
    ? ((dados.valor_ultimos_90_dias - dados.valor_90_180_dias) / dados.valor_90_180_dias) * 100
    : 0;

  if (variacaoValor < -50) {
    score += 25; // Queda drástica nos gastos
  } else if (variacaoValor < -25) {
    score += 15; // Queda significativa
  } else if (variacaoValor < 0) {
    score += 8; // Leve queda
  }

  // 4. FATOR INATIVIDADE (peso 10%)
  // Se não visitou nos últimos 90 dias
  if (dados.visitas_ultimos_90_dias === 0) {
    score += 10;
  }

  // Classificação do risco
  let nivel: 'baixo' | 'medio' | 'alto' | 'critico';
  if (score >= 75) {
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

// Sugestões de ações baseadas no perfil
function gerarAcoesSugeridas(cliente: Partial<ClienteChurn>): string[] {
  const acoes: string[] = [];

  if (cliente.nivel_risco === 'critico') {
    acoes.push('🚨 URGENTE: Contato imediato via WhatsApp');
    acoes.push('💰 Oferecer cupom de 20-30% de desconto');
    acoes.push('🎁 Enviar convite VIP para próximo evento especial');
  } else if (cliente.nivel_risco === 'alto') {
    acoes.push('📞 Entrar em contato via WhatsApp esta semana');
    acoes.push('💳 Oferecer cupom de 15% de desconto');
    acoes.push('📧 Incluir em campanha de reengajamento');
  } else if (cliente.nivel_risco === 'medio') {
    acoes.push('📱 Enviar mensagem personalizada de saudade');
    acoes.push('🎉 Convidar para eventos temáticos');
    acoes.push('💌 Incluir em newsletter semanal');
  }

  if (cliente.tendencia_valor === 'decrescente') {
    acoes.push('🍽️ Recomendar novos produtos do cardápio');
    acoes.push('🎯 Oferecer combo promocional');
  }

  if (cliente.dias_sem_visitar && cliente.dias_sem_visitar > 60) {
    acoes.push('🔔 Lembrar das novidades desde última visita');
    acoes.push('⭐ Perguntar feedback sobre experiência anterior');
  }

  return acoes;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const nivelRisco = searchParams.get('nivel_risco'); // baixo, medio, alto, critico
    const limite = parseInt(searchParams.get('limite') || '100');

    const hoje = new Date();
    const data90DiasAtras = new Date(hoje);
    data90DiasAtras.setDate(data90DiasAtras.getDate() - 90);
    const data180DiasAtras = new Date(hoje);
    data180DiasAtras.setDate(data180DiasAtras.getDate() - 180);

    // Buscar todos os clientes com histórico
    const { data: symplaData, error: symplaError } = await supabase
      .from('sympla_participantes')
      .select('telefone_normalizado, nome_completo, data_evento')
      .not('telefone_normalizado', 'is', null)
      .order('data_evento', { ascending: false });

    const { data: getinData, error: getinError } = await supabase
      .from('getin_reservations')
      .select('telefone_normalizado, nome, data')
      .not('telefone_normalizado', 'is', null)
      .order('data', { ascending: false });

    if (symplaError || getinError) {
      throw new Error(symplaError?.message || getinError?.message);
    }

    // Consolidar dados por telefone
    const clientesMap = new Map<string, {
      telefone: string;
      nome: string;
      visitas: Array<{ data: Date; fonte: 'sympla' | 'getin' }>;
    }>();

    // Processar Sympla
    symplaData?.forEach(item => {
      if (!item.telefone_normalizado) return;
      
      if (!clientesMap.has(item.telefone_normalizado)) {
        clientesMap.set(item.telefone_normalizado, {
          telefone: item.telefone_normalizado,
          nome: item.nome_completo || 'Cliente',
          visitas: []
        });
      }
      
      clientesMap.get(item.telefone_normalizado)!.visitas.push({
        data: new Date(item.data_evento),
        fonte: 'sympla'
      });
    });

    // Processar GetIn
    getinData?.forEach(item => {
      if (!item.telefone_normalizado) return;
      
      if (!clientesMap.has(item.telefone_normalizado)) {
        clientesMap.set(item.telefone_normalizado, {
          telefone: item.telefone_normalizado,
          nome: item.nome || 'Cliente',
          visitas: []
        });
      }
      
      clientesMap.get(item.telefone_normalizado)!.visitas.push({
        data: new Date(item.data),
        fonte: 'getin'
      });
    });

    // Calcular métricas e score de churn para cada cliente
    const clientesChurn: ClienteChurn[] = [];

    for (const [telefone, dados] of clientesMap.entries()) {
      // Ordenar visitas por data
      dados.visitas.sort((a, b) => b.data.getTime() - a.data.getTime());

      const ultimaVisita = dados.visitas[0]?.data;
      if (!ultimaVisita) continue;

      const diasSemVisitar = Math.floor((hoje.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24));

      // Contar visitas por período
      const visitasUltimos90 = dados.visitas.filter(v => v.data >= data90DiasAtras).length;
      const visitas90a180 = dados.visitas.filter(v => v.data >= data180DiasAtras && v.data < data90DiasAtras).length;

      // Para valor monetário, vamos usar número de visitas como proxy
      // (poderia ser integrado com dados de vendas reais futuramente)
      const valorUltimos90 = visitasUltimos90 * 100; // Média estimada por visita
      const valor90a180 = visitas90a180 * 100;

      // Calcular tendências
      const tendenciaFrequencia: 'crescente' | 'estavel' | 'decrescente' = 
        visitasUltimos90 > visitas90a180 ? 'crescente' :
        visitasUltimos90 < visitas90a180 ? 'decrescente' : 'estavel';

      const tendenciaValor: 'crescente' | 'estavel' | 'decrescente' =
        valorUltimos90 > valor90a180 ? 'crescente' :
        valorUltimos90 < valor90a180 ? 'decrescente' : 'estavel';

      // Calcular score de churn
      const { score, nivel } = calcularScoreChurn({
        dias_sem_visitar: diasSemVisitar,
        visitas_ultimos_90_dias: visitasUltimos90,
        visitas_90_180_dias: visitas90a180,
        valor_ultimos_90_dias: valorUltimos90,
        valor_90_180_dias: valor90a180
      });

      const cliente: ClienteChurn = {
        telefone,
        nome: dados.nome,
        ultima_visita: ultimaVisita.toISOString(),
        dias_sem_visitar: diasSemVisitar,
        visitas_ultimos_90_dias: visitasUltimos90,
        visitas_90_180_dias: visitas90a180,
        valor_ultimos_90_dias: valorUltimos90,
        valor_90_180_dias: valor90a180,
        tendencia_frequencia: tendenciaFrequencia,
        tendencia_valor: tendenciaValor,
        score_churn: score,
        nivel_risco: nivel,
        acoes_sugeridas: []
      };

      cliente.acoes_sugeridas = gerarAcoesSugeridas(cliente);

      clientesChurn.push(cliente);
    }

    // Filtrar por nível de risco se especificado
    let clientesFiltrados = clientesChurn;
    if (nivelRisco) {
      clientesFiltrados = clientesChurn.filter(c => c.nivel_risco === nivelRisco);
    }

    // Ordenar por score de churn (maior risco primeiro)
    clientesFiltrados.sort((a, b) => b.score_churn - a.score_churn);

    // Limitar resultados
    clientesFiltrados = clientesFiltrados.slice(0, limite);

    // Estatísticas gerais
    const stats = {
      total_clientes: clientesChurn.length,
      critico: clientesChurn.filter(c => c.nivel_risco === 'critico').length,
      alto: clientesChurn.filter(c => c.nivel_risco === 'alto').length,
      medio: clientesChurn.filter(c => c.nivel_risco === 'medio').length,
      baixo: clientesChurn.filter(c => c.nivel_risco === 'baixo').length,
      score_medio: clientesChurn.reduce((sum, c) => sum + c.score_churn, 0) / clientesChurn.length
    };

    return NextResponse.json({
      success: true,
      data: clientesFiltrados,
      stats
    });

  } catch (error: any) {
    console.error('Erro ao calcular predição de churn:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

