import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { authenticateUser } from '@/middleware/auth';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Cache em memória para dados de desempenho
const performanceCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos em millisegundos

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
    const mesParam = searchParams.get('mes');
    const mes = mesParam ? parseInt(mesParam) : null;
    const ano = parseInt(searchParams.get('ano') || new Date().getFullYear().toString());

    // Limpar cache temporariamente para debug
    const cacheKey = `desempenho-${user.bar_id}-${mes}-${ano}`;
    performanceCache.delete(cacheKey); // Forçar busca nova
    
    // const cached = performanceCache.get(cacheKey);
    // if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    //   if (process.env.NODE_ENV === 'development') {
    //     console.log('📦 Dados retornados do cache');
    //   }
    //   return NextResponse.json(cached.data);
    // }

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
        cl_plan,
        te_real,
        tb_real,
        percent_art_fat,
        c_art,
        c_prod
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

    // Função otimizada para buscar dados agregados por data
    const fetchAggregatedData = async (table: string, dateColumn: string, aggregateColumn: string, aggregateFunction = 'sum') => {
      const { data, error } = await supabase
        .rpc('aggregate_by_date', {
          table_name: table,
          date_column: dateColumn,
          aggregate_column: aggregateColumn,
          aggregate_function: aggregateFunction,
          start_date: `${ano}-01-01`,
          end_date: `${ano + 1}-01-01`,
          bar_id_filter: user.bar_id
        });

      if (error) {
        console.error(`❌ Erro ao buscar dados agregados de ${table}:`, error);
        // Fallback para método original se RPC falhar
        return await fetchAllDataFallback(table, `${dateColumn}, ${aggregateColumn}`, dateColumn);
      }

      return data || [];
    };

    // Função de fallback (método original) caso RPC não esteja disponível
    const fetchAllDataFallback = async (table: string, columns: string, dateColumn: string) => {
      const { data, error } = await supabase
        .from(table)
        .select(columns)
        .gte(dateColumn, `${ano}-01-01`)
        .lt(dateColumn, `${ano + 1}-01-01`)
        .eq('bar_id', user.bar_id)
        .limit(10000) // Limite maior para reduzir chamadas
        .order(dateColumn);

      if (error) {
        console.error(`❌ Erro ao buscar dados de ${table}:`, error);
        return [];
      }

      return data || [];
    };

    // Função para buscar dados do ContaHub (agregação será feita no código)
    const fetchContaHubData = async () => {
      const { data, error } = await supabase
        .from('contahub_pagamentos')
        .select('dt_gerencial, liquido')
        .gte('dt_gerencial', `${ano}-01-01`)
        .lt('dt_gerencial', `${ano + 1}-01-01`)
        .neq('meio', 'Conta Assinada')  // Excluir consumo de sócios
        .eq('bar_id', user.bar_id)
        .limit(10000)
        .order('dt_gerencial');

      if (error) {
        console.error('❌ Erro ao buscar dados do ContaHub:', error);
        return [];
      }

      return data || [];
    };

    // OTIMIZAÇÃO: Como estamos usando real_r da tabela eventos_base,
    // só precisamos buscar dados externos para debug/comparação
    const [yuzerData, symplaData, contahubData] = await Promise.all([
      fetchAllDataFallback('yuzer_pagamento', 'data_evento, valor_liquido', 'data_evento'),
      fetchAllDataFallback('sympla_resumo', 'data_evento, total_liquido', 'data_evento'), 
      fetchContaHubData()
    ]);

    // Logs básicos apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Dados carregados - Yuzer: ${yuzerData.length}, Sympla: ${symplaData.length}, ContaHub: ${contahubData.length}`);
    }

    // Criar mapas agregados (somar valores por data)
    const yuzerMap = new Map();
    yuzerData?.forEach((item: any) => {
      const data = item.data_evento;
      const valor = item.valor_liquido || 0;
      yuzerMap.set(data, (yuzerMap.get(data) || 0) + valor);
    });

    const symplaMap = new Map();
    symplaData?.forEach((item: any) => {
      const data = item.data_evento;
      const valor = item.total_liquido || 0;
      symplaMap.set(data, (symplaMap.get(data) || 0) + valor);
    });

    const contahubMap = new Map();
    contahubData?.forEach(item => {
      const data = item.dt_gerencial;
      const valor = item.liquido || 0;
      contahubMap.set(data, (contahubMap.get(data) || 0) + valor);
    });

    // Buscar dados do Getin para reservas (agregação será feita no código)
    const { data: getinData } = await supabase
      .from('getin_reservations')
      .select('reservation_date')
      .gte('reservation_date', `${ano}-01-01`)
      .lt('reservation_date', `${ano + 1}-01-01`)
      .eq('bar_id', user.bar_id)
      .limit(10000)
      .order('reservation_date');

    const getinMap = new Map();
    getinData?.forEach(item => {
      const data = item.reservation_date;
      getinMap.set(data, (getinMap.get(data) || 0) + 1);
    });

    // Buscar dados do ContaHub Período para couvert
    const { data: contahubPeriodoData } = await supabase
      .from('contahub_periodo')
      .select('dt_gerencial, vr_couvert')
      .gte('dt_gerencial', `${ano}-01-01`)
      .lt('dt_gerencial', `${ano + 1}-01-01`)
      .eq('bar_id', user.bar_id)
      .limit(10000)
      .order('dt_gerencial');

    const contahubCouvertMap = new Map();
    contahubPeriodoData?.forEach(item => {
      const data = item.dt_gerencial;
      const valor = item.vr_couvert || 0;
      contahubCouvertMap.set(data, (contahubCouvertMap.get(data) || 0) + valor);
    });

    // Buscar dados do Nibo para CMO
    const categoriasCMO = [
      'SALARIO FUNCIONARIOS', 'VALE TRANSPORTE', 'ALIMENTAÇÃO', 'ADICIONAIS',
      'FREELA ATENDIMENTO', 'FREELA BAR', 'FREELA COZINHA', 'FREELA LIMPEZA',
      'FREELA SEGURANÇA', 'PRO LABORE', 'PROVISÃO TRABALHISTA'
    ];

    const { data: niboData } = await supabase
      .from('nibo_agendamentos')
      .select('data_competencia, valor')
      .gte('data_competencia', `${ano}-01-01`)
      .lt('data_competencia', `${ano + 1}-01-01`)
      .eq('bar_id', user.bar_id)
      .in('categoria_nome', categoriasCMO)
      .limit(10000)
      .order('data_competencia');

    const niboMap = new Map();
    niboData?.forEach(item => {
      const data = item.data_competencia;
      const valor = item.valor || 0;
      niboMap.set(data, (niboMap.get(data) || 0) + valor);
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
      faturamento_couvert: number;
      faturamento_bar: number;
      cmv_total: number;
      cmo_valor: number;
      cmo_percentual: number;
      atracao_faturamento: number;
      atracao_percentual: number;
      clientes_atendidos: number;
      reservas_totais: number;
      reservas_presentes: number;
      cmv_rs: number;
    }>();

    eventos.forEach(evento => {
      // Usar a semana já calculada na tabela eventos_base em vez de recalcular
      const semana = evento.semana;
      
      if (!semanaMap.has(semana)) {
        // NÃO recalcular período - será definido dinamicamente baseado nas datas reais dos eventos
        semanaMap.set(semana, {
          semana,
          periodo: '', // Será calculado depois baseado nas datas reais dos eventos
          faturamento_total: 0,
          clientes_total: 0,
          eventos_count: 0,
          metas_faturamento: 0,
          metas_clientes: 0,
          faturamento_couvert: 0,
          faturamento_bar: 0,
          cmv_total: 0,
          cmo_valor: 0,
          cmo_percentual: 0,
          atracao_faturamento: 0,
          atracao_percentual: 0,
          clientes_atendidos: 0,
          reservas_totais: 0,
          reservas_presentes: 0,
          cmv_rs: 0
        });
      }

      const semanaData = semanaMap.get(semana)!;
      // USAR DADOS JÁ CALCULADOS DA TABELA eventos_base
      // O campo real_r já contém o faturamento total calculado corretamente
      const faturamentoTotal = evento.real_r || 0;
      
      // Debug: Comparar com cálculo manual para verificar discrepâncias
      const faturamentoContaHub = contahubMap.get(evento.data_evento) || 0;
      const faturamentoYuzer = yuzerMap.get(evento.data_evento) || 0;
      const faturamenteSympla = symplaMap.get(evento.data_evento) || 0;
      const faturamentoManual = faturamentoContaHub + faturamentoYuzer + faturamenteSympla;
      

      
      semanaData.faturamento_total += faturamentoTotal;
      semanaData.clientes_total += evento.cl_real || 0;
      semanaData.eventos_count += 1;
      semanaData.metas_faturamento += evento.m1_r || 0;
      semanaData.metas_clientes += evento.cl_plan || 0;
      
      // Novos indicadores de desempenho usando dados das tabelas corretas
      const clientesReais = evento.cl_real || 0;
      
      // Faturamento Couvert (da tabela contahub_periodo)
      const couvertDia = contahubCouvertMap.get(evento.data_evento) || 0;
      semanaData.faturamento_couvert += couvertDia;
      
      // Faturamento Bar = Total - Couvert
      semanaData.faturamento_bar += faturamentoTotal - couvertDia;
      
      // Atração/Faturamento (c_art + c_prod da eventos_base)
      semanaData.atracao_faturamento += (evento.c_art || 0) + (evento.c_prod || 0);
      
      // CMO (da tabela nibo_agendamentos)
      const cmoDia = niboMap.get(evento.data_evento) || 0;
      semanaData.cmo_valor += cmoDia;
      
      // Clientes Atendidos (cl_real da eventos_base)
      semanaData.clientes_atendidos += clientesReais;
      
      // Reservas (usando dados do Getin se disponível, senão usar cl_real)
      const reservasGetin = getinMap.get(evento.data_evento) || 0;
      semanaData.reservas_totais += reservasGetin > 0 ? reservasGetin : clientesReais;
      semanaData.reservas_presentes += clientesReais;
      
      // CMV R$ será manual (inicializado em 0)
      // semanaData.cmv_rs permanece 0 para ser preenchido manualmente
    });

    // Obter semana atual
    const hoje = new Date();
    const semanaAtual = getWeekNumber(hoje);



    // Buscar períodos da tabela de referência
    const { data: semanasReferencia } = await supabase
      .from('semanas_referencia')
      .select('semana, periodo_formatado')
      .in('semana', Array.from(semanaMap.keys()));

    // Aplicar períodos corretos da tabela de referência
    semanaMap.forEach((semanaData, numeroSemana) => {
      const referenciaEncontrada = semanasReferencia?.find(ref => ref.semana === numeroSemana);
      if (referenciaEncontrada) {
        semanaData.periodo = referenciaEncontrada.periodo_formatado;
      } else {
        // Fallback: calcular baseado nas datas dos eventos (caso não encontre na referência)
        const eventosDesaSemana = eventos.filter(e => e.semana === numeroSemana);
        if (eventosDesaSemana.length > 0) {
          const datas = eventosDesaSemana.map(e => new Date(e.data_evento)).sort((a, b) => a.getTime() - b.getTime());
          const dataInicio = datas[0];
          const dataFim = datas[datas.length - 1];
          
          semanaData.periodo = `${dataInicio.getDate().toString().padStart(2, '0')}.${(dataInicio.getMonth() + 1).toString().padStart(2, '0')} - ${dataFim.getDate().toString().padStart(2, '0')}.${(dataFim.getMonth() + 1).toString().padStart(2, '0')}`;
        }
      }
    });

    // Converter para array e calcular métricas (mostrar desde semana 6)
    let semanasConsolidadas = Array.from(semanaMap.values())
      .filter(semana => semana.eventos_count > 0 && semana.semana >= 6);

    semanasConsolidadas = semanasConsolidadas.map(semana => {
      const ticketMedio = semana.clientes_total > 0 ? semana.faturamento_total / semana.clientes_total : 0;
      
      // Calcular CMO% (CMO sobre faturamento)
      const cmoPercentual = semana.faturamento_total > 0 ? (semana.cmo_valor / semana.faturamento_total) * 100 : 0;
      
      // Calcular Atração/Faturamento %
      const atracaoPercentual = semana.faturamento_total > 0 ? (semana.atracao_faturamento / semana.faturamento_total) * 100 : 0;
      
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
        faturamento_couvert: Math.round(semana.faturamento_couvert * 100) / 100,
        faturamento_bar: Math.round(semana.faturamento_bar * 100) / 100,
        cmo_percentual: Math.round(cmoPercentual * 100) / 100,
        atracao_faturamento: Math.round(semana.atracao_faturamento * 100) / 100,
        atracao_percentual: Math.round(atracaoPercentual * 100) / 100,
        clientes_atendidos: semana.clientes_atendidos,
        reservas_totais: semana.reservas_totais,
        reservas_presentes: semana.reservas_presentes,
        cmv_rs: semana.cmv_rs,
        // Campos antigos mantidos para compatibilidade
        clientes_total: semana.clientes_total,
        eventos_count: semana.eventos_count,
        metas_faturamento: Math.round(semana.metas_faturamento * 100) / 100,
        metas_clientes: semana.metas_clientes,
        ticket_medio: Math.round(ticketMedio * 100) / 100,
        performance_geral: Math.round(performanceGeral * 100) / 100
      };
    }).sort((a, b) => b.semana - a.semana); // Ordenar decrescente (semana atual primeiro)



    // CORREÇÃO: Aplicar filtro mensal SEMPRE quando mes é especificado
    if (mes !== null && mes !== undefined) {
      // Filtrar semanas que contêm eventos do mês solicitado
      const eventosDoMes = eventos.filter(evento => {
        const dataEvento = new Date(evento.data_evento);
        return dataEvento.getMonth() + 1 === mes && dataEvento.getFullYear() === ano;
      });
      
      const semanasDoMes = new Set(eventosDoMes.map(evento => evento.semana));
      semanasConsolidadas = semanasConsolidadas.filter(semana => semanasDoMes.has(semana.semana));
    }

    // Ordenar semanas em ordem decrescente (mais recente primeiro)
    semanasConsolidadas.sort((a, b) => b.semana - a.semana);



    // Calcular totais mensais
    const totaisMensais = semanasConsolidadas.reduce((acc, semana) => ({
      faturamento_total: acc.faturamento_total + semana.faturamento_total,
      clientes_total: acc.clientes_total + semana.clientes_total,
      eventos_total: acc.eventos_total + semana.eventos_count,
      performance_media: acc.performance_media + (semana as any).performance_geral
    }), { faturamento_total: 0, clientes_total: 0, eventos_total: 0, performance_media: 0 });

    const ticketMedioMensal = totaisMensais.clientes_total > 0 ? 
      totaisMensais.faturamento_total / totaisMensais.clientes_total : 0;
    
    const performanceMediaMensal = semanasConsolidadas.length > 0 ? 
      totaisMensais.performance_media / semanasConsolidadas.length : 0;

    const responseData = {
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
    };

    // Salvar no cache
    performanceCache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });

    return NextResponse.json(responseData);

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
