import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dataReferencia = searchParams.get('data');
    const barId = searchParams.get('bar_id') || '3';
    
    if (!dataReferencia) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetro data é obrigatório'
      }, { status: 400 });
    }
    
    console.log(`📦 Buscando dados de stockout para data: ${dataReferencia}, bar: ${barId}`);
    
    // Buscar dados de stockout para a data específica
    const { data: stockoutData, error } = await supabase
      .from('contahub_stockout')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('data_consulta', dataReferencia)
      .order('produto_nome');
    
    if (error) {
      console.error('❌ Erro ao buscar dados de stockout:', error);
      throw new Error(`Erro na consulta: ${error.message}`);
    }
    
    if (!stockoutData || stockoutData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum dado de stockout encontrado para esta data',
        data: {
          data_consulta: dataReferencia,
          bar_id: parseInt(barId),
          total_produtos: 0,
          produtos_ativos: 0,
          produtos_inativos: 0,
          percentual_stockout: '0.00%',
          produtos: []
        }
      });
    }
    
    // Calcular estatísticas
    const totalProdutos = stockoutData.length;
    const produtosAtivos = stockoutData.filter(p => p.produto_ativo).length;
    const produtosInativos = totalProdutos - produtosAtivos;
    const percentualStockout = totalProdutos > 0 ? ((produtosInativos / totalProdutos) * 100).toFixed(2) : '0.00';
    
    // Separar produtos por status
    const produtosAtivosList = stockoutData.filter(p => p.produto_ativo);
    const produtosInativosList = stockoutData.filter(p => !p.produto_ativo);
    
    // Agrupar por grupo/categoria
    const gruposAtivos = produtosAtivosList.reduce((acc, produto) => {
      const grupo = produto.grupo_produto || 'Sem grupo';
      if (!acc[grupo]) acc[grupo] = [];
      acc[grupo].push(produto);
      return acc;
    }, {} as Record<string, any[]>);
    
    const gruposInativos = produtosInativosList.reduce((acc, produto) => {
      const grupo = produto.grupo_produto || 'Sem grupo';
      if (!acc[grupo]) acc[grupo] = [];
      acc[grupo].push(produto);
      return acc;
    }, {} as Record<string, any[]>);
    
    const resultado = {
      data_consulta: dataReferencia,
      bar_id: parseInt(barId),
      timestamp_consulta: new Date().toISOString(),
      estatisticas: {
        total_produtos: totalProdutos,
        produtos_ativos: produtosAtivos,
        produtos_inativos: produtosInativos,
        percentual_stockout: `${percentualStockout}%`,
        percentual_disponibilidade: `${(100 - parseFloat(percentualStockout)).toFixed(2)}%`
      },
      produtos: {
        ativos: produtosAtivosList.map(p => ({
          produto_id: p.produto_id,
          produto_nome: p.produto_nome,
          grupo_produto: p.grupo_produto,
          categoria_produto: p.categoria_produto,
          data_consulta: p.data_consulta,
          hora_consulta: p.hora_consulta
        })),
        inativos: produtosInativosList.map(p => ({
          produto_id: p.produto_id,
          produto_nome: p.produto_nome,
          grupo_produto: p.grupo_produto,
          categoria_produto: p.categoria_produto,
          data_consulta: p.data_consulta,
          hora_consulta: p.hora_consulta
        }))
      },
      grupos: {
        ativos: Object.keys(gruposAtivos).map(grupo => ({
          grupo: grupo,
          quantidade: gruposAtivos[grupo].length,
          produtos: gruposAtivos[grupo].map(p => p.produto_nome)
        })),
        inativos: Object.keys(gruposInativos).map(grupo => ({
          grupo: grupo,
          quantidade: gruposInativos[grupo].length,
          produtos: gruposInativos[grupo].map(p => p.produto_nome)
        }))
      }
    };
    
    console.log(`✅ Dados de stockout encontrados: ${totalProdutos} produtos, ${percentualStockout}% stockout`);
    
    return NextResponse.json({
      success: true,
      message: `Dados de stockout para ${dataReferencia}`,
      data: resultado
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar dados de stockout:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data_inicio, data_fim, bar_id = 3 } = body;
    
    if (!data_inicio || !data_fim) {
      return NextResponse.json({
        success: false,
        error: 'Parâmetros data_inicio e data_fim são obrigatórios'
      }, { status: 400 });
    }
    
    console.log(`📦 Buscando histórico de stockout de ${data_inicio} até ${data_fim}, bar: ${bar_id}`);
    
    // Buscar dados de stockout para o período
    const { data: stockoutData, error } = await supabase
      .from('contahub_stockout')
      .select('data_consulta, produto_ativo, produto_id, produto_nome, grupo_produto')
      .eq('bar_id', bar_id)
      .gte('data_consulta', data_inicio)
      .lte('data_consulta', data_fim)
      .order('data_consulta', { ascending: false });
    
    if (error) {
      console.error('❌ Erro ao buscar histórico de stockout:', error);
      throw new Error(`Erro na consulta: ${error.message}`);
    }
    
    if (!stockoutData || stockoutData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum dado de stockout encontrado para este período',
        data: {
          periodo: { data_inicio, data_fim },
          bar_id,
          historico: []
        }
      });
    }
    
    // Agrupar por data
    const dadosPorData = stockoutData.reduce((acc, item) => {
      const data = item.data_consulta;
      if (!acc[data]) {
        acc[data] = { ativos: [], inativos: [] };
      }
      
      if (item.produto_ativo) {
        acc[data].ativos.push(item);
      } else {
        acc[data].inativos.push(item);
      }
      
      return acc;
    }, {} as Record<string, { ativos: any[], inativos: any[] }>);
    
    // Calcular estatísticas por data
    const historico = Object.keys(dadosPorData).map(data => {
      const dadosData = dadosPorData[data];
      const totalProdutos = dadosData.ativos.length + dadosData.inativos.length;
      const produtosAtivos = dadosData.ativos.length;
      const produtosInativos = dadosData.inativos.length;
      const percentualStockout = totalProdutos > 0 ? ((produtosInativos / totalProdutos) * 100).toFixed(2) : '0.00';
      
      return {
        data_consulta: data,
        total_produtos: totalProdutos,
        produtos_ativos: produtosAtivos,
        produtos_inativos: produtosInativos,
        percentual_stockout: `${percentualStockout}%`,
        percentual_disponibilidade: `${(100 - parseFloat(percentualStockout)).toFixed(2)}%`
      };
    });
    
    // Calcular médias do período
    const totalDias = historico.length;
    const mediaStockout = totalDias > 0 ? 
      (historico.reduce((sum, dia) => sum + parseFloat(dia.percentual_stockout.replace('%', '')), 0) / totalDias).toFixed(2) : '0.00';
    
    const resultado = {
      periodo: { data_inicio, data_fim },
      bar_id,
      resumo: {
        total_dias: totalDias,
        media_stockout: `${mediaStockout}%`,
        media_disponibilidade: `${(100 - parseFloat(mediaStockout)).toFixed(2)}%`
      },
      historico: historico.sort((a, b) => b.data_referencia.localeCompare(a.data_referencia))
    };
    
    console.log(`✅ Histórico de stockout encontrado: ${totalDias} dias, média ${mediaStockout}% stockout`);
    
    return NextResponse.json({
      success: true,
      message: `Histórico de stockout de ${data_inicio} até ${data_fim}`,
      data: resultado
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar histórico de stockout:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
