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

    // Query para agregar vendas por categoria usando loc_desc e grp_desc
    const query = `
      WITH categorias AS (
        SELECT 
          CASE 
            -- CERVEJAS (Chopp, Baldes e cervejas do Bar)
            WHEN loc_desc IN ('Chopp', 'Baldes') AND grp_desc IN ('Cervejas', 'Baldes', 'Happy Hour') THEN 'CERVEJAS'
            WHEN loc_desc = 'Bar' AND grp_desc IN ('Cervejas', 'Baldes') THEN 'CERVEJAS'
            
            -- NÃO ALCOÓLICOS (bebidas sem álcool, refrigerantes, águas, sucos, energéticos)
            WHEN loc_desc = 'Bar' AND grp_desc = 'Bebidas Não Alcoólicas' THEN 'NÃO ALCOÓLICOS'
            WHEN grp_desc IN ('Drinks sem Álcool') THEN 'NÃO ALCOÓLICOS'
            
            -- DRINKS ALCOÓLICOS (Montados, Batidos, Preshh, Mexido, Shot e Dose e drinks do Bar)
            WHEN loc_desc IN ('Montados', 'Batidos', 'Preshh', 'Mexido', 'Shot e Dose') THEN 'DRINKS'
            WHEN loc_desc = 'Bar' AND grp_desc IN ('Drinks Autorais', 'Drinks Classicos', 'Drinks Clássicos',
                                                    'Drinks Prontos', 'Dose Dupla',
                                                    'Doses', 'Combos', 'Vinhos', 'Bebidas Prontas',
                                                    'Happy Hour', 'Fest Moscow') THEN 'DRINKS'
            
            -- COMIDAS (Cozinha 1 e Cozinha 2)
            WHEN loc_desc IN ('Cozinha 1', 'Cozinha 2') THEN 'COMIDAS'
            
            ELSE 'OUTROS'
          END as categoria,
          qtd,
          valorfinal,
          trn_dtgerencial
        FROM contahub_analitico
        WHERE trn_dtgerencial >= $1
          AND trn_dtgerencial <= $2
          AND bar_id = 3
          AND grp_desc NOT IN ('Insumos', 'Mercadorias- Compras', 'Uso Interno')
          AND qtd > 0
      )
      SELECT 
        categoria,
        ROUND(SUM(qtd)::numeric, 2) as quantidade_total,
        ROUND(SUM(valorfinal)::numeric, 2) as faturamento_total,
        COUNT(*) as num_vendas
      FROM categorias
      WHERE categoria IN ('DRINKS', 'CERVEJAS', 'COMIDAS', 'NÃO ALCOÓLICOS')
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
        .select('loc_desc, grp_desc, qtd, valorfinal, trn_dtgerencial')
        .gte('trn_dtgerencial', data_inicio)
        .lte('trn_dtgerencial', data_fim)
        .eq('bar_id', 3)
        .not('grp_desc', 'in', '("Insumos","Mercadorias- Compras","Uso Interno")')
        .gt('qtd', 0);

      if (errorFallback) throw errorFallback;

      // Processar dados no backend
      const categorias = {
        DRINKS: { quantidade_total: 0, faturamento_total: 0, num_vendas: 0 },
        CERVEJAS: { quantidade_total: 0, faturamento_total: 0, num_vendas: 0 },
        COMIDAS: { quantidade_total: 0, faturamento_total: 0, num_vendas: 0 },
        'NÃO ALCOÓLICOS': { quantidade_total: 0, faturamento_total: 0, num_vendas: 0 },
        OUTROS: { quantidade_total: 0, faturamento_total: 0, num_vendas: 0 }
      };

      dataFallback?.forEach(item => {
        const loc = item.loc_desc || '';
        const grp = item.grp_desc || '';
        let categoria: keyof typeof categorias = 'OUTROS';

        // CERVEJAS
        if ((loc === 'Chopp' || loc === 'Baldes') && ['Cervejas', 'Baldes', 'Happy Hour'].includes(grp)) {
          categoria = 'CERVEJAS';
        } else if (loc === 'Bar' && ['Cervejas', 'Baldes'].includes(grp)) {
          categoria = 'CERVEJAS';
        }
        // NÃO ALCOÓLICOS
        else if (loc === 'Bar' && grp === 'Bebidas Não Alcoólicas') {
          categoria = 'NÃO ALCOÓLICOS';
        } else if (grp === 'Drinks sem Álcool') {
          categoria = 'NÃO ALCOÓLICOS';
        }
        // DRINKS ALCOÓLICOS
        else if (['Montados', 'Batidos', 'Preshh', 'Mexido', 'Shot e Dose'].includes(loc)) {
          categoria = 'DRINKS';
        } else if (loc === 'Bar' && ['Drinks Autorais', 'Drinks Classicos', 'Drinks Clássicos',
                                      'Drinks Prontos', 'Dose Dupla',
                                      'Doses', 'Combos', 'Vinhos', 'Bebidas Prontas',
                                      'Happy Hour', 'Fest Moscow'].includes(grp)) {
          categoria = 'DRINKS';
        }
        // COMIDAS
        else if (['Cozinha 1', 'Cozinha 2'].includes(loc)) {
          categoria = 'COMIDAS';
        }

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
