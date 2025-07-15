import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🧪 Testando Edge Function meta-sync-automatico...')
    
    // Testar a edge function
    const response = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/meta-sync-automatico', {
      method: 'POST',
      headers: {
                 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M',
        'Content-Type': 'application/json'
      }
    })
    
    console.log(`📡 Response Status: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function error ${response.status}: ${errorText}`)
    }
    
    const result = await response.json()
    
    // Analisar resultado
    const analysis = {
      edge_function_status: response.ok ? 'FUNCIONANDO ✅' : 'ERRO ❌',
      response_status: response.status,
      campaigns_collected: result.campaigns_data?.campaigns?.length || 0,
      facebook_data_ok: !!result.facebook_data,
      instagram_data_ok: !!result.instagram_data,
      campaigns_saved: result.resultado_salvamento?.campaigns_saved || false,
      total_spend: result.campaigns_data?.totals?.total_spend || 0,
      sample_campaign: result.campaigns_data?.campaigns?.[0] ? {
        name: result.campaigns_data.campaigns[0].name,
        spend: result.campaigns_data.campaigns[0].insights?.data?.[0]?.spend,
        impressions: result.campaigns_data.campaigns[0].insights?.data?.[0]?.impressions,
        new_metrics: {
          cpm: result.campaigns_data.campaigns[0].insights?.data?.[0]?.cpm,
          cpp: result.campaigns_data.campaigns[0].insights?.data?.[0]?.cpp,
          frequency: result.campaigns_data.campaigns[0].insights?.data?.[0]?.frequency,
          video_play_actions: result.campaigns_data.campaigns[0].insights?.data?.[0]?.video_play_actions
        }
      } : null
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis,
      full_result: result
    })
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 