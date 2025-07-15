import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 === SCANNER COMPLETO DE MÉTRICAS META ===')
    
    const BAR_ID = 3
    
    // Obter credenciais
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
      page_id: credenciais.configuracoes.page_id,
      instagram_account_id: credenciais.configuracoes.instagram_account_id
    }

    const results = {
      instagram_metrics: {} as any,
      facebook_metrics: {} as any,
      instagram_media_metrics: {} as any,
      successful_metrics: [] as string[],
      failed_metrics: [] as string[]
    }

    // === INSTAGRAM INSIGHTS METRICS ===
    console.log('📸 Testando TODAS as métricas Instagram...')
    
    const instagramMetrics = [
      // Básicas (que sabemos que funcionam)
      'reach',
      'follower_count',
      
      // Com metric_type=total_value
      'profile_views',
      'website_clicks',
      'email_contacts',
      'phone_call_clicks',
      'text_message_clicks',
      'get_directions_clicks',
      'accounts_engaged',
      
      // Stories
      'story_impressions',
      'story_reach',
      'story_exits',
      'story_replies',
      'story_taps_forward',
      'story_taps_back',
      
      // Video
      'video_views',
      'reel_plays',
      'reel_reach',
      'reel_likes',
      'reel_comments',
      'reel_shares',
      'reel_saves',
      
      // Engajamento
      'likes',
      'comments',
      'saves',
      'shares',
      'replies',
      'profile_links_taps',
      
      // Descoberta
      'discovery_impressions',
      'discovery_reach',
      'hashtag_impressions',
      'explore_impressions'
    ]

    for (const metric of instagramMetrics) {
      try {
        console.log(`🧪 Testando: ${metric}`)
        
        // Testar primeiro sem metric_type
        let url = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=${metric}&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
        let response = await fetch(url)
        
        if (!response.ok) {
          // Se falhar, tentar com metric_type=total_value
          url = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=${metric}&metric_type=total_value&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
          response = await fetch(url)
        }
        
        if (response.ok) {
          const data = await response.json()
          results.instagram_metrics[metric] = {
            success: true,
            has_data: !!(data.data && data.data.length > 0),
            sample_data: data.data?.[0] || null,
            metric_type: url.includes('metric_type=total_value') ? 'total_value' : 'time_series'
          }
          results.successful_metrics.push(`instagram_${metric}`)
          console.log(`✅ ${metric}: ${data.data?.[0]?.values?.[0]?.value || data.data?.[0]?.total_value?.value || 'OK'}`)
        } else {
          const errorText = await response.text()
          results.instagram_metrics[metric] = {
            success: false,
            error: errorText
          }
          results.failed_metrics.push(`instagram_${metric}`)
          console.log(`❌ ${metric}: ${errorText.substring(0, 100)}...`)
        }
        
        // Delay para não sobrecarregar API
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error: any) {
        results.instagram_metrics[metric] = {
          success: false,
          error: error.message
        }
        results.failed_metrics.push(`instagram_${metric}`)
      }
    }

    // === FACEBOOK PAGE METRICS (básicas que funcionam com User Token) ===
    console.log('📘 Testando métricas básicas Facebook...')
    
    const facebookBasicMetrics = [
      'page_fans',
      'page_fan_adds',
      'page_fan_removes',
      'page_views_total',
      'page_views_unique'
    ]

    for (const metric of facebookBasicMetrics) {
      try {
        const url = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=${metric}&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
        const response = await fetch(url)
        
        if (response.ok) {
          const data = await response.json()
          results.facebook_metrics[metric] = {
            success: true,
            has_data: !!(data.data && data.data.length > 0),
            sample_data: data.data?.[0] || null
          }
          results.successful_metrics.push(`facebook_${metric}`)
        } else {
          const errorText = await response.text()
          results.facebook_metrics[metric] = {
            success: false,
            error: errorText
          }
          results.failed_metrics.push(`facebook_${metric}`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error: any) {
        results.facebook_metrics[metric] = {
          success: false,
          error: error.message
        }
        results.failed_metrics.push(`facebook_${metric}`)
      }
    }

    // === INSTAGRAM MEDIA INSIGHTS (posts individuais) ===
    console.log('📱 Testando insights de posts individuais...')
    
    try {
      // Primeiro, pegar posts recentes
      const mediaUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/media?fields=id&limit=5&access_token=${config.access_token}`
      const mediaResponse = await fetch(mediaUrl)
      
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json()
        const posts = mediaData.data || []
        
        if (posts.length > 0) {
          const firstPost = posts[0]
          
          // Testar métricas de post individual
          const postMetrics = [
            'impressions',
            'reach', 
            'likes',
            'comments',
            'saves',
            'shares',
            'video_views',
            'profile_visits',
            'follows',
            'website_clicks',
            'emails',
            'phone_calls',
            'get_directions'
          ]
          
          for (const metric of postMetrics) {
            try {
              const postInsightsUrl = `https://graph.facebook.com/v18.0/${firstPost.id}/insights?metric=${metric}&access_token=${config.access_token}`
              const postResponse = await fetch(postInsightsUrl)
              
              if (postResponse.ok) {
                const postData = await postResponse.json()
                results.instagram_media_metrics[metric] = {
                  success: true,
                  sample_post_id: firstPost.id,
                  data: postData.data?.[0] || null
                }
                results.successful_metrics.push(`media_${metric}`)
              } else {
                results.instagram_media_metrics[metric] = {
                  success: false,
                  error: await postResponse.text()
                }
                results.failed_metrics.push(`media_${metric}`)
              }
              
              await new Promise(resolve => setTimeout(resolve, 100))
              
            } catch (error: any) {
              results.instagram_media_metrics[metric] = {
                success: false,
                error: error.message
              }
            }
          }
        }
      }
    } catch (error) {
      console.log('❌ Erro ao testar insights de posts:', error)
    }

    // === ANÁLISE DOS RESULTADOS ===
    const analysis = {
      total_metrics_tested: Object.keys(results.instagram_metrics).length + 
                           Object.keys(results.facebook_metrics).length + 
                           Object.keys(results.instagram_media_metrics).length,
      successful_count: results.successful_metrics.length,
      failed_count: results.failed_metrics.length,
      success_rate: Math.round((results.successful_metrics.length / (results.successful_metrics.length + results.failed_metrics.length)) * 100),
      
      new_working_metrics: results.successful_metrics.filter(metric => 
        !['instagram_reach', 'instagram_follower_count', 'instagram_profile_views', 'instagram_website_clicks'].includes(metric)
      ),
      
      recommended_for_robot: [] as string[]
    }

    // Recomendar métricas que têm dados reais
    for (const [metric, data] of Object.entries(results.instagram_metrics)) {
      if ((data as any).success && (data as any).has_data) {
        analysis.recommended_for_robot.push(`instagram_${metric}`)
      }
    }
    
    for (const [metric, data] of Object.entries(results.facebook_metrics)) {
      if ((data as any).success && (data as any).has_data) {
        analysis.recommended_for_robot.push(`facebook_${metric}`)
      }
    }
    
    for (const [metric, data] of Object.entries(results.instagram_media_metrics)) {
      if ((data as any).success) {
        analysis.recommended_for_robot.push(`media_${metric}`)
      }
    }

    console.log(`📊 RESULTADOS: ${analysis.successful_count}/${analysis.total_metrics_tested} métricas funcionando (${analysis.success_rate}%)`)
    console.log(`🆕 Novas métricas descobertas: ${analysis.new_working_metrics.length}`)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      analysis,
      detailed_results: results,
      summary: {
        instagram_working: Object.entries(results.instagram_metrics).filter(([_, data]) => (data as any).success).length,
        facebook_working: Object.entries(results.facebook_metrics).filter(([_, data]) => (data as any).success).length,
        media_working: Object.entries(results.instagram_media_metrics).filter(([_, data]) => (data as any).success).length
      }
    })

  } catch (error) {
    console.error('❌ Erro no scanner:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 