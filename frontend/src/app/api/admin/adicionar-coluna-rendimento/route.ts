import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseClient()
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao conectar com banco' 
      }, { status: 500 })
    }

    console.log('🔧 Verificando se coluna rendimento_esperado existe...')

    // Tentar fazer um select para verificar se a coluna existe
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('rendimento_esperado')
        .limit(1)

      if (!error) {
        console.log('✅ Coluna rendimento_esperado já existe')
        return NextResponse.json({
          success: true,
          message: 'Coluna rendimento_esperado já existe e está configurada',
          proximos_passos: 'Agora você pode importar os rendimentos esperados da planilha'
        })
      } else {
        // Coluna não existe, retornar SQL para executar
        return NextResponse.json({
          success: false,
          error: 'Coluna rendimento_esperado não existe na tabela produtos',
          sql_para_executar: `-- Execute este SQL no Supabase SQL Editor:
ALTER TABLE produtos 
ADD COLUMN rendimento_esperado DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN produtos.rendimento_esperado IS 'Rendimento esperado em gramas para esta receita';

-- Atualizar alguns produtos de exemplo
UPDATE produtos SET rendimento_esperado = 150 WHERE codigo = 'pc0001';
UPDATE produtos SET rendimento_esperado = 1000 WHERE codigo = 'pc0005';
UPDATE produtos SET rendimento_esperado = 200 WHERE codigo = 'pc0011';`,
          proximos_passos: [
            '1. Acesse https://supabase.com/dashboard',
            '2. Selecione seu projeto: uqtgsvujwcbymjmvkjhy',
            '3. Vá em "SQL Editor"',
            '4. Execute o SQL acima',
            '5. Volte aqui e tente importar os rendimentos'
          ]
        })
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao verificar tabela produtos: ' + (error as Error).message,
        sql_para_executar: `-- Execute este SQL no Supabase SQL Editor:
ALTER TABLE produtos 
ADD COLUMN rendimento_esperado DECIMAL(10,2) DEFAULT 0;

COMMENT ON COLUMN produtos.rendimento_esperado IS 'Rendimento esperado em gramas para esta receita';`,
        proximos_passos: [
          '1. Acesse https://supabase.com/dashboard', 
          '2. Vá em "SQL Editor"',
          '3. Execute o SQL acima'
        ]
      })
    }

  } catch (error) {
    console.error('❌ Erro ao verificar coluna:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno: ' + (error as Error).message
    }, { status: 500 })
  }
} 