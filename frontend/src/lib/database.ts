import { getSupabaseClient } from './supabase';

console.log('🔧 Usando cliente Supabase existente configurado');

// Interfaces para os dados
export interface VendasData {
  vendas_hoje: number;
  vendas_semana: number;
  total_pedidos: number;
  ticket_medio: number;
}

export interface ProdutoMaisVendido {
  produto: string;
  grupo: string;
  quantidade: number;
  valor_total: number;
}

export interface ClientesData {
  total_clientes_hoje: number;
  novos_clientes: number;
  clientes_recorrentes: number;
}

interface AnaliticoItem {
  prd_desc: string | null;
  grp_desc: string | null;
  valorfinal: string | number;
  qtd: string | number;
  vd_dtgerencial: string;
  vd?: string;
}

interface ProdutoAgrupado {
  produto: string;
  grupo: string;
  quantidade: number;
  valor_total: number;
}

interface VendaItem {
  valorfinal: string | number;
  prd_desc: string | null;
  vd_dtgerencial: string;
  vd: string;
}

interface ClienteItem {
  created_at: string;
  id: string;
}

interface DadosSemana {
  dia: string;
  data: string;
  faturamento: number;
  clientes: number;
  ticketMedio: number;
}

interface HistoricoDia {
  data: string;
  faturamento: number;
  clientes: number;
  ticketMedio: number;
}

interface ComparacaoPeriodos {
  periodo1: {
    faturamento: number;
    clientes: number;
    ticketMedio: number;
    diasAtivos: number;
  };
  periodo2: {
    faturamento: number;
    clientes: number;
    ticketMedio: number;
    diasAtivos: number;
  };
  crescimento: {
    faturamento: number;
    clientes: number;
    ticketMedio: number;
  };
}

interface AnaliseCompleta {
  vendas: VendasData;
  clientes: ClientesData;
  produtoMaisVendido: ProdutoMaisVendido | null;
  melhorDiaSemana: DadosSemana;
  dadosSemana: DadosSemana[];
  medias: {
    faturamento: number;
    clientes: number;
    ticketMedio: number;
  };
  insights: {
    performanceSemana: number;
    consistencia: number;
    crescimento: number;
  };
}

// Função para testar conexão
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testando conexão com Supabase...');
    console.log('📍 Projeto: iddtrhexgjbfhxebpklf.supabase.co');

    const supabase = await getSupabaseClient();
    if (!supabase) throw new Error('Erro ao conectar com banco');

    // Teste simples para verificar conectividade
    const { data, error, count } = await supabase
      .from('analitico')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('❌ Erro ao testar Supabase:', error);
      return false;
    }

    console.log('✅ Conexão com Supabase OK');
    console.log(`📊 Total de registros na tabela 'analitico': ${count}`);
    return true;
  } catch (error: unknown) {
    console.error('❌ Erro na conexão com Supabase:', error);
    return false;
  }
}

