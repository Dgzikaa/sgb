import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ========================================
// 📊 CONTAAZUL V1 - STATUS DA SINCRONIZAÇÃO
// ========================================
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [V1] Verificando status da sincronização...')

    // Verificar se existe um arquivo de status temporário
    const statusFilePath = path.join(process.cwd(), 'temp', 'contaazul-v1-status.json')
    
    let statusData = {
      executando: false,
      ultima_execucao: null,
      status: 'nunca_executado',
      registros_processados: 0,
      mensagem: 'Nenhuma sincronização executada ainda'
    }

    try {
      if (fs.existsSync(statusFilePath)) {
        const fileContent = fs.readFileSync(statusFilePath, 'utf-8')
        statusData = JSON.parse(fileContent)
        console.log('✅ [V1] Status encontrado no arquivo:', statusData)
      }
      // Nota: É normal não existir arquivo de status na primeira execução
    } catch (fileError) {
      console.error('❌ [V1] Erro ao ler arquivo de status:', fileError)
    }

    // Verificar a última sincronização no banco
    try {
      const { data: ultimaSync } = await supabase
        .from('contaazul')
        .select('sincronizado_em')
        .order('sincronizado_em', { ascending: false })
        .limit(1)

      if (ultimaSync && ultimaSync.length > 0) {
        statusData.ultima_execucao = ultimaSync[0].sincronizado_em
        
        if (statusData.status === 'nunca_executado') {
          statusData.status = 'sucesso'
          statusData.mensagem = 'Dados disponíveis no sistema'
        }
      }
    } catch (dbError) {
      console.error('❌ [V1] Erro ao verificar última sync no banco:', dbError)
    }

    return NextResponse.json({
      success: true,
      ...statusData,
      versao: 'V1 - Status'
    })

  } catch (error: any) {
    console.error('❌ [V1] Erro ao verificar status:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao verificar status',
      executando: false,
      status: 'erro',
      mensagem: error.message
    }, { status: 500 })
  }
} 