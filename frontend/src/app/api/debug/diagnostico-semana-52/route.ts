import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId');

    if (!barId) {
      return NextResponse.json({
        success: false,
        error: 'barId é obrigatório'
      }, { status: 400 });
    }

    const barIdNum = parseInt(barId);
    const ano = 2025;
    const numeroSemana = 52;

    console.log(`🔍 Iniciando diagnóstico - Semana ${numeroSemana}/${ano} - Bar ${barIdNum}`);

    const problemas: string[] = [];
    const solucoes: string[] = [];

    // 1. BUSCAR DADOS SALVOS DA SEMANA 52
    console.log('📊 1. Buscando dados salvos...');
    
    const { data: semana, error: semanaError } = await supabase
      .from('desempenho_semanal')
      .select('*')
      .eq('bar_id', barIdNum)
      .eq('ano', ano)
      .eq('numero_semana', numeroSemana)
      .single();

    if (semanaError || !semana) {
      return NextResponse.json({
        success: false,
        error: `Semana ${numeroSemana} não encontrada na tabela desempenho_semanal`
      }, { status: 404 });
    }

    console.log(`✅ Semana encontrada: ${semana.data_inicio} até ${semana.data_fim}`);

    // 2. VERIFICAR DADOS DO CONTAHUB
    console.log('📁 2. Verificando dados do ContaHub...');
    
    const { data: contahubData, error: contahubError } = await supabase
      .from('contahub_periodo')
      .select('dt_gerencial, cli_fone, pessoas')
      .eq('bar_id', barIdNum)
      .gte('dt_gerencial', semana.data_inicio)
      .lte('dt_gerencial', semana.data_fim)
      .not('cli_fone', 'is', null);

    const dadosContahub: any = {
      totalRegistros: contahubData?.length || 0,
      clientesUnicos: 0,
      porDia: {}
    };

    if (!contahubError && contahubData && contahubData.length > 0) {
      // Clientes únicos
      const clientesUnicos = new Set(contahubData.map(r => r.cli_fone));
      dadosContahub.clientesUnicos = clientesUnicos.size;

      // Agrupar por dia
      dadosContahub.porDia = contahubData.reduce((acc: any, row) => {
        const dia = row.dt_gerencial;
        if (!acc[dia]) {
          acc[dia] = { clientes: 0, pessoas: 0 };
        }
        acc[dia].pessoas += parseInt(row.pessoas) || 0;
        return acc;
      }, {});

      // Contar clientes únicos por dia
      Object.keys(dadosContahub.porDia).forEach(dia => {
        const clientesDoDia = contahubData
          .filter(r => r.dt_gerencial === dia)
          .map(r => r.cli_fone);
        dadosContahub.porDia[dia].clientes = new Set(clientesDoDia).size;
      });

      console.log(`✅ ContaHub: ${dadosContahub.totalRegistros} registros, ${dadosContahub.clientesUnicos} clientes únicos`);
    } else {
      console.log('❌ Nenhum dado do ContaHub encontrado!');
      problemas.push('CRÍTICO: Nenhum dado do ContaHub para a semana 52');
      solucoes.push('Executar sync do ContaHub para o período 22-28/12/2025');
      solucoes.push('Verificar se houve problemas na integração ContaHub');
    }

    // 3. CALCULAR MÉTRICAS EM TEMPO REAL
    console.log('🧮 3. Calculando métricas...');
    
    const metricasCalculadas: any = {};

    if (contahubData && contahubData.length > 0) {
      // Total de clientes únicos
      const clientesSemana = new Set(contahubData.map(r => r.cli_fone));
      metricasCalculadas.totalClientes = clientesSemana.size;

      // Buscar histórico para calcular novos clientes
      const dataAnterior = new Date(semana.data_inicio);
      dataAnterior.setDate(dataAnterior.getDate() - 1);
      const dataAnteriorStr = dataAnterior.toISOString().split('T')[0];

      const { data: historicoData, error: historicoError } = await supabase
        .from('contahub_periodo')
        .select('cli_fone')
        .eq('bar_id', barIdNum)
        .lte('dt_gerencial', dataAnteriorStr)
        .not('cli_fone', 'is', null);

      if (!historicoError && historicoData) {
        const clientesHistoricos = new Set(historicoData.map(r => r.cli_fone));
        
        let novos = 0;
        clientesSemana.forEach(cliente => {
          if (!clientesHistoricos.has(cliente)) {
            novos++;
          }
        });

        metricasCalculadas.novosClientes = novos;
        metricasCalculadas.percNovos = metricasCalculadas.totalClientes > 0 
          ? (novos / metricasCalculadas.totalClientes) * 100 
          : 0;

        console.log(`✅ Novos clientes calculados: ${novos} (${metricasCalculadas.percNovos.toFixed(2)}%)`);
      }

      // Calcular clientes ativos (2+ visitas em 90 dias)
      const dataFim = new Date(semana.data_fim);
      const data90DiasAtras = new Date(dataFim);
      data90DiasAtras.setDate(dataFim.getDate() - 90);
      const data90DiasAtrasStr = data90DiasAtras.toISOString().split('T')[0];

      try {
        const { data: baseAtivaResult, error: baseAtivaError } = await supabase
          .rpc('get_count_base_ativa', {
            p_bar_id: barIdNum,
            p_data_inicio: data90DiasAtrasStr,
            p_data_fim: semana.data_fim
          });

        if (!baseAtivaError && baseAtivaResult !== null) {
          metricasCalculadas.clientesAtivos = Number(baseAtivaResult);
          console.log(`✅ Clientes ativos calculados: ${metricasCalculadas.clientesAtivos}`);
        } else {
          console.log('⚠️  Erro ao calcular clientes ativos:', baseAtivaError);
          problemas.push('Não foi possível calcular clientes ativos (stored procedure pode não existir)');
          solucoes.push('Verificar se a stored procedure get_count_base_ativa existe no banco');
        }
      } catch (err: any) {
        console.log('⚠️  Exceção ao calcular clientes ativos:', err.message);
        problemas.push('Erro ao executar stored procedure get_count_base_ativa');
        solucoes.push('Criar ou corrigir a stored procedure get_count_base_ativa');
      }
    }

    // 4. VERIFICAR PROBLEMAS NOS DADOS SALVOS
    console.log('🔍 4. Verificando inconsistências...');

    if (semana.perc_clientes_novos === null) {
      problemas.push('% Clientes Novos está NULL no banco');
      solucoes.push('Executar recálculo da semana 52');
    } else if (semana.perc_clientes_novos === 0) {
      problemas.push('% Clientes Novos está ZERADO (0%) no banco');
      
      if (metricasCalculadas.percNovos && metricasCalculadas.percNovos > 0) {
        problemas.push(`Divergência: deveria ser ${metricasCalculadas.percNovos.toFixed(2)}% (calculado agora)`);
      }
      
      solucoes.push('Executar recálculo da semana 52 para corrigir o valor');
    }

    if (semana.clientes_ativos === null) {
      problemas.push('Clientes Ativos está NULL no banco');
      solucoes.push('Executar recálculo da semana 52');
    } else if (semana.clientes_ativos === 0) {
      problemas.push('Clientes Ativos está ZERADO no banco');
      
      if (metricasCalculadas.clientesAtivos && metricasCalculadas.clientesAtivos > 0) {
        problemas.push(`Divergência: deveria ser ${metricasCalculadas.clientesAtivos} (calculado agora)`);
      }
      
      solucoes.push('Executar recálculo da semana 52 para corrigir o valor');
    }

    // Verificar se os valores calculados divergem dos salvos
    if (metricasCalculadas.percNovos && semana.perc_clientes_novos !== null) {
      const divergencia = Math.abs(metricasCalculadas.percNovos - semana.perc_clientes_novos);
      if (divergencia > 1) {
        problemas.push(`Divergência no % de novos: Salvo=${semana.perc_clientes_novos.toFixed(2)}%, Calculado=${metricasCalculadas.percNovos.toFixed(2)}%`);
        solucoes.push('Executar recálculo para sincronizar os valores');
      }
    }

    if (metricasCalculadas.clientesAtivos && semana.clientes_ativos !== null) {
      if (metricasCalculadas.clientesAtivos !== semana.clientes_ativos) {
        problemas.push(`Divergência nos clientes ativos: Salvo=${semana.clientes_ativos}, Calculado=${metricasCalculadas.clientesAtivos}`);
        solucoes.push('Executar recálculo para sincronizar os valores');
      }
    }

    // 5. VERIFICAR AUTOMAÇÃO
    if (semana.observacoes && !semana.observacoes.includes('Automação semanal')) {
      problemas.push('A semana pode não ter sido processada pela automação semanal');
      solucoes.push('Verificar logs da Edge Function desempenho-semanal-auto');
      solucoes.push('Executar Edge Function manualmente se necessário');
    }

    // 6. RESUMO
    console.log('\n📋 RESUMO DO DIAGNÓSTICO');
    console.log(`   Problemas encontrados: ${problemas.length}`);
    console.log(`   Soluções recomendadas: ${solucoes.length}`);

    if (problemas.length === 0) {
      console.log('✅ Nenhum problema detectado!');
    }

    return NextResponse.json({
      success: true,
      data: {
        semana,
        dadosContahub,
        metricasCalculadas,
        problemas,
        solucoes
      }
    });

  } catch (error: any) {
    console.error('❌ Erro no diagnóstico:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro ao executar diagnóstico',
      details: error.message
    }, { status: 500 });
  }
}
