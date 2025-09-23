import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface HorarioSemanalData {
  hora: number;
  hora_formatada: string;
  faturamento_atual: number;
  faturamento_semana1: number;
  faturamento_semana2: number;
  faturamento_semana3: number;
  media_4_semanas: number;
  data_atual?: string;
  data_semana1?: string;
  data_semana2?: string;
  data_semana3?: string;
  // Novos campos para suportar múltiplas datas
  todas_datas?: { [data: string]: number }; // { "2025-09-12": 1234.56, "2025-08-29": 2345.67, ... }
  datas_ordenadas?: string[]; // ["2025-09-12", "2025-08-29", "2025-08-22", ...]
  [key: string]: any; // Para campos dinâmicos como data_YYYY_MM_DD
}

interface ResumoPorData {
  data: string;
  data_formatada: string;
  dia_semana: string;
  total_faturamento: number;
  horario_pico: number;
  horario_pico_valor: number;
  produto_mais_vendido: string;
  produto_mais_vendido_qtd: number;
  produto_mais_vendido_valor: number;
  total_produtos_vendidos: number;
  produtos_unicos: number;
}

interface EstatisticasSemana {
  total_faturamento_atual: number;
  total_faturamento_semana1: number;
  total_faturamento_semana2: number;
  total_faturamento_semana3: number;
  media_total_4_semanas: number;
  horario_pico_atual: number;
  horario_pico_media: number;
  crescimento_vs_semana_anterior: number;
  crescimento_vs_media: number;
  data_atual: string;
  data_semana1: string;
  data_semana2: string;
  data_semana3: string;
}