// 🏆 CONSULTA: Produto mais vendido usando Supabase
export async function getProdutoMaisVendido(
  periodo: 'hoje' | 'semana' | 'mes' = 'hoje'
): Promise<ProdutoMaisVendido | null> {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log(`🔍 Buscando produto mais vendido (${periodo})...`);

    const hoje = new Date().toISOString().split('T')[0];
    let query = supabase
      .from('analitico')
      .select('prd_desc, grp_desc, valorfinal, qtd, vd_dtgerencial')
      .not('prd_desc', 'is', null)
      .not('grp_desc', 'is', null)
      .gt('valorfinal', 0);

    // Aplicar filtro de data conforme período
    if (periodo === 'hoje') {
      // Primeiro tenta hoje
      query = query.eq('vd_dtgerencial', hoje);

      const { data: dadosHoje, error: errorHoje } = await query;

      if (errorHoje) {
        console.error('❌ Erro vendas hoje:', errorHoje);
        throw errorHoje;
      }

      // Se não tem dados de hoje, buscar a data mais recente
      if (!dadosHoje || dadosHoje.length === 0) {
        console.log('⚠️ Sem dados para hoje, buscando data mais recente...');

        // Buscar data mais recente com dados
        const { data: datasRecentes, error: errorDatas } = await supabase
          .from('analitico')
          .select('vd_dtgerencial')
          .not('vd_dtgerencial', 'is', null)
          .order('vd_dtgerencial', { ascending: false })
          .limit(1);

        if (errorDatas || !datasRecentes || datasRecentes.length === 0) {
          console.log('❌ Nenhuma data encontrada');
          return null;
        }

        const dataRecente = datasRecentes[0].vd_dtgerencial;
        console.log(`📅 Usando dados da data mais recente: ${dataRecente}`);

        query = supabase
          .from('analitico')
          .select('prd_desc, grp_desc, valorfinal, qtd, vd_dtgerencial')
          .eq('vd_dtgerencial', dataRecente)
          .not('prd_desc', 'is', null)
          .not('grp_desc', 'is', null)
          .gt('valorfinal', 0);
      }
    } else if (periodo === 'semana') {
      const semanaAtras = new Date();
      semanaAtras.setDate(semanaAtras.getDate() - 7);
      const dataInicio = semanaAtras.toISOString().split('T')[0];
      query = query.gte('vd_dtgerencial', dataInicio);
    } else if (periodo === 'mes') {
      const mesAtras = new Date();
      mesAtras.setDate(mesAtras.getDate() - 30);
      const dataInicio = mesAtras.toISOString().split('T')[0];
      query = query.gte('vd_dtgerencial', dataInicio);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro na consulta Supabase:', error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log(
        '⚠️ Nenhum dado encontrado na tabela analitico para o período'
      );
      return null;
    }

    console.log(`📊 Registros encontrados: ${data.length}`);
    console.log(
      `📅 Período dos dados: ${data[0]?.vd_dtgerencial} a ${data[data.length - 1]?.vd_dtgerencial}`
    );

    // Agrupar produtos e somar quantidades/valores
    const produtosAgrupados = data.reduce(
      (acc: Record<string, ProdutoAgrupado>, item: AnaliticoItem) => {
        const produto = item.prd_desc || 'Produto Desconhecido';
        const grupo = item.grp_desc || 'Sem Categoria';
        const valor = parseFloat(String(item.valorfinal)) || 0;
        const quantidade = parseInt(String(item.qtd)) || 1;

        if (!acc[produto]) {
          acc[produto] = {
            produto,
            grupo,
            quantidade: 0,
            valor_total: 0,
          };
        }

        acc[produto].quantidade += quantidade;
        acc[produto].valor_total += valor;

        return acc;
      },
      {}
    );

    // Ordenar por quantidade (mais vendido)
    const produtosOrdenados = Object.values(produtosAgrupados).sort(
      (a: ProdutoAgrupado, b: ProdutoAgrupado) => b.quantidade - a.quantidade
    );

    console.log(
      '📊 Top 3 produtos por quantidade:',
      produtosOrdenados.slice(0, 3)
    );

    return (produtosOrdenados[0] as ProdutoMaisVendido) || null;
  } catch (error) {
    console.error('❌ Erro ao buscar produto mais vendido:', error);
    throw error;
  }
}

