import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/middleware/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 API Desempenho - Buscando dados de performance');

    // Autenticação
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString());
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());

    console.log(`📅 Buscando dados de desempenho para ${mes}/${ano} - Bar ID: ${user.bar_id}`);

    // Buscar eventos do mês específico da tabela eventos_base (atualizada)
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos_base')
      .select(`
        id,
        data_evento,
        nome,
        dia_semana,
        semana,
        m1_r,
        cl_plan,
        cl_real,
        te_plan,
        tb_plan,
        te_real,
        tb_real,
        t_medio,
        c_art,
        c_prod,
        real_r,
        percent_art_fat,
        t_coz,
        t_bar,
        fat_19h_percent,
        calculado_em,
        precisa_recalculo
      `)
      .eq('bar_id', user.bar_id)
      .gte('data_evento', `${ano}-${mes.toString().padStart(2, '0')}-01`)
      .lt('data_evento', `${ano}-${(Number(mes) + 1).toString().padStart(2, '0')}-01`)
      .eq('ativo', true)
      .order('data_evento', { ascending: true });

    if (eventosError) {
      console.error('❌ Erro ao buscar eventos:', eventosError);
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
    }

    if (!eventos || eventos.length === 0) {
      console.log('⚠️ Nenhum evento encontrado para o período');
      return NextResponse.json({ 
        success: true,
        mes: mes,
        ano: ano,
        eventos: [],
        total_eventos: 0
      });
    }

    console.log(`✅ ${eventos.length} eventos encontrados`);

    // Processar dados usando os campos da eventos_base
    const eventosProcessados = eventos?.map(evento => {
      const dataEvento = new Date(evento.data_evento);
      
      // Usar semana já calculada ou calcular se necessário
      const semana = evento.semana || Math.floor((dataEvento.getDate() - 1) / 7) + 1;

      // Usar dados reais da tabela eventos_base
      const faturamentoReal = evento.real_r || 0;
      const metaFaturamento = evento.m1_r || 0;
      const clientesReal = evento.cl_real || 0;
      const clientesPlan = evento.cl_plan || 0;
      const ticketMedio = evento.t_medio || 0;
      
      // Calcular performance baseada em múltiplos indicadores
      let performanceGeral = 0;
      let indicadores = 0;

      // Performance de receita (peso 40%)
      if (metaFaturamento > 0) {
        const performanceReceita = Math.min((faturamentoReal / metaFaturamento) * 100, 150);
        performanceGeral += performanceReceita * 0.4;
        indicadores += 0.4;
      }

      // Performance de clientes (peso 30%)
      if (clientesPlan > 0) {
        const performanceClientes = Math.min((clientesReal / clientesPlan) * 100, 150);
        performanceGeral += performanceClientes * 0.3;
        indicadores += 0.3;
      }

      // Performance de ticket médio (peso 20%)
      if (ticketMedio > 0) {
        const metaTicket = 93; // Meta padrão
        const performanceTicket = Math.min((ticketMedio / metaTicket) * 100, 150);
        performanceGeral += performanceTicket * 0.2;
        indicadores += 0.2;
      }

      // Performance de tempo (peso 10%)
      const tempoBar = evento.t_bar || 0;
      const tempoCozinha = evento.t_coz || 0;
      if (tempoBar > 0 || tempoCozinha > 0) {
        const metaBar = 4; // Meta <= 4min
        const metaCozinha = 12; // Meta <= 12min
        const performanceTempo = ((tempoBar <= metaBar ? 100 : (metaBar / tempoBar) * 100) + 
                                 (tempoCozinha <= metaCozinha ? 100 : (metaCozinha / tempoCozinha) * 100)) / 2;
        performanceGeral += performanceTempo * 0.1;
        indicadores += 0.1;
      }

      // Normalizar performance
      if (indicadores > 0) {
        performanceGeral = performanceGeral / indicadores;
      }

      return {
        id: evento.id,
        data_evento: evento.data_evento,
        nome_evento: evento.nome || '',
        semana: semana,
        mes: Number(mes),
        ano: Number(ano),
        dia_semana: evento.dia_semana || '',
        faturamento_real: faturamentoReal,
        meta_faturamento: metaFaturamento,
        clientes_real: clientesReal,
        clientes_plan: clientesPlan,
        ticket_medio: ticketMedio,
        te_plan: evento.te_plan || 0,
        tb_plan: evento.tb_plan || 0,
        percentual_artistico: Math.round((evento.percent_art_fat || 0) * 100) / 100,
        tempo_bar: evento.t_bar || 0,
        tempo_cozinha: evento.t_coz || 0,
        performance_geral: Math.round(performanceGeral * 100) / 100,
        precisa_recalculo: evento.precisa_recalculo || false,
        calculado_em: evento.calculado_em
      };
    }) || [];

    console.log(`📊 Dados processados: ${eventosProcessados.length} eventos`);

    return NextResponse.json({
      success: true,
      mes: mes,
      ano: ano,
      eventos: eventosProcessados,
      total_eventos: eventosProcessados.length,
      meta: {
        eventos_com_dados_reais: eventosProcessados.filter(e => e.faturamento_real > 0).length,
        eventos_precisam_recalculo: eventosProcessados.filter(e => e.precisa_recalculo).length,
        performance_media: eventosProcessados.length > 0 ? 
          eventosProcessados.reduce((sum, e) => sum + e.performance_geral, 0) / eventosProcessados.length : 0
      }
    });

  } catch (error) {
    console.error('❌ Erro na API de desempenho:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
