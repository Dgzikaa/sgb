import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('🧪 Testando Edge Function com novas métricas...')
    
    // Chamar a edge function
    const response = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/meta-sync-automatico', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODUwNjYsImV4cCI6MjA1MTI2MTA2Nn0.8mBgB5jkE1nqLn5C49_WxbO6s8fG5_nq5t0N-yGCdeo',
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function error: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    
    // Verificar se as campanhas foram coletadas com as novas métricas
    const campaigns = result.campaigns_data?.campaigns || []
    const firstCampaign = campaigns[0]
    
    let newMetricsFound = []
    if (firstCampaign?.insights?.data?.[0]) {
      const insights = firstCampaign.insights.data[0]
      
      // Verificar novas métricas
      if (insights.cpp) newMetricsFound.push('cpp')
      if (insights.cpm) newMetricsFound.push('cpm')  
      if (insights.frequency) newMetricsFound.push('frequency')
      if (insights.video_play_actions) newMetricsFound.push('video_play_actions')
      if (insights.video_p25_watched_actions) newMetricsFound.push('video_p25_watched_actions')
      if (insights.video_p50_watched_actions) newMetricsFound.push('video_p50_watched_actions')
      if (insights.video_p75_watched_actions) newMetricsFound.push('video_p75_watched_actions')
      if (insights.video_p100_watched_actions) newMetricsFound.push('video_p100_watched_actions')
    }
    
    return NextResponse.json({
      success: true,
      edge_function_result: result.success,
      campaigns_collected: campaigns.length,
      new_metrics_found: newMetricsFound,
      new_metrics_count: newMetricsFound.length,
      sample_campaign: firstCampaign ? {
        name: firstCampaign.name,
        insights: firstCampaign.insights?.data?.[0]
      } : null,
      resultado_salvamento: result.resultado_salvamento,
      message: `✅ Teste concluído! ${newMetricsFound.length} novas métricas encontradas: ${newMetricsFound.join(', ')}`
    })
    
  } catch (error: any) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return POST()
} 