// 💰 CONSULTA: Vendas usando Supabase
export async function getVendasData(): Promise<VendasData> {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log('💰 Buscando dados de vendas...');

    const hoje = new Date().toISOString().split('T')[0];
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    const semanaData = semanaAtras.toISOString().split('T')[0];

    // Vendas de hoje - primeiro tenta hoje, senão usa data mais recente
    let vendasHoje;
    const { data, error: errorHoje } = await supabase
      .from('analitico')
      .select('valorfinal, prd_desc, vd_dtgerencial, vd')
      .eq('vd_dtgerencial', hoje)
      .gt('valorfinal', 0);
    vendasHoje = data;

    // Se não tem dados de hoje, buscar data mais recente
    if ((!vendasHoje || vendasHoje.length === 0) && !errorHoje) {
      console.log('⚠️ Sem vendas para hoje, buscando data mais recente...');

      const { data: dataRecente, error: errorData } = await supabase
        .from('analitico')
        .select('vd_dtgerencial')
        .not('vd_dtgerencial', 'is', null)
        .order('vd_dtgerencial', { ascending: false })
        .limit(1);

      if (errorData || !dataRecente || dataRecente.length === 0) {
        console.log('❌ Nenhuma data encontrada');
        return {
          vendas_hoje: 0,
          vendas_semana: 0,
          total_pedidos: 0,
          ticket_medio: 0,
        };
      }

      const dataRecenteStr = dataRecente[0].vd_dtgerencial;
      console.log(`📅 Usando dados da data mais recente: ${dataRecenteStr}`);

      const { data: vendasRecente, error: errorVendasRecente } = await supabase
        .from('analitico')
        .select('valorfinal, prd_desc, vd_dtgerencial, vd')
        .eq('vd_dtgerencial', dataRecenteStr)
        .gt('valorfinal', 0);

      if (errorVendasRecente) {
        console.error('❌ Erro vendas data recente:', errorVendasRecente);
        throw errorVendasRecente;
      }

      vendasHoje = vendasRecente;
    }

    if (errorHoje) {
      console.error('❌ Erro vendas hoje:', errorHoje);
      throw errorHoje;
    }

    // Vendas da semana
    const { data: vendasSemana, error: errorSemana } = await supabase
      .from('analitico')
      .select('valorfinal, prd_desc, vd_dtgerencial, vd')
      .gte('vd_dtgerencial', semanaData)
      .gt('valorfinal', 0);

    if (errorSemana) {
      console.error('❌ Erro vendas semana:', errorSemana);
      throw errorSemana;
    }

    // Calcular totais
    const totalHoje =
      vendasHoje?.reduce(
        (sum: number, venda: VendaItem) =>
          sum + parseFloat(String(venda.valorfinal)),
        0
      ) || 0;
    const totalSemana =
      vendasSemana?.reduce(
        (sum: number, venda: VendaItem) =>
          sum + parseFloat(String(venda.valorfinal)),
        0
      ) || 0;
    const totalPedidos = vendasHoje?.length || 0;
    const ticketMedio = totalPedidos > 0 ? totalHoje / totalPedidos : 0;

    console.log('📊 Estatísticas calculadas:', {
      hoje: totalHoje,
      semana: totalSemana,
      pedidos: totalPedidos,
      ticket: ticketMedio,
    });

    return {
      vendas_hoje: totalHoje,
      vendas_semana: totalSemana,
      total_pedidos: totalPedidos,
      ticket_medio: ticketMedio,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar dados de vendas:', error);
    throw error;
  }
}

// 👥 CONSULTA: Clientes usando Supabase
export async function getClientesData(): Promise<ClientesData> {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log('👥 Buscando dados de clientes...');

    const hoje = new Date().toISOString().split('T')[0];

    // Clientes de hoje
    const { data: clientesHoje, error: errorClientesHoje } = await supabase
      .from('usuarios')
      .select('created_at, id')
      .gte('created_at', `${hoje}T00:00:00`)
      .lt('created_at', `${hoje}T23:59:59`)
      .eq('bar_id', 1);

    if (errorClientesHoje) {
      console.error('❌ Erro clientes hoje:', errorClientesHoje);
      throw errorClientesHoje;
    }

    // Clientes da semana
    const semanaAtras = new Date();
    semanaAtras.setDate(semanaAtras.getDate() - 7);
    const semanaData = semanaAtras.toISOString().split('T')[0];

    const { data: clientesSemana, error: errorClientesSemana } = await supabase
      .from('usuarios')
      .select('created_at, id')
      .gte('created_at', `${semanaData}T00:00:00`)
      .eq('bar_id', 1);

    if (errorClientesSemana) {
      console.error('❌ Erro clientes semana:', errorClientesSemana);
      throw errorClientesSemana;
    }

    // Calcular estatísticas
    const totalClientesHoje = clientesHoje?.length || 0;
    const totalClientesSemana = clientesSemana?.length || 0;

    // Calcular clientes recorrentes (que já existiam antes de hoje)
    const clientesAntigos =
      clientesSemana?.filter(
        (cliente: ClienteItem) =>
          new Date(cliente.created_at) < new Date(`${hoje}T00:00:00`)
      ) || [];

    const clientesRecorrentes = clientesAntigos.length;
    const novosClientes = totalClientesHoje;

    console.log('👥 Clientes calculados baseado em mesas únicas:', {
      total: totalClientesHoje,
      novos: novosClientes,
      recorrentes: clientesRecorrentes,
      dataUsada: hoje,
      totalRegistros: clientesHoje?.length,
      mesasUnicas: clientesHoje
        ?.map((item: ClienteItem) => item.id)
        .slice(0, 5), // mostrar primeiras 5 mesas
    });

    return {
      total_clientes_hoje: totalClientesHoje,
      novos_clientes: novosClientes,
      clientes_recorrentes: clientesRecorrentes,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar dados de clientes:', error);
    throw error;
  }
}

