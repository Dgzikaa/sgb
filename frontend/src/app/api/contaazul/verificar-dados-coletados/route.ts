import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId') || '3';
    
    console.log('🔍 Verificando status da coleta...');

    // Buscar dados coletados
    const { data: dadosColetados } = await supabase
      .from('contaazul_raw_data')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .order('tipo_dados, pagina');

    if (!dadosColetados || dadosColetados.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhum dado coletado encontrado'
      });
    }

    // Agrupar por tipo
    const resumoColeta = {
      receitas: dadosColetados.filter(d => d.tipo_dados === 'receitas'),
      despesas: dadosColetados.filter(d => d.tipo_dados === 'despesas'),
      categorias: dadosColetados.filter(d => d.tipo_dados === 'categorias'),
      contas: dadosColetados.filter(d => d.tipo_dados === 'contas')
    };

    // Calcular estatísticas
    const estatisticas = {
      receitas: {
        paginas_coletadas: resumoColeta.receitas.length,
        total_registros: resumoColeta.receitas.reduce((sum, p) => sum + (p.total_itens || 0), 0),
        ultima_pagina_tamanho: resumoColeta.receitas[resumoColeta.receitas.length - 1]?.total_itens || 0,
        pode_ter_mais: resumoColeta.receitas[resumoColeta.receitas.length - 1]?.total_itens === 500
      },
      despesas: {
        paginas_coletadas: resumoColeta.despesas.length,
        total_registros: resumoColeta.despesas.reduce((sum, p) => sum + (p.total_itens || 0), 0),
        ultima_pagina_tamanho: resumoColeta.despesas[resumoColeta.despesas.length - 1]?.total_itens || 0,
        pode_ter_mais: resumoColeta.despesas[resumoColeta.despesas.length - 1]?.total_itens === 500
      },
      categorias: {
        paginas_coletadas: resumoColeta.categorias.length,
        total_registros: resumoColeta.categorias.reduce((sum, p) => sum + (p.total_itens || 0), 0)
      },
      contas: {
        paginas_coletadas: resumoColeta.contas.length,
        total_registros: resumoColeta.contas.reduce((sum, p) => sum + (p.total_itens || 0), 0)
      }
    };

    // Verificar dados processados
    const { data: receitasProcessadas } = await supabase
      .from('contaazul_financeiro')
      .select('id')
      .eq('bar_id', parseInt(barId))
      .eq('tipo', 'RECEITA');

    const { data: despesasProcessadas } = await supabase
      .from('contaazul_financeiro')
      .select('id')
      .eq('bar_id', parseInt(barId))
      .eq('tipo', 'DESPESA');

    const processamento = {
      receitas_processadas: receitasProcessadas?.length || 0,
      despesas_processadas: despesasProcessadas?.length || 0
    };

    // Análise se pode coletar mais dados
    const analise = {
      coleta_completa: !estatisticas.receitas.pode_ter_mais && !estatisticas.despesas.pode_ter_mais,
      pode_continuar_receitas: estatisticas.receitas.pode_ter_mais,
      pode_continuar_despesas: estatisticas.despesas.pode_ter_mais,
      recomendacao: estatisticas.receitas.pode_ter_mais || estatisticas.despesas.pode_ter_mais 
        ? 'Execute coleta novamente para buscar mais dados'
        : 'Coleta aparenta estar completa para o período 2024-2027'
    };

    console.log('📊 Status da coleta verificado:', estatisticas);

    return NextResponse.json({
      success: true,
      periodo_coletado: '2024-01-01 até 2027-01-01',
      estatisticas,
      processamento,
      analise,
      detalhes_brutos: {
        total_paginas_coletadas: dadosColetados.length,
        dados_por_tipo: {
          receitas: resumoColeta.receitas.map(r => ({ 
            pagina: r.pagina, 
            itens: r.total_itens, 
            coletado_em: r.coletado_em 
          })),
          despesas: resumoColeta.despesas.map(d => ({ 
            pagina: d.pagina, 
            itens: d.total_itens, 
            coletado_em: d.coletado_em 
          }))
        }
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao verificar dados coletados:', error);
    return NextResponse.json({ 
      error: 'Erro ao verificar dados coletados', 
      details: error.message 
    }, { status: 500 });
  }
} 