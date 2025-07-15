import { NextResponse } from 'next/server';

// CONFIG - Centralizado
const CONFIG = {
  BAR_ID: 3,
  TARGET_ACCOUNT_ID: 'act_1153081576486761',
  API_VERSION: 'v18.0',
  FALLBACK_WEBHOOK: process.env.DISCORD_WEBHOOK_URL_GERAL || '',
  
  // IDs corretos baseados na configuração do banco
  BUSINESS_ID: '765235497466478',
  AD_ACCOUNT_ID: 'act_1153081576486761', 
  PAGE_ID: '517416481460390',
  INSTAGRAM_ID: '17841462447173052'
} as const;

// Helper para construir URLs da API
function buildFacebookApiUrl(endpoint: string, params: Record<string, string> = {}): string {
  const baseUrl = `https://graph.facebook.com/${CONFIG.API_VERSION}`;
  const queryParams = new URLSearchParams(params);
  return `${baseUrl}${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
}

export async function GET() {
  try {
    console.log('🔧 [FIXED TEST] Iniciando teste com endpoints corrigidos...');

    // Buscar token de acesso do banco
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: config } = await supabase
      .from('meta_config')
      .select('access_token')
      .eq('bar_id', CONFIG.BAR_ID)
      .single();

    if (!config?.access_token) {
      return NextResponse.json({ error: 'Token de acesso não encontrado' }, { status: 404 });
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      meta_ads: {
        total_campaigns: 0,
        campaigns: [],
        campaigns_with_insights: []
      },
      instagram: {
        profile: null,
        insights: { data: [], error: null },
        recent_posts: { data: [], error: null, count: 0 }
      },
      facebook_page: {
        info: null,
        insights: { data: [], error: null }
      },
      errors: [] as string[]
    };

    // ========================================
    // 1. META ADS - CAMPANHAS (CORRIGIDO)
    // ========================================
    console.log('📊 Testando Meta Ads API - Campanhas...');
    
    try {
      // Primeiro, buscar as campanhas
      const campaignsUrl = buildFacebookApiUrl(`/${CONFIG.AD_ACCOUNT_ID}/campaigns`, {
        fields: 'id,name,status,objective,created_time',
        access_token: config.access_token
      });

      const campaignsResponse = await fetch(campaignsUrl);
      const campaignsData = await campaignsResponse.json();
      
      if (campaignsData.error) {
        throw new Error(`Campanhas: ${campaignsData.error.message}`);
      }

      results.meta_ads = {
        total_campaigns: campaignsData.data?.length || 0,
        campaigns: campaignsData.data || [],
        campaigns_with_insights: []
      };

      // Buscar insights para cada campanha (CORRIGIDO)
      if (campaignsData.data?.length > 0) {
        console.log(`📈 Buscando insights para ${campaignsData.data.length} campanhas...`);
        
        for (const campaign of campaignsData.data.slice(0, 5)) { // Limitar a 5 para teste
          try {
            const insightsUrl = buildFacebookApiUrl(`/${campaign.id}/insights`, {
              fields: 'campaign_id,campaign_name,impressions,clicks,spend,reach,frequency,cpm,cpc,ctr',
              date_preset: 'last_30d',
              access_token: config.access_token
            });

            const insightsResponse = await fetch(insightsUrl);
            const insightsData = await insightsResponse.json();

            const campaignWithInsights = {
              id: campaign.id,
              name: campaign.name,
              status: campaign.status,
              objective: campaign.objective,
              insights: insightsData.data || [],
              insights_error: insightsData.error || null
            };

            results.meta_ads.campaigns_with_insights.push(campaignWithInsights);
            
            console.log(`✅ Campanha ${campaign.name}: ${insightsData.data?.length || 0} insights`);
            
          } catch (error) {
            console.error(`❌ Erro na campanha ${campaign.name}:`, error);
            results.errors.push(`Campanha ${campaign.name}: ${error}`);
          }
        }
      }

    } catch (error) {
      console.error('❌ Erro Meta Ads:', error);
      results.errors.push(`Meta Ads: ${error}`);
    }

    // ========================================
    // 2. INSTAGRAM GRAPH API (CORRIGIDO)
    // ========================================
    console.log('📸 Testando Instagram Graph API...');
    
    try {
      // Profile básico
      const profileUrl = buildFacebookApiUrl(`/${CONFIG.INSTAGRAM_ID}`, {
        fields: 'id,username,name,biography,website,followers_count,follows_count,media_count',
        access_token: config.access_token
      });

      const profileResponse = await fetch(profileUrl);
      const profileData = await profileResponse.json();

      if (profileData.error) {
        throw new Error(`Instagram Profile: ${profileData.error.message}`);
      }

      // Insights do perfil (MÉTRICAS CORRETAS)
      const insightsUrl = buildFacebookApiUrl(`/${CONFIG.INSTAGRAM_ID}/insights`, {
        metric: 'profile_visits,reach,impressions,follows', // Métricas que existem!
        period: 'day',
        since: '2025-01-15',
        until: '2025-01-25',
        access_token: config.access_token
      });

      const insightsResponse = await fetch(insightsUrl);
      const insightsData = await insightsResponse.json();

      // Posts recentes
      const mediaUrl = buildFacebookApiUrl(`/${CONFIG.INSTAGRAM_ID}/media`, {
        fields: 'id,caption,media_type,media_url,timestamp,like_count,comments_count',
        limit: '10',
        access_token: config.access_token
      });

      const mediaResponse = await fetch(mediaUrl);
      const mediaData = await mediaResponse.json();

      results.instagram = {
        profile: profileData,
        insights: {
          data: insightsData.data || [],
          error: insightsData.error || null
        },
        recent_posts: {
          data: mediaData.data || [],
          error: mediaData.error || null,
          count: mediaData.data?.length || 0
        }
      };

      console.log(`✅ Instagram: ${profileData.username}, ${insightsData.data?.length || 0} insights, ${mediaData.data?.length || 0} posts`);

    } catch (error) {
      console.error('❌ Erro Instagram:', error);
      results.errors.push(`Instagram: ${error}`);
    }

    // ========================================
    // 3. FACEBOOK PAGE (BÁSICO)
    // ========================================
    console.log('📘 Testando Facebook Page...');
    
    try {
      const pageUrl = buildFacebookApiUrl(`/${CONFIG.PAGE_ID}`, {
        fields: 'id,name,category,fan_count,followers_count,about,website,location',
        access_token: config.access_token
      });

      const pageResponse = await fetch(pageUrl);
      const pageData = await pageResponse.json();

      if (pageData.error) {
        throw new Error(`Facebook Page: ${pageData.error.message}`);
      }

      // Page Insights básicos
      const pageInsightsUrl = buildFacebookApiUrl(`/${CONFIG.PAGE_ID}/insights`, {
        metric: 'page_fans,page_fan_adds,page_impressions',
        period: 'day',
        since: '2025-01-15',
        until: '2025-01-25',
        access_token: config.access_token
      });

      const pageInsightsResponse = await fetch(pageInsightsUrl);
      const pageInsightsData = await pageInsightsResponse.json();

      results.facebook_page = {
        info: pageData,
        insights: {
          data: pageInsightsData.data || [],
          error: pageInsightsData.error || null
        }
      };

      console.log(`✅ Facebook Page: ${pageData.name}, ${pageInsightsData.data?.length || 0} insights`);

    } catch (error) {
      console.error('❌ Erro Facebook Page:', error);
      results.errors.push(`Facebook Page: ${error}`);
    }

    // ========================================
    // RELATÓRIO FINAL
    // ========================================
    const summary = {
      total_errors: results.errors.length,
      meta_ads_campaigns: results.meta_ads.total_campaigns || 0,
      meta_ads_with_insights: results.meta_ads.campaigns_with_insights?.length || 0,
      instagram_profile: !!results.instagram.profile?.username,
      instagram_insights: results.instagram.insights?.data?.length || 0,
      instagram_posts: results.instagram.recent_posts?.count || 0,
      facebook_page: !!results.facebook_page.info?.name,
      facebook_insights: results.facebook_page.insights?.data?.length || 0
    };

    console.log('✅ TESTE FINALIZADO:', summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
      corrections_applied: [
        '✅ Campanhas Meta: Adicionados parâmetros obrigatórios (fields, date_preset)',
        '✅ Instagram: Removidas métricas inexistentes (profile_views, website_clicks)', 
        '✅ Instagram: Usando métricas corretas (profile_visits, reach, impressions, follows)',
        '✅ URLs: Helper buildFacebookApiUrl para consistência',
        '✅ Config: Constantes centralizadas'
      ]
    }, { status: 200 });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 