import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mes = searchParams.get('mes') || new Date().getMonth() + 1;
    const ano = searchParams.get('ano') || new Date().getFullYear();

    // Extrair dados do usuário do header
    const userDataHeader = request.headers.get('x-user-data');
    if (!userDataHeader) {
      return NextResponse.json({ error: 'Dados do usuário não encontrados' }, { status: 400 });
    }

    const userData = JSON.parse(userDataHeader);
    const barId = userData.bar_id;

    if (!barId) {
      return NextResponse.json({ error: 'Bar ID não encontrado' }, { status: 400 });
    }

    // Buscar eventos do mês específico
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select(`
        id,
        data_evento,
        nome,
        dia_semana,
        real_r,
        m1_r,
        cl_real,
        cl_plan,
        t_medio,
        percent_art_fat,
        t_bar,
        t_coz,
        performance_geral
      `)
      .eq('bar_id', barId)
      .gte('data_evento', `${ano}-${mes.toString().padStart(2, '0')}-01`)
      .lt('data_evento', `${ano}-${(Number(mes) + 1).toString().padStart(2, '0')}-01`)
      .order('data_evento', { ascending: true });

    if (eventosError) {
      console.error('Erro ao buscar eventos:', eventosError);
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
    }

    // Processar dados para adicionar semana do mês
    const eventosProcessados = eventos?.map(evento => {
      const dataEvento = new Date(evento.data_evento);
      const primeiroDiaMes = new Date(Number(ano), Number(mes) - 1, 1);
      const diferencaDias = Math.floor((dataEvento.getTime() - primeiroDiaMes.getTime()) / (1000 * 60 * 60 * 24));
      const semana = Math.floor(diferencaDias / 7) + 1;

      // Calcular performance geral (simplificado)
      const performanceReceita = evento.m1_r > 0 ? (evento.real_r / evento.m1_r) * 100 : 0;
      const performanceClientes = evento.cl_plan > 0 ? (evento.cl_real / evento.cl_plan) * 100 : 0;
      const performanceGeral = (performanceReceita + performanceClientes) / 2;

      return {
        id: evento.id,
        data_evento: evento.data_evento,
        nome_evento: evento.nome,
        semana: semana,
        mes: Number(mes),
        ano: Number(ano),
        dia_semana: evento.dia_semana || '',
        faturamento_real: evento.real_r || 0,
        meta_faturamento: evento.m1_r || 0,
        clientes_real: evento.cl_real || 0,
        clientes_plan: evento.cl_plan || 0,
        ticket_medio: evento.t_medio || 0,
        percentual_artistico: evento.percent_art_fat || 0,
        tempo_bar: evento.t_bar || 0,
        tempo_cozinha: evento.t_coz || 0,
        performance_geral: performanceGeral
      };
    }) || [];

    return NextResponse.json({
      success: true,
      mes: Number(mes),
      ano: Number(ano),
      eventos: eventosProcessados,
      total_eventos: eventosProcessados.length
    });

  } catch (error) {
    console.error('Erro na API de desempenho:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
