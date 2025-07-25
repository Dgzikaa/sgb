import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// FUNÇÃO COMPLETAMENTE NOVA PARA FORÇAR RECOMPILAÇÃO
async function getDashboardSemanalCorrigido(request: NextRequest) {
  const VERSAO_DOMINGO_CORRIGIDA = 'V5_FINAL_' + Date.now();
  console.log(
    `🔥🔥🔥 NOVA FUNÇÃO DOMINGO CORRIGIDA: ${VERSAO_DOMINGO_CORRIGIDA} 🔥🔥🔥`
  );

  try {
    const { searchParams } = new URL(request.url);
    const data_inicio = searchParams.get('data_inicio');
    const data_fim = searchParams.get('data_fim');
    const bar_id = searchParams.get('bar_id');

    if (!data_inicio || !data_fim || !bar_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Parâmetros obrigatórios: data_inicio, data_fim, bar_id',
        },
        { status: 400 }
      );
    }

    console.log('🔍 API Dashboard Semanal - Parâmetros recebidos:', {
      data_inicio,
      data_fim,
      bar_id,
      timestamp: new Date().toISOString(),
      versao: 'CORREÇÃO_DOMINGO_V2',
    });

    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      console.error('❌ Erro ao conectar com banco');
      return NextResponse.json(
        { success: false, error: 'Erro ao conectar com banco' },
        { status: 500 }
      );
    }

    // Gerar array de datas da semana
    const inicioSemana = new Date(data_inicio + 'T00:00:00');
    // const fimSemana = new Date(data_fim + 'T00:00:00')
    const diasSemana: Array<{
      data: string;
      dia: string;
      faturamento: number;
      clientes: number;
      ticketMedio: number;
    }> = [];
    const diasNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i <= 6; i++) {
      const dia = new Date(inicioSemana);
      dia.setDate(inicioSemana.getDate() + i);
      const dataStr = dia.toISOString().split('T')[0];
      diasSemana.push({
        data: dataStr,
        dia: diasNomes[dia.getDay()],
        faturamento: 0,
        clientes: 0,
        ticketMedio: 0,
      });
    }

    console.log(
      '📅 Dias da semana gerados:',
      diasSemana.map(d => `${d.dia} (${d.data})`).join(', ')
    );

    try {
      // FUNÇÃO PARA BUSCAR TODOS OS DADOS COM PAGINAÇÃO
      const buscarTodosPagamentos = async () => {
        let todosPagamentos: unknown[] = [];
        let offset = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('pagamentos')
            .select('dt_gerencial, liquido, meio, pag, origem, vr_couvert')
            .eq('bar_id', parseInt(bar_id))
            .gte('dt_gerencial', data_inicio)
            .lte('dt_gerencial', data_fim)
            .not('liquido', 'is', null)
            .neq('pag', 'Conta Assinada')
            .range(offset, offset + limit - 1);

          if (error) {
            console.error(`❌ Erro na paginação offset ${offset}:`, error);
            break;
          }

          if (data && data.length > 0) {
            todosPagamentos = [...todosPagamentos, ...data];
            console.log(
              `📄 Página ${Math.floor(offset / limit) + 1}: ${data.length} registros (total: ${todosPagamentos.length})`
            );

            if (data.length < limit) {
              hasMore = false;
            } else {
              offset += limit;
            }
          } else {
            hasMore = false;
          }
        }

        console.log(
          `💰 TOTAL PAGAMENTOS ENCONTRADOS: ${todosPagamentos.length}`
        );
        return todosPagamentos;
      };

      // Buscar dados de TODAS as fontes (paginação + paralelismo)
      const [pagamentos, symplaResult, periodoResult] = await Promise.all([
        // 1. Pagamentos ContaHub (COM PAGINAÇÃO)
        buscarTodosPagamentos(),

        // 2. Sympla bilheteria + SEM LIMITE
        supabase
          .from('sympla_bilheteria')
          .select('data_evento, total_liquido, qtd_checkins_realizados')
          .eq('bar_id', parseInt(bar_id))
          .gte('data_evento', data_inicio)
          .lte('data_evento', data_fim)
          .not('total_liquido', 'is', null)
          .then((result: unknown) => result.data || []),

        // 3. Período para clientes E faturamento adicional + SEM LIMITE
        supabase
          .from('periodo')
          .select('dt_gerencial, pessoas, vr_pagamentos, vr_couvert')
          .eq('bar_id', parseInt(bar_id))
          .gte('dt_gerencial', data_inicio)
          .lte('dt_gerencial', data_fim)
          .then((result: unknown) => result.data || []),
      ]);

      const sympla = symplaResult;
      const periodo = periodoResult;

      console.log('📊 Dados encontrados (PAGINAÇÃO):', {
        pagamentos: pagamentos.length,
        sympla: sympla.length,
        periodo: periodo.length,
      });

      // BUSCAR DADOS YUZER (igual ao dashboard diário) + COM PAGINAÇÃO
      const buscarTodosYuzerBar = async () => {
        let todosYuzerBar: unknown[] = [];
        let offset = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('yuzer_analitico')
            .select('data_pedido, valor_total, pedido_id, produto_nome')
            .eq('bar_id', parseInt(bar_id))
            .gte('data_pedido', data_inicio)
            .lte('data_pedido', data_fim)
            .not('produto_nome', 'ilike', '%ingresso%')
            .range(offset, offset + limit - 1);

          if (error) {
            console.error(
              `❌ Erro na paginação Yuzer Bar offset ${offset}:`,
              error
            );
            break;
          }

          if (data && data.length > 0) {
            todosYuzerBar = [...todosYuzerBar, ...data];
            if (data.length < limit) {
              hasMore = false;
            } else {
              offset += limit;
            }
          } else {
            hasMore = false;
          }
        }

        console.log(`🍺 TOTAL YUZER BAR ENCONTRADOS: ${todosYuzerBar.length}`);
        return todosYuzerBar;
      };

      const buscarTodosYuzerIngressos = async () => {
        let todosYuzerIngressos: unknown[] = [];
        let offset = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('yuzer_analitico')
            .select('data_pedido, valor_total, pedido_id, produto_nome')
            .eq('bar_id', parseInt(bar_id))
            .gte('data_pedido', data_inicio)
            .lte('data_pedido', data_fim)
            .ilike('produto_nome', '%ingresso%')
            .range(offset, offset + limit - 1);

          if (error) {
            console.error(
              `❌ Erro na paginação Yuzer Ingressos offset ${offset}:`,
              error
            );
            break;
          }

          if (data && data.length > 0) {
            todosYuzerIngressos = [...todosYuzerIngressos, ...data];
            if (data.length < limit) {
              hasMore = false;
            } else {
              offset += limit;
            }
          } else {
            hasMore = false;
          }
        }

        console.log(
          `🎫 TOTAL YUZER INGRESSOS ENCONTRADOS: ${todosYuzerIngressos.length}`
        );
        return todosYuzerIngressos;
      };

      const [yuzerBar, yuzerIngresso] = await Promise.all([
        buscarTodosYuzerBar(),
        buscarTodosYuzerIngressos(),
      ]);

      console.log('📊 Dados Yuzer detalhados (PAGINAÇÃO):', {
        yuzerBar: yuzerBar.length,
        yuzerIngresso: yuzerIngresso.length,
      });

      // Processar faturamento de TODAS as fontes (igual ao diário)
      // 1. ContaHub (pagamentos filtrados)
      const faturamento_contahub_real = pagamentos.reduce(
        (sum: number, item: unknown) => {
          return sum + (parseFloat(item.liquido) || 0);
        },
        0
      );

      // 2. Bilheteria Sympla
      const faturamento_bilheteria = sympla.reduce(
        (sum: number, item: unknown) => {
          return sum + (parseFloat(item.total_liquido) || 0);
        },
        0
      );

      // 3. Yuzer Bar (faturamento bar)
      const faturamento_yuzer_bar = yuzerBar.reduce(
        (sum: number, item: unknown) => {
          return sum + (parseFloat(item.valor_total) || 0);
        },
        0
      );

      // 4. Yuzer Ingressos (faturamento ingressos)
      const faturamento_yuzer_ingressos = yuzerIngresso.reduce(
        (sum: number, item: unknown) => {
          return sum + (parseFloat(item.valor_total) || 0);
        },
        0
      );

      // 5. Couvert real da tabela período
      const couvert_real_periodo = periodo.reduce(
        (sum: number, item: unknown) => {
          return sum + (parseFloat(item.vr_couvert) || 0);
        },
        0
      );

      console.log('💰 Faturamentos detalhados (igual ao diário):', {
        contahub_real: faturamento_contahub_real,
        bilheteria: faturamento_bilheteria,
        yuzer_bar: faturamento_yuzer_bar,
        yuzer_ingressos: faturamento_yuzer_ingressos,
        couvert_periodo: couvert_real_periodo,
      });

      // TOTAIS CONSOLIDADOS (igual ao diário)
      const faturamento_bar_sem_couvert =
        faturamento_contahub_real -
        couvert_real_periodo +
        faturamento_bilheteria;
      const bar_total = faturamento_bar_sem_couvert + faturamento_yuzer_bar;
      const couvert_total = couvert_real_periodo + faturamento_yuzer_ingressos;
      const faturamento_total = bar_total + couvert_total;

      console.log('💰 Faturamento CONSOLIDADO IGUAL AO DIÁRIO:', {
        bar_total: bar_total,
        couvert_total: couvert_total,
        faturamento_total: faturamento_total,
      });

      // **CORREÇÃO IGUAL AO DIÁRIO: Usar pessoas_diario_corrigido quando possível**
      console.log(
        '👥 Buscando clientes na tabela pessoas_diario_corrigido para cada dia da semana...'
      );

      let clientes_pessoas_diario_total = 0;
      const diasSemanaArray = [];
      for (
        let d = new Date(data_inicio + 'T00:00:00');
        d <= new Date(data_fim + 'T00:00:00');
        d.setDate(d.getDate() + 1)
      ) {
        diasSemanaArray.push(d.toISOString().split('T')[0]);
      }

      for (const dia of diasSemanaArray) {
        try {
          const { data: pessoasData } = await supabase
            .from('pessoas_diario_corrigido')
            .select('total_pessoas_bruto')
            .eq('dt_gerencial', dia)
            .maybeSingle();

          if (pessoasData) {
            clientes_pessoas_diario_total +=
              pessoasData.total_pessoas_bruto || 0;
            console.log(
              `👥 ${dia}: pessoas_diario_corrigido = ${pessoasData.total_pessoas_bruto || 0}`
            );
          } else {
            console.log(`⚠️ ${dia}: sem dados em pessoas_diario_corrigido`);
          }
        } catch (error) {
          console.log(
            `❌ Erro ao buscar ${dia} em pessoas_diario_corrigido:`,
            error
          );
        }
      }

      // Calcular clientes do ContaHub
      const periodo_com_pagamento = periodo.filter(
        (item: unknown) => parseFloat(item.vr_pagamentos || '0') > 0
      );
      const clientes_contahub_periodo = periodo_com_pagamento.length; // CONTAR registros, não somar pessoas

      // Clientes Yuzer (apenas ingressos)
      const pedidos_unicos_yuzer_ingresso = [
        ...new Set(yuzerIngresso.map((y: unknown) => y.pedido_id)),
      ];
      const clientes_yuzer = pedidos_unicos_yuzer_ingresso.length;

      // Buscar TODAS as visitas Sympla do período COM PAGINAÇÃO
      console.log(
        '🔍 Buscando TODAS as visitas_clientes Sympla do período COM PAGINAÇÃO...'
      );
      console.log('📋 RESUMO PERÍODO (antes de filtrar):', {
        total_registros: periodo.length,
        amostra_5_primeiros: periodo.slice(0, 5).map((p: unknown) => ({
          dt_gerencial: p.dt_gerencial,
          pessoas: p.pessoas,
          vr_pagamentos: p.vr_pagamentos,
          cli_cel: p.cli_cel?.slice(0, 4) + '***',
        })),
      });

      const buscarTodasVisitasSympa = async () => {
        let todasVisitas: unknown[] = [];
        let offset = 0;
        const limit = 1000;
        let hasMore = true;

        while (hasMore) {
          const { data, error } = await supabase
            .from('cliente_visitas')
            .select('data_visita, pessoas_na_mesa')
            .eq('bar_id', parseInt(bar_id))
            .gte('data_visita', data_inicio)
            .lte('data_visita', data_fim)
            .eq('tipo_visita', 'evento_sympla')
            .range(offset, offset + limit - 1);

          if (error) {
            console.error(
              `❌ Erro na paginação Visitas Sympla offset ${offset}:`,
              error
            );
            break;
          }

          if (data && data.length > 0) {
            todasVisitas = [...todasVisitas, ...data];
            if (data.length < limit) {
              hasMore = false;
            } else {
              offset += limit;
            }
          } else {
            hasMore = false;
          }
        }

        console.log(
          `👥 TOTAL VISITAS SYMPLA ENCONTRADAS: ${todasVisitas.length}`
        );
        return todasVisitas;
      };

      const todasVisitasSymplaData = await buscarTodasVisitasSympa();

      const clientes_visitas_sympla = todasVisitasSymplaData.reduce(
        (sum: number, item: unknown) => {
          return sum + (parseInt(item.pessoas_na_mesa) || 0);
        },
        0
      );

      // **LÓGICA FINAL IGUAL AO DIÁRIO: Usar pessoas_diario_corrigido como base**
      let clientes_contahub = clientes_contahub_periodo; // Valor padrão
      let clientesSource = 'periodo_com_pagamento';

      if (clientes_pessoas_diario_total > 0) {
        // **CORREÇÃO IGUAL AO DIÁRIO: usar pessoas_diario_corrigido COMO BASE e somar Yuzer + Sympla**
        clientes_contahub = clientes_pessoas_diario_total;
        clientesSource = 'pessoas_diario_corrigido + yuzer + sympla';
        console.log(
          `👥 Usando pessoas_diario_corrigido como base: ${clientes_pessoas_diario_total} + ${clientes_yuzer} (Yuzer) + ${clientes_visitas_sympla} (Sympla)`
        );
      } else {
        // Usar dados do período
        clientes_contahub = clientes_contahub_periodo;
        clientesSource = 'periodo_com_pagamento';
        console.log(
          `👥 Usando período com pagamento: ${clientes_contahub_periodo}`
        );
      }

      // **SOMA IGUAL AO DIÁRIO: base + yuzer + sympla**
      const clientes_total =
        clientes_contahub + clientes_yuzer + clientes_visitas_sympla;

      console.log('👥 Clientes detalhados (CORRIGIDO - IGUAL AO DIÁRIO):', {
        periodo_total_registros: periodo.length,
        periodo_com_pagamento_registros: periodo_com_pagamento.length,
        pessoas_diario_corrigido_total: clientes_pessoas_diario_total,
        contahub_pessoas: clientes_contahub,
        yuzer_ingressos_pedidos_unicos: clientes_yuzer,
        visitas_sympla_soma_pessoas: clientes_visitas_sympla,
        total: clientes_total,
        fonte_clientes: clientesSource,
      });

      // Distribuir nos dias da semana
      for (const dia of diasSemana) {
        // Distribuir faturamento por dia
        const pagamentos_dia = pagamentos.filter(
          (p: unknown) => p.dt_gerencial === dia.data
        );
        const sympla_dia = sympla.filter(
          (s: unknown) => s.data_evento === dia.data
        );
        const yuzer_bar_dia = yuzerBar.filter(
          (y: unknown) => y.data_pedido === dia.data
        );
        const yuzer_ingresso_dia = yuzerIngresso.filter(
          (y: unknown) => y.data_pedido === dia.data
        );
        const periodo_dia = periodo.filter(
          (p: unknown) => p.dt_gerencial === dia.data
        );
        const visitas_sympla_dia = todasVisitasSymplaData.filter(
          (v: unknown) => v.data_visita === dia.data
        );

        const faturamento_contahub_dia = pagamentos_dia.reduce(
          (sum: number, item: unknown) => sum + (parseFloat(item.liquido) || 0),
          0
        );
        const faturamento_bilheteria_dia = sympla_dia.reduce(
          (sum: number, item: unknown) =>
            sum + (parseFloat(item.total_liquido) || 0),
          0
        );
        const faturamento_yuzer_bar_dia = yuzer_bar_dia.reduce(
          (sum: number, item: unknown) =>
            sum + (parseFloat(item.valor_total) || 0),
          0
        );
        const faturamento_yuzer_ingressos_dia = yuzer_ingresso_dia.reduce(
          (sum: number, item: unknown) =>
            sum + (parseFloat(item.valor_total) || 0),
          0
        );
        const couvert_periodo_dia = periodo_dia.reduce(
          (sum: number, item: unknown) =>
            sum + (parseFloat(item.vr_couvert) || 0),
          0
        );

        const bar_total_dia =
          faturamento_contahub_dia -
          couvert_periodo_dia +
          faturamento_bilheteria_dia +
          faturamento_yuzer_bar_dia;
        const couvert_total_dia =
          couvert_periodo_dia + faturamento_yuzer_ingressos_dia;
        dia.faturamento = bar_total_dia + couvert_total_dia;

        // **Distribuir clientes por dia (EXATAMENTE IGUAL AO DIÁRIO)**
        let clientes_base_dia = 0;
        let clientes_pessoas_diario_dia = 0;
        let clientesSourceDia = 'periodo_com_pagamento';

        // **CORREÇÃO IGUAL AO DIÁRIO: Buscar pessoas_diario_corrigido primeiro**
        console.log(
          `🔥🔥🔥 DISTRIBUINDO CLIENTES INDIVIDUALMENTE - DIA: ${dia.data} (${dia.dia}) 🔥🔥🔥`
        );
        console.log(
          `👥 🔍 BUSCANDO PESSOAS_DIARIO_CORRIGIDO PARA ${dia.data} (${dia.dia})...`
        );
        try {
          const { data: pessoasDataDia } = await supabase
            .from('pessoas_diario_corrigido')
            .select('total_pessoas_bruto')
            .eq('dt_gerencial', dia.data)
            .maybeSingle();

          if (pessoasDataDia) {
            clientes_pessoas_diario_dia =
              pessoasDataDia.total_pessoas_bruto || 0;
            clientesSourceDia = 'pessoas_diario_corrigido';
            console.log(
              `👥 ${dia.data} - Pessoas diário corrigido: ${clientes_pessoas_diario_dia}`
            );
          } else {
            console.log(
              `⚠️ ${dia.data} - Nenhum dado encontrado na tabela pessoas_diario_corrigido`
            );
          }
        } catch (error) {
          console.log(
            `❌ ${dia.data} - Erro ao buscar clientes pessoas_diario_corrigido:`,
            error
          );
        }

        // **LÓGICA FINAL IGUAL AO DIÁRIO**
        const periodo_com_pagamento_dia = periodo_dia.filter(
          (item: unknown) => parseFloat(item.vr_pagamentos || '0') > 0
        );
        const clientes_contahub_dia = periodo_com_pagamento_dia.length; // Dados do período

        if (clientes_pessoas_diario_dia > 0) {
          // Se há dados consolidados, usar eles COMO BASE
          clientes_base_dia = clientes_pessoas_diario_dia;
          clientesSourceDia = 'pessoas_diario_corrigido + yuzer + sympla';
          console.log(
            `👥 ${dia.data} - Usando pessoas_diario_corrigido como base: ${clientes_pessoas_diario_dia}`
          );
        } else {
          // Usar dados do período com pagamento
          clientes_base_dia = clientes_contahub_dia;
          clientesSourceDia = 'periodo_com_pagamento';
          console.log(
            `👥 ${dia.data} - Usando período com pagamento: ${clientes_contahub_dia}`
          );
        }

        // Yuzer ingressos do dia
        const pedidos_unicos_yuzer_ingresso_dia = [
          ...new Set(yuzer_ingresso_dia.map((y: unknown) => y.pedido_id)),
        ];
        const clientes_yuzer_dia = pedidos_unicos_yuzer_ingresso_dia.length;

        // Visitas Sympla do dia (já filtradas)
        const clientes_visitas_sympla_dia = visitas_sympla_dia.reduce(
          (sum: number, item: unknown) => {
            return sum + (parseInt(item.pessoas_na_mesa) || 0);
          },
          0
        );

        // **SOMAR TODAS AS FONTES por dia (IGUAL AO DIÁRIO)**
        dia.clientes =
          clientes_base_dia + clientes_yuzer_dia + clientes_visitas_sympla_dia;

        // Log detalhado para debug
        console.log(
          `👥 ${dia.dia} (${dia.data}) - CLIENTES FINAL (${clientesSourceDia}): ${dia.clientes}`
        );
        console.log(
          `   💎 pessoas_diario_corrigido: ${clientes_pessoas_diario_dia}`
        );
        console.log(`   🏢 base_dia: ${clientes_base_dia}`);
        console.log(`   🎫 yuzer_dia: ${clientes_yuzer_dia}`);
        console.log(`   🎪 sympla_dia: ${clientes_visitas_sympla_dia}`);

        // Calcular ticket médio
        dia.ticketMedio = dia.clientes > 0 ? dia.faturamento / dia.clientes : 0;
      }

      // Log dos resultados por dia
      diasSemana.forEach(dia => {
        if (dia.faturamento > 0 || dia.clientes > 0) {
          console.log(
            `📅 ${dia.dia} (${dia.data}): R$ ${dia.faturamento.toFixed(2)}, ${dia.clientes} pessoas`
          );
        }
      });

      const totalFaturamento = diasSemana.reduce(
        (sum, dia) => sum + dia.faturamento,
        0
      );
      const totalClientes = diasSemana.reduce(
        (sum, dia) => sum + dia.clientes,
        0
      );

      console.log('✅ Totais da semana (CORRIGIDOS):', {
        faturamento: totalFaturamento,
        clientes: totalClientes,
        ticketMedio: totalClientes > 0 ? totalFaturamento / totalClientes : 0,
      });

      const response = NextResponse.json({
        success: true,
        dados: diasSemana,
        totais: {
          faturamento: totalFaturamento,
          clientes: totalClientes,
          ticketMedio: totalClientes > 0 ? totalFaturamento / totalClientes : 0,
        },
        meta: {
          periodo: `${data_inicio} a ${data_fim}`,
          bar_id: parseInt(bar_id),
          fonte_faturamento: 'pagamentos_filtrado_igual_diario',
          fonte_clientes: 'periodo_filtrado_igual_diario',
          versao_corrigida: 'DOMINGO_V5_FINAL_NOVA_FUNCAO',
          timestamp: new Date().toISOString(),
          force_recompile: VERSAO_DOMINGO_CORRIGIDA,
        },
        debug_clientes: {
          periodo_total_registros: periodo.length,
          periodo_com_pagamento_registros: periodo_com_pagamento.length,
          contahub_pessoas: clientes_contahub,
          yuzer_ingressos_pedidos_unicos: clientes_yuzer,
          visitas_sympla_soma_pessoas: clientes_visitas_sympla,
          total_calculado: clientes_total,
          amostra_periodo: periodo.slice(0, 3).map((p: unknown) => ({
            dt_gerencial: p.dt_gerencial,
            pessoas: p.pessoas,
            vr_pagamentos: p.vr_pagamentos,
            tem_pagamento: parseFloat(p.vr_pagamentos || '0') > 0,
          })),
        },
      });

      // Desabilitar cache completamente
      response.headers.set(
        'Cache-Control',
        'no-store, no-cache, must-revalidate, proxy-revalidate'
      );
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
      response.headers.set('Surrogate-Control', 'no-store');

      return response;
    } catch (dbError) {
      console.error('❌ Erro ao buscar dados do banco:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao buscar dados do banco: ' + (dbError as Error).message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Erro na API Dashboard Semanal:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno do servidor: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

// Exportar como GET para Next.js
export async function GET(request: NextRequest) {
  return getDashboardSemanalCorrigido(request);
}
