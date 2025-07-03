import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase';
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Inicializar cliente Supabase
    const supabase = await getSupabaseClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Erro ao conectar com banco' }, { status: 500 });
    }

    console.log('ðŸš€ Iniciando inserÃ§Ã£o dos dados do Getin')
    
    // Caminho para o arquivo SQL
    const sqlFilePath = path.join(process.cwd(), '..', 'tests', 'getin', 'upsert_reservas_junho.sql')
    
    // Verificar se arquivo existe
    if (!fs.existsSync(sqlFilePath)) {
      return NextResponse.json({ 
        error: 'Arquivo SQL nÃ£o encontrado',
        path: sqlFilePath
      }, { status: 404 })
    }

    // Ler arquivo SQL
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8')
    
    // Dividir em lotes (cada INSERT separado)
    const sqlStatements = sqlContent
      .split('INSERT INTO getin_reservas')
      .filter(statement => statement.trim().length > 0)
      .map((statement: any, index: any) => 
        index === 0 ? statement : 'INSERT INTO getin_reservas' + statement
      )
      .filter(statement => statement.includes('VALUES'))

    console.log(`ðŸ“Š Total de lotes SQL encontrados: ${sqlStatements.length}`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Executar cada lote
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i].trim()
      
      console.log(`ðŸ”„ Executando lote ${i + 1}/${sqlStatements.length}`)
      
      try {
        const { data, error } = await supabase
          .rpc('execute_sql', { sql_query: statement })

        if (error) {
          console.error(`âŒ Erro no lote ${i + 1}:`, error)
          errorCount++
          errors.push(`Lote ${i + 1}: ${error.message}`)
        } else {
          console.log(`âœ… Lote ${i + 1} executado com sucesso`)
          successCount++
        }
        
        // Pequena pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (err) {
        console.error(`âŒ Erro no lote ${i + 1}:`, err)
        errorCount++
        errors.push(`Lote ${i + 1}: ${err}`)
      }
    }

    // Verificar quantas reservas foram inseridas
    const { data: totalReservas, error: countError } = await supabase
      .from('getin_reservas')
      .select('id', { count: 'exact', head: true })

    const resultado = {
      success: true,
      message: 'InserÃ§Ã£o de dados do Getin concluÃ­da',
      estatisticas: {
        lotes_processados: sqlStatements.length,
        lotes_sucesso: successCount,
        lotes_erro: errorCount,
        total_reservas_no_banco: totalReservas || 0,
        errors: errors
      }
    }

    console.log('ðŸŽ¯ Resultado final:', resultado)

    return NextResponse.json(resultado)

  } catch (error) {
    console.error('âŒ Erro geral:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
