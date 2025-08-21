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

    // Função para calcular número da semana ISO
    const getWeekNumber = (date: Date): number => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    // Função para obter período da semana
    const getWeekPeriod = (weekNumber: number, year: number): { inicio: Date, fim: Date } => {
      const jan1 = new Date(year, 0, 1);
      const daysToFirstMonday = (8 - jan1.getDay()) % 7;
      const firstMonday = new Date(year, 0, 1 + daysToFirstMonday);
      
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      return { inicio: weekStart, fim: weekEnd };
    };

    // Consolidar dados por semana
    const semanaMap = new Map<number, {
      semana: number;
      periodo: string;
      faturamento_total: number;
      clientes_total: number;
      eventos_count: number;
      metas_faturamento: number;
      metas_clientes: number;
    }>();

    eventos.forEach(evento => {
      const dataEvento = new Date(evento.data_evento);
      const semana = getWeekNumber(dataEvento);
      
      if (!semanaMap.has(semana)) {
        const { inicio, fim } = getWeekPeriod(semana, ano);
        semanaMap.set(semana, {
          semana,
          periodo: `${inicio.getDate().toString().padStart(2, '0')}.${(inicio.getMonth() + 1).toString().padStart(2, '0')} - ${fim.getDate().toString().padStart(2, '0')}.${(fim.getMonth() + 1).toString().padStart(2, '0')}`,
          faturamento_total: 0,
          clientes_total: 0,
          eventos_count: 0,
          metas_faturamento: 0,
          metas_clientes: 0
        });
      }

      const semanaData = semanaMap.get(semana)!;
      semanaData.faturamento_total += evento.real_r || 0;
      semanaData.clientes_total += evento.cl_real || 0;
      semanaData.eventos_count += 1;
      semanaData.metas_faturamento += evento.m1_r || 0;
      semanaData.metas_clientes += evento.cl_plan || 0;
    });

    // Converter para array e calcular métricas
    const semanasConsolidadas = Array.from(semanaMap.values()).map(semana => {
      const ticketMedio = semana.clientes_total > 0 ? semana.faturamento_total / semana.clientes_total : 0;
      
      // Calcular performance geral da semana
      let performanceGeral = 0;
      let indicadores = 0;

      // Performance de receita (peso 60%)
      if (semana.metas_faturamento > 0) {
        const performanceReceita = Math.min((semana.faturamento_total / semana.metas_faturamento) * 100, 150);
        performanceGeral += performanceReceita * 0.6;
        indicadores += 0.6;
      }

      // Performance de clientes (peso 40%)
      if (semana.metas_clientes > 0) {
        const performanceClientes = Math.min((semana.clientes_total / semana.metas_clientes) * 100, 150);
        performanceGeral += performanceClientes * 0.4;
        indicadores += 0.4;
      }

      // Normalizar performance
      if (indicadores > 0) {
        performanceGeral = performanceGeral / indicadores;
      }

      return {
        semana: semana.semana,
        periodo: semana.periodo,
        faturamento_total: Math.round(semana.faturamento_total * 100) / 100,
        clientes_total: semana.clientes_total,
        ticket_medio: Math.round(ticketMedio * 100) / 100,
        performance_geral: Math.round(performanceGeral * 100) / 100,
        eventos_count: semana.eventos_count,
        meta_faturamento: Math.round(semana.metas_faturamento * 100) / 100,
        meta_clientes: semana.metas_clientes
      };
    }).sort((a, b) => a.semana - b.semana);

    console.log(`📊 Dados consolidados: ${semanasConsolidadas.length} semanas`);

    // Calcular totais mensais
    const totaisMensais = semanasConsolidadas.reduce((acc, semana) => ({
      faturamento_total: acc.faturamento_total + semana.faturamento_total,
      clientes_total: acc.clientes_total + semana.clientes_total,
      eventos_total: acc.eventos_total + semana.eventos_count,
      performance_media: acc.performance_media + semana.performance_geral
    }), { faturamento_total: 0, clientes_total: 0, eventos_total: 0, performance_media: 0 });

    const ticketMedioMensal = totaisMensais.clientes_total > 0 ? 
      totaisMensais.faturamento_total / totaisMensais.clientes_total : 0;
    
    const performanceMediaMensal = semanasConsolidadas.length > 0 ? 
      totaisMensais.performance_media / semanasConsolidadas.length : 0;

    return NextResponse.json({
      success: true,
      mes: mes,
      ano: ano,
      semanas: semanasConsolidadas,
      total_semanas: semanasConsolidadas.length,
      totais_mensais: {
        faturamento_total: Math.round(totaisMensais.faturamento_total * 100) / 100,
        clientes_total: totaisMensais.clientes_total,
        ticket_medio: Math.round(ticketMedioMensal * 100) / 100,
        performance_media: Math.round(performanceMediaMensal * 100) / 100,
        eventos_total: totaisMensais.eventos_total
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
