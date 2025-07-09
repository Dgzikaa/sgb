import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('🔍 Verificando schema das tabelas ContaHub...');
    
    const resultados: any = {};
    
    // Lista das tabelas ContaHub
    const tabelas = [
      'contahub_analitico',
      'contahub_periodo', 
      'contahub_tempo',
      'contahub_pagamentos',
      'contahub_fatporhora',
      'contahub_clientes_presenca',
      'contahub_clientes_cpf',
      'contahub_clientes_faturamento',
      'contahub_nfs',
      'contahub_compra_produto_dtnf'
    ];

    for (const tabela of tabelas) {
      try {
        console.log(`📋 Verificando tabela: ${tabela}`);
        
        // Tentar fazer SELECT para ver as colunas
        const { data, error } = await supabase
          .from(tabela)
          .select('*')
          .limit(1);

        if (error) {
          resultados[tabela] = {
            status: 'erro',
            erro: error.message,
            detalhes: error
          };
        } else {
          // Se conseguiu fazer SELECT, a tabela existe
          // Vamos tentar descobrir as colunas fazendo um INSERT vazio
          const { error: insertError } = await supabase
            .from(tabela)
            .insert({});

          if (insertError) {
            // O erro vai nos dizer quais colunas são required
            resultados[tabela] = {
              status: 'existe',
              total_registros: data?.length || 0,
              erro_insert: insertError.message,
              detalhes_insert: insertError,
              possivel_estrutura: 'Erro indica colunas obrigatórias'
            };
          } else {
            resultados[tabela] = {
              status: 'existe',
              total_registros: data?.length || 0,
              observacao: 'INSERT vazio funcionou (sem colunas obrigatórias)'
            };
          }
        }
      } catch (error) {
        resultados[tabela] = {
          status: 'erro_catch',
          erro: error instanceof Error ? error.message : String(error)
        };
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verificação de schema concluída',
      resultados,
      total_tabelas: tabelas.length
    });

  } catch (error) {
    console.error('❌ Erro na verificação de schema:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 