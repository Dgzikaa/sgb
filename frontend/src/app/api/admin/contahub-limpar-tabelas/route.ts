import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  const logs: string[] = [];
  const errors: string[] = [];
  
  function log(message: string) {
    console.log(message);
    logs.push(message);
  }
  
  function logError(message: string) {
    console.error(message);
    errors.push(message);
  }
  
  try {
    log('🧹 Iniciando limpeza completa das tabelas ContaHub');
    
    const supabase = await getAdminClient();
    
    // Lista completa das tabelas ContaHub
    const tabelasContaHub = [
      'contahub_analitico',
      'contahub_periodo', 
      'contahub_fatporhora',
      'contahub_pagamentos',
      'contahub_tempo',
      'contahub_nfs',
      'contahub_clientes_cpf',
      'contahub_clientes_faturamento',
      'contahub_clientes_presenca',
      'contahub_compra_produto_dtnf'
    ];

    const resultados = {
      sistema_raw: { antes: 0, depois: 0, removidos: 0 },
      tabelas_contahub: {} as Record<string, { antes: number, depois: number, removidos: number, erro?: string }>
    };

    // 1. Limpar sistema_raw primeiro
    log('🧹 Limpando sistema_raw...');
    try {
      // Primeiro, verificar TODOS os dados ContaHub sem filtro de sistema
      const { data: todosContahub, error: todosError } = await supabase
        .from('sistema_raw')
        .select('id, sistema, tipo_dados, bar_id')
        .eq('bar_id', 3)
        .ilike('tipo_dados', '%conta%')
        .limit(10);

      if (todosError) {
        logError('Erro ao buscar dados ContaHub: ' + todosError.message);
      }

      log('🔍 Debug - Registros ContaHub encontrados: ' + (todosContahub?.length || 0));
      if (todosContahub?.length > 0) {
        log('🔍 Debug - Primeiros registros: ' + JSON.stringify(todosContahub.slice(0, 3), null, 2));
      }

      // Verificar registros com filtro exato da limpeza
      const { count: antesCount, data: amostras, error: contarError } = await supabase
        .from('sistema_raw')
        .select('id, sistema, tipo_dados, data_referencia', { count: 'exact' })
        .eq('sistema', 'contahub')
        .eq('bar_id', 3)
        .limit(3);

      if (contarError) {
        logError('Erro ao contar registros: ' + contarError.message);
      }

      log(`📊 sistema_raw - registros antes (sistema=contahub, bar_id=3): ${antesCount}`);
      if (amostras?.length > 0) {
        log('📊 Amostras encontradas: ' + JSON.stringify(amostras, null, 2));
      }

      // Fazer a limpeza com diferentes abordagens se necessário
      let removidos = 0;
      if ((antesCount || 0) > 0) {
        log('🗑️ Executando limpeza direta por sistema=contahub...');
        const { error: deleteError } = await supabase
          .from('sistema_raw')
          .delete()
          .eq('sistema', 'contahub')
          .eq('bar_id', 3);

        if (deleteError) {
          logError('Erro ao deletar por sistema: ' + deleteError.message);
          throw deleteError;
        }

        // Contar registros depois
        const { count: depoisCount, error: depoisError } = await supabase
          .from('sistema_raw')
          .select('id', { count: 'exact', head: true })
          .eq('sistema', 'contahub')
          .eq('bar_id', 3);

        if (depoisError) {
          logError('Erro ao contar após limpeza: ' + depoisError.message);
        }

        removidos = (antesCount || 0) - (depoisCount || 0);
        log(`✅ sistema_raw limpa: ${removidos} registros removidos`);
      } else {
        // Tentar limpar por tipo_dados se sistema não funcionar
        log('🔄 Tentando limpeza alternativa por tipo_dados...');
        const tiposContahub = ['periodo_completo', 'tempo', 'pagamentos', 'fatporhora', 'analitico', 'nfs', 'compra_produto_dtnf', 'clientes_cpf', 'clientes_faturamento', 'clientes_presenca'];
        
        for (const tipo of tiposContahub) {
          try {
            const { count: tipoCount, error: tipoCountError } = await supabase
              .from('sistema_raw')
              .select('id', { count: 'exact', head: true })
              .eq('tipo_dados', tipo)
              .eq('bar_id', 3);

            if (tipoCountError) {
              logError(`Erro ao contar tipo ${tipo}: ${tipoCountError.message}`);
              continue;
            }

            if ((tipoCount || 0) > 0) {
              log(`🧹 Removendo ${tipoCount} registros de tipo ${tipo}...`);
              const { error: deleteTypeError } = await supabase
                .from('sistema_raw')
                .delete()
                .eq('tipo_dados', tipo)
                .eq('bar_id', 3);

              if (deleteTypeError) {
                logError(`Erro ao deletar tipo ${tipo}: ${deleteTypeError.message}`);
              } else {
                removidos += tipoCount || 0;
              }
            }
          } catch (typeError) {
            logError(`Erro ao processar tipo ${tipo}: ${typeError}`);
          }
        }
        log(`✅ Limpeza alternativa: ${removidos} registros removidos`);
      }

      resultados.sistema_raw = {
        antes: antesCount || 0,
        depois: Math.max(0, (antesCount || 0) - removidos),
        removidos
      };
      
    } catch (error: any) {
      logError(`❌ Erro ao limpar sistema_raw: ${error.message || error}`);
      resultados.sistema_raw = { antes: 0, depois: 0, removidos: 0 };
    }

    // 2. Limpar cada tabela ContaHub
    for (const tabela of tabelasContaHub) {
      log(`🧹 Limpando ${tabela}...`);
      
      try {
        // Contar registros antes (filtrando por bar_id = 3)
        const { count: antesCount, error: countError } = await supabase
          .from(tabela)
          .select('id', { count: 'exact', head: true })
          .eq('bar_id', 3);

        if (countError && countError.code !== 'PGRST106') {
          logError(`Erro ao contar ${tabela}: ${countError.message}`);
          throw countError;
        }

        if (countError?.code === 'PGRST106') {
          log(`ℹ️ Tabela ${tabela} não existe, pulando...`);
          resultados.tabelas_contahub[tabela] = {
            antes: 0,
            depois: 0,
            removidos: 0,
            erro: 'Tabela não existe'
          };
          continue;
        }

        log(`📊 ${tabela} - registros antes (bar_id=3): ${antesCount}`);

        // Fazer a limpeza (deletar registros do bar_id = 3)
        const { error: deleteError } = await supabase
          .from(tabela)
          .delete()
          .eq('bar_id', 3);

        if (deleteError) {
          logError(`Erro ao deletar ${tabela}: ${deleteError.message}`);
          throw deleteError;
        }

        // Contar registros depois (filtrando por bar_id = 3)
        const { count: depoisCount, error: depoisError } = await supabase
          .from(tabela)
          .select('id', { count: 'exact', head: true })
          .eq('bar_id', 3);

        if (depoisError) {
          logError(`Erro ao contar depois ${tabela}: ${depoisError.message}`);
        }

        const removidos = (antesCount || 0) - (depoisCount || 0);
        
        resultados.tabelas_contahub[tabela] = {
          antes: antesCount || 0,
          depois: depoisCount || 0,
          removidos
        };

        log(`✅ ${tabela} limpa: ${removidos} registros removidos`);
        
      } catch (error: any) {
        logError(`❌ Erro ao limpar ${tabela}: ${error.message || error}`);
        resultados.tabelas_contahub[tabela] = {
          antes: 0,
          depois: 0,
          removidos: 0,
          erro: error.message || String(error)
        };
      }
    }

    // 3. Calcular totais
    const totalRemovidosTabelas = Object.values(resultados.tabelas_contahub)
      .reduce((sum, tabela) => sum + tabela.removidos, 0);
    
    const totalRemovidos = resultados.sistema_raw.removidos + totalRemovidosTabelas;

    log('\n' + '='.repeat(50));
    log('🧹 LIMPEZA COMPLETA FINALIZADA');
    log('='.repeat(50));
    log(`📊 sistema_raw: ${resultados.sistema_raw.removidos} registros removidos`);
    log(`📊 Tabelas ContaHub: ${totalRemovidosTabelas} registros removidos`);
    log(`🎯 Total geral: ${totalRemovidos} registros removidos`);

    return NextResponse.json({
      success: true,
      message: `Limpeza completa finalizada: ${totalRemovidos} registros removidos`,
      resultados,
      logs,
      errors,
      totais: {
        sistema_raw_removidos: resultados.sistema_raw.removidos,
        tabelas_contahub_removidos: totalRemovidosTabelas,
        total_removidos: totalRemovidos,
        tabelas_limpas: Object.keys(resultados.tabelas_contahub).filter(
          tabela => resultados.tabelas_contahub[tabela].removidos > 0
        ).length,
        tabelas_com_erro: Object.keys(resultados.tabelas_contahub).filter(
          tabela => resultados.tabelas_contahub[tabela].erro
        ).length
      }
    });

  } catch (error) {
    logError('💥 Erro na limpeza: ' + (error instanceof Error ? error.message : String(error)));
    return NextResponse.json({
      success: false,
      error: 'Erro interno na limpeza',
      details: error instanceof Error ? error.message : String(error),
      logs,
      errors
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('📊 Verificando status atual das tabelas ContaHub');
    
    const supabase = await getAdminClient();
    
    const tabelasContaHub = [
      'contahub_analitico',
      'contahub_periodo', 
      'contahub_fatporhora',
      'contahub_pagamentos',
      'contahub_tempo',
      'contahub_nfs',
      'contahub_clientes_cpf',
      'contahub_clientes_faturamento',
      'contahub_clientes_presenca',
      'contahub_compra_produto_dtnf'
    ];

    const status: any = {
      sistema_raw: {},
      tabelas_contahub: {}
    };

    // Verificar sistema_raw
    try {
      const { count } = await supabase
        .from('sistema_raw')
        .select('id', { count: 'exact', head: true })
        .eq('sistema', 'contahub')
        .eq('bar_id', 3);

      status.sistema_raw = {
        existe: true,
        registros: count || 0
      };
    } catch (error) {
      status.sistema_raw = { erro: `${error}` };
    }

    // Verificar cada tabela ContaHub
    for (const tabela of tabelasContaHub) {
      try {
        // Filtrar por bar_id = 3 igual como fazemos na limpeza
        const { count, error } = await supabase
          .from(tabela)
          .select('id', { count: 'exact', head: true })
          .eq('bar_id', 3);

        if (error) {
          if (error.code === 'PGRST106') {
            status.tabelas_contahub[tabela] = { existe: false, registros: 0 };
          } else {
            status.tabelas_contahub[tabela] = { erro: error.message };
          }
        } else {
          status.tabelas_contahub[tabela] = {
            existe: true,
            registros: count || 0
          };
        }
      } catch (error) {
        status.tabelas_contahub[tabela] = { erro: `${error}` };
      }
    }

    // Calcular totais
    const totalRegistrosTabelas = Object.values(status.tabelas_contahub)
      .filter((info: any) => info.existe)
      .reduce((sum: number, info: any) => sum + (info.registros || 0), 0);

    const totalGeral = (status.sistema_raw.registros || 0) + totalRegistrosTabelas;

    return NextResponse.json({
      success: true,
      message: `Status atual: ${totalGeral} registros ContaHub no sistema`,
      status,
      totais: {
        sistema_raw: status.sistema_raw.registros || 0,
        tabelas_contahub: totalRegistrosTabelas,
        total_geral: totalGeral,
        tabelas_existentes: Object.values(status.tabelas_contahub).filter((info: any) => info.existe).length,
        tabelas_com_dados: Object.values(status.tabelas_contahub).filter((info: any) => info.existe && info.registros > 0).length
      }
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erro ao verificar status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 