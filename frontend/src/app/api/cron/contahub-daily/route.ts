import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('° CRON JOB: Coleta diá¡ria ContaHub iniciada')
    
    // Verificar se á© um cron autorizado (opcional - adicionar header de seguraná§a)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'sgb-cron-2024'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.log('Œ Cron ná£o autorizado')
      return NextResponse.json({
        success: false,
        error: 'Ná£o autorizado'
      }, { status: 401 })
    }
    
    // Chamar a edge function ContaHub
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/contahub-collector`
    
    console.log(`ðŸ“¡ Executando edge function: ${edgeFunctionUrl}`)
    
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
    
    console.log('œ… Cron job concluá­do com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'Cron job ContaHub executado com sucesso',
      timestamp: new Date().toISOString(),
      resultado: data
    })
    
  } catch (error) {
    console.error('ðŸ’¥ Erro no cron job:', error)
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
