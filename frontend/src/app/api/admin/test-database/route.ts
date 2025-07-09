import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    console.log('🔍 Verificando status da tabela contaazul_raw...');

    // 1. Verificar se a tabela existe
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'contaazul_raw');

    if (tablesError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar tabelas',
        details: tablesError.message
      }, { status: 500 });
    }

    const tabelaExiste = tables && tables.length > 0;

    // 2. Se a tabela existe, contar registros
    let totalRegistros = 0;
    let ultimosRegistros = [];
    let erro_contagem = null;

    if (tabelaExiste) {
      try {
        // Contar total de registros
        const { count, error: countError } = await supabase
          .from('contaazul_raw')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          erro_contagem = countError.message;
        } else {
          totalRegistros = count || 0;
        }

        // Buscar últimos 5 registros
        const { data: registros, error: registrosError } = await supabase
          .from('contaazul_raw')
          .select('id, data_coleta, fonte, metadados')
          .order('data_coleta', { ascending: false })
          .limit(5);

        if (!registrosError && registros) {
          ultimosRegistros = registros;
        }

      } catch (e) {
        erro_contagem = e instanceof Error ? e.message : String(e);
      }
    }

    // 3. Verificar outras tabelas relacionadas
    const { data: outrasTabelas, error: outrasError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', '%contaazul%');

    return NextResponse.json({
      success: true,
      verificacao: {
        tabela_contaazul_raw: {
          existe: tabelaExiste,
          total_registros: totalRegistros,
          erro_contagem,
          ultimos_registros: ultimosRegistros
        },
        outras_tabelas_contaazul: outrasTabelas?.map(t => t.table_name) || [],
        status_geral: tabelaExiste ? 
          (totalRegistros > 0 ? 'DADOS_ENCONTRADOS' : 'TABELA_VAZIA') : 
          'TABELA_NAO_EXISTE'
      }
    });

  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    if (action === 'create_table') {
      // Criar tabela contaazul_raw se não existir
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS contaazul_raw (
          id BIGSERIAL PRIMARY KEY,
          data_coleta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          fonte TEXT NOT NULL,
          dados_brutos JSONB NOT NULL,
          metadados JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Índices para performance
        CREATE INDEX IF NOT EXISTS idx_contaazul_raw_data_coleta ON contaazul_raw(data_coleta);
        CREATE INDEX IF NOT EXISTS idx_contaazul_raw_fonte ON contaazul_raw(fonte);
        CREATE INDEX IF NOT EXISTS idx_contaazul_raw_dados_brutos ON contaazul_raw USING GIN(dados_brutos);
        
        -- Trigger para updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_contaazul_raw_updated_at ON contaazul_raw;
        CREATE TRIGGER update_contaazul_raw_updated_at
          BEFORE UPDATE ON contaazul_raw
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `;

      const { error: createError } = await supabase.rpc('execute_sql', {
        sql: createTableSQL
      });

      if (createError) {
        return NextResponse.json({
          success: false,
          error: 'Erro ao criar tabela',
          details: createError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Tabela contaazul_raw criada com sucesso',
        sql_executado: createTableSQL
      });

    } else if (action === 'test_insert') {
      // Inserir dados de teste
      const dadosTeste = {
        data_coleta: new Date().toISOString(),
        fonte: 'teste_api',
        dados_brutos: {
          teste: true,
          timestamp: new Date().toISOString(),
          dados: ['teste1', 'teste2', 'teste3']
        },
        metadados: {
          metodo: 'teste_manual',
          versao: 'v3_teste',
          total_registros: 3
        }
      };

      const { data: insertData, error: insertError } = await supabase
        .from('contaazul_raw')
        .insert([dadosTeste])
        .select();

      if (insertError) {
        return NextResponse.json({
          success: false,
          error: 'Erro ao inserir dados de teste',
          details: insertError.message
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Dados de teste inseridos com sucesso',
        dados_inseridos: insertData
      });

    } else {
      return NextResponse.json({
        success: false,
        error: 'Ação não reconhecida. Use: create_table ou test_insert'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Erro na ação:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 