import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    console.log('🔍 Investigando estrutura de rateio com dados locais...');

    // Verificar dados nas tabelas de cache
    const { data: categorias } = await supabase
      .from('contaazul_categorias')
      .select('*')
      .limit(3);

    const { data: centrosCusto } = await supabase
      .from('contaazul_centros_custo')
      .select('*')
      .limit(3);

    const { data: contasFinanceiras } = await supabase
      .from('contaazul_contas_financeiras')
      .select('*')
      .limit(3);

    // Verificar se há dados na tabela de competência
    const { data: competencia } = await supabase
      .from('contaazul_visao_competencia')
      .select('*')
      .limit(1);

    const investigacao = {
      dados_locais_disponiveis: {
        categorias: {
          total: categorias?.length || 0,
          tem_dados: !!categorias && categorias.length > 0,
          estrutura_exemplo: categorias?.[0] || null,
          campos_disponveis: categorias?.[0] ? Object.keys(categorias[0]) : [],
        },
        centros_custo: {
          total: centrosCusto?.length || 0,
          tem_dados: !!centrosCusto && centrosCusto.length > 0,
          estrutura_exemplo: centrosCusto?.[0] || null,
          campos_disponveis: centrosCusto?.[0] ? Object.keys(centrosCusto[0]) : [],
        },
        contas_financeiras: {
          total: contasFinanceiras?.length || 0,
          tem_dados: !!contasFinanceiras && contasFinanceiras.length > 0,
          estrutura_exemplo: contasFinanceiras?.[0] || null,
          campos_disponveis: contasFinanceiras?.[0] ? Object.keys(contasFinanceiras[0]) : [],
        },
        competencia: {
          total: competencia?.length || 0,
          tem_dados: !!competencia && competencia.length > 0,
          estrutura_exemplo: competencia?.[0] || null,
          campos_disponveis: competencia?.[0] ? Object.keys(competencia[0]) : [],
        }
      },
      
      analise_openapi: {
        problema_identificado: 'Campo rateio presente na CRIAÇÃO mas não documentado na RECUPERAÇÃO',
        arquivo_analisado: 'exemplo_teste/financial-apis-openapi.json',
        eventofin_request: {
          tem_rateio: true,
          estrutura: 'array de CategoriaRateio',
          campos_rateio: ['id_categoria', 'valor', 'rateio_centro_custo'],
        },
        parcela_response: {
          tem_rateio: false,
          problema: 'Campo rateio não documentado no schema Parcela',
          campos_evento: ['data_competencia', 'id', 'condicao_pagamento', 'referencia', 'agendado', 'tipo'],
        }
      },

      proximos_passos: [
        'Dados locais existem e podem ser usados para estruturar rateio',
        'Para testar API real: commit no Git e teste no Vercel',
        'Comparar estrutura real da API vs documentação OpenAPI',
        'Verificar se campo rateio existe mas não está documentado',
      ],

      recomendacao: competencia && competencia.length > 0 ? 
        'Usar dados da tabela competencia existente' : 
        'Fazer commit e testar no Vercel onde token está configurado',
    };

    return NextResponse.json(investigacao);

  } catch (error) {
    console.error('❌ Erro na investigação:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 