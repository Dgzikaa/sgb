import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações do Google
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID') || '';
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
const GOOGLE_REFRESH_TOKEN = Deno.env.get('GOOGLE_REFRESH_TOKEN') || '';
const GOOGLE_ADS_CUSTOMER_ID = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID') || ''; // Sem hífens
const GOOGLE_ADS_DEVELOPER_TOKEN = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN') || '';
const GOOGLE_GMB_LOCATION_ID = Deno.env.get('GOOGLE_GMB_LOCATION_ID') || ''; // locations/XXXXXX

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const body = await req.json().catch(() => ({}));
    const barId = body.bar_id || 3;
    const semana = body.semana;
    const ano = body.ano;

    // Calcular datas da semana
    const { dataInicio, dataFim } = calcularDatasSemana(semana, ano);
    
    console.log(`Sincronizando marketing Google: Semana ${semana}/${ano} (${dataInicio} a ${dataFim})`);

    // Obter access token
    const accessToken = await obterAccessToken();

    // 1. Buscar dados do Google Ads
    const adsData = await buscarGoogleAds(accessToken, dataInicio, dataFim);
    
    // 2. Buscar dados do Google Meu Negócio
    const gmbData = await buscarGoogleMeuNegocio(accessToken, dataInicio, dataFim);

    // 3. Atualizar registro existente ou criar novo
    // Primeiro busca se já existe
    const { data: existente } = await supabase
      .from('marketing_semanal')
      .select('id')
      .eq('bar_id', barId)
      .eq('ano', ano)
      .eq('semana', semana)
      .single();

    const dadosGoogle = {
      // Google Ads
      g_valor_investido: adsData.cost || 0,
      g_impressoes: adsData.impressions || 0,
      g_cliques: adsData.clicks || 0,
      g_cpc: adsData.cpc || 0,
      g_ctr: adsData.ctr || 0,
      g_solicitacoes_rotas: adsData.conversions || 0,
      g_ligacoes: adsData.phone_calls || 0,
      g_click_reservas: adsData.website_clicks || 0,
      
      // Google Meu Negócio
      gmn_total_acoes: gmbData.total_actions || 0,
      gmn_total_visualizacoes: gmbData.total_views || 0,
      gmn_visu_pesquisa: gmbData.search_views || 0,
      gmn_visu_maps: gmbData.maps_views || 0,
      gmn_cliques_website: gmbData.website_clicks || 0,
      gmn_ligacoes: gmbData.phone_calls || 0,
      gmn_solicitacoes_rotas: gmbData.direction_requests || 0,
      gmn_menu_views: gmbData.menu_views || 0,
      
      updated_at: new Date().toISOString()
    };

    if (existente) {
      // Atualizar registro existente
      const { error } = await supabase
        .from('marketing_semanal')
        .update(dadosGoogle)
        .eq('id', existente.id);

      if (error) throw error;
    } else {
      // Criar novo registro
      const { error } = await supabase
        .from('marketing_semanal')
        .insert({
          bar_id: barId,
          ano: ano,
          semana: semana,
          data_inicio: dataInicio,
          data_fim: dataFim,
          fonte: 'api_google',
          ...dadosGoogle
        });

      if (error) throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Marketing Google sincronizado para semana ${semana}/${ano}`,
        dados: dadosGoogle
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na sincronização:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Calcular datas de início e fim da semana ISO
function calcularDatasSemana(semana: number, ano: number): { dataInicio: string; dataFim: string } {
  const jan1 = new Date(ano, 0, 1);
  const dayOfWeek = jan1.getDay();
  const daysToFirstThursday = (4 - dayOfWeek + 7) % 7;
  const firstThursday = new Date(ano, 0, 1 + daysToFirstThursday);
  
  const firstMonday = new Date(firstThursday);
  firstMonday.setDate(firstThursday.getDate() - 3);
  
  const dataInicio = new Date(firstMonday);
  dataInicio.setDate(firstMonday.getDate() + (semana - 1) * 7);
  
  const dataFim = new Date(dataInicio);
  dataFim.setDate(dataInicio.getDate() + 6);
  
  return {
    dataInicio: dataInicio.toISOString().split('T')[0],
    dataFim: dataFim.toISOString().split('T')[0]
  };
}

// Obter access token do Google via refresh token
async function obterAccessToken(): Promise<string> {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
    throw new Error('Google OAuth não configurado');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: GOOGLE_REFRESH_TOKEN,
      grant_type: 'refresh_token'
    })
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`Erro OAuth: ${data.error_description}`);
  }

  return data.access_token;
}

// Buscar dados do Google Ads
async function buscarGoogleAds(accessToken: string, dataInicio: string, dataFim: string): Promise<any> {
  if (!GOOGLE_ADS_CUSTOMER_ID || !GOOGLE_ADS_DEVELOPER_TOKEN) {
    console.warn('Google Ads não configurado - retornando dados vazios');
    return {};
  }

  try {
    // Google Ads API usa GAQL (Google Ads Query Language)
    const query = `
      SELECT
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.phone_calls
      FROM customer
      WHERE segments.date BETWEEN '${dataInicio}' AND '${dataFim}'
    `;

    const response = await fetch(
      `https://googleads.googleapis.com/v17/customers/${GOOGLE_ADS_CUSTOMER_ID}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': GOOGLE_ADS_DEVELOPER_TOKEN,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error('Erro Google Ads:', data.error);
      return {};
    }

    // Agregar resultados
    let totalCost = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalPhoneCalls = 0;

    if (data.results) {
      for (const result of data.results) {
        const metrics = result.metrics || {};
        totalCost += (metrics.costMicros || 0) / 1000000; // Converter de micros para reais
        totalImpressions += metrics.impressions || 0;
        totalClicks += metrics.clicks || 0;
        totalConversions += metrics.conversions || 0;
        totalPhoneCalls += metrics.phoneCalls || 0;
      }
    }

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    const cpc = totalClicks > 0 ? (totalCost / totalClicks) : 0;

    return {
      cost: totalCost,
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: ctr,
      cpc: cpc,
      conversions: totalConversions,
      phone_calls: totalPhoneCalls
    };
  } catch (error) {
    console.error('Erro ao buscar Google Ads:', error);
    return {};
  }
}

