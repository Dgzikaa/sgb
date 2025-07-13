import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Teste manual do Meta Sync solicitado')

    // URL da Edge Function no Supabase
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/meta-sync-automatico`
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    console.log('📡 Chamando Edge Function:', edgeFunctionUrl)

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        manual_test: true,
        source: 'teste_manual_api',
        timestamp: new Date().toISOString()
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(`Edge Function Error: ${data.error || response.statusText}`)
    }

    console.log('✅ Meta Sync executado com sucesso:', data)

    return NextResponse.json({
      success: true,
      message: '🎉 Meta Sync funcionando perfeitamente!',
      edge_function_response: data,
      facebook_data: data.facebook_data ? '✅ Coletado' : '❌ Falha',
      instagram_data: data.instagram_data ? '✅ Coletado' : '❌ Falha',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Erro no teste Meta Sync:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      message: '❌ Falha no teste - verifique as credenciais Meta',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Meta Sync Test API',
    usage: 'POST para executar teste manual da Edge Function',
    endpoint: '/api/meta/test-sync'
  })
} 