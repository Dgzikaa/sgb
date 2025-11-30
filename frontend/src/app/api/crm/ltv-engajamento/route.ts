import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ClienteLTV {
  telefone: string;
  nome: string;
  
  // Lifetime Value
  ltv_atual: number; // Valor total já gasto
  ltv_projetado_12m: number; // Projeção para próximos 12 meses
  ltv_projetado_24m: number; // Projeção para próximos 24 meses
  
  // Métricas de Engajamento
  score_engajamento: number; // 0-100
  nivel_engajamento: 'baixo' | 'medio' | 'alto' | 'muito_alto';
  
  // Métricas de cálculo
  total_visitas: number;
  primeira_visita: string;
  ultima_visita: string;
  dias_como_cliente: number;
  frequencia_visitas: number; // Visitas por mês
  ticket_medio: number;
  valor_medio_mensal: number;
  
  // Tendências
  tendencia_valor: 'crescente' | 'estavel' | 'decrescente';
  tendencia_frequencia: 'crescente' | 'estavel' | 'decrescente';
  
  // Potencial
  potencial_crescimento: 'baixo' | 'medio' | 'alto';
  roi_marketing: number; // Retorno estimado de investimento em marketing
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
  if (dados.frequenciaVisitas >= 4) score += 40; // 4+ vezes por mês
  else if (dados.frequenciaVisitas >= 2) score += 30; // 2-3 vezes por mês
  else if (dados.frequenciaVisitas >= 1) score += 20; // 1 vez por mês
  else if (dados.frequenciaVisitas >= 0.5) score += 10; // Quinzenal
  else score += 5; // Esporádico

  // 2. LONGEVIDADE (25 pontos)
  if (dados.diasComoCliente > 365) score += 25; // Mais de 1 ano
  else if (dados.diasComoCliente > 180) score += 20; // 6 meses - 1 ano
  else if (dados.diasComoCliente > 90) score += 15; // 3-6 meses
  else if (dados.diasComoCliente > 30) score += 10; // 1-3 meses
  else score += 5; // Novo cliente

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

  if (mediaRecente > mediaAntiga * 1.1) return 'crescente';
  if (mediaRecente < mediaAntiga * 0.9) return 'decrescente';
  return 'estavel';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const telefone = searchParams.get('telefone');
    const limite = parseInt(searchParams.get('limite') || '100');

    if (telefone) {
      // LTV de um cliente específico
      return await calcularLTVCliente(telefone);
    } else {
      // LTV de todos os clientes (top N)
      return await calcularLTVTodosClientes(limite);
    }

  } catch (error: any) {
    console.error('Erro ao calcular LTV:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

async function calcularLTVCliente(telefone: string) {
  // Buscar histórico do cliente
  const { data: symplaData } = await supabase
    .from('sympla_participantes')
    .select('data_evento, nome_completo')
    .eq('telefone_normalizado', telefone)
    .order('data_evento', { ascending: true });

  const { data: getinData } = await supabase
    .from('getin_reservations')
    .select('data, nome, numero_convidados')
    .eq('telefone_normalizado', telefone)
    .order('data', { ascending: true });

  if (!symplaData?.length && !getinData?.length) {
    throw new Error('Cliente não encontrado');
  }

  // Consolidar visitas
  const visitas: Array<{ data: Date; valor: number }> = [];

  symplaData?.forEach(v => {
    visitas.push({
      data: new Date(v.data_evento),
      valor: 100 // Valor médio estimado por visita (pode ser integrado com dados reais de vendas)
    });
  });

  getinData?.forEach(v => {
    const valorEstimado = (v.numero_convidados || 1) * 120; // Valor médio por pessoa
    visitas.push({
      data: new Date(v.data),
      valor: valorEstimado
    });
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

  // Tendências (comparar primeira metade vs segunda metade)
  const metade = Math.floor(visitas.length / 2);
  const visitasAntigas = visitas.slice(0, metade);
  const visitasRecentes = visitas.slice(metade);

  const valoresAntigos = visitasAntigas.map(v => v.valor);
  const valoresRecentes = visitasRecentes.map(v => v.valor);

  const tendenciaValor = calcularTendencia(valoresAntigos, valoresRecentes);

  // Tendência de frequência (comparar visitas/mês nos últimos 90 dias vs. 90-180 dias)
  const data90DiasAtras = new Date();
  data90DiasAtras.setDate(data90DiasAtras.getDate() - 90);
  const data180DiasAtras = new Date();
  data180DiasAtras.setDate(data180DiasAtras.getDate() - 180);

  const visitasUltimos90 = visitas.filter(v => v.data >= data90DiasAtras).length;
  const visitas90a180 = visitas.filter(v => v.data >= data180DiasAtras && v.data < data90DiasAtras).length;

  const tendenciaFrequencia = visitasUltimos90 > visitas90a180 ? 'crescente' :
    visitasUltimos90 < visitas90a180 ? 'decrescente' : 'estavel';

  // Projeções de LTV
  // Método: Valor médio mensal * meses futuros * fator de ajuste baseado em tendências
  let fatorAjuste = 1.0;
  if (tendenciaValor === 'crescente' && tendenciaFrequencia === 'crescente') {
    fatorAjuste = 1.3; // +30% de crescimento
  } else if (tendenciaValor === 'crescente' || tendenciaFrequencia === 'crescente') {
    fatorAjuste = 1.15; // +15% de crescimento
  } else if (tendenciaValor === 'decrescente' && tendenciaFrequencia === 'decrescente') {
    fatorAjuste = 0.7; // -30% de declínio
  } else if (tendenciaValor === 'decrescente' || tendenciaFrequencia === 'decrescente') {
    fatorAjuste = 0.85; // -15% de declínio
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

  // ROI de Marketing (estimativa simplificada)
  // Quanto vale investir para reter/engajar esse cliente
  const custoMarketingEstimado = 50; // R$ 50 de custo por campanha
  const roiMarketing = (ltvProjetado12m / custoMarketingEstimado);

  const resultado: ClienteLTV = {
    telefone,
    nome: symplaData?.[0]?.nome_completo || getinData?.[0]?.nome || 'Cliente',
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

async function calcularLTVTodosClientes(limite: number) {
  // Buscar todos os clientes
  const { data: symplaData } = await supabase
    .from('sympla_participantes')
    .select('telefone_normalizado, nome_completo, data_evento')
    .not('telefone_normalizado', 'is', null);

  const { data: getinData } = await supabase
    .from('getin_reservations')
    .select('telefone_normalizado, nome, data, numero_convidados')
    .not('telefone_normalizado', 'is', null);

  // Agrupar por telefone
  const clientesMap = new Map<string, {
    telefone: string;
    nome: string;
    visitas: Array<{ data: Date; valor: number }>;
  }>();

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
      valor: 100
    });
  });

  getinData?.forEach(item => {
    if (!item.telefone_normalizado) return;

    if (!clientesMap.has(item.telefone_normalizado)) {
      clientesMap.set(item.telefone_normalizado, {
        telefone: item.telefone_normalizado,
        nome: item.nome || 'Cliente',
        visitas: []
      });
    }

    const valorEstimado = (item.numero_convidados || 1) * 120;
    clientesMap.get(item.telefone_normalizado)!.visitas.push({
      data: new Date(item.data),
      valor: valorEstimado
    });
  });

  // Calcular LTV para cada cliente
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

  // Estatísticas
  const stats = {
    total_clientes: resultados.length,
    ltv_total_atual: resultados.reduce((sum, c) => sum + c.ltv_atual, 0),
    ltv_total_projetado_12m: resultados.reduce((sum, c) => sum + c.ltv_projetado_12m, 0),
    ltv_medio_atual: Math.round(resultados.reduce((sum, c) => sum + c.ltv_atual, 0) / resultados.length),
    ltv_medio_projetado_12m: Math.round(resultados.reduce((sum, c) => sum + c.ltv_projetado_12m, 0) / resultados.length),
    engajamento_muito_alto: resultados.filter(c => c.nivel_engajamento === 'muito_alto').length,
    engajamento_alto: resultados.filter(c => c.nivel_engajamento === 'alto').length,
    engajamento_medio: resultados.filter(c => c.nivel_engajamento === 'medio').length,
    engajamento_baixo: resultados.filter(c => c.nivel_engajamento === 'baixo').length,
  };

  return NextResponse.json({
    success: true,
    data: resultados.slice(0, limite),
    stats
  });
}

