import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('?? Meta Daily Comparison - Análise diária de dados...')

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    // Obter dados do usuário para pegar o bar_id
    const userData = request.headers.get('x-user-data')
    let barId = 3 // fallback para desenvolvimento

    if (userData) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData))
        barId = parsedUser.bar_id || 3
        console.log(`?? Usando bar_id: ${barId}`)
      } catch (e) {
        console.log('?? Erro ao parsear userData, usando barId padráo:', e)
      }
    }

    // Calcular datas
    const hoje = new Date()
    const inicioPeriodo = new Date(hoje.getTime() - days * 24 * 60 * 60 * 1000)

    console.log(`?? Buscando dados de ${inicioPeriodo.toISOString().split('T')[0]} até ${hoje.toISOString().split('T')[0]}`)

    // 1. BUSCAR DADOS DO FACEBOOK POR DIA
    const { data: facebookData, error: fbError } = await supabase
      .from('facebook_metrics')
      .select('data_referencia, page_fans, page_reach, page_impressions, page_engaged_users')
      .eq('bar_id', barId)
      .gte('data_referencia', inicioPeriodo.toISOString().split('T')[0])
      .order('data_referencia', { ascending: false })

    if (fbError) {
      console.error('? Erro ao buscar facebook_metrics:', fbError)
    }

    // 2. BUSCAR DADOS DO INSTAGRAM POR DIA
    const { data: instagramData, error: igError } = await supabase
      .from('instagram_metrics')
      .select('data_referencia, follower_count, reach, impressions, profile_views')
      .eq('bar_id', barId)
      .gte('data_referencia', inicioPeriodo.toISOString().split('T')[0])
      .order('data_referencia', { ascending: false })

    if (igError) {
      console.error('? Erro ao buscar instagram_metrics:', igError)
    }

    console.log(`?? Dados encontrados - Facebook: ${facebookData?.length || 0}, Instagram: ${instagramData?.length || 0}`)

    // 3. CONSOLIDAR DADOS POR DIA
    const dailyMap = new Map()

    // Processar dados Facebook
    facebookData?.forEach((day) => {
      const date = day.data_referencia
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          fb_followers: 0,
          ig_followers: 0,
          total_reach: 0,
          engajamento: 0
        })
      }
      
      const dayData = dailyMap.get(date)
      dayData.fb_followers = Math.max(dayData.fb_followers, day.page_fans || 0)
      dayData.total_reach += day.page_reach || 0
      dayData.engajamento += day.page_engaged_users || 0
    })

    // Processar dados Instagram
    instagramData?.forEach((day) => {
      const date = day.data_referencia
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          fb_followers: 0,
          ig_followers: 0,
          total_reach: 0,
          engajamento: 0
        })
      }
      
      const dayData = dailyMap.get(date)
      dayData.ig_followers = Math.max(dayData.ig_followers, day.follower_count || 0)
      dayData.total_reach += day.reach || 0
      dayData.engajamento += day.profile_views || 0
    })

    // Converter Map para Array ordenado
    const daysArray = Array.from(dailyMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    // 4. CALCULAR COMPARAÇÕES
    const comparisons = []
    
    if (daysArray.length >= 2) {
      // Hoje vs Ontem
      const hoje_data = daysArray[0]
      const ontem_data = daysArray[1]
      
      const followers_change = (hoje_data.fb_followers + hoje_data.ig_followers) - 
                              (ontem_data.fb_followers + ontem_data.ig_followers)
      const followers_percent = followers_change / Math.max((ontem_data.fb_followers + ontem_data.ig_followers), 1) * 100
      const reach_change = hoje_data.total_reach - ontem_data.total_reach
      const engagement_change = hoje_data.engajamento - ontem_data.engajamento
      
      comparisons.push({
        period: 'Hoje vs Ontem',
        followers_change,
        followers_percent: Math.round(followers_percent * 100) / 100,
        reach_change,
        engagement_change
      })

      if (daysArray.length >= 3) {
        // Ontem vs Anteontem
        const anteontem_data = daysArray[2]
        
        const followers_change_prev = (ontem_data.fb_followers + ontem_data.ig_followers) - 
                                      (anteontem_data.fb_followers + anteontem_data.ig_followers)
        const followers_percent_prev = followers_change_prev / Math.max((anteontem_data.fb_followers + anteontem_data.ig_followers), 1) * 100
        const reach_change_prev = ontem_data.total_reach - anteontem_data.total_reach
        const engagement_change_prev = ontem_data.engajamento - anteontem_data.engajamento
        
        comparisons.push({
          period: 'Ontem vs Anteontem',
          followers_change: followers_change_prev,
          followers_percent: Math.round(followers_percent_prev * 100) / 100,
          reach_change: reach_change_prev,
          engagement_change: engagement_change_prev
        })
      }

      // Últimos 7 dias
      if (daysArray.length >= 7) {
        const semana_atras = daysArray[6]
        
        const followers_change_week = (hoje_data.fb_followers + hoje_data.ig_followers) - 
                                     (semana_atras.fb_followers + semana_atras.ig_followers)
        const followers_percent_week = followers_change_week / Math.max((semana_atras.fb_followers + semana_atras.ig_followers), 1) * 100
        const reach_change_week = hoje_data.total_reach - semana_atras.total_reach
        const engagement_change_week = hoje_data.engajamento - semana_atras.engajamento
        
        comparisons.push({
          period: 'Últimos 7 dias',
          followers_change: followers_change_week,
          followers_percent: Math.round(followers_percent_week * 100) / 100,
          reach_change: reach_change_week,
          engagement_change: engagement_change_week
        })
      }
    }

    // 5. CALCULAR TENDÊNCIAS
    const trends = {
      followers_trend: 'stable',
      engagement_trend: 'stable',
      reach_trend: 'stable'
    }

    if (comparisons.length > 0) {
      const main_comparison = comparisons[0]
      trends.followers_trend = main_comparison.followers_change > 0 ? 'growing' : 
                              main_comparison.followers_change < 0 ? 'falling' : 'stable'
      trends.engagement_trend = main_comparison.engagement_change > 0 ? 'growing' : 
                               main_comparison.engagement_change < 0 ? 'falling' : 'stable'
      trends.reach_trend = main_comparison.reach_change > 0 ? 'growing' : 
                          main_comparison.reach_change < 0 ? 'falling' : 'stable'
    }

    // 6. ESTRUTURAR RESPOSTA
    const responseData = {
      success: true,
      data: {
        days: daysArray,
        comparisons,
        trends,
        period: `${inicioPeriodo.toISOString().split('T')[0]} to ${hoje.toISOString().split('T')[0]}`,
        total_days: daysArray.length
      },
      meta: {
        source: 'daily-comparison',
        records_processed: {
          facebook: facebookData?.length || 0,
          instagram: instagramData?.length || 0
        },
        bar_id: barId
      }
    }

    console.log('? Daily Comparison - Dados processados:', {
      days_found: responseData.data.total_days,
      comparisons_generated: responseData.data.comparisons.length,
      trends: responseData.data.trends
    })

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('? Erro na API Daily Comparison:', error)
    
    // Retornar erro real, SEM dados simulados
    return NextResponse.json({
      success: false,
      error: 'Erro ao carregar dados de comparaçáo diária',
      details: error instanceof Error ? error.message : 'Erro desconhecido',
      data_source: 'error'
    }, { status: 500 })
  }
} 
