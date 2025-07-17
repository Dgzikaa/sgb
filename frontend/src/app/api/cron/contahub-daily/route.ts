import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('ÂÂ° CRON JOB: Coleta diÃ¡Â¡ria ContaHub iniciada')
    
    // Verificar se Ã¡Â© um cron autorizado (opcional - adicionar header de seguranÃ¡Â§a)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'sgb-cron-2024'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('ÂÅ’ Cron nÃ¡Â£o autorizado')
      return NextResponse.json({
        success: false,
        error: 'NÃ¡Â£o autorizado'
      }, { status: 401 })
    }
    
    // Chamar a edge function ContaHub
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/contahub-collector`
    
    console.log(`Ã°Å¸â€œÂ¡ Executando edge function: ${edgeFunctionUrl}`)
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({})
    })
    
    const responseText = await response.text()
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (parseError) {
      throw new Error(`Erro parsing resposta: ${responseText}`)
    }
    
    if (!response.ok) {
      throw new Error(`Edge function falhou: ${response.status} - ${data.error || responseText}`)
    }
    
    console.log('Å“â€¦ Cron job concluÃ¡Â­do com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Cron job ContaHub executado com sucesso',
      timestamp: new Date().toISOString(),
      resultado: data
    })
    
  } catch (error) {
    console.error('Ã°Å¸â€™Â¥ Erro no cron job:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Suportar tanto GET quanto POST para flexibilidade de cron jobs
  return GET(request)
} 

