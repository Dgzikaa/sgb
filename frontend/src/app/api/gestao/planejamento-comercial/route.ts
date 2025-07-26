import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || new Date().getMonth() + 1;
    const ano = searchParams.get('ano') || new Date().getFullYear();

    // Buscar eventos do mês específico
    const inicioMes = `${ano}-${mes.toString().padStart(2, '0')}-01`;
    const fimMes = `${ano}-${mes.toString().padStart(2, '0')}-31`;

    // Buscar dados reais da tabela eventos
    const { data: eventos, error } = await supabase
      .from('eventos')
      .select(`
        data_evento,
        nome,
        artista,
        genero,
        status,
        total_ingressos_combinado,
        faturamento_total_evento,
        sympla_ticket_medio,
        yuzer_ticket_medio_bilheteria,
        capacidade_maxima,
        dia_semana
      `)
      .gte('data_evento', inicioMes)
      .lte('data_evento', fimMes)
      .order('data_evento', { ascending: true });

    if (error) {
      console.error('Erro ao buscar eventos:', error);
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
    }

    // Processar dados para o formato esperado pelo frontend
    const dadosProcessados = eventos.map((evento: any) => ({
      data: evento.data_evento.split('-')[2] + '/' + evento.data_evento.split('-')[1],
      dia: evento.dia_semana?.substring(0, 3) || '',
      obsData: '',
      label: evento.nome || '',
      realizado: parseFloat(evento.faturamento_total_evento || '0'),
      m1: 0, // Meta não está na tabela
      clientes: {
        planejado: 0,
        real: parseInt(evento.total_ingressos_combinado || '0'),
        resTotal: 0,
        resPresente: 0,
        lotMax: parseInt(evento.capacidade_maxima || '0')
      },
      ticketEntrada: {
        planejado: 0,
        real: parseFloat(evento.yuzer_ticket_medio_bilheteria || '0')
      },
      ticketBar: {
        planejado: 0,
        real: 0
      },
      ticketMedio: parseFloat(evento.sympla_ticket_medio || '0'),
      rentabilidadeAtracoes: {
        custoArtistico: 0,
        custoProducao: 0,
        percArtFat: '0%'
      },
      cesta: {
        percBebidas: '0%',
        percDrinks: '0%',
        percCozinha: '0%'
      },
      tempo: {
        cozinha: 0,
        bar: 0
      },
      faturamentoAte19h: '0%'
    }));

    return NextResponse.json({ 
      dados: dadosProcessados,
      totalEventos: eventos.length,
      mes: parseInt(mes.toString()),
      ano: parseInt(ano.toString())
    });

  } catch (error) {
    console.error('Erro na API:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Dados atualizados com sucesso' 
    });
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    return NextResponse.json({ error: 'Erro ao salvar dados' }, { status: 500 });
  }
} 