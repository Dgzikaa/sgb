import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    console.log('🔍 Analisando estrutura dos dados sistema_raw...');
    
    // Buscar alguns registros de exemplo
    const { data: registros, error } = await supabase
      .from('sistema_raw')
      .select('*')
      .eq('sistema', 'contahub')
      .eq('processado', false)
      .limit(5);

    if (error) {
      return NextResponse.json({ 
        error: `Erro ao buscar registros: ${error.message}`,
        details: error 
      }, { status: 500 });
    }

    if (!registros || registros.length === 0) {
      return NextResponse.json({ 
        message: 'Nenhum registro encontrado',
        total: 0
      });
    }

    const analises = registros.map((registro, index) => {
      console.log(`🔍 Analisando registro ${index + 1}:`, registro.id);
      
      return {
        id: registro.id,
        tipo_dados: registro.tipo_dados,
        data_referencia: registro.data_referencia,
        bar_id: registro.bar_id,
        
        // Analisar estrutura dos dados
        estrutura_registro: {
          campos_diretos: Object.keys(registro),
          tem_dados: !!registro.data,
          tipo_dados_campo: typeof registro.data,
          dados_e_objeto: registro.data && typeof registro.data === 'object',
          
          // Se dados é string, tentar fazer parse
          dados_parseados: (() => {
            if (typeof registro.data === 'string') {
              try {
                return JSON.parse(registro.data);
              } catch {
                return 'ERRO_PARSE';
              }
            }
            return registro.data;
          })()
        },
        
        // Verificar se tem wrapper format
        tem_wrapper: registro.data && 
                     registro.data.metadados && 
                     registro.data.todos_registros,
        
        // Verificar campos típicos de cada tipo
        campos_identificacao: (() => {
          let dados = registro.data;
          
          // Se dados é string, fazer parse
          if (typeof dados === 'string') {
            try {
              dados = JSON.parse(dados);
            } catch {
              return 'ERRO_PARSE';
            }
          }
          
          if (!dados) return 'SEM_DADOS';
          
          // Se tem wrapper, usar primeiro registro
          if (dados.metadados && dados.todos_registros) {
            dados = dados.todos_registros && dados.todos_registros[0];
          }
          
          if (!dados) return 'SEM_PRIMEIRO_REGISTRO';
          
          return {
            tem_vd: !!dados.vd,
            tem_trn: !!dados.trn,
            tem_dt_gerencial: !!dados.dt_gerencial,
            tem_pag: !!dados.pag,
            tem_itm: !!dados.itm,
            tem_prd: !!dados.prd,
            tem_hora: !!dados.hora,
            tem_dds: !!dados.dds,
            tem_cpf: !!dados.cpf,
            tem_vendas: !!dados.vendas,
            tem_valor: !!dados.valor,
            tem_cli_nome: !!dados.cli_nome,
            
            // Campos com cifrão
            tem_vr_produtos: !!dados['$vr_produtos'],
            tem_vr_pagamentos: !!dados['$vr_pagamentos'],
            tem_vr_couvert: !!dados['$vr_couvert'],
            
            primeiros_campos: Object.keys(dados).slice(0, 10)
          };
        })(),
        
        // Amostra pequena dos dados
        amostra_dados: (() => {
          let dados = registro.data;
          
          if (typeof dados === 'string') {
            try {
              dados = JSON.parse(dados);
            } catch {
              return 'ERRO_PARSE';
            }
          }
          
          if (dados && dados.metadados && dados.todos_registros) {
            return {
              metadados: dados.metadados,
              total_registros: dados.total_registros,
              primeiro_registro: dados.todos_registros && dados.todos_registros[0]
            };
          }
          
          return dados;
        })()
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Análise de estrutura concluída',
      total_registros: registros.length,
      analises,
      resumo: {
        tipos_encontrados: [...new Set(registros.map(r => r.tipo_dados))],
        datas_referencia: [...new Set(registros.map(r => r.data_referencia))],
        bar_ids: [...new Set(registros.map(r => r.bar_id))]
      }
    });

  } catch (error) {
    console.error('❌ Erro na análise de dados:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 