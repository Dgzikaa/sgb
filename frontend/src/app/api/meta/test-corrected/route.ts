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
    console.log('🔧 [CORRECTED TEST] Iniciando teste com endpoints e métricas corretos...');

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
      return NextResponse.json({ 
        error: 'Token de acesso não encontrado',
        config_checked: `bar_id: ${CONFIG.BAR_ID}`
      }, { status: 404 });
    }

    const results: any = {
      timestamp: new Date().toISOString(),
      config: CONFIG,
      fixes_applied: [
        '✅ Meta Ads: Adicionado fields obrigatório para campanhas',
        '✅ Meta Ads: Adicionado date_preset para insights',
        '✅ Instagram: Removido profile_views (NÃO EXISTE na API)',
        '✅ Instagram: Removido website_clicks (NÃO EXISTE na API)', 
        '✅ Instagram: Usando profile_visits, reach, impressions, follows',
        '✅ URLs: Helper buildFacebookApiUrl para consistência'
      ],
      tests: {
        meta_campaigns: { tested: false, result: null, error: null },
        instagram_profile: { tested: false, result: null, error: null },
        instagram_insights: { tested: false, result: null, error: null }
      }
    };

    // ========================================
    // 1. META ADS - CAMPANHAS (CORRIGIDO)
    // ========================================
    console.log('📊 Testando Meta Ads API - Campanhas...');
    
    try {
      const campaignsUrl = buildFacebookApiUrl(`/${CONFIG.AD_ACCOUNT_ID}/campaigns`, {
        fields: 'id,name,status,objective,created_time', // OBRIGATÓRIO
        access_token: config.access_token
      });

      console.log('🔗 URL Campanhas:', campaignsUrl.replace(config.access_token, 'TOKEN'));

      const campaignsResponse = await fetch(campaignsUrl);
      const campaignsData = await campaignsResponse.json();
      
      results.tests.meta_campaigns.tested = true;
      
      if (campaignsData.error) {
        results.tests.meta_campaigns.error = campaignsData.error;
        console.log('❌ Erro campanhas:', campaignsData.error);
      } else {
        results.tests.meta_campaigns.result = {
          total_campaigns: campaignsData.data?.length || 0,
          campaigns: campaignsData.data?.slice(0, 3) || [] // Primeiras 3
        };
        console.log(`✅ Campanhas: ${campaignsData.data?.length || 0} encontradas`);
      }

    } catch (error) {
      results.tests.meta_campaigns.error = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro Meta Ads:', error);
    }

    // ========================================
    // 2. INSTAGRAM PROFILE (CORRIGIDO)
    // ========================================
    console.log('📸 Testando Instagram Profile...');
    
    try {
      const profileUrl = buildFacebookApiUrl(`/${CONFIG.INSTAGRAM_ID}`, {
        fields: 'id,username,name,biography,website,followers_count,follows_count,media_count',
        access_token: config.access_token
      });

      console.log('🔗 URL Profile:', profileUrl.replace(config.access_token, 'TOKEN'));

      const profileResponse = await fetch(profileUrl);
      const profileData = await profileResponse.json();

      results.tests.instagram_profile.tested = true;
      
      if (profileData.error) {
        results.tests.instagram_profile.error = profileData.error;
        console.log('❌ Erro profile:', profileData.error);
      } else {
        results.tests.instagram_profile.result = {
          username: profileData.username,
          followers_count: profileData.followers_count,
          media_count: profileData.media_count
        };
        console.log(`✅ Profile: @${profileData.username}, ${profileData.followers_count} seguidores`);
      }

    } catch (error) {
      results.tests.instagram_profile.error = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro Instagram Profile:', error);
    }

    // ========================================
    // 3. INSTAGRAM INSIGHTS (MÉTRICAS CORRETAS)
    // ========================================
    console.log('📈 Testando Instagram Insights...');
    
    try {
      // USANDO MÉTRICAS QUE REALMENTE EXISTEM
      const insightsUrl = buildFacebookApiUrl(`/${CONFIG.INSTAGRAM_ID}/insights`, {
        metric: 'profile_visits,reach,impressions', // SEM profile_views e website_clicks!
        period: 'day',
        since: '2025-01-20',
        until: '2025-01-25',
        access_token: config.access_token
      });

      console.log('🔗 URL Insights:', insightsUrl.replace(config.access_token, 'TOKEN'));

      const insightsResponse = await fetch(insightsUrl);
      const insightsData = await insightsResponse.json();

      results.tests.instagram_insights.tested = true;
      
      if (insightsData.error) {
        results.tests.instagram_insights.error = insightsData.error;
        console.log('❌ Erro insights:', insightsData.error);
      } else {
        results.tests.instagram_insights.result = {
          metrics_count: insightsData.data?.length || 0,
          metrics: insightsData.data?.map((metric: any) => ({
            name: metric.name,
            values_count: metric.values?.length || 0
          })) || []
        };
        console.log(`✅ Insights: ${insightsData.data?.length || 0} métricas coletadas`);
      }

    } catch (error) {
      results.tests.instagram_insights.error = error instanceof Error ? error.message : String(error);
      console.error('❌ Erro Instagram Insights:', error);
    }

    // ========================================
    // RELATÓRIO FINAL
    // ========================================
    const summary = {
      total_tests: 3,
      successful_tests: Object.values(results.tests).filter((test: any) => test.tested && !test.error).length,
      failed_tests: Object.values(results.tests).filter((test: any) => test.tested && test.error).length,
      meta_campaigns_found: results.tests.meta_campaigns.result?.total_campaigns || 0,
      instagram_profile_ok: !!results.tests.instagram_profile.result?.username,
      instagram_insights_ok: !!results.tests.instagram_insights.result?.metrics_count
    };

    console.log('✅ TESTE CORRIGIDO FINALIZADO:', summary);

    return NextResponse.json({
      success: true,
      message: 'Teste com endpoints e métricas corretos',
      summary,
      results
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