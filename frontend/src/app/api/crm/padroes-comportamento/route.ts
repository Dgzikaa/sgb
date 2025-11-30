import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

function getMaxKey<T extends Record<string, number>>(obj: T): string {
  return Object.entries(obj).reduce((a, b) => b[1] > a[1] ? b : a)[0];
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
    const limite = parseInt(searchParams.get('limite') || '50');

    if (!telefone) {
      // Buscar padrões de todos os clientes (top N)
      return await buscarPadroesTodosClientes(limite);
    } else {
      // Buscar padrão de um cliente específico
      return await buscarPadraoCliente(telefone);
    }

  } catch (error: any) {
    console.error('Erro ao buscar padrões de comportamento:', error);
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

async function buscarPadroesTodosClientes(limite: number) {
  // Buscar todos os clientes com histórico
  const { data: symplaData } = await supabase
    .from('sympla_participantes')
    .select('telefone_normalizado, nome_completo, data_evento, evento_nome')
    .not('telefone_normalizado', 'is', null)
    .order('data_evento', { ascending: false });

  const { data: getinData } = await supabase
    .from('getin_reservations')
    .select('telefone_normalizado, nome, data, numero_convidados')
    .not('telefone_normalizado', 'is', null)
    .order('data', { ascending: false });

  // Consolidar por telefone
  const clientesMap = new Map<string, {
    telefone: string;
    nome: string;
    visitas: Array<{ data: Date; tipo: string; convidados: number }>;
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
      tipo: item.evento_nome || 'Evento',
      convidados: 1
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

    clientesMap.get(item.telefone_normalizado)!.visitas.push({
      data: new Date(item.data),
      tipo: 'Reserva GetIn',
      convidados: item.numero_convidados || 1
    });
  });

  // Calcular padrões para cada cliente
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

    const horarioPrefKey = getMaxKey(distribuicaoHorarios);
    const horarioDescricoes = {
      manha: 'Manhã (06:00-12:00)',
      tarde: 'Tarde (12:00-18:00)',
      noite: 'Noite (18:00-00:00)',
      madrugada: 'Madrugada (00:00-06:00)'
    };

    padroes.push({
      telefone,
      nome: dados.nome,
      total_visitas: dados.visitas.length,
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
      vem_sozinho: totalConvidados === dados.visitas.length,
      tamanho_grupo_medio: Math.round(totalConvidados / dados.visitas.length)
    });
  }

  // Ordenar por total de visitas (clientes mais frequentes primeiro)
  padroes.sort((a, b) => b.total_visitas - a.total_visitas);

  // Limitar resultados
  const resultado = padroes.slice(0, limite);

  // Estatísticas gerais
  const stats = {
    total_clientes_analisados: padroes.length,
    dia_mais_popular: getMaxKey(
      padroes.reduce((acc, p) => {
        acc[p.dia_semana_preferido] = (acc[p.dia_semana_preferido] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ),
    horario_mais_popular: getMaxKey(
      padroes.reduce((acc, p) => {
        acc[p.horario_preferido] = (acc[p.horario_preferido] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ),
    frequencia_alta: padroes.filter(p => p.frequencia === 'alto').length,
    frequencia_media: padroes.filter(p => p.frequencia === 'medio').length,
    frequencia_baixa: padroes.filter(p => p.frequencia === 'baixo').length,
  };

  return NextResponse.json({
    success: true,
    data: resultado,
    stats
  });
}

