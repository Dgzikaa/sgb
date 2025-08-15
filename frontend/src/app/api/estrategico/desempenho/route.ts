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

    // Buscar eventos do mês específico da tabela eventos (mais rápido)
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos')
      .select(`
        id,
        data_evento,
        nome,
        dia_semana,
        m1_r,
        cl_plan,
        te_plan,
        tb_plan,
        c_art,
        receita_total
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

      // Usar dados que existem na tabela eventos
      const faturamentoReal = evento.receita_total || 0;
      const metaFaturamento = evento.m1_r || 0;
      const clientesPlan = evento.cl_plan || 0;
      
      // Calcular performance simplificada
      const performanceReceita = metaFaturamento > 0 ? (faturamentoReal / metaFaturamento) * 100 : 0;
      const performanceGeral = Math.min(performanceReceita, 150); // Cap em 150%

      // Calcular percentual artístico simples
      const percentualArtistico = faturamentoReal > 0 ? ((evento.c_art || 0) / faturamentoReal) * 100 : 0;

      return {
        id: evento.id,
        data_evento: evento.data_evento,
        nome_evento: evento.nome,
        semana: semana,
        mes: Number(mes),
        ano: Number(ano),
        dia_semana: evento.dia_semana || '',
        faturamento_real: faturamentoReal,
        meta_faturamento: metaFaturamento,
        clientes_real: 0, // Será calculado via ContaHub se necessário
        clientes_plan: clientesPlan,
        ticket_medio: 0, // Será calculado se necessário
        te_plan: evento.te_plan || 0,
        tb_plan: evento.tb_plan || 0,
        percentual_artistico: Math.round(percentualArtistico * 100) / 100,
        tempo_bar: 0,
        tempo_cozinha: 0,
        performance_geral: Math.round(performanceGeral * 100) / 100
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
