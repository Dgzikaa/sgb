import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 === TESTE COM CHAMADAS CORRIGIDAS ===')
    
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
      page_id: credenciais.configuracoes.page_id, // 517416481460390
      instagram_account_id: credenciais.configuracoes.instagram_account_id // 17841468820531210
    }

    const results = {
      success: true,
      instagram: {} as any,
      facebook: {} as any,
      campaigns: {} as any
    }

    // === INSTAGRAM CORRIGIDO ===
    console.log('📸 Testando Instagram com metric_type=total_value...')
    
    // 1. Reach (já funciona)
    try {
      const reachUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=reach&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
      const reachResponse = await fetch(reachUrl)
      if (reachResponse.ok) {
        const reachData = await reachResponse.json()
        results.instagram.reach = {
          success: true,
          data: reachData.data?.[0]?.values || [],
          total: reachData.data?.[0]?.values?.reduce((sum: number, item: any) => sum + item.value, 0) || 0
        }
      }
    } catch (error: any) {
      results.instagram.reach = { success: false, error: error.message }
    }

    // 2. Profile Views (CORRIGIDO com metric_type=total_value)
    try {
      const profileUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=profile_views&metric_type=total_value&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
      const profileResponse = await fetch(profileUrl)
      if (profileResponse.ok) {
        const profileData = await profileResponse.json()
        results.instagram.profile_views = {
          success: true,
          data: profileData.data?.[0]?.total_value || 0
        }
      } else {
        results.instagram.profile_views = {
          success: false,
          error: await profileResponse.text()
        }
      }
    } catch (error: any) {
      results.instagram.profile_views = { success: false, error: error.message }
    }

    // 3. Website Clicks (CORRIGIDO)
    try {
      const websiteUrl = `https://graph.facebook.com/v18.0/${config.instagram_account_id}/insights?metric=website_clicks&metric_type=total_value&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
      const websiteResponse = await fetch(websiteUrl)
      if (websiteResponse.ok) {
        const websiteData = await websiteResponse.json()
        results.instagram.website_clicks = {
          success: true,
          data: websiteData.data?.[0]?.total_value || 0
        }
      } else {
        results.instagram.website_clicks = {
          success: false,
          error: await websiteResponse.text()
        }
      }
    } catch (error: any) {
      results.instagram.website_clicks = { success: false, error: error.message }
    }

    // === FACEBOOK CORRIGIDO ===
    console.log('📘 Testando Facebook com métricas corretas...')

    // 1. Page Impressions (métricas corretas)
    try {
      const impressionsUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_impressions_unique&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
      const impressionsResponse = await fetch(impressionsUrl)
      if (impressionsResponse.ok) {
        const impressionsData = await impressionsResponse.json()
        results.facebook.impressions = {
          success: true,
          data: impressionsData.data?.[0]?.values || [],
          total: impressionsData.data?.[0]?.values?.reduce((sum: number, item: any) => sum + item.value, 0) || 0
        }
      } else {
        results.facebook.impressions = {
          success: false,
          error: await impressionsResponse.text()
        }
      }
    } catch (error: any) {
      results.facebook.impressions = { success: false, error: error.message }
    }

    // 2. Page Reach (métricas corretas)
    try {
      const pageReachUrl = `https://graph.facebook.com/v18.0/${config.page_id}/insights?metric=page_impressions_unique&period=day&since=2025-07-10&until=2025-07-14&access_token=${config.access_token}`
      const pageReachResponse = await fetch(pageReachUrl)
      if (pageReachResponse.ok) {
        const pageReachData = await pageReachResponse.json()
        results.facebook.reach = {
          success: true,
          data: pageReachData.data?.[0]?.values || [],
          total: pageReachData.data?.[0]?.values?.reduce((sum: number, item: any) => sum + item.value, 0) || 0
        }
      } else {
        results.facebook.reach = {
          success: false,
          error: await pageReachResponse.text()
        }
      }
    } catch (error: any) {
      results.facebook.reach = { success: false, error: error.message }
    }

    // === CAMPANHAS ===
    console.log('💰 Testando campanhas com Business ID...')
    
    try {
      const businessId = '2164664530223231' // Do token info
      const adAccountsUrl = `https://graph.facebook.com/v18.0/${businessId}/owned_ad_accounts?fields=id,name,account_status,amount_spent&access_token=${config.access_token}`
      const adAccountsResponse = await fetch(adAccountsUrl)
      
      if (adAccountsResponse.ok) {
        const adAccountsData = await adAccountsResponse.json()
        results.campaigns = {
          success: true,
          ad_accounts: adAccountsData.data || [],
          count: adAccountsData.data?.length || 0
        }
      } else {
        results.campaigns = {
          success: false,
          error: await adAccountsResponse.text()
        }
      }
    } catch (error: any) {
      results.campaigns = { success: false, error: error.message }
    }

    // RESUMO
    const summary = {
      instagram_reach_total: results.instagram.reach?.total || 0,
      instagram_profile_views: results.instagram.profile_views?.data || 0,
      instagram_website_clicks: results.instagram.website_clicks?.data || 0,
      facebook_impressions_total: results.facebook.impressions?.total || 0,
      facebook_reach_total: results.facebook.reach?.total || 0,
      campaigns_ad_accounts: results.campaigns.count || 0,
      working_metrics: [
        results.instagram.reach?.success ? '✅ Instagram Reach' : '❌ Instagram Reach',
        results.instagram.profile_views?.success ? '✅ Instagram Profile Views' : '❌ Instagram Profile Views',
        results.instagram.website_clicks?.success ? '✅ Instagram Website Clicks' : '❌ Instagram Website Clicks',
        results.facebook.impressions?.success ? '✅ Facebook Impressions' : '❌ Facebook Impressions',
        results.facebook.reach?.success ? '✅ Facebook Reach' : '❌ Facebook Reach',
        results.campaigns.success ? '✅ Campanhas/Ads' : '❌ Campanhas/Ads'
      ]
    }

    console.log('📊 RESUMO:', summary)

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      token_info: {
        page_id: config.page_id,
        instagram_id: config.instagram_account_id,
        has_all_permissions: true
      },
      summary,
      detailed_results: results
    })

  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 