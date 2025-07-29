import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 ContaHub Sync API - Iniciando...')
    
    // Configurações do Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variáveis de ambiente do Supabase não encontradas')
    }
    
    // Chamar a edge function com autenticação adequada
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/contahub-sync-automatico`
    
    console.log('📡 Chamando edge function:', edgeFunctionUrl)
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        cronSecret: 'pgcron_contahub',
        triggeredBy: 'api_nextjs'
      }),
    })
    
    console.log('📡 Status da resposta:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro na edge function:', errorText)
      throw new Error(`Edge function falhou: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    console.log('✅ Edge function executada com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Sincronização ContaHub executada com sucesso via API',
      data: result
    }, { status: 200 })
    
  } catch (error) {
    console.error('❌ Erro na API ContaHub Sync:', error)
    
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      message: 'Erro ao executar sincronização ContaHub'
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'ContaHub Sync API - Use POST para executar sincronização',
    status: 'ready',
    timestamp: new Date().toISOString()
  })
} 