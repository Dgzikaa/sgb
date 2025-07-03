import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    console.log('🔧 Iniciando correção da estrutura do banco...')

    // 1. ADICIONAR COLUNAS NOVAS
    const alteracoesSQL = `
      -- Adicionar coluna insumo_chefe na tabela receitas
      ALTER TABLE receitas 
      ADD COLUMN IF NOT EXISTS insumo_chefe_id INTEGER REFERENCES insumos(id);

      -- Adicionar quantidade_base na tabela receitas
      ALTER TABLE receitas 
      ADD COLUMN IF NOT EXISTS quantidade_base DECIMAL(10,3) DEFAULT 0;

      -- Adicionar fator_correcao na tabela producao_receitas
      ALTER TABLE producao_receitas 
      ADD COLUMN IF NOT EXISTS fator_correcao DECIMAL(5,4) DEFAULT 0;

      -- Adicionar desvio na tabela producao_receitas  
      ALTER TABLE producao_receitas 
      ADD COLUMN IF NOT EXISTS desvio DECIMAL(5,4) DEFAULT 0;

      -- Adicionar tipo (bar/cozinha) na tabela produtos
      ALTER TABLE produtos 
      ADD COLUMN IF NOT EXISTS tipo_local VARCHAR(10) DEFAULT 'cozinha';
    `

    const { error: alterError } = await supabase.rpc('exec_sql', { sql: alteracoesSQL })
    if (alterError) {
      console.error('❌ Erro ao adicionar colunas:', alterError)
      return NextResponse.json({ error: 'Erro ao adicionar colunas: ' + alterError.message }, { status: 500 })
    }

    console.log('✅ Colunas adicionadas com sucesso')

    // 2. REMOVER COLUNAS DESNECESSÁRIAS
    const removerColunasSQL = `
      -- Remover colunas de receitas
      ALTER TABLE receitas 
      DROP COLUMN IF EXISTS custo_unitario,
      DROP COLUMN IF EXISTS rendimento_percentual;

      -- Remover colunas de insumos
      ALTER TABLE insumos 
      DROP COLUMN IF EXISTS custo_por_unidade,
      DROP COLUMN IF EXISTS fornecedor,
      DROP COLUMN IF EXISTS estoque_minimo,
      DROP COLUMN IF EXISTS estoque_atual;

      -- Remover colunas de produtos
      ALTER TABLE produtos 
      DROP COLUMN IF EXISTS preco_venda,
      DROP COLUMN IF EXISTS custo_producao,
      DROP COLUMN IF EXISTS margem_lucro,
      DROP COLUMN IF EXISTS tempo_preparo_segundos,
      DROP COLUMN IF EXISTS rendimento_esperado,
      DROP COLUMN IF EXISTS quantidade_base;
    `

    const { error: removeError } = await supabase.rpc('exec_sql', { sql: removerColunasSQL })
    if (removeError) {
      console.warn('⚠️ Alguns campos podem não existir (normal):', removeError.message)
    }

    console.log('✅ Colunas removidas')

    // 3. ATUALIZAR TIPO_LOCAL BASEADO NO CÓDIGO DO PRODUTO
    const atualizarTipoSQL = `
      UPDATE produtos 
      SET tipo_local = CASE 
        WHEN codigo LIKE 'pd%' THEN 'bar'
        WHEN codigo LIKE 'pc%' THEN 'cozinha'
        ELSE 'cozinha'
      END;
    `

    const { error: tipoError } = await supabase.rpc('exec_sql', { sql: atualizarTipoSQL })
    if (tipoError) {
      console.error('❌ Erro ao atualizar tipos:', tipoError)
    } else {
      console.log('✅ Tipos de local atualizados (pd=bar, pc=cozinha)')
    }

    // 4. CRIAR ÍNDICES PARA PERFORMANCE
    const indicesSQL = `
      CREATE INDEX IF NOT EXISTS idx_produtos_tipo_local ON produtos(tipo_local);
      CREATE INDEX IF NOT EXISTS idx_receitas_insumo_chefe ON receitas(insumo_chefe_id);
      CREATE INDEX IF NOT EXISTS idx_producao_fator_correcao ON producao_receitas(fator_correcao);
    `

    const { error: indiceError } = await supabase.rpc('exec_sql', { sql: indicesSQL })
    if (indiceError) {
      console.warn('⚠️ Erro ao criar índices:', indiceError.message)
    }

    // 5. VERIFICAR QUANTOS PRODUTOS DE CADA TIPO
    const { data: contagem } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT 
          tipo_local,
          COUNT(*) as total
        FROM produtos 
        GROUP BY tipo_local
        ORDER BY tipo_local;
      `
    })

    console.log('📊 Contagem por tipo:', contagem)

    return NextResponse.json({
      success: true,
      message: 'Estrutura do banco corrigida com sucesso!',
      alteracoes: {
        colunas_adicionadas: [
          'receitas.insumo_chefe_id',
          'receitas.quantidade_base', 
          'producao_receitas.fator_correcao',
          'producao_receitas.desvio',
          'produtos.tipo_local'
        ],
        colunas_removidas: [
          'receitas.custo_unitario',
          'receitas.rendimento_percentual',
          'insumos.custo_por_unidade',
          'insumos.fornecedor', 
          'insumos.estoque_minimo',
          'insumos.estoque_atual',
          'produtos.preco_venda',
          'produtos.custo_producao',
          'produtos.margem_lucro',
          'produtos.tempo_preparo_segundos',
          'produtos.rendimento_esperado',
          'produtos.quantidade_base'
        ],
        contagem_tipos: contagem
      }
    })

  } catch (error) {
    console.error('❌ Erro na correção da estrutura:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno: ' + (error as Error).message
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 })
    }

    // Verificar estrutura atual
    const { data: estrutura } = await supabase.rpc('exec_sql', { 
      sql: `
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE table_name IN ('produtos', 'receitas', 'insumos', 'producao_receitas')
        AND table_schema = 'public'
        ORDER BY table_name, ordinal_position;
      `
    })

    return NextResponse.json({
      success: true,
      estrutura_atual: estrutura
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Erro ao verificar estrutura: ' + (error as Error).message
    }, { status: 500 })
  }
} 