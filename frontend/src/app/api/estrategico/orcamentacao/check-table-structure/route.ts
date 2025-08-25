import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('bar_id') || '3';

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Verificar se a tabela existe e pegar estrutura
    const { data: tableInfo, error: tableError } = await supabase
      .from('nibo_agendamentos')
      .select('*')
      .limit(1);

    if (tableError) {
      return NextResponse.json({
        success: false,
        error: 'Tabela nibo_agendamentos não encontrada',
        details: tableError
      });
    }

    // 2. Contar total de registros
    const { count: totalCount } = await supabase
      .from('nibo_agendamentos')
      .select('*', { count: 'exact', head: true });

    // 3. Contar registros para bar_id específico
    const { count: barCount } = await supabase
      .from('nibo_agendamentos')
      .select('*', { count: 'exact', head: true })
      .eq('bar_id', parseInt(barId));

    // 4. Buscar alguns registros para análise
    const { data: sampleData } = await supabase
      .from('nibo_agendamentos')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .limit(5);

    // 5. Verificar campos específicos que estamos usando
    const { data: fieldsCheck } = await supabase
      .from('nibo_agendamentos')
      .select('categoria_nome, data_competencia, status, valor, tipo')
      .eq('bar_id', parseInt(barId))
      .limit(3);

    // 6. Buscar por diferentes variações de data
    const { data: dateVariations } = await supabase
      .from('nibo_agendamentos')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .or('data_competencia.gte.2025-01-01,data_vencimento.gte.2025-01-01,created_at.gte.2025-01-01')
      .limit(5);

    // 7. Verificar estrutura das colunas
    const colunas = tableInfo && tableInfo.length > 0 ? Object.keys(tableInfo[0]) : [];

    return NextResponse.json({
      success: true,
      estrutura: {
        total_registros_tabela: totalCount,
        registros_bar_id: barCount,
        colunas_disponiveis: colunas,
        amostra_dados: sampleData,
        campos_especificos: fieldsCheck,
        variacoes_data: dateVariations
      },
      analise: {
        tabela_existe: !!tableInfo,
        tem_dados_bar: (barCount || 0) > 0,
        tem_categoria_nome: colunas.includes('categoria_nome'),
        tem_data_competencia: colunas.includes('data_competencia'),
        tem_status: colunas.includes('status'),
        tem_valor: colunas.includes('valor')
      }
    });

  } catch (error) {
    console.error('Erro ao verificar estrutura:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: error },
      { status: 500 }
    );
  }
}
