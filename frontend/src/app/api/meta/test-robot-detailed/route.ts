import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 EXECUTANDO ROBÔ COM DEBUG DETALHADO...')

    const robotUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/meta-sync-automatico'
    
    const response = await fetch(robotUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        test_execution: true,
        debug_campaigns: true,
        timestamp: new Date().toISOString()
      })
    })

    const responseText = await response.text()
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
      return NextResponse.json({
        success: false,
        error: 'Erro ao executar robô',
        status: response.status,
        response: responseData
      })
    }

    // Analisar resposta sobre campanhas
    const campaignsAnalysis = {
      has_campaigns_data: !!responseData.campaigns_data,
      campaigns_found: responseData.campaigns_data?.campaigns?.length || 0,
      ad_accounts_found: responseData.campaigns_data?.ad_accounts?.length || 0,
      totals: responseData.campaigns_data?.totals || null,
      campaigns_error: responseData.campaigns_data?.error || null,
      campaigns_message: responseData.campaigns_data?.message || null,
      database_save_result: responseData.resultado_salvamento || null
    }

    return NextResponse.json({
      success: true,
      message: 'Robô executado com análise detalhada',
      execution_time: new Date().toISOString(),
      campaigns_analysis: campaignsAnalysis,
      full_response: responseData,
      status_summary: {
        facebook_ok: !!responseData.facebook_data,
        instagram_ok: !!responseData.instagram_data,
        campaigns_ok: campaignsAnalysis.campaigns_found > 0,
        database_ok: !!responseData.resultado_salvamento
      }
    })

  } catch (error: any) {
    console.error('❌ Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
} 