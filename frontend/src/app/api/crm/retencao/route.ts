import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  proxima_acao_sugerida: string;
  historico_visitas: Array<{
    data: string;
    tipo: string;
    dias_desde_anterior: number | null;
  }>;
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') || 'cohort'; // cohort ou jornada

    if (tipo === 'cohort') {
      return await calcularCohorts();
    } else if (tipo === 'jornada') {
      const telefone = searchParams.get('telefone');
      if (telefone) {
        return await buscarJornadaCliente(telefone);
      } else {
        return await listarJornadasClientes();
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

async function calcularCohorts() {
  // Buscar todos os clientes
  const { data: symplaData } = await supabase
    .from('sympla_participantes')
    .select('telefone_normalizado, data_evento, nome_completo')
    .not('telefone_normalizado', 'is', null);

  const { data: getinData } = await supabase
    .from('getin_reservations')
    .select('telefone_normalizado, data, nome')
    .not('telefone_normalizado', 'is', null);

  // Consolidar por cliente
  const clientesMap = new Map<string, Date[]>();

  symplaData?.forEach(item => {
    if (!item.telefone_normalizado) return;
    if (!clientesMap.has(item.telefone_normalizado)) {
      clientesMap.set(item.telefone_normalizado, []);
    }
    clientesMap.get(item.telefone_normalizado)!.push(new Date(item.data_evento));
  });

  getinData?.forEach(item => {
    if (!item.telefone_normalizado) return;
    if (!clientesMap.has(item.telefone_normalizado)) {
      clientesMap.set(item.telefone_normalizado, []);
    }
    clientesMap.get(item.telefone_normalizado)!.push(new Date(item.data));
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

  return NextResponse.json({
    success: true,
    data: cohorts
  });
}

async function buscarJornadaCliente(telefone: string) {
  // Buscar histórico do cliente
  const { data: symplaData } = await supabase
    .from('sympla_participantes')
    .select('data_evento, evento_nome, nome_completo')
    .eq('telefone_normalizado', telefone)
    .order('data_evento', { ascending: true });

  const { data: getinData } = await supabase
    .from('getin_reservations')
    .select('data, nome')
    .eq('telefone_normalizado', telefone)
    .order('data', { ascending: true});

  if (!symplaData?.length && !getinData?.length) {
    throw new Error('Cliente não encontrado');
  }

  // Consolidar visitas
  const visitas: Array<{ data: Date; tipo: string }> = [];

  symplaData?.forEach(v => {
    visitas.push({
      data: new Date(v.data_evento),
      tipo: v.evento_nome || 'Evento'
    });
  });

  getinData?.forEach(v => {
    visitas.push({
      data: new Date(v.data),
      tipo: 'Reserva GetIn'
    });
  });

  visitas.sort((a, b) => a.data.getTime() - b.data.getTime());

  const hoje = new Date();
  const primeiraVisita = visitas[0].data;
  const ultimaVisita = visitas[visitas.length - 1].data;
  const diasComoCliente = Math.floor((hoje.getTime() - primeiraVisita.getTime()) / (1000 * 60 * 60 * 24));
  const diasSemVisitar = Math.floor((hoje.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24));

  // Determinar etapa da jornada
  const etapa = determinarEtapaJornada({
    diasSemVisitar,
    totalVisitas: visitas.length,
    diasComoCliente
  });

  // Próxima ação sugerida
  let proximaAcao: string;
  switch (etapa) {
    case 'novo':
      proximaAcao = 'Enviar boas-vindas e cupom de segunda visita (15% OFF)';
      break;
    case 'engajado':
      proximaAcao = 'Manter engajamento com convites para eventos especiais';
      break;
    case 'fiel':
      proximaAcao = 'Incluir em programa VIP e oferecer benefícios exclusivos';
      break;
    case 'em_risco':
      proximaAcao = 'Campanha de reengajamento URGENTE com cupom 20-25% OFF';
      break;
    case 'perdido':
      proximaAcao = 'Campanha de reativação com cupom agressivo 30% OFF + convite VIP';
      break;
  }

  // Histórico detalhado
  const historico = visitas.map((v, index) => {
    const diasDesdeAnterior = index > 0
      ? Math.floor((v.data.getTime() - visitas[index - 1].data.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      data: v.data.toISOString(),
      tipo: v.tipo,
      dias_desde_anterior: diasDesdeAnterior
    };
  });

  const jornada: JornadaCliente = {
    telefone,
    nome: symplaData?.[0]?.nome_completo || getinData?.[0]?.nome || 'Cliente',
    etapa_atual: etapa,
    dias_no_funil: diasComoCliente,
    visitas_totais: visitas.length,
    proxima_acao_sugerida: proximaAcao,
    historico_visitas: historico
  };

  return NextResponse.json({
    success: true,
    data: jornada
  });
}

async function listarJornadasClientes() {
  // Buscar todos os clientes
  const { data: symplaData } = await supabase
    .from('sympla_participantes')
    .select('telefone_normalizado, data_evento, nome_completo')
    .not('telefone_normalizado', 'is', null);

  const { data: getinData } = await supabase
    .from('getin_reservations')
    .select('telefone_normalizado, data, nome')
    .not('telefone_normalizado', 'is', null);

  // Consolidar
  const clientesMap = new Map<string, {
    nome: string;
    visitas: Date[];
  }>();

  symplaData?.forEach(item => {
    if (!item.telefone_normalizado) return;
    if (!clientesMap.has(item.telefone_normalizado)) {
      clientesMap.set(item.telefone_normalizado, {
        nome: item.nome_completo || 'Cliente',
        visitas: []
      });
    }
    clientesMap.get(item.telefone_normalizado)!.visitas.push(new Date(item.data_evento));
  });

  getinData?.forEach(item => {
    if (!item.telefone_normalizado) return;
    if (!clientesMap.has(item.telefone_normalizado)) {
      clientesMap.set(item.telefone_normalizado, {
        nome: item.nome || 'Cliente',
        visitas: []
      });
    }
    clientesMap.get(item.telefone_normalizado)!.visitas.push(new Date(item.data));
  });

  const jornadas: Array<{
    telefone: string;
    nome: string;
    etapa: string;
    visitas: number;
    dias_sem_visitar: number;
  }> = [];

  const hoje = new Date();

  for (const [telefone, dados] of clientesMap.entries()) {
    dados.visitas.sort((a, b) => a.getTime() - b.getTime());
    
    const primeiraVisita = dados.visitas[0];
    const ultimaVisita = dados.visitas[dados.visitas.length - 1];
    const diasComoCliente = Math.floor((hoje.getTime() - primeiraVisita.getTime()) / (1000 * 60 * 60 * 24));
    const diasSemVisitar = Math.floor((hoje.getTime() - ultimaVisita.getTime()) / (1000 * 60 * 60 * 24));

    const etapa = determinarEtapaJornada({
      diasSemVisitar,
      totalVisitas: dados.visitas.length,
      diasComoCliente
    });

    jornadas.push({
      telefone,
      nome: dados.nome,
      etapa,
      visitas: dados.visitas.length,
      dias_sem_visitar: diasSemVisitar
    });
  }

  // Estatísticas
  const stats = {
    total: jornadas.length,
    novo: jornadas.filter(j => j.etapa === 'novo').length,
    engajado: jornadas.filter(j => j.etapa === 'engajado').length,
    fiel: jornadas.filter(j => j.etapa === 'fiel').length,
    em_risco: jornadas.filter(j => j.etapa === 'em_risco').length,
    perdido: jornadas.filter(j => j.etapa === 'perdido').length,
  };

  return NextResponse.json({
    success: true,
    data: jornadas.slice(0, 100),
    stats
  });
}

