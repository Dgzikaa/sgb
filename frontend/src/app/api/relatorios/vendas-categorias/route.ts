import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ano = searchParams.get('ano') || new Date().getFullYear().toString();
    const data_inicio = searchParams.get('data_inicio') || `${ano}-01-01`;
    const data_fim = searchParams.get('data_fim') || `${ano}-12-31`;

    // Query para agregar vendas por categoria
    const query = `
      WITH categorias AS (
        SELECT 
          CASE 
            -- DRINKS
            WHEN grp_desc IN ('Drinks Autorais', 'Drinks Classicos', 'Drinks Clássicos', 
                              'Drinks Prontos', 'Drinks sem Álcool', 'Drinks Mocktails',
                              'Dose Dupla', 'Dose Dupla!', 'Dose Dupla Sem Álcool', 'Doses',
                              'Shots e Doses', 'Festival de Caipi', 'Festival de Moscow Mule',
                              'Fest Moscow') THEN 'DRINKS'
            -- CERVEJAS
            WHEN grp_desc IN ('Cervejas', 'Baldes') THEN 'CERVEJAS'
            -- COMIDAS
            WHEN grp_desc IN ('Petiscos', 'Pratos Individuais', 'Pratos Para Compartilhar - P/ 4 Pessoas',
                              'Sandubas', 'Sanduíches', 'Chapas e Parrilla', 'Pastel',
                              'Sobremesa', 'Sobremesas', 'Adicionais', 'Espressos') THEN 'COMIDAS'
            ELSE 'OUTROS'
          END as categoria,
          qtd,
          valorfinal,
          trn_dtgerencial
        FROM contahub_analitico
        WHERE trn_dtgerencial >= $1
          AND trn_dtgerencial <= $2
          AND grp_desc NOT IN ('Insumos', 'Mercadorias- Compras', 'Uso Interno')
          AND qtd > 0
      )
      SELECT 
        categoria,
        ROUND(SUM(qtd)::numeric, 2) as quantidade_total,
        ROUND(SUM(valorfinal)::numeric, 2) as faturamento_total,
        COUNT(*) as num_vendas
      FROM categorias
      WHERE categoria IN ('DRINKS', 'CERVEJAS', 'COMIDAS')
      GROUP BY categoria
      ORDER BY quantidade_total DESC
    `;

    const { data, error } = await supabase.rpc('exec_sql', {
      query_text: query,
      params: [data_inicio, data_fim]
    });

    if (error) {
      // Fallback: usar query direta sem RPC
      const { data: dataFallback, error: errorFallback } = await supabase
        .from('contahub_analitico')
        .select('grp_desc, qtd, valorfinal, trn_dtgerencial')
        .gte('trn_dtgerencial', data_inicio)
        .lte('trn_dtgerencial', data_fim)
        .not('grp_desc', 'in', '("Insumos","Mercadorias- Compras","Uso Interno")')
        .gt('qtd', 0);

      if (errorFallback) throw errorFallback;

      // Processar dados no backend
      const categorias = {
        DRINKS: { quantidade_total: 0, faturamento_total: 0, num_vendas: 0 },
        CERVEJAS: { quantidade_total: 0, faturamento_total: 0, num_vendas: 0 },
        COMIDAS: { quantidade_total: 0, faturamento_total: 0, num_vendas: 0 },
        OUTROS: { quantidade_total: 0, faturamento_total: 0, num_vendas: 0 }
      };

      const categoriasMap: Record<string, keyof typeof categorias> = {
        'Drinks Autorais': 'DRINKS',
        'Drinks Classicos': 'DRINKS',
        'Drinks Clássicos': 'DRINKS',
        'Drinks Prontos': 'DRINKS',
        'Drinks sem Álcool': 'DRINKS',
        'Drinks Mocktails': 'DRINKS',
        'Dose Dupla': 'DRINKS',
        'Dose Dupla!': 'DRINKS',
        'Dose Dupla Sem Álcool': 'DRINKS',
        'Doses': 'DRINKS',
        'Shots e Doses': 'DRINKS',
        'Festival de Caipi': 'DRINKS',
        'Festival de Moscow Mule': 'DRINKS',
        'Fest Moscow': 'DRINKS',
        'Cervejas': 'CERVEJAS',
        'Baldes': 'CERVEJAS',
        'Petiscos': 'COMIDAS',
        'Pratos Individuais': 'COMIDAS',
        'Pratos Para Compartilhar - P/ 4 Pessoas': 'COMIDAS',
        'Sandubas': 'COMIDAS',
        'Sanduíches': 'COMIDAS',
        'Chapas e Parrilla': 'COMIDAS',
        'Pastel': 'COMIDAS',
        'Sobremesa': 'COMIDAS',
        'Sobremesas': 'COMIDAS',
        'Adicionais': 'COMIDAS',
        'Espressos': 'COMIDAS'
      };

      dataFallback?.forEach(item => {
        const categoria = categoriasMap[item.grp_desc || ''] || 'OUTROS';
        categorias[categoria].quantidade_total += parseFloat(item.qtd?.toString() || '0');
        categorias[categoria].faturamento_total += parseFloat(item.valorfinal?.toString() || '0');
        categorias[categoria].num_vendas += 1;
      });

      const resultado = Object.entries(categorias)
        .filter(([key]) => key !== 'OUTROS')
        .map(([categoria, valores]) => ({
          categoria,
          quantidade_total: Math.round(valores.quantidade_total * 100) / 100,
          faturamento_total: Math.round(valores.faturamento_total * 100) / 100,
          num_vendas: valores.num_vendas
        }))
        .sort((a, b) => b.quantidade_total - a.quantidade_total);

      return NextResponse.json({
        success: true,
        data: resultado,
        periodo: {
          data_inicio,
          data_fim,
          ano
        }
      });
    }

    return NextResponse.json({
      success: true,
      data,
      periodo: {
        data_inicio,
        data_fim,
        ano
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao buscar vendas por categoria:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar vendas por categoria',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
