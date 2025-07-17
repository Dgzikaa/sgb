import { NextResponse } from 'next/server'

export async function POST() {
  try {
    console.log('üîÑ For·ßando execu·ß·£o manual do Meta Sync...')
    
    const response = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/meta-sync-automatico', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M',
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Edge Function falhou: ${response.status} - ${errorText}`)
    }
    
    const result = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'úÖ Meta Analytics atualizado com sucesso!',
      data: {
        timestamp: new Date().toISOString(),
        facebook_saved: result.resultado_salvamento?.facebook_saved || false,
        instagram_saved: result.resultado_salvamento?.instagram_saved || false,
        campaigns_saved: result.resultado_salvamento?.campaigns_saved || false,
        total_campaigns: result.campaigns_data?.totals?.total_campaigns || 0,
        total_spend: result.campaigns_data?.totals?.total_spend || 0,
        active_campaigns: result.campaigns_data?.totals?.active_campaigns || 0
      }
    })
    
  } catch (error: any) {
    console.error('ùå Erro ao for·ßar sync:', error)
    return NextResponse.json({
      success: false,
      message: 'ùå Falha ao atualizar dados do Meta',
      error: error.message
    }, { status: 500 })
  }
}

export async function GET() {
  return POST()
} 
