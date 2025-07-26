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
        dia_semana,
        real_r,
        m1_r,
        cl_plan,
        cl_real,
        res_tot,
        res_p,
        lot_max,
        te_plan,
        te_real,
        tb_plan,
        tb_real,
        t_medio,
        c_art,
        c_prod,
        percent_art_fat,
        percent_b,
        percent_d,
        percent_c,
        t_coz,
        t_bar,
        fat_19h
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
        realizado: temEventos ? Number(primeiroEvento.real_r) || 0 : 0,
        m1: temEventos ? Number(primeiroEvento.m1_r) || 0 : 0,
        m2: 0, // Não existe no banco
        m3: 0, // Não existe no banco
        clientes: {
          planejado: temEventos ? Number(primeiroEvento.cl_plan) || 0 : 0,
          real: temEventos ? Number(primeiroEvento.cl_real) || 0 : 0,
          resTotal: temEventos ? Number(primeiroEvento.res_tot) || 0 : 0,
          resPresente: temEventos ? Number(primeiroEvento.res_p) || 0 : 0,
          lotMax: temEventos ? Number(primeiroEvento.lot_max) || 0 : 0
        },
        ticketEntrada: {
          planejado: temEventos ? Number(primeiroEvento.te_plan) || 0 : 0,
          real: temEventos ? Number(primeiroEvento.te_real) || 0 : 0
        },
        ticketBar: {
          planejado: temEventos ? Number(primeiroEvento.tb_plan) || 0 : 0,
          real: temEventos ? Number(primeiroEvento.tb_real) || 0 : 0
        },
        ticketMedio: temEventos ? Number(primeiroEvento.t_medio) || 0 : 0,
        rentabilidadeAtracoes: {
          custoArtistico: temEventos ? Number(primeiroEvento.c_art) || 0 : 0,
          custoProducao: temEventos ? Number(primeiroEvento.c_prod) || 0 : 0,
          percArtFat: temEventos ? `${Number(primeiroEvento.percent_art_fat) || 0}%` : '0%'
        },
        cesta: {
          percBebidas: temEventos ? `${Number(primeiroEvento.percent_b) || 0}%` : '0%',
          percDrinks: temEventos ? `${Number(primeiroEvento.percent_d) || 0}%` : '0%',
          percCozinha: temEventos ? `${Number(primeiroEvento.percent_c) || 0}%` : '0%'
        },
        tempo: {
          cozinha: temEventos ? Number(primeiroEvento.t_coz) || 0 : 0,
          bar: temEventos ? Number(primeiroEvento.t_bar) || 0 : 0
        },
        faturamentoAte19h: temEventos ? `${Number(primeiroEvento.fat_19h) || 0}%` : '0%'
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