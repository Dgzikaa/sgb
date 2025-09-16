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
    const mes = searchParams.get('mes'); // Formato: YYYY-MM

    if (!barId) {
      return NextResponse.json({
        success: false,
        error: 'barId é obrigatório'
      }, { status: 400 });
    }

    const barIdNum = parseInt(barId);
    
    // Se não especificar mês, usar mês atual
    const mesReferencia = mes || new Date().toISOString().slice(0, 7);
    const [ano, mesNum] = mesReferencia.split('-');
    
    // Calcular mês anterior para comparação
    const dataAtual = new Date(parseInt(ano), parseInt(mesNum) - 1, 1);
    const mesAnterior = new Date(dataAtual);
    mesAnterior.setMonth(mesAnterior.getMonth() - 1);
    
    const mesAtualStr = `${dataAtual.getFullYear()}-${(dataAtual.getMonth() + 1).toString().padStart(2, '0')}`;
    const mesAnteriorStr = `${mesAnterior.getFullYear()}-${(mesAnterior.getMonth() + 1).toString().padStart(2, '0')}`;

    console.log(`🔍 Calculando novos clientes para bar ${barIdNum}:`);
    console.log(`📅 Mês atual: ${mesAtualStr}`);
    console.log(`📅 Mês anterior: ${mesAnteriorStr}`);

    // Query para calcular novos clientes por mês
    const { data: novosClientesData, error: novosClientesError } = await supabase.rpc('calcular_novos_clientes_por_mes', {
      p_bar_id: barIdNum,
      p_mes_atual: mesAtualStr,
      p_mes_anterior: mesAnteriorStr
    });

    // Se a função RPC não existir, usar query SQL direta
    if (novosClientesError && novosClientesError.code === '42883') {
      console.log('⚠️ Função RPC não encontrada, usando query SQL direta');
      
      // Query SQL para calcular novos clientes
      const querySQL = `
        WITH primeira_visita_cliente AS (
          SELECT 
            cli_fone,
            MIN(dt_gerencial) as primeira_visita
          FROM contahub_periodo 
          WHERE cli_fone IS NOT NULL 
            AND cli_fone != ''
            AND bar_id = $1
          GROUP BY cli_fone
        ),
        novos_clientes_mes_atual AS (
          SELECT COUNT(*) as novos_clientes
          FROM primeira_visita_cliente
          WHERE primeira_visita >= $2 || '-01'
            AND primeira_visita <= $2 || '-31'
        ),
        novos_clientes_mes_anterior AS (
          SELECT COUNT(*) as novos_clientes
          FROM primeira_visita_cliente
          WHERE primeira_visita >= $3 || '-01'
            AND primeira_visita <= $3 || '-31'
        ),
        clientes_mes_atual AS (
          SELECT 
            COUNT(DISTINCT cp.cli_fone) as total_clientes,
            COUNT(CASE WHEN pv.primeira_visita >= $2 || '-01' AND pv.primeira_visita <= $2 || '-31' THEN 1 END) as novos,
            COUNT(CASE WHEN pv.primeira_visita < $2 || '-01' THEN 1 END) as recorrentes
          FROM contahub_periodo cp
          JOIN primeira_visita_cliente pv ON cp.cli_fone = pv.cli_fone
          WHERE cp.dt_gerencial >= $2 || '-01' 
            AND cp.dt_gerencial <= $2 || '-31'
            AND cp.bar_id = $1
        )
        SELECT 
          nma.novos_clientes as novos_mes_atual,
          nman.novos_clientes as novos_mes_anterior,
          cma.total_clientes,
          cma.novos,
          cma.recorrentes,
          CASE 
            WHEN nman.novos_clientes > 0 
            THEN ROUND(((nma.novos_clientes - nman.novos_clientes)::numeric / nman.novos_clientes::numeric) * 100, 2)
            ELSE 0 
          END as variacao_percentual
        FROM novos_clientes_mes_atual nma,
             novos_clientes_mes_anterior nman,
             clientes_mes_atual cma
      `;

      const { data: resultadoSQL, error: erroSQL } = await supabase.rpc('execute_sql', {
        query: querySQL,
        params: [barIdNum, mesAtualStr, mesAnteriorStr]
      });

      if (erroSQL) {
        console.error('❌ Erro na query SQL:', erroSQL);
        
        // Fallback: query mais simples
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('contahub_periodo')
          .select('cli_fone, dt_gerencial')
          .eq('bar_id', barIdNum)
          .not('cli_fone', 'is', null)
          .gte('dt_gerencial', `${mesAnteriorStr}-01`)
          .lte('dt_gerencial', `${mesAtualStr}-31`);

        if (fallbackError) {
          throw fallbackError;
        }

        // Processar dados manualmente
        const clientesPrimeiraVisita = new Map<string, string>();
        
        fallbackData?.forEach(registro => {
          const fone = registro.cli_fone;
          const data = registro.dt_gerencial;
          
          if (!clientesPrimeiraVisita.has(fone) || data < clientesPrimeiraVisita.get(fone)!) {
            clientesPrimeiraVisita.set(fone, data);
          }
        });

        let novosClientesMesAtual = 0;
        let novosClientesMesAnterior = 0;

        clientesPrimeiraVisita.forEach((primeiraVisita, fone) => {
          if (primeiraVisita.startsWith(mesAtualStr)) {
            novosClientesMesAtual++;
          } else if (primeiraVisita.startsWith(mesAnteriorStr)) {
            novosClientesMesAnterior++;
          }
        });

        const variacao = novosClientesMesAnterior > 0 
          ? ((novosClientesMesAtual - novosClientesMesAnterior) / novosClientesMesAnterior) * 100 
          : 0;

        return NextResponse.json({
          success: true,
          data: {
            mesAtual: {
              mes: mesAtualStr,
              novosClientes: novosClientesMesAtual,
              nome: new Date(parseInt(ano), parseInt(mesNum) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            },
            mesAnterior: {
              mes: mesAnteriorStr,
              novosClientes: novosClientesMesAnterior,
              nome: mesAnterior.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            },
            variacao: {
              absoluta: novosClientesMesAtual - novosClientesMesAnterior,
              percentual: Math.round(variacao * 100) / 100
            },
            meta: 3000, // Meta padrão
            detalhes: {
              totalClientesUnicos: clientesPrimeiraVisita.size,
              metodo: 'fallback'
            }
          }
        });
      }

      // Processar resultado da query SQL
      const resultado = resultadoSQL?.[0];
      
      return NextResponse.json({
        success: true,
        data: {
          mesAtual: {
            mes: mesAtualStr,
            novosClientes: resultado?.novos_mes_atual || 0,
            nome: new Date(parseInt(ano), parseInt(mesNum) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          },
          mesAnterior: {
            mes: mesAnteriorStr,
            novosClientes: resultado?.novos_mes_anterior || 0,
            nome: mesAnterior.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          },
          variacao: {
            absoluta: (resultado?.novos_mes_atual || 0) - (resultado?.novos_mes_anterior || 0),
            percentual: resultado?.variacao_percentual || 0
          },
          meta: 3000, // Meta padrão
          detalhes: {
            totalClientesUnicos: resultado?.total_clientes || 0,
            novos: resultado?.novos || 0,
            recorrentes: resultado?.recorrentes || 0,
            metodo: 'sql_direto'
          }
        }
      });
    }

    // Se chegou aqui, a função RPC funcionou
    const resultado = novosClientesData?.[0];
    
    return NextResponse.json({
      success: true,
      data: {
        mesAtual: {
          mes: mesAtualStr,
          novosClientes: resultado?.novos_mes_atual || 0,
          nome: new Date(parseInt(ano), parseInt(mesNum) - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        },
        mesAnterior: {
          mes: mesAnteriorStr,
          novosClientes: resultado?.novos_mes_anterior || 0,
          nome: mesAnterior.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        },
        variacao: {
          absoluta: (resultado?.novos_mes_atual || 0) - (resultado?.novos_mes_anterior || 0),
          percentual: resultado?.variacao_percentual || 0
        },
        meta: 3000, // Meta padrão
        detalhes: {
          totalClientesUnicos: resultado?.total_clientes || 0,
          metodo: 'rpc'
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao calcular novos clientes:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}
