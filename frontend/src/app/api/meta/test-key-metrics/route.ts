import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 === TESTE MÉTRICAS-CHAVE META ===')
    
    const BAR_ID = 3
    
    const { data: credenciais } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'meta')
      .eq('bar_id', BAR_ID)
      .eq('ativo', true)
      .single()

    if (!credenciais?.configuracoes) {
      return NextResponse.json({ error: 'Credenciais não encontradas' }, { status: 400 })
    }

    const config = {
      access_token: credenciais.access_token,
      instagram_account_id: credenciais.configuracoes.instagram_account_id
    }

    const results = {
      working: {} as any,
      new_metrics: {} as any
    }

    // TESTE RÁPIDO DE MÉTRICAS ADICIONAIS
    const metricsToTest = [
      'accounts_engaged',
      'story_impressions', 
      'story_reach',
      'video_views',
      'likes',
      'comments',
      'saves',
      'shares'
    ]

    for (const metric of metricsToTest) {
      try {
        // Testar com metric_type=total_value primeiro
        let url = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=${metric}&metric_type=total_value&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
        let response = await fetch(url)
        
        if (!response.ok) {
          // Se falhar, testar sem metric_type
          url = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=${metric}&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
          response = await fetch(url)
        }
        
        if (response.ok) {
          const data = await response.json()
          const hasData = !!(data.data && data.data.length > 0)
          
          if (hasData) {
            if (data.data[0]?.total_value) {
              results.new_metrics[metric] = {
                success: true,
                value: data.data[0].total_value.value,
                type: 'total_value'
              }
            } else if (data.data[0]?.values) {
              const total = data.data[0].values.reduce((sum: number, item: any) => sum + item.value, 0)
              results.new_metrics[metric] = {
                success: true,
                total: total,
                values: data.data[0].values,
                type: 'time_series'
              }
            }
          }
        } else {
          results.new_metrics[metric] = {
            success: false,
            error: await response.text()
          }
        }
        
      } catch (error: any) {
        results.new_metrics[metric] = {
          success: false,
          error: error.message
        }
      }
    }

    // ANÁLISE
    const successful = Object.entries(results.new_metrics).filter(([_, data]) => (data as any).success)
    const withData = successful.filter(([_, data]) => (data as any).value > 0 || (data as any).total > 0)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: results.new_metrics,
      summary: {
        total_tested: metricsToTest.length,
        successful_apis: successful.length,
        with_real_data: withData.length,
        new_metrics_found: withData.map(([metric, data]) => ({
          metric,
          value: (data as any).value || (data as any).total,
          type: (data as any).type
        }))
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 