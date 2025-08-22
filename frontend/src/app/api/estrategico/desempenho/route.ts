import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/middleware/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 API Desempenho - Buscando dados de performance');
    }

    // Autenticação
    const user = await authenticateUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const mes = parseInt(searchParams.get('mes') || (new Date().getMonth() + 1).toString());
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📅 Buscando dados de desempenho para ${mes}/${ano} - Bar ID: ${user.bar_id}`);
    }

    // Buscar eventos básicos de todo o ano
    const { data: eventos, error: eventosError } = await supabase
      .from('eventos_base')
      .select(`
        id,
        data_evento,
        nome,
        dia_semana,
        semana,
        cl_real,
        real_r,
        m1_r,
        cl_plan
      `)
      .eq('bar_id', user.bar_id)
      .gte('data_evento', `${ano}-01-01`)
      .lt('data_evento', `${ano + 1}-01-01`)
      .eq('ativo', true)
      .order('data_evento', { ascending: true });

    if (eventosError) {
      console.error('❌ Erro ao buscar eventos:', eventosError);
      return NextResponse.json({ error: 'Erro ao buscar eventos' }, { status: 500 });
    }

    // Função para buscar todos os dados com paginação
    const fetchAllData = async (table: string, columns: string, dateColumn: string) => {
      let allData: any[] = [];
      let from = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from(table)
          .select(columns)
          .gte(dateColumn, `${ano}-01-01`)
          .lt(dateColumn, `${ano + 1}-01-01`)
          .range(from, from + limit - 1);

        if (error) {
          console.error(`❌ Erro ao buscar dados de ${table}:`, error);
          break;
        }

        if (data && data.length > 0) {
          allData = allData.concat(data);
          hasMore = data.length === limit;
          from += limit;
        } else {
          hasMore = false;
        }
      }

      return allData;
    };

    // Buscar dados do Yuzer da tabela original (com paginação)
    const yuzerData = await fetchAllData('yuzer_pagamento', 'data_evento, valor_liquido', 'data_evento');
    // Logs apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Yuzer: ${yuzerData.length} registros encontrados`);
    }

    // Buscar dados do Sympla das tabelas de resumo (com paginação)
    const symplaData = await fetchAllData('sympla_resumo', 'data_evento, total_liquido', 'data_evento');
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Sympla: ${symplaData.length} registros encontrados`);
    }

    // Função para buscar dados do ContaHub excluindo 'Conta Assinada'
    const fetchContaHubData = async () => {
      let allData: any[] = [];
      let from = 0;
      const limit = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('contahub_pagamentos')
          .select('dt_gerencial, liquido')
          .gte('dt_gerencial', `${ano}-01-01`)
          .lt('dt_gerencial', `${ano + 1}-01-01`)
          .neq('meio', 'Conta Assinada')  // Excluir consumo de sócios
          .range(from, from + limit - 1);

        if (error) {
          console.error(`❌ Erro ao buscar dados de contahub_pagamentos:`, error);
          break;
        }

        if (data && data.length > 0) {
          allData = allData.concat(data);
          hasMore = data.length === limit;
          from += limit;
        } else {
          hasMore = false;
        }
      }

      return allData;
    };

    // Buscar dados do ContaHub excluindo 'Conta Assinada' (com paginação)
    const contahubData = await fetchContaHubData();
    // Logs detalhados apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ContaHub: ${contahubData.length} registros encontrados (excluindo Conta Assinada)`);
      
      // Debug: Log dos primeiros registros para verificar se o filtro está funcionando
      console.log('🔍 Debug ContaHub - Primeiros 5 registros:', contahubData.slice(0, 5));
      console.log('🔍 Debug Yuzer - Primeiros 5 registros:', yuzerData.slice(0, 5));
      console.log('🔍 Debug Sympla - Primeiros 5 registros:', symplaData.slice(0, 5));
    }

    // Criar mapas para facilitar a busca
    const yuzerMap = new Map();
    const yuzerDebug = new Map(); // Para debug
    yuzerData?.forEach(item => {
      const currentValue = yuzerMap.get(item.data_evento) || 0;
      const currentCount = yuzerDebug.get(item.data_evento) || 0;
      yuzerMap.set(item.data_evento, currentValue + (item.valor_liquido || 0));
      yuzerDebug.set(item.data_evento, currentCount + 1);
    });

    // Debug verbose - apenas quando necessário
    if (process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
      console.log('🔍 Debug Yuzer - Registros por data:');
      yuzerDebug.forEach((count, data) => {
        if (count > 1) {
          console.log(`  📅 ${data}: ${count} registros (DUPLICADO!) - Total: R$ ${yuzerMap.get(data)}`);
        }
      });
    }

    const symplaMap = new Map();
    symplaData?.forEach(item => {
      symplaMap.set(item.data_evento, item.total_liquido || 0);
    });

    const contahubMap = new Map();
    contahubData?.forEach(item => {
      const currentValue = contahubMap.get(item.dt_gerencial) || 0;
      contahubMap.set(item.dt_gerencial, currentValue + (item.liquido || 0));
    });

    // Debug específico removido para reduzir logs desnecessários

    if (!eventos || eventos.length === 0) {
      // Log apenas em modo verbose
      if (process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.log('⚠️ Nenhum evento encontrado para o período');
      }
      return NextResponse.json({ 
        success: true,
        mes: mes,
        ano: ano,
        eventos: [],
        total_eventos: 0
      });
    }

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${eventos.length} eventos encontrados`);
    }

    // Função para calcular número da semana ISO
    const getWeekNumber = (date: Date): number => {
      const target = new Date(date.valueOf());
      const dayNr = (date.getDay() + 6) % 7;
      target.setDate(target.getDate() - dayNr + 3);
      const jan4 = new Date(target.getFullYear(), 0, 4);
      const dayDiff = (target.getTime() - jan4.getTime()) / 86400000;
      return 1 + Math.ceil(dayDiff / 7);
    };

    // Função para obter período da semana ISO
    const getWeekPeriod = (weekNumber: number, year: number): { inicio: Date, fim: Date } => {
      // Encontrar a primeira segunda-feira da primeira semana ISO do ano
      const jan4 = new Date(year, 0, 4); // 4 de janeiro sempre está na primeira semana ISO
      const dayOfWeek = jan4.getDay() || 7; // Domingo = 7, Segunda = 1
      const firstMonday = new Date(jan4);
      firstMonday.setDate(jan4.getDate() - dayOfWeek + 1); // Volta para a segunda-feira
      
      // Calcular início da semana desejada
      const weekStart = new Date(firstMonday);
      weekStart.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
      
      // Fim da semana (domingo)
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
      // Usar a semana já calculada na tabela eventos_base em vez de recalcular
      const semana = evento.semana;
      
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
      // Somar faturamento de todas as fontes: ContaHub + Yuzer + Sympla
      const faturamentoContaHub = contahubMap.get(evento.data_evento) || 0;
      const faturamentoYuzer = yuzerMap.get(evento.data_evento) || 0;
      const faturamenteSympla = symplaMap.get(evento.data_evento) || 0;
      const faturamentoTotal = faturamentoContaHub + faturamentoYuzer + faturamenteSympla;
      
      // Debug detalhado para semanas recentes
      // Debug apenas em desenvolvimento
      if (process.env.NODE_ENV === 'development' && semana >= 31 && semana <= 34) {
        console.log(`🔍 Semana ${semana} - Evento ${evento.nome} (${evento.data_evento}):`, {
          contahub: faturamentoContaHub,
          yuzer: faturamentoYuzer,
          sympla: faturamenteSympla,
          total: faturamentoTotal
        });
      }
      
      semanaData.faturamento_total += faturamentoTotal;
      semanaData.clientes_total += evento.cl_real || 0;
      semanaData.eventos_count += 1;
      semanaData.metas_faturamento += evento.m1_r || 0;
      semanaData.metas_clientes += evento.cl_plan || 0;
    });

    // Obter semana atual
    const hoje = new Date();
    const semanaAtual = getWeekNumber(hoje);

    // Converter para array e calcular métricas (filtrar semanas >= 5 e <= semana atual)
    const semanasConsolidadas = Array.from(semanaMap.values())
      .filter(semana => semana.semana >= 5 && semana.semana <= semanaAtual)
      .map(semana => {
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
    }).sort((a, b) => b.semana - a.semana); // Ordenar decrescente (semana atual primeiro)

    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Dados consolidados: ${semanasConsolidadas.length} semanas`);
    }

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
