import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const dataEspecifica = searchParams.get('data_especifica');
    const periodoAnalise = searchParams.get('periodo_analise') || '30';
    const grupoFiltro = searchParams.get('grupo_filtro') || 'todos';
    const barId = parseInt(searchParams.get('bar_id') || '1');

    if (!dataEspecifica) {
      return NextResponse.json({ error: 'Data especÃ¡Â­fica Ã¡Â© obrigatÃ¡Â³ria' }, { status: 400 });
    }

    console.log(`Ã°Å¸â€Â Analisando tempos para ${dataEspecifica}, perÃ¡Â­odo: ${periodoAnalise} dias, grupo: ${grupoFiltro}, bar: ${barId}`);

    // Calcular data de inÃ¡Â­cio do perÃ¡Â­odo de comparaÃ¡Â§Ã¡Â£o
    const dataFim = new Date(dataEspecifica);
    const dataInicio = new Date(dataFim);
    
    if (periodoAnalise === 'todos') {
      dataInicio.setFullYear(2025, 0, 1); // Desde 01/01/2025
    } else {
      dataInicio.setDate(dataFim.getDate() - parseInt(periodoAnalise));
    }

    console.log(`Ã°Å¸â€œâ€¦ PerÃ¡Â­odo de anÃ¡Â¡lise: ${dataInicio.toISOString().split('T')[0]} atÃ¡Â© ${dataFim.toISOString().split('T')[0]}`);

    // Query base para buscar dados de tempo - AGORA COM TODOS OS CAMPOS NECESSÃ¡ÂRIOS
    let queryBase = supabase
      .from('tempo')
      .select(`
        prd_desc,
        grp_desc,
        loc_desc,
        t0_lancamento,
        t1_prodini,
        t2_prodfim,
        t3_entrega,
        t0_t1,
        t0_t2,
        t0_t3,
        t1_t2,
        t1_t3,
        t2_t3,
        itm_qtd
      `)
      .eq('bar_id', barId)
      .not('prd_desc', 'is', null);

    // Aplicar filtro de grupo se especificado
    if (grupoFiltro !== 'todos') {
      queryBase = queryBase.eq('grp_desc', grupoFiltro);
    }

    // Buscar dados do perÃ¡Â­odo de comparaÃ¡Â§Ã¡Â£o usando campo 'dia' - COM PAGINAÃ¡â€¡Ã¡Æ’O
    const diaInicioInt = parseInt(dataInicio.toISOString().split('T')[0].replace(/-/g, ''));
    const diaFimInt = parseInt(dataFim.toISOString().split('T')[0].replace(/-/g, ''));
    
    console.log(`Ã°Å¸â€œâ€¦ Buscando perÃ¡Â­odo de comparaÃ¡Â§Ã¡Â£o: ${diaInicioInt} atÃ¡Â© ${diaFimInt}`);
    
    // Buscar dados do perÃ¡Â­odo com paginaÃ¡Â§Ã¡Â£o
    let dadosPeriodo: any[] = [];
    let pagina = 0;
    const tamanhoPagina = 1000;
    
    while (true) {
      const inicio = pagina * tamanhoPagina;
      const fim = inicio + tamanhoPagina - 1;
      
      const { data: dadosPagina, error: errorPagina } = await supabase
        .from('tempo')
        .select(`
          prd_desc,
          grp_desc,
          loc_desc,
          t0_lancamento,
          t1_prodini,
          t2_prodfim,
          t3_entrega,
          t0_t1,
          t0_t2,
          t0_t3,
          t1_t2,
          t1_t3,
          t2_t3,
          itm_qtd,
          dia
        `)
        .eq('bar_id', barId)
        .gte('dia', diaInicioInt)
        .lte('dia', diaFimInt)
        .not('prd_desc', 'is', null)
        .range(inicio, fim);

      if (errorPagina) {
        console.error('ÂÅ’ Erro ao buscar dados do perÃ¡Â­odo:', errorPagina);
        return NextResponse.json({ error: 'Erro ao buscar dados do perÃ¡Â­odo' }, { status: 500 });
      }

      if (!dadosPagina || dadosPagina.length === 0) break;
      
      dadosPeriodo = [...dadosPeriodo, ...dadosPagina];
      console.log(`Ã°Å¸â€œâ€ž PÃ¡Â¡gina ${pagina + 1}: ${dadosPagina.length} registros (Total: ${dadosPeriodo.length})`);
      
      if (dadosPagina.length < tamanhoPagina) break;
      pagina++;
    }

    console.log(`Ã°Å¸â€œÅ  Total de registros do perÃ¡Â­odo: ${dadosPeriodo.length}`);

    // Buscar dados do dia especÃ¡Â­fico - USANDO CAMPO 'dia' (YYYYMMDD)
    console.log(`Ã°Å¸â€Â Buscando dados para o dia: ${dataEspecifica}`);
    
    // Converter data para formato YYYYMMDD
    const diaEspecificoInt = parseInt(dataEspecifica.replace(/-/g, '')); // 2025-06-13 -> 20250613
    
    console.log(`Ã°Å¸â€œâ€¦ Convertendo data: ${dataEspecifica} â€ â€™ ${diaEspecificoInt}`);
    
    // Buscar dados do dia especÃ¡Â­fico usando campo 'dia' - COM PAGINAÃ¡â€¡Ã¡Æ’O
    let dadosDia: any[] = [];
    pagina = 0;
    
    while (true) {
      const inicio = pagina * tamanhoPagina;
      const fim = inicio + tamanhoPagina - 1;
      
      const { data: dadosPagina, error: errorPagina } = await supabase
        .from('tempo')
        .select(`
          prd_desc,
          grp_desc,
          loc_desc,
          t0_lancamento,
          t1_prodini,
          t2_prodfim,
          t3_entrega,
          t0_t1,
          t0_t2,
          t0_t3,
          t1_t2,
          t1_t3,
          t2_t3,
          itm_qtd,
          dia
        `)
        .eq('bar_id', barId)
        .eq('dia', diaEspecificoInt)
        .not('prd_desc', 'is', null)
        .range(inicio, fim);

      if (errorPagina) {
        console.error('ÂÅ’ Erro ao buscar dados do dia:', errorPagina);
        return NextResponse.json({ error: 'Erro ao buscar dados do dia' }, { status: 500 });
      }

      if (!dadosPagina || dadosPagina.length === 0) break;
      
      dadosDia = [...dadosDia, ...dadosPagina];
      console.log(`Ã°Å¸â€œâ€ž Dia - PÃ¡Â¡gina ${pagina + 1}: ${dadosPagina.length} registros (Total: ${dadosDia.length})`);
      
      if (dadosPagina.length < tamanhoPagina) break;
      pagina++;
    }

    console.log(`Ã°Å¸â€œÅ  Dados encontrados - PerÃ¡Â­odo: ${dadosPeriodo?.length || 0}, Dia especÃ¡Â­fico: ${dadosDia?.length || 0}`);
    
    // Log de debug dos primeiros registros do dia
    if (dadosDia && dadosDia.length > 0) {
      console.log(`Ã°Å¸â€œâ€¹ Primeiros registros do dia:`, dadosDia.slice(0, 3).map((item) => ({
        produto: item.prd_desc,
        grupo: item.grp_desc,
        dia: item.dia,
        t0_lancamento: item.t0_lancamento,
        t1_t2: item.t1_t2,
        t0_t3: item.t0_t3
      })));
    }

    // FunÃ¡Â§Ã¡Â£o para determinar se Ã¡Â© bebida ou comida e calcular tempo correto
    const calcularTempo = (item: any) => {
      const grupo = (item.grp_desc || '').toLowerCase();
      const localizacao = (item.loc_desc || '').toLowerCase();
      
      // Determinar tipo baseado no grupo e localizaÃ¡Â§Ã¡Â£o
      const isBebida = grupo.includes('cerveja') || 
                      grupo.includes('drink') || 
                      grupo.includes('dose') || 
                      grupo.includes('bebida') || 
                      grupo.includes('balde') ||
                      grupo.includes('combo') ||
                      localizacao.includes('bar') ||
                      grupo === '';
      
      const isComida = grupo.includes('prato') || 
                       grupo.includes('comida') || 
                       grupo.includes('lanche') ||
                       grupo.includes('petisco') ||
                       grupo.includes('entrada') ||
                       localizacao.includes('cozinha');
      
      let tempo = 0;
      let tempoValido = false;
      let tipo = 'indefinido';
      let tempoUsado = '';
      let dadosCompletos = false;
      let motivoIncompleto = '';
      
      if (isBebida) {
        tipo = 'bebida';
        // Para bebidas: t0-t3 (lanÃ¡Â§amento atÃ¡Â© entrega)
        if (item.t0_t3 && item.t0_t3 > 0) {
          tempo = item.t0_t3;
          tempoValido = tempo >= 30 && tempo <= 1200; // 0.5 a 20 minutos
          tempoUsado = 't0-t3';
          dadosCompletos = !!(item.t0_lancamento && item.t3_entrega);
          if (!dadosCompletos) {
            motivoIncompleto = !item.t0_lancamento ? 'sem_t0' : 'sem_t3';
          }
        } else {
          motivoIncompleto = 'sem_calculo_t0_t3';
        }
      } else if (isComida) {
        tipo = 'comida';
        // Para comidas: t1-t2 (inÃ¡Â­cio produÃ¡Â§Ã¡Â£o atÃ¡Â© fim produÃ¡Â§Ã¡Â£o)
        if (item.t1_t2 && item.t1_t2 > 0) {
          tempo = item.t1_t2;
          tempoValido = tempo >= 60 && tempo <= 2700; // 1 a 45 minutos
          tempoUsado = 't1-t2';
          dadosCompletos = !!(item.t1_prodini && item.t2_prodfim);
          if (!dadosCompletos) {
            motivoIncompleto = !item.t1_prodini ? 'sem_t1' : 'sem_t2';
          }
        } else {
          motivoIncompleto = 'sem_calculo_t1_t2';
        }
      } else {
        // Produto indefinido - tentar t1_t2 como fallback
        tipo = 'indefinido';
        if (item.t1_t2 && item.t1_t2 > 0) {
          tempo = item.t1_t2;
          tempoValido = tempo >= 30 && tempo <= 3600; // 0.5 a 60 minutos
          tempoUsado = 't1-t2 (fallback)';
          dadosCompletos = !!(item.t1_prodini && item.t2_prodfim);
          if (!dadosCompletos) {
            motivoIncompleto = !item.t1_prodini ? 'sem_t1' : 'sem_t2';
          }
        } else {
          motivoIncompleto = 'sem_dados_tempo';
        }
      }
      
      return {
        tempo,
        tempoValido,
        tipo,
        tempoUsado,
        dadosCompletos,
        motivoIncompleto
      };
    };

    // Se nÃ¡Â£o hÃ¡Â¡ dados para o dia especÃ¡Â­fico, buscar dados dos Ã¡Âºltimos 7 dias para mostrar algo Ã¡Âºtil
    let dadosRecentes = dadosDia;
    let usandoDadosRecentes = false;
    
    if (!dadosDia || dadosDia.length === 0) {
      console.log(`Å¡Â Ã¯Â¸Â Nenhum dado encontrado para o dia ${dataEspecifica}. Buscando Ã¡Âºltimos 7 dias...`);
      
      // Calcular range dos Ã¡Âºltimos 7 dias em formato YYYYMMDD
      const dataFimObj = new Date(dataEspecifica);
      const dataInicioObj = new Date(dataFimObj);
      dataInicioObj.setDate(dataFimObj.getDate() - 7);
      
      const diaFimInt = parseInt(dataEspecifica.replace(/-/g, ''));
      const diaInicioInt = parseInt(dataInicioObj.toISOString().split('T')[0].replace(/-/g, ''));
      
      console.log(`Ã°Å¸â€œâ€¦ Buscando dados de ${diaInicioInt} atÃ¡Â© ${diaFimInt}`);
      
      // Buscar Ã¡Âºltimos 7 dias com paginaÃ¡Â§Ã¡Â£o
      let dadosUltimos7Dias: any[] = [];
      let paginaRecente = 0;
      
      while (true) {
        const inicio = paginaRecente * tamanhoPagina;
        const fim = inicio + tamanhoPagina - 1;
        
        const { data: dadosPagina } = await supabase
          .from('tempo')
          .select(`
            prd_desc,
            grp_desc,
            loc_desc,
            t0_lancamento,
            t1_prodini,
            t2_prodfim,
            t3_entrega,
            t0_t1,
            t0_t2,
            t0_t3,
            t1_t2,
            t1_t3,
            t2_t3,
            itm_qtd,
            dia
          `)
          .eq('bar_id', barId)
          .gte('dia', diaInicioInt)
          .lte('dia', diaFimInt)
          .not('prd_desc', 'is', null)
          .range(inicio, fim);
        
        if (!dadosPagina || dadosPagina.length === 0) break;
        
        dadosUltimos7Dias = [...dadosUltimos7Dias, ...dadosPagina];
        console.log(`Ã°Å¸â€œâ€ž Ã¡Å¡ltimos 7 dias - PÃ¡Â¡gina ${paginaRecente + 1}: ${dadosPagina.length} registros (Total: ${dadosUltimos7Dias.length})`);
        
        if (dadosPagina.length < tamanhoPagina) break;
        paginaRecente++;
      }
      
      dadosRecentes = dadosUltimos7Dias;
      usandoDadosRecentes = true;
      console.log(`Ã°Å¸â€œÅ  Usando dados dos Ã¡Âºltimos 7 dias como referÃ¡Âªncia: ${dadosRecentes.length} registros`);
    }

    // MÃ¡Â©tricas de qualidade dos dados
    const metricas = {
      bebidas: {
        total: 0,
        completas: 0,
        sem_t0: 0,
        sem_t3: 0,
        sem_calculo: 0,
        outliers: 0
      },
      comidas: {
        total: 0,
        completas: 0,
        sem_t1: 0,
        sem_t2: 0,
        sem_calculo: 0,
        outliers: 0
      },
      indefinidos: {
        total: 0,
        com_dados: 0,
        sem_dados: 0
      }
    };

    // Processar dados por produto
    const produtosMap = new Map();

    // FunÃ¡Â§Ã¡Â£o para processar um conjunto de dados
    const processarDados = (dados: any[], isPeriodo: boolean) => {
      dados?.forEach((item) => {
        const key = `${item.prd_desc}_${item.grp_desc}`;
        const analise = calcularTempo(item);
        
        // Atualizar mÃ¡Â©tricas
        if (analise.tipo === 'bebida') {
          metricas.bebidas.total++;
          if (analise.dadosCompletos) metricas.bebidas.completas++;
          if (analise.motivoIncompleto === 'sem_t0') metricas.bebidas.sem_t0++;
          if (analise.motivoIncompleto === 'sem_t3') metricas.bebidas.sem_t3++;
          if (analise.motivoIncompleto === 'sem_calculo_t0_t3') metricas.bebidas.sem_calculo++;
          if (analise.tempo > 0 && !analise.tempoValido) metricas.bebidas.outliers++;
        } else if (analise.tipo === 'comida') {
          metricas.comidas.total++;
          if (analise.dadosCompletos) metricas.comidas.completas++;
          if (analise.motivoIncompleto === 'sem_t1') metricas.comidas.sem_t1++;
          if (analise.motivoIncompleto === 'sem_t2') metricas.comidas.sem_t2++;
          if (analise.motivoIncompleto === 'sem_calculo_t1_t2') metricas.comidas.sem_calculo++;
          if (analise.tempo > 0 && !analise.tempoValido) metricas.comidas.outliers++;
        } else {
          metricas.indefinidos.total++;
          if (analise.tempo > 0) metricas.indefinidos.com_dados++;
          else metricas.indefinidos.sem_dados++;
        }
        
        // SÃ¡Â³ processar se o tempo Ã¡Â© vÃ¡Â¡lido
        if (!analise.tempoValido || analise.tempo <= 0) return;
        
        if (!produtosMap.has(key)) {
          produtosMap.set(key, {
            produto: item.prd_desc,
            grupo: item.grp_desc,
            tipo: analise.tipo,
            tempo_usado: analise.tempoUsado,
            tempos_periodo: [],
            tempos_dia: [],
            pedidos_periodo: 0,
            pedidos_dia: 0
          });
        }
        
        const produto = produtosMap.get(key);
        if (isPeriodo) {
          produto.tempos_periodo.push(analise.tempo);
          produto.pedidos_periodo += item.itm_qtd || 1;
        } else {
          produto.tempos_dia.push(analise.tempo);
          produto.pedidos_dia += item.itm_qtd || 1;
        }
      });
    };

    // Processar dados do perÃ¡Â­odo e do dia
    processarDados(dadosPeriodo, true);
    processarDados(dadosRecentes, false);

    console.log(`Ã°Å¸â€œÅ  MÃ¡Â©tricas de qualidade dos dados:`, metricas);

    // Calcular estatÃ¡Â­sticas e detectar outliers
    const produtos = Array.from(produtosMap.values()).map((produto) => {
      // Tempo mÃ¡Â©dio do perÃ¡Â­odo (excluindo o dia especÃ¡Â­fico para comparaÃ¡Â§Ã¡Â£o justa)
      let temposPeriodoSemDia = produto.tempos_periodo;
      
      // Se estamos usando dados do dia especÃ¡Â­fico, remover esses dados do perÃ¡Â­odo para comparaÃ¡Â§Ã¡Â£o
      if (!usandoDadosRecentes && dadosDia && dadosDia.length > 0) {
        // Filtrar dados do perÃ¡Â­odo que nÃ¡Â£o sejam do dia especÃ¡Â­fico
        const dadosPeriodoSemDia = dadosPeriodo?.filter((item) => {
          return item.dia !== diaEspecificoInt;
        }) || [];
        
        // Recalcular tempos do perÃ¡Â­odo sem o dia especÃ¡Â­fico
        const temposProdutoPeriodo: number[] = [];
        dadosPeriodoSemDia.forEach((item) => {
          if (`${item.prd_desc}_${item.grp_desc}` === `${produto.produto}_${produto.grupo}`) {
            const analise = calcularTempo(item);
            if (analise.tempoValido && analise.tempo > 0) {
              temposProdutoPeriodo.push(analise.tempo);
            }
          }
        });
        
        temposPeriodoSemDia = temposProdutoPeriodo;
      }

      const tempoMedioGeral = temposPeriodoSemDia.length > 0 
        ? temposPeriodoSemDia.reduce((a: number, b: number) => a + b, 0) / temposPeriodoSemDia.length 
        : 0;

      const tempoDiaEspecifico = produto.tempos_dia.length > 0 
        ? produto.tempos_dia.reduce((a: number, b: number) => a + b, 0) / produto.tempos_dia.length 
        : 0;

      // Calcular variaÃ¡Â§Ã¡Â£o percentual
      const variacaoPercentual = tempoMedioGeral > 0 
        ? ((tempoDiaEspecifico - tempoMedioGeral) / tempoMedioGeral) * 100 
        : 0;

      // Determinar status baseado na variaÃ¡Â§Ã¡Â£o
      let status = 'normal';
      if (Math.abs(variacaoPercentual) > 50) {
        status = 'muito_alto';
      } else if (Math.abs(variacaoPercentual) > 25) {
        status = 'alto';
      } else if (variacaoPercentual < -15) {
        status = 'baixo';
      }

      // Calcular desvio padrÃ¡Â£o para detectar outliers
      const temposValidos = temposPeriodoSemDia.filter((t: number) => t > 0);
      let desvio = 0;
      if (temposValidos.length > 1) {
        const media = temposValidos.reduce((a: number, b: number) => a + b, 0) / temposValidos.length;
        const variancia = temposValidos.reduce((acc: number, tempo: number) => acc + Math.pow(tempo - media, 2), 0) / temposValidos.length;
        desvio = Math.sqrt(variancia);
      }

      return {
        produto: produto.produto,
        grupo: produto.grupo,
        tipo: produto.tipo,
        tempo_usado: produto.tempo_usado,
        tempo_medio_geral: Math.round(tempoMedioGeral),
        tempo_medio_30dias: Math.round(tempoMedioGeral), // Mantendo compatibilidade
        tempo_dia_especifico: Math.round(tempoDiaEspecifico),
        variacao_percentual: Math.round(variacaoPercentual * 10) / 10,
        total_pedidos: produto.pedidos_periodo,
        pedidos_30dias: produto.pedidos_periodo, // Mantendo compatibilidade
        pedidos_dia: produto.pedidos_dia,
        desvio_padrao: Math.round(desvio),
        status
      };
    });

    // Filtrar APENAS produtos que tÃ¡Âªm dados NO DIA ESPECÃ¡ÂFICO (nÃ¡Â£o mostrar "Sem dados")
    const produtosFiltrados = produtos.filter((p) => p.pedidos_dia > 0 && p.tempo_dia_especifico > 0);

    // Ordenar: 1Âº casos GRAVES (variaÃ¡Â§Ã¡Âµes positivas altas), 2Âº casos BONS (variaÃ¡Â§Ã¡Âµes negativas), 3Âº normais
    produtosFiltrados.sort((a, b) => {
      const variacaoA = a.variacao_percentual;
      const variacaoB = b.variacao_percentual;
      
      // Categorizar produtos
      const graveA = variacaoA > 50;   // Casos graves: >50% (ex: +200%)
      const graveB = variacaoB > 50;
      
      const problemaA = variacaoA > 25 && variacaoA <= 50;  // Problemas moderados: 25-50%
      const problemaB = variacaoB > 25 && variacaoB <= 50;
      
      const bomA = variacaoA < -15;    // Casos bons: <-15% (ex: -70%)
      const bomB = variacaoB < -15;
      
      // 1Âº PRIORIDADE: Casos GRAVES (variaÃ¡Â§Ã¡Âµes positivas muito altas)
      if (graveA && !graveB) return -1;
      if (graveB && !graveA) return 1;
      if (graveA && graveB) {
        // Ambos graves - ordenar pelo MAIS grave (maior variaÃ¡Â§Ã¡Â£o positiva)
        return variacaoB - variacaoA; // +200% vem antes de +100%
      }
      
      // 2Âº PRIORIDADE: Problemas moderados (25-50%)
      if (problemaA && !problemaB && !bomB) return -1;
      if (problemaB && !problemaA && !bomA) return 1;
      if (problemaA && problemaB) {
        // Ambos problemas moderados - ordenar pelo maior problema
        return variacaoB - variacaoA;
      }
      
      // 3Âº PRIORIDADE: Casos BONS (variaÃ¡Â§Ã¡Âµes negativas - melhorias)
      if (bomA && !bomB && !graveB && !problemaB) return -1;
      if (bomB && !bomA && !graveA && !problemaA) return 1;
      if (bomA && bomB) {
        // Ambos bons - ordenar pela MAIOR melhoria (mais negativo)
        return variacaoA - variacaoB; // -70% vem antes de -30%
      }
      
      // 4Âº PRIORIDADE: Casos normais (-15% a +25%)
      // Ordenar por melhor tempo (menor tempo = melhor performance)
      if (a.tempo_dia_especifico !== b.tempo_dia_especifico) {
        return a.tempo_dia_especifico - b.tempo_dia_especifico;
      }
      
      // Se tempos iguais, ordenar por mais pedidos
      return b.pedidos_dia - a.pedidos_dia;
    });

    // Log da ordenaÃ¡Â§Ã¡Â£o para debug
    const categorias = {
      graves: produtosFiltrados.filter((p) => p.variacao_percentual > 50).length,
      problemas: produtosFiltrados.filter((p) => p.variacao_percentual > 25 && p.variacao_percentual <= 50).length,
      bons: produtosFiltrados.filter((p) => p.variacao_percentual < -15).length,
      normais: produtosFiltrados.filter((p) => p.variacao_percentual >= -15 && p.variacao_percentual <= 25).length
    };
    
    console.log(`Ã°Å¸â€œÅ  OrdenaÃ¡Â§Ã¡Â£o aplicada:`, categorias);
    console.log(`Ã°Å¸â€Â´ Primeiros 3 produtos:`, produtosFiltrados.slice(0, 3).map((p) => ({
      produto: p.produto,
      variacao: p.variacao_percentual,
      categoria: p.variacao_percentual > 50 ? 'GRAVE' : 
                p.variacao_percentual > 25 ? 'PROBLEMA' : 
                p.variacao_percentual < -15 ? 'BOM' : 'NORMAL'
    })));
    
    console.log(`Å“â€¦ Processamento concluÃ¡Â­do: ${produtosFiltrados.length} produtos analisados`);

    return NextResponse.json({
      success: true,
      produtos: produtosFiltrados,
      metricas_qualidade: metricas,
      meta: {
        data_especifica: dataEspecifica,
        periodo_analise: periodoAnalise,
        grupo_filtro: grupoFiltro,
        total_produtos: produtosFiltrados.length,
        produtos_com_dados_dia: produtosFiltrados.filter((p) => p.pedidos_dia > 0).length,
        produtos_com_variacao_alta: produtosFiltrados.filter((p) => Math.abs(p.variacao_percentual) > 25).length,
        dados_periodo_total: dadosPeriodo?.length || 0,
        dados_dia_total: dadosRecentes?.length || 0,
        usando_dados_recentes: usandoDadosRecentes
      }
    });

  } catch (error) {
    console.error('ÂÅ’ Erro na API de tempos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 

