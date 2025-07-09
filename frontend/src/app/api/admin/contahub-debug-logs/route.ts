import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST() {
  try {
    console.log('🔍 Diagnóstico básico do sistema...');

    // Teste 1: Verificar variáveis de ambiente
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('🔐 Verificando variáveis de ambiente...');
    console.log(`URL existe: ${!!supabaseUrl}`);
    console.log(`Service Role Key existe: ${!!supabaseKey}`);
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        message: 'Variáveis de ambiente não configuradas',
        detalhes: {
          supabase_url: !!supabaseUrl,
          service_role_key: !!supabaseKey
        }
      });
    }

    // Teste 2: Consulta básica
    console.log('📡 Testando consulta básica...');
    try {
      const { data: basicData, error: basicError } = await supabase
        .from('sistema_raw')
        .select('id')
        .limit(1);
      
      if (basicError) {
        console.error('❌ Erro na consulta básica:', basicError);
        return NextResponse.json({
          success: false,
          message: 'Erro na consulta mais básica',
          detalhes: {
            codigo_erro: basicError.code || 'sem_codigo',
            mensagem_erro: basicError.message || 'mensagem_vazia',
            tipo_problema: 'consulta_basica_falhou'
          }
        });
      }
      
      console.log('✅ Consulta básica funcionou!', basicData);
      
    } catch (connectionError) {
      console.error('❌ Erro de conexão:', connectionError);
      return NextResponse.json({
        success: false,
        message: 'Erro de conexão com Supabase',
        detalhes: {
          erro: connectionError instanceof Error ? connectionError.message : 'Erro de conexão',
          tipo_problema: 'conexao'
        }
      });
    }

    // Teste 3: Descobrir estrutura da tabela
    console.log('📊 Descobrindo estrutura da tabela...');
    const { data: fullRecord, error: fullError } = await supabase
      .from('sistema_raw')
      .select('*')
      .limit(1);

    if (fullError) {
      console.error('❌ Erro ao buscar registro completo:', fullError);
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar estrutura da tabela',
        detalhes: {
          codigo_erro: fullError.code,
          mensagem_erro: fullError.message,
          tipo_problema: 'busca_estrutura'
        }
      });
    }

    // Descobrir colunas disponíveis
    const colunasDisponiveis = fullRecord && fullRecord.length > 0 ? 
      Object.keys(fullRecord[0]) : [];
    
    console.log('📋 Colunas disponíveis:', colunasDisponiveis);

    // Teste 4: Buscar TODOS os registros para estatísticas completas
    console.log('📊 Buscando todos os registros para estatísticas...');
    const { data: allRecords, error: allError } = await supabase
      .from('sistema_raw')
      .select('id, processado, tipo_dados, data_referencia, criado_em, bar_id');

    if (allError) {
      console.error('❌ Erro ao buscar todos os registros:', allError);
      return NextResponse.json({
        success: false,
        message: 'Erro ao buscar registros completos',
        detalhes: {
          codigo_erro: allError.code,
          mensagem_erro: allError.message,
          tipo_problema: 'busca_completa'
        }
      });
    }

    // Análise dos dados
    const totalRegistros = allRecords?.length || 0;
    const processados = allRecords?.filter(r => r.processado === true).length || 0;
    const naoProcessados = allRecords?.filter(r => r.processado === false).length || 0;
    
    // Contagem por tipo
    const contagemPorTipo = allRecords?.reduce((acc: any, r: any) => {
      const tipo = r.tipo_dados || 'indefinido';
      acc[tipo] = (acc[tipo] || 0) + 1;
      return acc;
    }, {}) || {};

    // Buscar últimos registros para exibição
    const ultimosRegistros = allRecords?.slice(0, 10) || [];

    // Sucesso!
    console.log(`✅ Diagnóstico completo!`);
    console.log(`📊 Total de registros: ${totalRegistros}`);
    console.log(`✅ Processados: ${processados}`);
    console.log(`⏳ Não processados: ${naoProcessados}`);
    console.log(`📋 Colunas disponíveis: ${colunasDisponiveis.join(', ')}`);
    console.log(`📊 Tipos encontrados:`, contagemPorTipo);
    
    return NextResponse.json({
      success: true,
      message: 'Diagnóstico completo - sistema_raw acessível',
      estatisticas: {
        total_registros: totalRegistros,
        registros_amostra: ultimosRegistros.length,
        processados: processados,
        nao_processados: naoProcessados,
        registros_problematicos: 0,
        tem_coluna_processado: colunasDisponiveis.includes('processado'),
        contagem_por_tipo: contagemPorTipo
      },
      estrutura_tabela: {
        colunas_disponiveis: colunasDisponiveis,
        total_colunas: colunasDisponiveis.length,
        exemplo_registro: fullRecord?.[0] || null
      },
      amostra_estrutura: [fullRecord?.[0] || {}], // Para compatibilidade com interface
      registros_problematicos: [],
      ultimos_registros: ultimosRegistros.map(r => ({
        id: r.id,
        tipo_dados: r.tipo_dados,
        processado: r.processado,
        data_referencia: r.data_referencia,
        criado_em: r.criado_em,
        bar_id: r.bar_id,
        tem_dados: true
      })),
      diagnostico: {
        conexao: 'ok',
        tabela_existe: 'ok',
        permissoes: 'ok',
        consulta_basica: 'ok'
      }
    });

  } catch (error) {
    console.error('❌ Erro inesperado no diagnóstico:', error);
    return NextResponse.json({
      success: false,
      message: 'Erro inesperado no diagnóstico',
      detalhes: {
        erro: error instanceof Error ? error.message : 'Erro desconhecido',
        stack: error instanceof Error ? error.stack : undefined,
        tipo_problema: 'erro_inesperado'
      }
    });
  }
} 