const NOMES_DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');
    const diaSemana = searchParams.get('diaSemana'); // 0=Domingo, 1=Segunda, ..., 6=Sábado
    const meses = searchParams.get('meses'); // formato: 2025-09,2025-08
    const modo = searchParams.get('modo') || 'individual'; // individual ou mes_x_mes

    if (!barId) {
      return NextResponse.json({
        success: false,
        error: 'barId é obrigatório'
      }, { status: 400 });
    }

    if (!diaSemana) {
      return NextResponse.json({
        success: false,
        error: 'diaSemana é obrigatório'
      }, { status: 400 });
    }

    if (!meses) {
      return NextResponse.json({
        success: false,
        error: 'meses é obrigatório'
      }, { status: 400 });
    }

    const barIdNum = parseInt(barId);
    const diaSemanaNum = parseInt(diaSemana);
    const mesesSelecionados = meses.split(',');
    
    console.log(`🔍 Buscando dados de horário para ${NOMES_DIAS[diaSemanaNum]} (dia ${diaSemanaNum}) nos meses:`, mesesSelecionados);
    console.log(`🎯 Modo de comparação: ${modo}`);
    
    // Para cada mês selecionado, encontrar todas as ocorrências do dia da semana
    const datasParaBuscar: string[] = [];
    
    for (const mesAno of mesesSelecionados) {
      const [ano, mes] = mesAno.split('-').map(Number);
      
      // Encontrar todas as ocorrências do dia da semana no mês
      const primeiroDiaMes = new Date(ano, mes - 1, 1); // mes-1 porque Date usa 0-indexed
      const ultimoDiaMes = new Date(ano, mes, 0);
      
      console.log(`📅 Processando ${mesAno}: ${primeiroDiaMes.toISOString().split('T')[0]} a ${ultimoDiaMes.toISOString().split('T')[0]}`);
      
      // Encontrar a primeira ocorrência do dia da semana no mês
      let dataAtual = new Date(primeiroDiaMes);
      const diasParaAvancar = (diaSemanaNum - dataAtual.getDay() + 7) % 7;
      dataAtual.setDate(dataAtual.getDate() + diasParaAvancar);
      
      console.log(`🔍 Primeira ${NOMES_DIAS[diaSemanaNum]} de ${mesAno}: ${dataAtual.toISOString().split('T')[0]} (dia da semana: ${dataAtual.getDay()})`);
      
      // Adicionar todas as ocorrências do dia da semana no mês
      while (dataAtual.getMonth() === mes - 1) {
        const dataFormatada = dataAtual.toISOString().split('T')[0];
        console.log(`➕ Adicionando ${NOMES_DIAS[diaSemanaNum]}: ${dataFormatada} (dia da semana: ${dataAtual.getDay()})`);
        datasParaBuscar.push(dataFormatada);
        dataAtual.setDate(dataAtual.getDate() + 7); // Próxima semana
      }
    }
    
    // Ordenar datas (mais recente primeiro)
    datasParaBuscar.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    console.log(`🔍 Datas encontradas para ${NOMES_DIAS[diaSemanaNum]}:`, datasParaBuscar);

    // Buscar dados de faturamento por hora para cada data
    const dadosPorSemana: { [data: string]: { [hora: number]: number } } = {};
    const datasComDados: string[] = [];

    // Processar TODAS as datas encontradas (sem limitação)
    let datasParaProcessar = datasParaBuscar;
    console.log(`🎯 Processando TODAS as ${datasParaProcessar.length} datas encontradas:`, datasParaProcessar);

    for (const data of datasParaProcessar) {
      console.log(`📊 Processando faturamento por hora para ${data}`);

      // 1. Buscar dados oficiais por hora (produtos) - igual ao resumo
      // Horários 17:00-23:00 do dia
      const { data: faturamentoDia, error: errorFaturamentoDia } = await supabase
        .from('contahub_fatporhora')
        .select('hora, valor, qtd')
        .eq('vd_dtgerencial', data)
        .eq('bar_id', barIdNum)
        .gte('hora', 17)
        .lte('hora', 23);

      // Horários 24h, 25h, 26h (que são 00h, 01h, 02h) do mesmo dia
      const { data: faturamentoMadrugada, error: errorFaturamentoMadrugada } = await supabase
        .from('contahub_fatporhora')
        .select('hora, valor, qtd')
        .eq('vd_dtgerencial', data)
        .eq('bar_id', barIdNum)
        .gte('hora', 24)
        .lte('hora', 26);

      // 2. Buscar dados de bilheteria (couvert + pagamentos + repique) - igual ao horário de pico
      const { data: dadosPeriodo, error: errorPeriodo } = await supabase
        .from('contahub_periodo')
        .select('pessoas, vr_couvert, vr_pagamentos, vr_repique')
        .eq('dt_gerencial', data)
        .eq('bar_id', barIdNum);

      if (errorFaturamentoDia || errorFaturamentoMadrugada || errorPeriodo) {
        console.error(`❌ Erro ao buscar dados ContaHub para ${data}:`, errorFaturamentoDia || errorFaturamentoMadrugada || errorPeriodo);
        continue;
      }

      // Calcular totais de bilheteria (couvert + pagamentos + repique)
      const totalCouvert = dadosPeriodo?.reduce((sum, item) => sum + (parseFloat(item.vr_couvert) || 0), 0) || 0;
      const totalPagamentos = dadosPeriodo?.reduce((sum, item) => sum + (parseFloat(item.vr_pagamentos) || 0), 0) || 0;
      const totalRepique = dadosPeriodo?.reduce((sum, item) => sum + (parseFloat(item.vr_repique) || 0), 0) || 0;
      const faturamentoBilheteria = totalCouvert + totalPagamentos + totalRepique;

      // Combinar os dados e normalizar horários 24h+ para 0-2h
      const faturamentoPorHora: { [hora: number]: number } = {};
      
      // Processar horários normais (17-23h)
      (faturamentoDia || []).forEach(item => {
        const hora = item.hora;
        const valor = parseFloat(item.valor) || 0;
        faturamentoPorHora[hora] = valor;
      });

      // Processar madrugada (24h->0h, 25h->1h, 26h->2h)
      (faturamentoMadrugada || []).forEach(item => {
        const hora = item.hora - 24; // Normalizar: 24->0, 25->1, 26->2
        const valor = parseFloat(item.valor) || 0;
        faturamentoPorHora[hora] = valor;
      });

      // Distribuir bilheteria proporcionalmente pelos horários
      const totalProdutos = Object.values(faturamentoPorHora).reduce((sum, val) => sum + val, 0);
      if (totalProdutos > 0 && faturamentoBilheteria > 0) {
        // Distribuir bilheteria proporcionalmente ao faturamento de produtos por hora
        Object.keys(faturamentoPorHora).forEach(horaStr => {
          const hora = parseInt(horaStr);
          const faturamentoProdutosHora = faturamentoPorHora[hora];
          const proporcao = faturamentoProdutosHora / totalProdutos;
          const bilheteriaHora = faturamentoBilheteria * proporcao;
          faturamentoPorHora[hora] = faturamentoProdutosHora + bilheteriaHora;
        });
      }

      // Verificar se há dados significativos
      const totalDia = Object.values(faturamentoPorHora).reduce((sum, val) => sum + val, 0);
      console.log(`💰 ${data}: Faturamento por hora:`, faturamentoPorHora);
      console.log(`💰 ${data}: Total do dia: R$ ${totalDia.toLocaleString('pt-BR')}`);
      
      if (totalDia > 0) {
        dadosPorSemana[data] = faturamentoPorHora;
        datasComDados.push(data);
        console.log(`✅ ${data}: R$ ${totalDia.toLocaleString('pt-BR')} em ${Object.keys(faturamentoPorHora).length} horas`);
      }
    }

    console.log(`🎯 RESULTADO FINAL - Datas com dados encontradas:`, datasComDados);
    console.log(`📅 Detalhes das datas:`, datasComDados.map(data => {
      const date = new Date(data + 'T12:00:00');
      return `${data} (${NOMES_DIAS[date.getDay()]})`;
    }));

    if (datasComDados.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Nenhum dado encontrado para o dia da semana selecionado'
      }, { status: 404 });
    }

    // Buscar dados de produtos para criar resumo por data
    const resumoPorData: ResumoPorData[] = [];
    
    for (const data of datasComDados) {
      console.log(`📊 Buscando produtos para ${data}`);
      
      // Buscar produtos do dia
      const { data: produtosDia, error: errorProdutos } = await supabase
        .from('contahub_analitico')
        .select('prd_desc, grp_desc, qtd, valorfinal')
        .eq('trn_dtgerencial', data)
        .eq('bar_id', barIdNum)
        .order('valorfinal', { ascending: false });

      if (errorProdutos) {
        console.error(`❌ Erro ao buscar produtos para ${data}:`, errorProdutos);
        continue;
      }

      // Processar dados dos produtos
      const produtosAgregados = new Map<string, { qtd: number, valor: number }>();
      let totalProdutosVendidos = 0;
      let totalValorProdutos = 0;

      (produtosDia || []).forEach(item => {
        const produto = item.prd_desc;
        const qtd = parseFloat(item.qtd) || 0;
        const valor = parseFloat(item.valorfinal) || 0;
        
        totalProdutosVendidos += qtd;
        totalValorProdutos += valor;

        if (produtosAgregados.has(produto)) {
          const existing = produtosAgregados.get(produto)!;
          existing.qtd += qtd;
          existing.valor += valor;
        } else {
          produtosAgregados.set(produto, { qtd, valor });
        }
      });

      // Encontrar produto mais vendido (por valor)
      let produtoMaisVendido = 'N/A';
      let produtoMaisVendidoQtd = 0;
      let produtoMaisVendidoValor = 0;

      for (const [produto, dados] of produtosAgregados.entries()) {
        if (dados.valor > produtoMaisVendidoValor) {
          produtoMaisVendido = produto;
          produtoMaisVendidoQtd = dados.qtd;
          produtoMaisVendidoValor = dados.valor;
        }
      }

      // Encontrar horário de pico
      const faturamentoDia = dadosPorSemana[data];
      let horarioPico = 21; // Default
      let horarioPicoValor = 0;

      for (const [hora, valor] of Object.entries(faturamentoDia)) {
        if (valor > horarioPicoValor) {
          horarioPico = parseInt(hora);
          horarioPicoValor = valor;
        }
      }

      // Criar resumo da data
      const dataObj = new Date(data + 'T12:00:00');
      const resumo: ResumoPorData = {
        data,
        data_formatada: dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        dia_semana: NOMES_DIAS[dataObj.getDay()],
        total_faturamento: Object.values(faturamentoDia).reduce((sum, val) => sum + val, 0),
        horario_pico: horarioPico,
        horario_pico_valor: horarioPicoValor,
        produto_mais_vendido: produtoMaisVendido,
        produto_mais_vendido_qtd: produtoMaisVendidoQtd,
        produto_mais_vendido_valor: produtoMaisVendidoValor,
        total_produtos_vendidos: totalProdutosVendidos,
        produtos_unicos: produtosAgregados.size
      };

      resumoPorData.push(resumo);
    }

    // Ordenar datas (mais recente primeiro)
    datasComDados.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    console.log(`📈 Processando dados para ${datasComDados.length} datas:`, datasComDados);

    // Criar estrutura de dados por hora (17h às 3h - igual ao resumo)
    const horariosParaAnalise = [17, 18, 19, 20, 21, 22, 23, 0, 1, 2, 3];
    const dadosHorarios: HorarioSemanalData[] = [];

    if (modo === 'mes_x_mes' && mesesSelecionados.length >= 2) {
      // Modo Mês x Mês: Agrupar dados por mês e calcular médias
      const dadosPorMes: { [mes: string]: { [hora: number]: number[] } } = {};
      
      // Agrupar dados por mês
      datasComDados.forEach(data => {
        const mesData = data.substring(0, 7); // 2025-09
        if (!dadosPorMes[mesData]) {
          dadosPorMes[mesData] = {};
        }
        
        horariosParaAnalise.forEach(hora => {
          if (!dadosPorMes[mesData][hora]) {
            dadosPorMes[mesData][hora] = [];
          }
          const valor = dadosPorSemana[data]?.[hora] || 0;
          if (valor > 0) {
            dadosPorMes[mesData][hora].push(valor);
          }
        });
      });

      console.log(`📊 Dados agrupados por mês:`, Object.keys(dadosPorMes));

      // Calcular médias por hora para cada mês (suporte para múltiplos meses)
      horariosParaAnalise.forEach(hora => {
        const mediasDosMeses: number[] = [];
        const datasLabels: (string | undefined)[] = [];
        
        // Calcular média para cada mês selecionado
        mesesSelecionados.forEach((mes, index) => {
          const valores_mes = dadosPorMes[mes]?.[hora] || [];
          const media_mes = valores_mes.length > 0 ? valores_mes.reduce((sum, val) => sum + val, 0) / valores_mes.length : 0;
          mediasDosMeses.push(media_mes);
          datasLabels.push(`Média ${mes}`);
        });

        // Preencher com zeros se necessário (máximo 4 campos)
        while (mediasDosMeses.length < 4) {
          mediasDosMeses.push(0);
          datasLabels.push(undefined);
        }

        const media_geral = mediasDosMeses.filter(m => m > 0).reduce((sum, val) => sum + val, 0) / mediasDosMeses.filter(m => m > 0).length || 0;

        dadosHorarios.push({
          hora,
          hora_formatada: `${hora.toString().padStart(2, '0')}:00`,
          faturamento_atual: mediasDosMeses[0] || 0,
          faturamento_semana1: mediasDosMeses[1] || 0,
          faturamento_semana2: mediasDosMeses[2] || 0,
          faturamento_semana3: mediasDosMeses[3] || 0,
          media_4_semanas: media_geral,
          // Labels para o tooltip no modo mês x mês
          data_atual: datasLabels[0],
          data_semana1: datasLabels[1],
          data_semana2: datasLabels[2],
          data_semana3: datasLabels[3]
        });
      });
    } else {
      // Modo Individual: Usar TODAS as datas encontradas
      console.log(`📊 Modo Individual - Usando ${datasComDados.length} datas encontradas:`, datasComDados);

      horariosParaAnalise.forEach(hora => {
        // Criar objeto com todas as datas e seus valores para esta hora
        const todasDatasHora: { [data: string]: number } = {};
        const valoresHora: number[] = [];
        
        datasComDados.forEach(data => {
          const valor = dadosPorSemana[data]?.[hora] || 0;
          todasDatasHora[data] = valor;
          if (valor > 0) {
            valoresHora.push(valor);
          }
        });

        // Calcular média de todas as datas válidas
        const media_geral = valoresHora.length > 0 ? valoresHora.reduce((sum, val) => sum + val, 0) / valoresHora.length : 0;

        // Manter compatibilidade com estrutura antiga (primeiras 4 datas)
        const datasParaUsar = datasComDados.slice(0, 4);
        while (datasParaUsar.length < 4) {
          datasParaUsar.push('');
        }

        const faturamento_atual = datasParaUsar[0] ? (dadosPorSemana[datasParaUsar[0]]?.[hora] || 0) : 0;
        const faturamento_semana1 = datasParaUsar[1] ? (dadosPorSemana[datasParaUsar[1]]?.[hora] || 0) : 0;
        const faturamento_semana2 = datasParaUsar[2] ? (dadosPorSemana[datasParaUsar[2]]?.[hora] || 0) : 0;
        const faturamento_semana3 = datasParaUsar[3] ? (dadosPorSemana[datasParaUsar[3]]?.[hora] || 0) : 0;

        // Criar campos dinâmicos para cada data (formato que o Recharts espera)
        const camposDinamicos: { [key: string]: number } = {};
        datasComDados.forEach(data => {
          const campoNome = `data_${data.replace(/-/g, '_')}`;
          camposDinamicos[campoNome] = dadosPorSemana[data]?.[hora] || 0;
        });

        dadosHorarios.push({
          hora,
          hora_formatada: `${hora.toString().padStart(2, '0')}:00`,
          faturamento_atual,
          faturamento_semana1,
          faturamento_semana2,
          faturamento_semana3,
          media_4_semanas: media_geral,
          // Incluir as datas para o tooltip (compatibilidade)
          data_atual: datasParaUsar[0] || undefined,
          data_semana1: datasParaUsar[1] || undefined,
          data_semana2: datasParaUsar[2] || undefined,
          data_semana3: datasParaUsar[3] || undefined,
          // Novos campos com todas as datas
          todas_datas: todasDatasHora,
          datas_ordenadas: datasComDados,
          // Campos dinâmicos para o Recharts
          ...camposDinamicos
        });
      });
    }

    // Calcular estatísticas corrigidas
    let total_faturamento_atual = 0;
    let total_faturamento_semana1 = 0;
    let total_faturamento_semana2 = 0;
    let total_faturamento_semana3 = 0;
    let media_total_4_semanas = 0;

    if (modo === 'mes_x_mes') {
      // Modo Mês x Mês: usar os totais calculados por hora
      total_faturamento_atual = dadosHorarios.reduce((sum, item) => sum + item.faturamento_atual, 0);
      total_faturamento_semana1 = dadosHorarios.reduce((sum, item) => sum + item.faturamento_semana1, 0);
      total_faturamento_semana2 = dadosHorarios.reduce((sum, item) => sum + item.faturamento_semana2, 0);
      total_faturamento_semana3 = dadosHorarios.reduce((sum, item) => sum + item.faturamento_semana3, 0);
      
      const totaisValidos = [total_faturamento_atual, total_faturamento_semana1, total_faturamento_semana2, total_faturamento_semana3].filter(t => t > 0);
      media_total_4_semanas = totaisValidos.length > 0 ? totaisValidos.reduce((sum, val) => sum + val, 0) / totaisValidos.length : 0;
    } else {
      // Modo Individual: usar apenas as últimas 4 datas com dados
      const ultimasQuatroDatas = datasComDados.slice(0, 4);
      const totaisPorData = ultimasQuatroDatas.map(data => {
        if (!data) return 0;
        return Object.values(dadosPorSemana[data] || {}).reduce((sum, val) => sum + val, 0);
      });

      total_faturamento_atual = totaisPorData[0] || 0;
      total_faturamento_semana1 = totaisPorData[1] || 0;
      total_faturamento_semana2 = totaisPorData[2] || 0;
      total_faturamento_semana3 = totaisPorData[3] || 0;

      // Média das últimas 4 semanas (apenas valores válidos)
      const totaisValidos = totaisPorData.filter(t => t > 0);
      media_total_4_semanas = totaisValidos.length > 0 ? totaisValidos.reduce((sum, val) => sum + val, 0) / totaisValidos.length : 0;
    }

    // Encontrar horários de pico corrigidos
    let horario_pico_atual = 17;
    let horario_pico_media = 20;

    if (modo === 'individual' && datasComDados.length > 0) {
      // Modo Individual: usar dados da data mais recente
      const dataRecente = datasComDados[0];
      const dadosDataRecente = dadosPorSemana[dataRecente] || {};
      
      let maior_faturamento_atual = 0;
      for (const [hora, valor] of Object.entries(dadosDataRecente)) {
        if (valor > maior_faturamento_atual) {
          maior_faturamento_atual = valor;
          horario_pico_atual = parseInt(hora);
        }
      }

      // Calcular média de horário de pico das últimas 4 semanas
      const ultimasQuatroDatas = datasComDados.slice(0, 4);
      const horariosPico: number[] = [];
      
      ultimasQuatroDatas.forEach(data => {
        if (!data) return;
        const dadosData = dadosPorSemana[data] || {};
        let horarioPicoData = 17;
        let maiorValorData = 0;
        
        for (const [hora, valor] of Object.entries(dadosData)) {
          if (valor > maiorValorData) {
            maiorValorData = valor;
            horarioPicoData = parseInt(hora);
          }
        }
        
        if (maiorValorData > 0) {
          horariosPico.push(horarioPicoData);
        }
      });

      horario_pico_media = horariosPico.length > 0 ? Math.round(horariosPico.reduce((sum, h) => sum + h, 0) / horariosPico.length) : 20;
    } else {
      // Modo Mês x Mês: usar dados agregados
      let maior_faturamento_atual = 0;
      dadosHorarios.forEach(item => {
        if (item.faturamento_atual > maior_faturamento_atual) {
          maior_faturamento_atual = item.faturamento_atual;
          horario_pico_atual = item.hora;
        }
      });

      // Média baseada nos dados agregados
      let soma_horarios_pico = 0;
      let count_horarios_pico = 0;
      dadosHorarios.forEach(item => {
        if (item.faturamento_atual > 0) {
          soma_horarios_pico += item.hora;
          count_horarios_pico++;
        }
      });
      horario_pico_media = count_horarios_pico > 0 ? Math.round(soma_horarios_pico / count_horarios_pico) : 20;
    }

    // Calcular crescimentos
    const crescimento_vs_semana_anterior = total_faturamento_semana1 > 0 
      ? ((total_faturamento_atual - total_faturamento_semana1) / total_faturamento_semana1) * 100 
      : 0;

    const crescimento_vs_media = media_total_4_semanas > 0 
      ? ((total_faturamento_atual - media_total_4_semanas) / media_total_4_semanas) * 100 
      : 0;

    const estatisticas: EstatisticasSemana = {
      total_faturamento_atual,
      total_faturamento_semana1,
      total_faturamento_semana2,
      total_faturamento_semana3,
      media_total_4_semanas,
      horario_pico_atual,
      horario_pico_media,
      crescimento_vs_semana_anterior,
      crescimento_vs_media,
      data_atual: datasComDados[0] || '',
      data_semana1: datasComDados[1] || '',
      data_semana2: datasComDados[2] || '',
      data_semana3: datasComDados[3] || ''
    };

    console.log(`📊 Estatísticas calculadas:`, {
      atual: `R$ ${total_faturamento_atual.toLocaleString('pt-BR')}`,
      media: `R$ ${media_total_4_semanas.toLocaleString('pt-BR')}`,
      crescimento_vs_anterior: `${crescimento_vs_semana_anterior.toFixed(1)}%`,
      horario_pico: `${horario_pico_atual}h`
    });

    // Criar dados para gráfico de valor total por dia da semana (modo Mês x Mês)
    const dadosValorTotal: any[] = [];
    
    console.log(`🎯 Criando dados valor total - Modo: ${modo}, Meses: ${mesesSelecionados.length}`);
    
    if (modo === 'mes_x_mes' && mesesSelecionados.length >= 2) {
      // Criar dados no formato do print: cada sexta-feira individual por mês
      const diasSemanaLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const nomesMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const coresPorMes = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#84CC16', '#F97316'];
      
      // Agrupar dados por mês para criar estrutura de barras múltiplas
      const dadosPorMes: { [mes: string]: any[] } = {};
      
      // Para cada data encontrada, agrupar por mês
      datasComDados.forEach(data => {
        const [ano, mes, dia] = data.split('-');
        const mesIndex = parseInt(mes) - 1;
        const nomeMes = nomesMeses[mesIndex];
        const mesCompleto = `${ano}-${mes}`;
        const dataObj = new Date(data + 'T12:00:00');
        const diaSemanaLabel = diasSemanaLabels[dataObj.getDay()];
        
        // Calcular total da data
        const totalData = Object.values(dadosPorSemana[data] || {}).reduce((sum, valor) => sum + valor, 0);
        
        if (!dadosPorMes[mesCompleto]) {
          dadosPorMes[mesCompleto] = [];
        }
        
        dadosPorMes[mesCompleto].push({
          mes: nomeMes,
          mes_completo: mesCompleto,
          dia_semana: diaSemanaLabel,
          data_completa: data,
          data_formatada: `${dia}/${mes}`,
          valor_total: totalData,
          cor_index: mesesSelecionados.indexOf(mesCompleto),
          cor: coresPorMes[mesesSelecionados.indexOf(mesCompleto)] || '#3B82F6'
        });
      });
      
      // Criar estrutura final para o gráfico (uma entrada por data)
      Object.values(dadosPorMes).forEach(datasMes => {
        datasMes.forEach(item => {
          dadosValorTotal.push(item);
        });
      });
      
      // Ordenar por data (mais antiga primeiro para o gráfico)
      dadosValorTotal.sort((a, b) => new Date(a.data_completa).getTime() - new Date(b.data_completa).getTime());
      
      console.log(`📊 Dados valor total criados (${dadosValorTotal.length} pontos):`, dadosValorTotal);
      console.log(`📊 Meses encontrados:`, Object.keys(dadosPorMes));
    }

    return NextResponse.json({
      success: true,
      data: {
        horarios: dadosHorarios,
        estatisticas,
        resumo_por_data: resumoPorData,
        valor_total_por_mes: dadosValorTotal, // Novo campo para o gráfico
        dia_semana: NOMES_DIAS[diaSemanaNum],
        periodo: `${datasComDados[3] || 'N/A'} - ${datasComDados[0] || 'N/A'}`,
        ultimaAtualizacao: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Erro ao calcular dados semanais por horário:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
