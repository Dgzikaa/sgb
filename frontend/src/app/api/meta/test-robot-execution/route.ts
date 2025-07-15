import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 TESTANDO EXECUÇÃO DO ROBÔ META-SYNC-AUTOMATICO...')

    // Chamar o Edge Function meta-sync-automatico
    const robotUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!.replace('/rest/v1', '') + 
                     '/functions/v1/meta-sync-automatico'
    
    console.log('🚀 Executando robô em:', robotUrl)

    const response = await fetch(robotUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test_execution: true,
        timestamp: new Date().toISOString()
      })
    })

    const responseText = await response.text()
    let responseData

    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { raw_response: responseText }
    }

    if (!response.ok) {
      console.log('❌ Erro na execução do robô:', response.status, responseData)
      return NextResponse.json({
        success: false,
        error: 'Erro ao executar robô',
        status: response.status,
        response: responseData
      })
    }

    console.log('✅ Robô executado com sucesso:', responseData)

    return NextResponse.json({
      success: true,
      message: 'Robô meta-sync-automatico executado com sucesso',
      robot_response: responseData,
      execution_time: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('❌ Erro ao testar robô:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
} 