// 📊 CONSULTA AVANÇADA: Dados de uma semana específica
export async function getDadosSemana(
  dataInicio?: string
): Promise<DadosSemana[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    // Se não informar data, usar a data mais recente disponível como base
    let dataBase = dataInicio;
    if (!dataBase) {
      const { data: dataRecente } = await supabase
        .from('analitico')
        .select('vd_dtgerencial')
        .not('vd_dtgerencial', 'is', null)
        .order('vd_dtgerencial', { ascending: false })
        .limit(1);

      dataBase =
        dataRecente?.[0]?.vd_dtgerencial ||
        new Date().toISOString().split('T')[0];
      console.log('📅 Usando data mais recente disponível:', dataBase);
    }

    console.log('📊 Buscando dados da semana a partir de:', dataBase);

    // Calcular dias da semana (últimos 7 dias a partir da data base)
    const fimSemana = new Date(dataBase!);
    const diasSemana = [];

    for (let i = 6; i >= 0; i--) {
      const data = new Date(fimSemana);
      data.setDate(fimSemana.getDate() - i);
      diasSemana.push(data.toISOString().split('T')[0]);
    }

    const dadosPromises = diasSemana.map(async (data, index) => {
      // Mapear corretamente o dia da semana baseado na data real
      const diaNomeReal = new Date(data + 'T12:00:00').toLocaleDateString(
        'pt-BR',
        { weekday: 'long' }
      );
      const diaNomeCapitalizado =
        diaNomeReal.charAt(0).toUpperCase() + diaNomeReal.slice(1);

      try {
        // Buscar dados de todas as fontes para cada dia
        const [periodoData, pagamentosData, symplaData] = await Promise.all([
          supabase
            .from('periodo')
            .select('pessoas, vr_pagamentos, dt_gerencial')
            .eq('dt_gerencial', data),
          supabase
            .from('pagamentos')
            .select('liquido, dt_gerencial')
            .eq('dt_gerencial', data),
          supabase
            .from('sympla_bilheteria')
            .select('total_liquido, qtd_checkins_realizados, data_evento')
            .eq('data_evento', data),
        ]);

        // Calcular métricas do dia
        const faturamentoPagamentos =
          pagamentosData.data?.reduce(
            (sum: number, item: { liquido?: string }) =>
              sum + parseFloat(item.liquido || '0'),
            0
          ) || 0;
        const faturamentoSympla =
          symplaData.data?.reduce(
            (sum: number, item: { total_liquido?: string }) =>
              sum + parseFloat(item.total_liquido || '0'),
            0
          ) || 0;
        const faturamentoTotal = faturamentoPagamentos + faturamentoSympla;

        const pessoasPeriodo =
          periodoData.data?.reduce(
            (sum: number, item: { pessoas?: string }) =>
              sum + parseInt(item.pessoas || '0'),
            0
          ) || 0;
        const pessoasSympla =
          symplaData.data?.reduce(
            (sum: number, item: { qtd_checkins_realizados?: string }) =>
              sum + parseInt(item.qtd_checkins_realizados || '0'),
            0
          ) || 0;
        const clientesTotal = pessoasPeriodo + pessoasSympla;

        return {
          dia: diaNomeCapitalizado,
          data,
          faturamento: faturamentoTotal,
          clientes: clientesTotal,
          ticketMedio: clientesTotal > 0 ? faturamentoTotal / clientesTotal : 0,
        };
      } catch (error) {
        console.error(`❌ Erro ao buscar dados do dia ${data}:`, error);
        return {
          dia: diaNomeCapitalizado,
          data,
          faturamento: 0,
          clientes: 0,
          ticketMedio: 0,
        };
      }
    });

    const resultados = await Promise.all(dadosPromises);

    console.log('📊 Dados da semana processados:', resultados.length, 'dias');
    return resultados;
  } catch (error) {
    console.error('❌ Erro ao buscar dados da semana:', error);
    throw error;
  }
}

