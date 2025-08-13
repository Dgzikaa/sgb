import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// Interfaces para tipagem dos produtos
interface ProdutoContahub {
  vd_dtgerencial: string;
  prd_desc: string;
  qtd: string | number;
  valorfinal: string | number;
}

interface ProdutoYuzer {
  dt_gerencial: string;
  produto: string;
  quantidade: string | number;
  valor_unitario: string | number;
  valor_total: string | number;
}

interface ProdutoAgrupado {
  produto: string;
  quantidade: number;
  valor: number;
}

interface ProdutosPorDia {
  contahub: ProdutoAgrupado[];
  yuzer: ProdutoAgrupado[];
}

function isProdutoContahub(obj: unknown): obj is ProdutoContahub {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'vd_dtgerencial' in obj &&
    'prd_desc' in obj &&
    'qtd' in obj &&
    'valorfinal' in obj
  );
}

function isProdutoYuzer(obj: unknown): obj is ProdutoYuzer {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'dt_gerencial' in obj &&
    'produto' in obj &&
    'quantidade' in obj &&
    'valor_total' in obj
  );
}

export async function GET(request: NextRequest) {
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

    console.log('🍕 API Produtos Período - Parâmetros recebidos:', {
      data_inicio,
      data_fim,
      bar_id,
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

    // Gerar array de datas do período
    const inicioData = new Date(data_inicio + 'T00:00:00');
    const fimData = new Date(data_fim + 'T00:00:00');
    const diasPeriodo: string[] = [];

    for (
      let d = new Date(inicioData);
      d <= fimData;
      d.setDate(d.getDate() + 1)
    ) {
      diasPeriodo.push(d.toISOString().split('T')[0]);
    }

    console.log('📅 Dias do período:', diasPeriodo.join(', '));

    try {
      const produtosPorDia: { [key: string]: ProdutosPorDia } = {};

      // Inicializar estrutura para cada dia
      diasPeriodo.forEach(dia => {
        produtosPorDia[dia] = {
          contahub: [],
          yuzer: [],
        };
      });

      // Buscar produtos da tabela analitico (ContaHub)
      console.log('🔍 Buscando produtos ContaHub...');
      const { data: contahubData, error: contahubError } = await supabase
        .from('analitico')
        .select('vd_dtgerencial, prd_desc, qtd, valorfinal')
        .eq('bar_id', parseInt(bar_id))
        .gte('vd_dtgerencial', data_inicio)
        .lte('vd_dtgerencial', data_fim)
        .not('prd_desc', 'is', null)
        .gt('qtd', 0);

      if (contahubError) {
        console.error('❌ Erro ao buscar produtos ContaHub:', contahubError);
      } else if (contahubData && contahubData.length > 0) {
        console.log(`📊 Produtos ContaHub encontrados: ${contahubData.length}`);
        (
            // Agrupar produtos ContaHub por dia
            contahubData as unknown[]
          )
          .filter(isProdutoContahub)
          .forEach((item: ProdutoContahub) => {
            const dia = item.vd_dtgerencial;
            if (produtosPorDia[dia]) {
              // Verificar se o produto já existe para este dia
              const produtoExistente = produtosPorDia[dia].contahub.find(
                p => p.produto === item.prd_desc
              );

              if (produtoExistente) {
                produtoExistente.quantidade += parseInt(
                  String(item.qtd) || '0'
                );
                produtoExistente.valor += parseFloat(
                  String(item.valorfinal) || '0'
                );
              } else {
                produtosPorDia[dia].contahub.push({
                  produto: item.prd_desc,
                  quantidade: parseInt(String(item.qtd) || '0'),
                  valor: parseFloat(String(item.valorfinal) || '0'),
                });
              }
            }
          });
      }

      // Buscar produtos da tabela yuzer_analitico (se existir)
      console.log('🔍 Buscando produtos Yuzer...');
      const { data: yuzerData, error: yuzerError } = await supabase
        .from('yuzer_analitico')
        .select(
          'dt_gerencial, produto, quantidade, valor_unitario, valor_total'
        )
        .eq('bar_id', parseInt(bar_id))
        .gte('dt_gerencial', data_inicio)
        .lte('dt_gerencial', data_fim)
        .not('produto', 'is', null)
        .gt('quantidade', 0);

      if (yuzerError) {
        console.log(
          '⚠️ Tabela yuzer_analitico não encontrada ou sem dados:',
          yuzerError.message
        );
      } else if (yuzerData && yuzerData.length > 0) {
        console.log(`📊 Produtos Yuzer encontrados: ${yuzerData.length}`);
        (
            // Agrupar produtos Yuzer por dia
            yuzerData as unknown[]
          )
          .filter(isProdutoYuzer)
          .forEach((item: ProdutoYuzer) => {
            const dia = item.dt_gerencial;
            if (produtosPorDia[dia]) {
              // Verificar se o produto já existe para este dia
              const produtoExistente = produtosPorDia[dia].yuzer.find(
                p => p.produto === item.produto
              );

              if (produtoExistente) {
                produtoExistente.quantidade += parseInt(
                  String(item.quantidade) || '0'
                );
                produtoExistente.valor += parseFloat(
                  String(item.valor_total) || '0'
                );
              } else {
                produtosPorDia[dia].yuzer.push({
                  produto: item.produto,
                  quantidade: parseInt(String(item.quantidade) || '0'),
                  valor: parseFloat(String(item.valor_total) || '0'),
                });
              }
            }
          });
      }

      // Ordenar produtos por quantidade em cada dia
      Object.keys(produtosPorDia).forEach(dia => {
        produtosPorDia[dia].contahub.sort(
          (a, b) => b.quantidade - a.quantidade
        );
        produtosPorDia[dia].yuzer.sort((a, b) => b.quantidade - a.quantidade);
      });

      // Log resumo
      const totalDias = Object.keys(produtosPorDia).length;
      const diasComDados = Object.keys(produtosPorDia).filter(
        dia =>
          produtosPorDia[dia].contahub.length > 0 ||
          produtosPorDia[dia].yuzer.length > 0
      ).length;

      console.log('📊 Resumo dos produtos por período:', {
        total_dias: totalDias,
        dias_com_dados: diasComDados,
        primeiro_dia_com_dados:
          diasComDados > 0
            ? Object.keys(produtosPorDia).find(
                dia =>
                  produtosPorDia[dia].contahub.length > 0 ||
                  produtosPorDia[dia].yuzer.length > 0
              )
            : null,
      });

      return NextResponse.json({
        success: true,
        produtos: produtosPorDia,
        meta: {
          total_dias: totalDias,
          dias_com_dados: diasComDados,
        },
      });
    } catch (error) {
      console.error(
        '❌ Erro interno ao processar produtos por período:',
        error
      );
      return NextResponse.json(
        {
          success: false,
          error: 'Erro interno ao processar produtos por período',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Erro interno na API de produtos por período:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
