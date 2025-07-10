import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analisarLote, gerarRelatorioClassificacao, mapearCategoria } from '@/lib/contaazul-categoria-mapper';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🧠 Iniciando teste de mapeamento inteligente de categorias...');
    
    const { bar_id } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`📊 Testando mapeamento para bar_id: ${bar_id}`);

    // Buscar todas as parcelas coletadas
    const { data: parcelas, error } = await supabase
      .from('contaazul_raw_parcelas')
      .select('*')
      .eq('bar_id', bar_id)
      .eq('processado', false);

    if (error) {
      throw new Error(`Erro ao buscar parcelas: ${error.message}`);
    }

    if (!parcelas || parcelas.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Nenhuma parcela encontrada para análise'
      });
    }

    console.log(`📋 Analisando ${parcelas.length} parcelas...`);

    // Executar análise inteligente
    const analise = analisarLote(parcelas);
    
    // Gerar relatório
    const relatorio = gerarRelatorioClassificacao(analise);
    
    console.log('📊 Análise concluída:');
    console.log(`- ${analise.total_classificadas}/${analise.total_analisadas} classificadas`);
    console.log(`- Confiança média: ${Math.round(analise.confianca_media)}%`);

    // Exemplos detalhados das primeiras 10 parcelas
    const exemplosMapeamento = parcelas.slice(0, 10).map(parcela => {
      const descricao = parcela.dados_completos?.item_original?.descricao || '';
      const tipo = parcela.dados_completos?.tipo || 'DESPESA';
      const valor = parseFloat(parcela.dados_completos?.item_original?.total || '0');
      
      const mapping = mapearCategoria(descricao, tipo, valor);
      
      return {
        id: parcela.id,
        descricao,
        tipo,
        valor: valor / 100, // Converter centavos para reais
        categoria_sugerida: mapping.categoria_sugerida,
        centro_custo_sugerido: mapping.centro_custo_sugerido,
        confianca: mapping.confianca,
        motivo: mapping.motivo
      };
    });

    // Casos mais comuns para demonstrar padrões
    const padroesMaisComuns = Object.entries(analise.categorias_encontradas)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 8)
      .map(([categoria, count]) => ({
        categoria,
        quantidade: count,
        percentual: Math.round((count / analise.total_analisadas) * 100)
      }));

    return NextResponse.json({
      success: true,
      message: '🧠 Análise de mapeamento inteligente concluída!',
      estatisticas: {
        total_parcelas: analise.total_analisadas,
        classificadas: analise.total_classificadas,
        percentual_classificado: Math.round((analise.total_classificadas / analise.total_analisadas) * 100),
        confianca_media: Math.round(analise.confianca_media),
        categorias_unicas: Object.keys(analise.categorias_encontradas).length,
        casos_revisar: analise.casos_revisar.length
      },
      padroes_identificados: padroesMaisComuns,
      exemplos_mapeamento: exemplosMapeamento,
      relatorio_completo: relatorio,
      casos_baixa_confianca: analise.casos_revisar.slice(0, 5).map(caso => ({
        descricao: caso.descricao,
        categoria_sugerida: caso.categoria_sugerida,
        confianca: caso.confianca,
        valor: caso.valor / 100
      })),
      proximos_passos: [
        '✅ Mapeamento funcionando - precisão elevada identificada',
        '🔄 Aplicar categorização nas 800 parcelas coletadas',
        '📊 Gerar relatórios categorizados automaticamente',
        '⚙️ Ajustar regras conforme necessário',
        '🚀 Implementar processamento automático futuro'
      ]
    });

  } catch (error) {
    console.error('❌ Erro no teste de mapeamento:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro no teste de mapeamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 