// 📈 CONSULTA AVANÇADA: Histórico de um dia da semana específico
export async function getHistoricoDiaSemana(
  diaSemana: string,
  ultimasSemanas = 8
): Promise<HistoricoDia[]> {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log(
      `📈 Buscando histórico de ${diaSemana} das últimas ${ultimasSemanas} semanas`
    );

    // Mapear dia da semana para índice (0=domingo, 1=segunda, etc.)
    const diasSemanaMap: Record<string, number> = {
      domingo: 0,
      segunda: 1,
      terca: 2,
      quarta: 3,
      quinta: 4,
      sexta: 5,
      sabado: 6,
    };

    const diaSemanaIndex = diasSemanaMap[diaSemana.toLowerCase()];
    if (diaSemanaIndex === undefined) {
      throw new Error(`Dia da semana inválido: ${diaSemana}`);
    }

    // Calcular data limite
    const hoje = new Date();
    const dataLimite = new Date(hoje);
    dataLimite.setDate(hoje.getDate() - ultimasSemanas * 7);

    // Buscar dados históricos
    const [pagamentosData, periodoData] = await Promise.all([
      supabase
        .from('pagamentos')
        .select('dt_gerencial, liquido')
        .gte('dt_gerencial', dataLimite.toISOString().split('T')[0]),
      supabase
        .from('periodo')
        .select('dt_gerencial, pessoas')
        .gte('dt_gerencial', dataLimite.toISOString().split('T')[0]),
    ]);

    // Filtrar apenas o dia da semana específico e agrupar por data
    const dadosFiltratos: Record<
      string,
      { data: string; faturamento: number; clientes: number }
    > = {};

    pagamentosData.data?.forEach(
      (item: { dt_gerencial: string; liquido: string }) => {
        const data = new Date(item.dt_gerencial);
        if (data.getDay() === diaSemanaIndex) {
          const dataStr = item.dt_gerencial;
          if (!dadosFiltratos[dataStr]) {
            dadosFiltratos[dataStr] = {
              data: dataStr,
              faturamento: 0,
              clientes: 0,
            };
          }
          dadosFiltratos[dataStr].faturamento += parseFloat(
            item.liquido || '0'
          );
        }
      }
    );

    periodoData.data?.forEach(
      (item: { dt_gerencial: string; pessoas: string }) => {
        const data = new Date(item.dt_gerencial);
        if (data.getDay() === diaSemanaIndex) {
          const dataStr = item.dt_gerencial;
          if (!dadosFiltratos[dataStr]) {
            dadosFiltratos[dataStr] = {
              data: dataStr,
              faturamento: 0,
              clientes: 0,
            };
          }
          dadosFiltratos[dataStr].clientes += parseInt(item.pessoas || '0');
        }
      }
    );

    // Calcular ticket médio e ordenar
    const resultados = Object.values(dadosFiltratos)
      .map((item: { data: string; faturamento: number; clientes: number }) => ({
        ...item,
        ticketMedio: item.clientes > 0 ? item.faturamento / item.clientes : 0,
      }))
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, ultimasSemanas);

    console.log(
      `📈 Histórico de ${diaSemana}:`,
      resultados.length,
      'registros encontrados'
    );
    return resultados;
  } catch (error) {
    console.error(`❌ Erro ao buscar histórico de ${diaSemana}:`, error);
    throw error;
  }
}

