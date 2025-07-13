import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando APIs OFICIAIS exatas do Meta...')

    // Buscar configuração da Meta
    const { data: config, error: configError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', 3)
      .eq('sistema', 'meta')
      .single()

    if (configError || !config) {
      return NextResponse.json({ 
        error: 'Configuração Meta não encontrada',
        details: configError?.message 
      }, { status: 404 })
    }

    const accessToken = config.access_token
    const configs = config.configuracoes || {}
    const instagramId = configs.instagram_account_id
    const pageId = configs.page_id

    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: [] as any[]
    }

    // 🏢 TESTE 1: GET https://graph.facebook.com/v18.0/me/adaccounts
    console.log('🏢 TESTE 1: Buscando contas de anúncios com API oficial...')
    try {
      const adAccountsUrl = `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}`
      const adAccountsResponse = await fetch(adAccountsUrl)
      const adAccountsData = await adAccountsResponse.json()

      results.tests.push({
        test: 'GET /me/adaccounts',
        status: adAccountsResponse.ok ? 'success' : 'error',
        data: adAccountsData,
        accounts_found: adAccountsData.data?.length || 0
      })

      // 📊 TESTE 2: Para cada conta, GET /{ad_account_id}/campaigns
      if (adAccountsResponse.ok && adAccountsData.data) {
        for (const adAccount of adAccountsData.data.slice(0, 2)) { // Teste primeiras 2 contas
          console.log(`📊 TESTE 2: Buscando campanhas da conta ${adAccount.id}...`)
          
          const campaignsUrl = `https://graph.facebook.com/v18.0/${adAccount.id}/campaigns?fields=id,name,status,effective_status,objective,start_time,stop_time,daily_budget&access_token=${accessToken}`
          const campaignsResponse = await fetch(campaignsUrl)
          const campaignsData = await campaignsResponse.json()

          results.tests.push({
            test: `GET /${adAccount.id}/campaigns`,
            account_name: adAccount.name,
            status: campaignsResponse.ok ? 'success' : 'error',
            data: campaignsData,
            campaigns_found: campaignsData.data?.length || 0
          })

          // 📈 TESTE 3: Insights da conta de anúncios
          if (campaignsResponse.ok && campaignsData.data && campaignsData.data.length > 0) {
            console.log(`📈 TESTE 3: Buscando insights da conta ${adAccount.id}...`)
            
            const insightsUrl = `https://graph.facebook.com/v18.0/${adAccount.id}/insights?fields=campaign_name,impressions,clicks,reach,spend,actions,cost_per_action_type,cost_per_conversion&date_preset=last_30d&access_token=${accessToken}`
            const insightsResponse = await fetch(insightsUrl)
            const insightsData = await insightsResponse.json()

            results.tests.push({
              test: `GET /${adAccount.id}/insights`,
              account_name: adAccount.name,
              status: insightsResponse.ok ? 'success' : 'error',
              data: insightsData,
              insights_found: insightsData.data?.length || 0
            })
          }
        }
      }
    } catch (error: any) {
      results.tests.push({
        test: 'GET /me/adaccounts',
        status: 'error',
        error: error.message
      })
    }

    // 📱 TESTE 4: GET /{ig_user_id}/insights - Instagram Insights
    if (instagramId) {
      console.log('📱 TESTE 4: Buscando insights do Instagram...')
      try {
        const igInsightsUrl = `https://graph.facebook.com/v18.0/${instagramId}/insights?metric=impressions,reach,profile_views,follower_count&period=day&access_token=${accessToken}`
        const igInsightsResponse = await fetch(igInsightsUrl)
        const igInsightsData = await igInsightsResponse.json()

        results.tests.push({
          test: `GET /${instagramId}/insights`,
          status: igInsightsResponse.ok ? 'success' : 'error',
          data: igInsightsData,
          metrics_found: igInsightsData.data?.length || 0
        })
             } catch (error: any) {
         results.tests.push({
           test: `GET /${instagramId}/insights`,
           status: 'error',
           error: error.message
         })
       }

      // 📸 TESTE 5: GET /{ig_user_id}/media - Posts Instagram
      console.log('📸 TESTE 5: Buscando posts do Instagram...')
      try {
        const igMediaUrl = `https://graph.facebook.com/v18.0/${instagramId}/media?access_token=${accessToken}`
        const igMediaResponse = await fetch(igMediaUrl)
        const igMediaData = await igMediaResponse.json()

        results.tests.push({
          test: `GET /${instagramId}/media`,
          status: igMediaResponse.ok ? 'success' : 'error',
          data: igMediaData,
          posts_found: igMediaData.data?.length || 0
        })

        // 📊 TESTE 6: GET /{media_id}/insights - Insights de posts individuais
        if (igMediaResponse.ok && igMediaData.data && igMediaData.data.length > 0) {
          console.log('📊 TESTE 6: Buscando insights de posts individuais...')
          
          const firstPost = igMediaData.data[0]
          const mediaInsightsUrl = `https://graph.facebook.com/v18.0/${firstPost.id}/insights?metric=engagement,impressions,reach,saved,video_views&access_token=${accessToken}`
          const mediaInsightsResponse = await fetch(mediaInsightsUrl)
          const mediaInsightsData = await mediaInsightsResponse.json()

          results.tests.push({
            test: `GET /${firstPost.id}/insights`,
            post_id: firstPost.id,
            status: mediaInsightsResponse.ok ? 'success' : 'error',
            data: mediaInsightsData,
            insights_found: mediaInsightsData.data?.length || 0
          })
        }
             } catch (error: any) {
         results.tests.push({
           test: `GET /${instagramId}/media`,
           status: 'error',
           error: error.message
         })
       }
    }

    // 📋 RESUMO DOS TESTES
    const summary = {
      total_tests: results.tests.length,
      successful_tests: results.tests.filter(t => t.status === 'success').length,
      failed_tests: results.tests.filter(t => t.status === 'error').length,
      ad_accounts_found: results.tests.find(t => t.test === 'GET /me/adaccounts')?.accounts_found || 0,
      total_campaigns_found: results.tests
        .filter(t => t.test.includes('/campaigns'))
        .reduce((sum, t) => sum + (t.campaigns_found || 0), 0),
      instagram_posts_found: results.tests.find(t => t.test.includes('/media'))?.posts_found || 0
    }

    console.log('✅ Testes das APIs oficiais concluídos:', summary)

    return NextResponse.json({
      ...results,
      summary,
      recommendations: [
        summary.ad_accounts_found > 0 && summary.total_campaigns_found === 0 ? 
          'Contas de anúncios encontradas mas sem campanhas. Verifique se há campanhas ativas no Business Manager.' : null,
        summary.instagram_posts_found === 0 ? 
          'Nenhum post do Instagram encontrado. Verifique se a conta Instagram está conectada corretamente.' : null,
        summary.failed_tests > summary.successful_tests ? 
          'Muitos testes falharam. Verifique permissões do token de acesso.' : null
      ].filter(Boolean)
    })

  } catch (error: any) {
    console.error('❌ Erro ao testar APIs oficiais:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Erro ao testar APIs oficiais',
      details: error.message 
    }, { status: 500 })
  }
} 