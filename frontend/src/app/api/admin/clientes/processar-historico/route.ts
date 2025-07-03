import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
        // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }
const { bar_id = 1, modo = 'todos' } = await request.json();

    console.log('🔄 PROCESSANDO HISTÓRICO DE CLIENTES');
    console.log(`🏪 Bar ID: ${bar_id}`);
    console.log(`📋 Modo: ${modo}`);

    // 1. Buscar range de datas disponíveis
    const { data: rangeData, error: rangeError } = await supabase
      .from('periodo')
      .select('dt_gerencial')
      .eq('bar_id', bar_id)
      .order('dt_gerencial')
      .limit(1);

    const { data: rangeDataMax, error: rangeErrorMax } = await supabase
      .from('periodo')
      .select('dt_gerencial')
      .eq('bar_id', bar_id)
      .order('dt_gerencial', { ascending: false })
      .limit(1);

    if (rangeError || rangeErrorMax || !rangeData[0] || !rangeDataMax[0]) {
      throw new Error('Erro ao buscar range de datas');
    }

    const dataInicio = rangeData[0].dt_gerencial;
    const dataFim = rangeDataMax[0].dt_gerencial;

    console.log(`📅 Range histórico: ${dataInicio} → ${dataFim}`);

    // 2. Gerar lista de meses para processar
    const meses = [];
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    let currentDate = new Date(inicio.getFullYear(), inicio.getMonth(), 1);
    while (currentDate <= fim) {
      const ano = currentDate.getFullYear();
      const mes = currentDate.getMonth() + 1;
      const mesInicio = `${ano}-${mes.toString().padStart(2, '0')}-01`;
      
      // Último dia do mês
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const mesFim = `${ano}-${mes.toString().padStart(2, '0')}-${ultimoDia}`;

      meses.push({
        mes: `${ano}-${mes.toString().padStart(2, '0')}`,
        inicio: mesInicio,
        fim: mesFim
      });

      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    console.log(`📊 ${meses.length} meses para processar:`, meses.map((m: any) => m.mes));

    // 3. Processar cada mês sequencialmente
    let totalClientesRegistrados = 0;
    let totalVisitasRegistradas = 0;
    let totalPadroesEncontrados = 0;
    const resultadosPorMes = [];

    for (const mesInfo of meses) {
      console.log(`\n🔄 Processando ${mesInfo.mes}...`);
      
      try {
        // Buscar dados do mês
        const { data: periodoMes, error: periodoError } = await supabase
          .from('periodo')
          .select('vd, vd_mesadesc, dt_gerencial, pessoas, vr_pagamentos, vr_couvert')
          .eq('bar_id', bar_id)
          .gte('dt_gerencial', mesInfo.inicio)
          .lte('dt_gerencial', mesInfo.fim)
          .gt('vr_pagamentos', 0) // Excluir cortesias
          .order('dt_gerencial, vd');

        if (periodoError) {
          console.error(`❌ Erro ao buscar dados de ${mesInfo.mes}:`, periodoError);
          continue;
        }

        if (!periodoMes || periodoMes.length === 0) {
          console.log(`⚠️ ${mesInfo.mes}: Nenhum dado encontrado`);
          resultadosPorMes.push({
            mes: mesInfo.mes,
            registros_encontrados: 0,
            clientes_registrados: 0,
            visitas_registradas: 0,
            padroes_mesa: 0
          });
          continue;
        }

        console.log(`📊 ${mesInfo.mes}: ${periodoMes.length} registros encontrados`);

        // Processar padrões de mesa do mês
        const mesaPatterns = new Map<string, {
          primeiro_uso: string;
          ultimo_uso: string;
          total_visitas: number;
          valor_total: number;
          vendas: string[];
        }>();

        periodoMes.forEach((registro: any) => {
          const mesaKey = registro.vd_mesadesc || `Mesa-${registro.vd}`;
          const valor_total = parseFloat(registro.vr_pagamentos || '0') + parseFloat(registro.vr_couvert || '0');
          
          if (!mesaPatterns.has(mesaKey)) {
            mesaPatterns.set(mesaKey, {
              primeiro_uso: registro.dt_gerencial,
              ultimo_uso: registro.dt_gerencial,
              total_visitas: 0,
              valor_total: 0,
              vendas: []
            });
          }

          const pattern = mesaPatterns.get(mesaKey)!;
          pattern.ultimo_uso = registro.dt_gerencial;
          pattern.total_visitas++;
          pattern.valor_total += valor_total;
          pattern.vendas.push(registro.vd);
        });

        // Registrar/atualizar clientes do mês
        let clientesMes = 0;
        let visitasMes = 0;

        for (const [mesaPattern, dados] of mesaPatterns) {
          const clienteId = `MESA_${mesaPattern.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
          
          // Verificar se cliente já existe (pode ter sido criado em mês anterior)
          const { data: clienteExistente } = await supabase
            .from('clientes')
            .select('id, data_primeiro_visit, total_visitas, valor_total_gasto')
            .eq('bar_id', bar_id)
            .eq('cpf', clienteId)
            .single();

          let clienteIdFinal: number;

          if (!clienteExistente) {
            // Criar novo cliente
            const { data: novoCliente, error: clienteError } = await supabase
              .from('clientes')
              .insert({
                bar_id: bar_id,
                cpf: clienteId,
                nome: `Cliente ${mesaPattern}`,
                data_primeiro_visit: dados.primeiro_uso,
                data_ultimo_visit: dados.ultimo_uso,
                total_visitas: dados.total_visitas,
                valor_total_gasto: dados.valor_total,
                valor_medio_ticket: dados.valor_total / dados.total_visitas,
                tipo_cliente: 'novo',
                origem_cadastro: 'processamento_historico'
              })
              .select('id')
              .single();

            if (clienteError) {
              console.error(`❌ Erro ao criar cliente ${clienteId}:`, clienteError);
              continue;
            }

            clienteIdFinal = novoCliente.id;
            clientesMes++;
          } else {
            // Atualizar cliente existente (somar visitas e valores)
            const novoTotal = clienteExistente.valor_total_gasto + dados.valor_total;
            const novasVisitas = clienteExistente.total_visitas + dados.total_visitas;
            const primeiraVisita = clienteExistente.data_primeiro_visit < dados.primeiro_uso 
              ? clienteExistente.data_primeiro_visit 
              : dados.primeiro_uso;

            const { error: updateError } = await supabase
              .from('clientes')
              .update({
                data_primeiro_visit: primeiraVisita,
                data_ultimo_visit: dados.ultimo_uso,
                total_visitas: novasVisitas,
                valor_total_gasto: novoTotal,
                valor_medio_ticket: novoTotal / novasVisitas,
                tipo_cliente: novasVisitas > 1 ? 'recorrente' : 'novo'
              })
              .eq('id', clienteExistente.id);

            if (updateError) {
              console.error(`❌ Erro ao atualizar cliente ${clienteId}:`, updateError);
              continue;
            }

            clienteIdFinal = clienteExistente.id;
          }

          // Registrar visitas do mês
          for (const vd of dados.vendas) {
            const registroVisita = periodoMes.find((p: any) => p.vd === vd);
            if (!registroVisita) continue;

            const { error: visitaError } = await supabase
              .from('cliente_visitas')
              .upsert({
                cliente_id: clienteIdFinal,
                bar_id: bar_id,
                data_visita: registroVisita.dt_gerencial,
                vd: parseInt(vd),
                valor_gasto: parseFloat(registroVisita.vr_pagamentos || '0') + parseFloat(registroVisita.vr_couvert || '0'),
                pessoas_na_mesa: parseInt(registroVisita.pessoas || '0'),
                tipo_visita: 'regular'
              }, {
                onConflict: 'cliente_id,data_visita,vd'
              });

            if (!visitaError) {
              visitasMes++;
            }
          }
        }

        console.log(`✅ ${mesInfo.mes}: ${clientesMes} clientes, ${visitasMes} visitas, ${mesaPatterns.size} padrões`);

        resultadosPorMes.push({
          mes: mesInfo.mes,
          registros_encontrados: periodoMes.length,
          clientes_registrados: clientesMes,
          visitas_registradas: visitasMes,
          padroes_mesa: mesaPatterns.size
        });

        totalClientesRegistrados += clientesMes;
        totalVisitasRegistradas += visitasMes;
        totalPadroesEncontrados += mesaPatterns.size;

      } catch (error) {
        console.error(`💥 Erro ao processar ${mesInfo.mes}:`, error);
        resultadosPorMes.push({
          mes: mesInfo.mes,
          erro: error instanceof Error ? error.message : 'Erro desconhecido',
          registros_encontrados: 0,
          clientes_registrados: 0,
          visitas_registradas: 0,
          padroes_mesa: 0
        });
      }

      // Pausa pequena entre meses para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 4. Atualizar tipos de cliente (novo vs recorrente) baseado no total final
    console.log('\n🔄 Atualizando tipos de cliente...');
    const { error: updateTipoError } = await supabase.rpc('sql', {
      query: `
        UPDATE clientes 
        SET tipo_cliente = CASE 
          WHEN total_visitas > 1 THEN 'recorrente'
          ELSE 'novo'
        END
        WHERE bar_id = ${bar_id}
      `
    });

    if (updateTipoError) {
      console.error('⚠️ Erro ao atualizar tipos de cliente:', updateTipoError);
    }

    console.log('\n✅ PROCESSAMENTO HISTÓRICO CONCLUÍDO!');
    console.log(`👥 Total de clientes: ${totalClientesRegistrados}`);
    console.log(`📊 Total de visitas: ${totalVisitasRegistradas}`);
    console.log(`🎯 Total de padrões: ${totalPadroesEncontrados}`);

    return NextResponse.json({
      success: true,
      message: 'Processamento histórico concluído',
      periodo_processado: `${dataInicio} → ${dataFim}`,
      resumo: {
        total_clientes_registrados: totalClientesRegistrados,
        total_visitas_registradas: totalVisitasRegistradas,
        total_padroes_encontrados: totalPadroesEncontrados,
        meses_processados: meses.length
      },
      detalhes_por_mes: resultadosPorMes
    });

  } catch (error: any) {
    console.error('💥 Erro no processamento histórico:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}


