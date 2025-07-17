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
      return NextResponse.json({ error: 'Data espec·≠fica ·© obrigat·≥ria' }, { status: 400 });
    }

    console.log(`üîç Analisando tempos para ${dataEspecifica}, per·≠odo: ${periodoAnalise} dias, grupo: ${grupoFiltro}, bar: ${barId}`);

    // Calcular data de in·≠cio do per·≠odo de compara·ß·£o
    const dataFim = new Date(dataEspecifica);
    const dataInicio = new Date(dataFim);
    
    if (periodoAnalise === 'todos') {
      dataInicio.setFullYear(2025, 0, 1); // Desde 01/01/2025
    } else {
      dataInicio.setDate(dataFim.getDate() - parseInt(periodoAnalise));
    }

    console.log(`üìÖ Per·≠odo de an·°lise: ${dataInicio.toISOString().split('T')[0]} at·© ${dataFim.toISOString().split('T')[0]}`);

    // Query base para buscar dados de tempo - AGORA COM TODOS OS CAMPOS NECESS·ÅRIOS
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

    // Buscar dados do per·≠odo de compara·ß·£o usando campo 'dia' - COM PAGINA·á·ÉO
    const diaInicioInt = parseInt(dataInicio.toISOString().split('T')[0].replace(/-/g, ''));
    const diaFimInt = parseInt(dataFim.toISOString().split('T')[0].replace(/-/g, ''));
    
    console.log(`üìÖ Buscando per·≠odo de compara·ß·£o: ${diaInicioInt} at·© ${diaFimInt}`);
    
    // Buscar dados do per·≠odo com pagina·ß·£o
    let dadosPeriodo[] = [];
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
        console.error('ùå Erro ao buscar dados do per·≠odo:', errorPagina);
        return NextResponse.json({ error: 'Erro ao buscar dados do per·≠odo' }, { status: 500 });
      }

      if (!dadosPagina || dadosPagina.length === 0) break;
      
      dadosPeriodo = [...dadosPeriodo, ...dadosPagina];
      console.log(`üìÑ P·°gina ${pagina + 1}: ${dadosPagina.length} registros (Total: ${dadosPeriodo.length})`);
      
      if (dadosPagina.length < tamanhoPagina) break;
      pagina++;
    }

    console.log(`üìä Total de registros do per·≠odo: ${dadosPeriodo.length}`);

    // Buscar dados do dia espec·≠fico - USANDO CAMPO 'dia' (YYYYMMDD)
    console.log(`üîç Buscando dados para o dia: ${dataEspecifica}`);
    
    // Converter data para formato YYYYMMDD
    const diaEspecificoInt = parseInt(dataEspecifica.replace(/-/g, '')); // 2025-06-13 -> 20250613
    
    console.log(`üìÖ Convertendo data: ${dataEspecifica} Üí ${diaEspecificoInt}`);
    
    // Buscar dados do dia espec·≠fico usando campo 'dia' - COM PAGINA·á·ÉO
    let dadosDia[] = [];
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
        console.error('ùå Erro ao buscar dados do dia:', errorPagina);
        return NextResponse.json({ error: 'Erro ao buscar dados do dia' }, { status: 500 });
      }

      if (!dadosPagina || dadosPagina.length === 0) break;
      
      dadosDia = [...dadosDia, ...dadosPagina];
      console.log(`üìÑ Dia - P·°gina ${pagina + 1}: ${dadosPagina.length} registros (Total: ${dadosDia.length})`);
      
      if (dadosPagina.length < tamanhoPagina) break;
      pagina++;
    }

    console.log(`üìä Dados encontrados - Per·≠odo: ${dadosPeriodo?.length || 0}, Dia espec·≠fico: ${dadosDia?.length || 0}`);
    
    // Log de debug dos primeiros registros do dia
    if (dadosDia && dadosDia.length > 0) {
      console.log(`üìã Primeiros registros do dia:`, dadosDia.slice(0, 3).map((item) => ({
        produto: item.prd_desc,
        grupo: item.grp_desc,
        dia: item.dia,
        t0_lancamento: item.t0_lancamento,
        t1_t2: item.t1_t2,
        t0_t3: item.t0_t3
      })));
    }

    // Fun·ß·£o para determinar se ·© bebida ou comida e calcular tempo correto
    const calcularTempo = (item) => {
      const grupo = (item.grp_desc || '').toLowerCase();
      const localizacao = (item.loc_desc || '').toLowerCase();
      
      // Determinar tipo baseado no grupo e localiza·ß·£o
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
        // Para bebidas: t0-t3 (lan·ßamento at·© entrega)
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
        // Para comidas: t1-t2 (in·≠cio produ·ß·£o at·© fim produ·ß·£o)
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

    // Se n·£o h·° dados para o dia espec·≠fico, buscar dados dos ·∫ltimos 7 dias para mostrar algo ·∫til
    let dadosRecentes = dadosDia;
    let usandoDadosRecentes = false;
    
    if (!dadosDia || dadosDia.length === 0) {
      console.log(`ö†Ô∏è Nenhum dado encontrado para o dia ${dataEspecifica}. Buscando ·∫ltimos 7 dias...`);
      
      // Calcular range dos ·∫ltimos 7 dias em formato YYYYMMDD
      const dataFimObj = new Date(dataEspecifica);
      const dataInicioObj = new Date(dataFimObj);
      dataInicioObj.setDate(dataFimObj.getDate() - 7);
      
      const diaFimInt = parseInt(dataEspecifica.replace(/-/g, ''));
      const diaInicioInt = parseInt(dataInicioObj.toISOString().split('T')[0].replace(/-/g, ''));
      
      console.log(`üìÖ Buscando dados de ${diaInicioInt} at·© ${diaFimInt}`);
      
      // Buscar ·∫ltimos 7 dias com pagina·ß·£o
      let dadosUltimos7Dias[] = [];
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
        console.log(`üìÑ ·öltimos 7 dias - P·°gina ${paginaRecente + 1}: ${dadosPagina.length} registros (Total: ${dadosUltimos7Dias.length})`);
        
        if (dadosPagina.length < tamanhoPagina) break;
        paginaRecente++;
      }
      
      dadosRecentes = dadosUltimos7Dias;
      usandoDadosRecentes = true;
      console.log(`üìä Usando dados dos ·∫ltimos 7 dias como refer·™ncia: ${dadosRecentes.length} registros`);
    }

    // M·©tricas de qualidade dos dados
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

    // Fun·ß·£o para processar um conjunto de dados
    const processarDados = (dados[], isPeriodo: boolean) => {
      dados?.forEach((item) => {
        const key = `${item.prd_desc}_${item.grp_desc}`;
        const analise = calcularTempo(item);
        
        // Atualizar m·©tricas
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
        
        // S·≥ processar se o tempo ·© v·°lido
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

    // Processar dados do per·≠odo e do dia
    processarDados(dadosPeriodo, true);
    processarDados(dadosRecentes, false);

    console.log(`üìä M·©tricas de qualidade dos dados:`, metricas);

    // Calcular estat·≠sticas e detectar outliers
    const produtos = Array.from(produtosMap.values()).map((produto) => {
      // Tempo m·©dio do per·≠odo (excluindo o dia espec·≠fico para compara·ß·£o justa)
      let temposPeriodoSemDia = produto.tempos_periodo;
      
      // Se estamos usando dados do dia espec·≠fico, remover esses dados do per·≠odo para compara·ß·£o
      if (!usandoDadosRecentes && dadosDia && dadosDia.length > 0) {
        // Filtrar dados do per·≠odo que n·£o sejam do dia espec·≠fico
        const dadosPeriodoSemDia = dadosPeriodo?.filter((item) => {
          return item.dia !== diaEspecificoInt;
        }) || [];
        
        // Recalcular tempos do per·≠odo sem o dia espec·≠fico
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

      // Calcular varia·ß·£o percentual
      const variacaoPercentual = tempoMedioGeral > 0 
        ? ((tempoDiaEspecifico - tempoMedioGeral) / tempoMedioGeral) * 100 
        : 0;

      // Determinar status baseado na varia·ß·£o
      let status = 'normal';
      if (Math.abs(variacaoPercentual) > 50) {
        status = 'muito_alto';
      } else if (Math.abs(variacaoPercentual) > 25) {
        status = 'alto';
      } else if (variacaoPercentual < -15) {
        status = 'baixo';
      }

      // Calcular desvio padr·£o para detectar outliers
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

    // Filtrar APENAS produtos que t·™m dados NO DIA ESPEC·çFICO (n·£o mostrar "Sem dados")
    const produtosFiltrados = produtos.filter((p) => p.pedidos_dia > 0 && p.tempo_dia_especifico > 0);

    // Ordenar: 1∫ casos GRAVES (varia·ß·µes positivas altas), 2∫ casos BONS (varia·ß·µes negativas), 3∫ normais
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
      
      // 1∫ PRIORIDADE: Casos GRAVES (varia·ß·µes positivas muito altas)
      if (graveA && !graveB) return -1;
      if (graveB && !graveA) return 1;
      if (graveA && graveB) {
        // Ambos graves - ordenar pelo MAIS grave (maior varia·ß·£o positiva)
        return variacaoB - variacaoA; // +200% vem antes de +100%
      }
      
      // 2∫ PRIORIDADE: Problemas moderados (25-50%)
      if (problemaA && !problemaB && !bomB) return -1;
      if (problemaB && !problemaA && !bomA) return 1;
      if (problemaA && problemaB) {
        // Ambos problemas moderados - ordenar pelo maior problema
        return variacaoB - variacaoA;
      }
      
      // 3∫ PRIORIDADE: Casos BONS (varia·ß·µes negativas - melhorias)
      if (bomA && !bomB && !graveB && !problemaB) return -1;
      if (bomB && !bomA && !graveA && !problemaA) return 1;
      if (bomA && bomB) {
        // Ambos bons - ordenar pela MAIOR melhoria (mais negativo)
        return variacaoA - variacaoB; // -70% vem antes de -30%
      }
      
      // 4∫ PRIORIDADE: Casos normais (-15% a +25%)
      // Ordenar por melhor tempo (menor tempo = melhor performance)
      if (a.tempo_dia_especifico !== b.tempo_dia_especifico) {
        return a.tempo_dia_especifico - b.tempo_dia_especifico;
      }
      
      // Se tempos iguais, ordenar por mais pedidos
      return b.pedidos_dia - a.pedidos_dia;
    });

    // Log da ordena·ß·£o para debug
    const categorias = {
      graves: produtosFiltrados.filter((p) => p.variacao_percentual > 50).length,
      problemas: produtosFiltrados.filter((p) => p.variacao_percentual > 25 && p.variacao_percentual <= 50).length,
      bons: produtosFiltrados.filter((p) => p.variacao_percentual < -15).length,
      normais: produtosFiltrados.filter((p) => p.variacao_percentual >= -15 && p.variacao_percentual <= 25).length
    };
    
    console.log(`üìä Ordena·ß·£o aplicada:`, categorias);
    console.log(`üî¥ Primeiros 3 produtos:`, produtosFiltrados.slice(0, 3).map((p) => ({
      produto: p.produto,
      variacao: p.variacao_percentual,
      categoria: p.variacao_percentual > 50 ? 'GRAVE' : 
                p.variacao_percentual > 25 ? 'PROBLEMA' : 
                p.variacao_percentual < -15 ? 'BOM' : 'NORMAL'
    })));
    
    console.log(`úÖ Processamento conclu·≠do: ${produtosFiltrados.length} produtos analisados`);

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
    console.error('ùå Erro na API de tempos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 
