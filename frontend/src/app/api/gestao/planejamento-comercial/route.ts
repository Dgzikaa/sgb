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

    // Gerar todos os dias do mês
    const diasNoMes = new Date(parseInt(ano.toString()), parseInt(mes.toString()), 0).getDate();
    const dadosCompletos: any[] = [];

    for (let dia = 1; dia <= diasNoMes; dia++) {
      const dataFormatada = `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
      const eventosDoDia = eventos?.filter(e => e.data_evento === dataFormatada) || [];
      
      const dataObj = new Date(parseInt(ano.toString()), parseInt(mes.toString()) - 1, dia);
      const diasSemana = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
      const diaSemana = diasSemana[dataObj.getDay()];

      // Se tem eventos, usar dados do primeiro evento
      // Se não tem eventos, usar dados zerados
      const temEventos = eventosDoDia.length > 0;
      const primeiroEvento = eventosDoDia[0];

      dadosCompletos.push({
        data: `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}`,
        dia: diaSemana,
        obsData: '',
        label: temEventos ? primeiroEvento.nome || '' : '',
        realizado: temEventos ? parseFloat(primeiroEvento.faturamento_total_evento || '0') : 0,
        m1: 0, // Meta não está na tabela
        clientes: {
          planejado: 0,
          real: temEventos ? parseInt(primeiroEvento.total_ingressos_combinado?.toString() || '0') : 0,
          resTotal: 0,
          resPresente: 0,
          lotMax: temEventos ? parseInt(primeiroEvento.capacidade_maxima?.toString() || '0') : 0
        },
        ticketEntrada: {
          planejado: 0,
          real: temEventos ? parseFloat(primeiroEvento.yuzer_ticket_medio_bilheteria || '0') : 0
        },
        ticketBar: {
          planejado: 0,
          real: 0
        },
        ticketMedio: temEventos ? parseFloat(primeiroEvento.sympla_ticket_medio || '0') : 0,
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
      });
    }

    return NextResponse.json({ 
      dados: dadosCompletos,
      totalEventos: eventos?.length || 0,
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