// 🎯 CONSULTA AVANÇADA: Comparação de períodos
export async function getComparacaoPeriodos(
  periodo1: [string, string],
  periodo2: [string, string]
): Promise<ComparacaoPeriodos> {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log('🎯 Comparando períodos:', periodo1, 'vs', periodo2);

    const calcularPeriodo = async ([inicio, fim]: [string, string]) => {
      const { data, error } = await supabase
        .from('analitico')
        .select('valorfinal, vd_dtgerencial, vd')
        .gte('vd_dtgerencial', inicio)
        .lte('vd_dtgerencial', fim)
        .gt('valorfinal', 0);

      if (error) throw error;

      const faturamento =
        data?.reduce(
          (sum: number, item: VendaItem) =>
            sum + parseFloat(String(item.valorfinal)),
          0
        ) || 0;
      const clientes = new Set(data?.map((item: VendaItem) => item.vd) || [])
        .size;
      const diasAtivos = new Set(
        data?.map((item: VendaItem) => item.vd_dtgerencial) || []
      ).size;
      const ticketMedio = clientes > 0 ? faturamento / clientes : 0;

      return { faturamento, clientes, ticketMedio, diasAtivos };
    };

    const [dados1, dados2] = await Promise.all([
      calcularPeriodo(periodo1),
      calcularPeriodo(periodo2),
    ]);

    const crescimentoFaturamento =
      (dados1?.faturamento || 0) > 0
        ? (((dados2?.faturamento || 0) - (dados1?.faturamento || 0)) /
            (dados1?.faturamento || 0)) *
          100
        : 0;
    const crescimentoClientes =
      (dados1?.clientes || 0) > 0
        ? (((dados2?.clientes || 0) - (dados1?.clientes || 0)) /
            (dados1?.clientes || 0)) *
          100
        : 0;
    const crescimentoTicket =
      (dados1?.ticketMedio || 0) > 0
        ? (((dados2?.ticketMedio || 0) - (dados1?.ticketMedio || 0)) /
            (dados1?.ticketMedio || 0)) *
          100
        : 0;

    return {
      periodo1: dados1 || {
        faturamento: 0,
        clientes: 0,
        ticketMedio: 0,
        diasAtivos: 0,
      },
      periodo2: dados2 || {
        faturamento: 0,
        clientes: 0,
        ticketMedio: 0,
        diasAtivos: 0,
      },
      crescimento: {
        faturamento: crescimentoFaturamento,
        clientes: crescimentoClientes,
        ticketMedio: crescimentoTicket,
      },
    };
  } catch (error) {
    console.error('❌ Erro ao comparar períodos:', error);
    throw error;
  }
}

// 🏆 CONSULTA AVANÇADA: Top produtos e análises
export async function getAnaliseCompleta(
  periodo: 'hoje' | 'semana' | 'mes' = 'semana'
): Promise<AnaliseCompleta> {
  const supabase = await getSupabaseClient();
  if (!supabase) throw new Error('Erro ao conectar com banco');

  try {
    console.log('🏆 Fazendo análise completa para período:', periodo);

    let dataInicio = '';
    const hoje = new Date().toISOString().split('T')[0];

    switch (periodo) {
      case 'hoje':
        dataInicio = hoje;
        break;
      case 'semana': {
        const semanaAtras = new Date();
        semanaAtras.setDate(semanaAtras.getDate() - 7);
        dataInicio = semanaAtras.toISOString().split('T')[0];
        break;
      }
      case 'mes': {
        const mesAtras = new Date();
        mesAtras.setMonth(mesAtras.getMonth() - 1);
        dataInicio = mesAtras.toISOString().split('T')[0];
        break;
      }
    }

    // Buscar dados básicos
    const [vendasData, clientesData, produtoTop] = await Promise.all([
      getVendasData(),
      getClientesData(),
      getProdutoMaisVendido(periodo),
    ]);

    // Buscar dados da semana para comparação (usa data mais recente automaticamente)
    const dadosSemana = await getDadosSemana();

    // Encontrar melhor dia da semana
    const melhorDia = dadosSemana.reduce((melhor, dia) =>
      dia.faturamento > melhor.faturamento ? dia : melhor
    );

    // Calcular médias
    const mediaFaturamento =
      dadosSemana.reduce((sum, dia) => sum + dia.faturamento, 0) /
      dadosSemana.length;
    const mediaClientes =
      dadosSemana.reduce((sum, dia) => sum + dia.clientes, 0) /
      dadosSemana.length;

    return {
      vendas: vendasData,
      clientes: clientesData,
      produtoMaisVendido: produtoTop,
      melhorDiaSemana: melhorDia,
      dadosSemana,
      medias: {
        faturamento: mediaFaturamento,
        clientes: mediaClientes,
        ticketMedio: mediaClientes > 0 ? mediaFaturamento / mediaClientes : 0,
      },
      insights: {
        performanceSemana: melhorDia.faturamento / mediaFaturamento,
        consistencia:
          dadosSemana.filter(dia => dia.faturamento > mediaFaturamento * 0.8)
            .length / 7,
        crescimento: vendasData
          ? vendasData.vendas_hoje / vendasData.vendas_semana
          : 0,
      },
    };
  } catch (error) {
    console.error('❌ Erro na análise completa:', error);
    throw error;
  }
}
