import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Listar todas as tabelas no schema public
    const { data: tables, error } = await supabase.rpc('get_table_list', {});
    
    if (error) {
      // Se a função RPC não existir, vamos tentar uma abordagem mais simples
      console.log('RPC não existe, tentando abordagem alternativa...');
      
      // Vamos tentar algumas tabelas conhecidas
      const testTables = [
        'contaazul_configuracoes',
        'contaazul_visao_competencia',
        'contaazul_categorias',
        'contaazul_centros_custo',
        'contaazul_contas_financeiras',
        'users',
        'bars',
        'bar_users',
      ];
      
      const results = [];
      
      for (const tableName of testTables) {
        try {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
          
          results.push({
            table: tableName,
            exists: !error,
            error: error?.message || null,
            has_data: data && data.length > 0,
          });
        } catch (err) {
          results.push({
            table: tableName,
            exists: false,
            error: err instanceof Error ? err.message : String(err),
            has_data: false,
          });
        }
      }
      
      return NextResponse.json({
        method: 'table_test',
        results,
        summary: {
          total_tested: results.length,
          existing_tables: results.filter(r => r.exists).length,
          tables_with_data: results.filter(r => r.has_data).length,
        },
      });
    }
    
    return NextResponse.json({
      method: 'rpc_call',
      tables: tables || [],
    });

  } catch (error) {
    console.error('❌ Erro ao verificar tabelas:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
} 