// Buscar dados do Google Meu Negócio
async function buscarGoogleMeuNegocio(accessToken: string, dataInicio: string, dataFim: string): Promise<any> {
  if (!GOOGLE_GMB_LOCATION_ID) {
    console.warn('Google Meu Negócio não configurado - retornando dados vazios');
    return {};
  }

  try {
    // Google Business Profile Performance API
    const url = `https://businessprofileperformance.googleapis.com/v1/${GOOGLE_GMB_LOCATION_ID}:getDailyMetricsTimeSeries?` +
      `dailyMetric=WEBSITE_CLICKS&dailyMetric=CALL_CLICKS&dailyMetric=DIRECTION_REQUESTS&dailyMetric=BUSINESS_IMPRESSIONS_DESKTOP_MAPS&dailyMetric=BUSINESS_IMPRESSIONS_DESKTOP_SEARCH&dailyMetric=BUSINESS_IMPRESSIONS_MOBILE_MAPS&dailyMetric=BUSINESS_IMPRESSIONS_MOBILE_SEARCH` +
      `&dailyRange.startDate.year=${dataInicio.split('-')[0]}&dailyRange.startDate.month=${parseInt(dataInicio.split('-')[1])}&dailyRange.startDate.day=${parseInt(dataInicio.split('-')[2])}` +
      `&dailyRange.endDate.year=${dataFim.split('-')[0]}&dailyRange.endDate.month=${parseInt(dataFim.split('-')[1])}&dailyRange.endDate.day=${parseInt(dataFim.split('-')[2])}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await response.json();

    if (data.error) {
      console.error('Erro GMB:', data.error);
      return {};
    }

    // Agregar métricas
    let websiteClicks = 0;
    let phoneCalls = 0;
    let directionRequests = 0;
    let mapsViews = 0;
    let searchViews = 0;

    if (data.multiDailyMetricTimeSeries) {
      for (const series of data.multiDailyMetricTimeSeries) {
        const metric = series.dailyMetric;
        const total = series.timeSeries?.datedValues?.reduce(
          (sum: number, dv: any) => sum + (dv.value || 0), 0
        ) || 0;

        switch (metric) {
          case 'WEBSITE_CLICKS':
            websiteClicks = total;
            break;
          case 'CALL_CLICKS':
            phoneCalls = total;
            break;
          case 'DIRECTION_REQUESTS':
            directionRequests = total;
            break;
          case 'BUSINESS_IMPRESSIONS_DESKTOP_MAPS':
          case 'BUSINESS_IMPRESSIONS_MOBILE_MAPS':
            mapsViews += total;
            break;
          case 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH':
          case 'BUSINESS_IMPRESSIONS_MOBILE_SEARCH':
            searchViews += total;
            break;
        }
      }
    }

    const totalViews = mapsViews + searchViews;
    const totalActions = websiteClicks + phoneCalls + directionRequests;

    return {
      total_views: totalViews,
      search_views: searchViews,
      maps_views: mapsViews,
      website_clicks: websiteClicks,
      phone_calls: phoneCalls,
      direction_requests: directionRequests,
      total_actions: totalActions,
      menu_views: 0 // Não disponível na API padrão
    };
  } catch (error) {
    console.error('Erro ao buscar GMB:', error);
    return {};
  }
}
