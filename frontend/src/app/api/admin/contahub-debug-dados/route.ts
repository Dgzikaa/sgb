import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('🔍 Investigando estrutura dos dados ContaHub...');

    // Buscar alguns registros para análise
    const { data: registros, error } = await supabase
      .from('sistema_raw')
      .select('id, tipo_dados, data_referencia, data')
      .eq('sistema', 'contahub')
      .eq('bar_id', 3)
      .order('criado_em', { ascending: false })
      .limit(5);

    if (error) {
      throw error;
    }

    const analise = {
      total_registros: registros?.length || 0,
      amostras: [] as any[]
    };

    if (registros && registros.length > 0) {
      for (const registro of registros) {
        const dadosJSON = registro.data;
        
        const amostra = {
          id: registro.id,
          tipo_dados: registro.tipo_dados,
          data_referencia: registro.data_referencia,
          estrutura_json: {
            keys_principais: Object.keys(dadosJSON || {}),
            tem_metadados: !!dadosJSON?.metadados,
            tem_list: !!dadosJSON?.list,
            tipo_list: typeof dadosJSON?.list,
            list_e_array: Array.isArray(dadosJSON?.list),
            length_list: dadosJSON?.list?.length,
            
            // Se tem metadados, mostrar
            metadados_info: dadosJSON?.metadados ? {
              query_id: dadosJSON.metadados.query_id,
              query_nome: dadosJSON.metadados.query_nome,
              total_registros: dadosJSON.metadados.total_registros
            } : null,
            
            // Se tem list, analisar
            list_info: dadosJSON?.list ? {
              length: dadosJSON.list.length,
              primeiro_item_keys: dadosJSON.list[0] ? Object.keys(dadosJSON.list[0]) : null,
              primeiro_item_sample: dadosJSON.list[0] ? 
                Object.fromEntries(
                  Object.entries(dadosJSON.list[0]).slice(0, 5)
                ) : null
            } : null,
            
            // Verificar outros campos possíveis
            outros_arrays: Object.keys(dadosJSON || {}).filter(key => 
              Array.isArray(dadosJSON[key])
            ).map(key => ({
              campo: key,
              length: dadosJSON[key].length,
              primeiro_item_keys: dadosJSON[key][0] ? Object.keys(dadosJSON[key][0]) : null
            }))
          }
        };

        analise.amostras.push(amostra);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Análise da estrutura dos dados ContaHub',
      analise
    });

  } catch (error) {
    console.error('Erro na análise dos dados:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro ao analisar estrutura dos dados',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 