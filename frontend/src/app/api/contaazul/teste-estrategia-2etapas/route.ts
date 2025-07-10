import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { bar_id, limite_teste = 5 } = await request.json();

    if (!bar_id) {
      return NextResponse.json({ error: 'bar_id é obrigatório' }, { status: 400 });
    }

    console.log('🎯 Iniciando teste da estratégia de 2 etapas...');
    const inicio = Date.now();

    // Criar cliente Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Buscar configurações do ContaAzul para este bar
    const { data: config, error: configError } = await supabase
      .from('contaazul_configs')
      .select('*')
      .eq('bar_id', bar_id)
      .single();

    if (configError || !config?.access_token) {
      return NextResponse.json({ error: 'Configuração ContaAzul não encontrada ou token inválido' }, { status: 400 });
    }

    const baseUrl = 'https://api.contaazul.com';
    const headers = {
      'Authorization': `Bearer ${config.access_token}`,
      'Content-Type': 'application/json'
    };

    // ETAPA 1: Buscar lista básica de contas a receber
    console.log('📋 Etapa 1: Buscando lista básica...');
    
    const etapa1Response = await fetch(`${baseUrl}/v1/financeiro/eventos-financeiros/contas-a-receber/buscar?situacao=PENDENTE&limite=${limite_teste}`, {
      headers
    });

    if (!etapa1Response.ok) {
      const errorText = await etapa1Response.text();
      console.error('Erro na Etapa 1:', errorText);
      return NextResponse.json({ error: `Erro na Etapa 1: ${errorText}` }, { status: 500 });
    }

    const etapa1Data = await etapa1Response.json();
    const parcelasBasicas = etapa1Data.data || [];

    console.log(`📋 Etapa 1 concluída: ${parcelasBasicas.length} parcelas encontradas`);

    // ETAPA 2: Buscar detalhes de cada parcela (categoria e centro de custo)
    console.log('🔍 Etapa 2: Buscando detalhes das parcelas...');
    
    const parcelasDetalhadas = [];
    let comCategoria = 0;
    let comCentroCusto = 0;

    for (const parcela of parcelasBasicas) {
      try {
        // Buscar detalhes da parcela específica
        const detalhesResponse = await fetch(`${baseUrl}/v1/financeiro/eventos-financeiros/parcelas/${parcela.id}`, {
          headers
        });

        if (detalhesResponse.ok) {
          const detalhes = await detalhesResponse.json();
          
          // Verificar se tem categoria
          if (detalhes.categoria) {
            comCategoria++;
          }
          
          // Verificar se tem centro de custo
          if (detalhes.centro_custo) {
            comCentroCusto++;
          }

          parcelasDetalhadas.push({
            id: parcela.id,
            descricao: parcela.descricao || detalhes.descricao,
            categoria: detalhes.categoria,
            centro_custo: detalhes.centro_custo,
            valor: parcela.valor,
            data_vencimento: parcela.data_vencimento
          });

          console.log(`✅ Parcela ${parcela.id}: categoria=${detalhes.categoria?.nome || 'N/A'}, centro_custo=${detalhes.centro_custo?.nome || 'N/A'}`);
        } else {
          console.warn(`⚠️ Erro ao buscar detalhes da parcela ${parcela.id}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao processar parcela ${parcela.id}:`, error);
      }
    }

    const tempoExecucao = Date.now() - inicio;

    const resultado = {
      etapa1: {
        total_encontrado: parcelasBasicas.length,
        parcelas_basicas: parcelasBasicas
      },
      etapa2: {
        total_processado: parcelasDetalhadas.length,
        com_categoria: comCategoria,
        com_centro_custo: comCentroCusto,
        parcelas_detalhadas: parcelasDetalhadas
      },
      tempo_execucao: tempoExecucao
    };

    console.log('🎯 Teste concluído:', {
      etapa1_total: resultado.etapa1.total_encontrado,
      etapa2_processado: resultado.etapa2.total_processado,
      com_categoria: resultado.etapa2.com_categoria,
      com_centro_custo: resultado.etapa2.com_centro_custo,
      tempo_ms: tempoExecucao
    });

    return NextResponse.json({
      success: true,
      resultado
    });

  } catch (error) {
    console.error('Erro no teste da estratégia:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
} 