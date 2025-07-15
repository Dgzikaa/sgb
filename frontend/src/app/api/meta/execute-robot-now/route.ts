import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 EXECUTANDO ROBÔ META-SYNC-AUTOMATICO MANUALMENTE...')

    // URL da Edge Function
    const robotUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/meta-sync-automatico'
    
    console.log('🚀 Executando robô em:', robotUrl)

    const response = await fetch(robotUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test_execution: true,
        manual_trigger: true,
        bar_id: 3,
        timestamp: new Date().toISOString()
      })
    })

    console.log('📊 Status da resposta:', response.status)

    const responseText = await response.text()
    console.log('📝 Resposta bruta:', responseText.substring(0, 500) + '...')

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch {
      responseData = { 
        raw_response: responseText,
        parse_error: 'Resposta não é JSON válido'
      }
    }

    if (!response.ok) {
      console.log('❌ Erro na execução do robô:', response.status)
      return NextResponse.json({
        success: false,
        error: 'Erro ao executar robô',
        status: response.status,
        response: responseData,
        robot_url: robotUrl
      })
    }

    console.log('✅ Robô executado com sucesso')

    // Verificar se coletou campanhas
    const campaignsInfo = responseData.campaigns_data ? {
      total_campaigns: responseData.campaigns_data.campaigns?.length || 0,
      active_campaigns: responseData.campaigns_data.campaigns?.filter((c: any) => c.effective_status === 'ACTIVE').length || 0,
      total_spend: responseData.campaigns_data.totals?.total_spend || 0,
      ad_accounts: responseData.campaigns_data.ad_accounts?.length || 0
    } : null

    return NextResponse.json({
      success: true,
      message: 'Robô meta-sync-automatico executado com sucesso',
      execution_time: new Date().toISOString(),
      robot_response: responseData,
      campaigns_summary: campaignsInfo,
      facebook_data: responseData.facebook_data ? 'Coletado' : 'Não coletado',
      instagram_data: responseData.instagram_data ? 'Coletado' : 'Não coletado',
      database_save: responseData.resultado_salvamento ? 'Salvo' : 'Não salvo'
    })

  } catch (error: any) {
    console.error('❌ Erro ao testar robô:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 