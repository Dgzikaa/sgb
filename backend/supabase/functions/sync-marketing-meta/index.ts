import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configurações do Meta (Facebook/Instagram)
const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN') || '';
const META_AD_ACCOUNT_ID = Deno.env.get('META_AD_ACCOUNT_ID') || ''; // act_XXXXXXXXX
const META_INSTAGRAM_ID = Deno.env.get('META_INSTAGRAM_ID') || '';
const META_API_VERSION = 'v21.0';

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
    
    console.log(`Sincronizando marketing Meta: Semana ${semana}/${ano} (${dataInicio} a ${dataFim})`);

    // 1. Buscar dados do Meta Ads
    const adsData = await buscarMetaAds(dataInicio, dataFim);
    
    // 2. Buscar dados do Instagram Orgânico
    const instagramData = await buscarInstagramOrganico(dataInicio, dataFim);

    // 3. Salvar no banco
    const dadosMarketing = {
      bar_id: barId,
      ano: ano,
      semana: semana,
      data_inicio: dataInicio,
      data_fim: dataFim,
      
      // Instagram Orgânico
      o_num_posts: instagramData.posts || 0,
      o_alcance: instagramData.reach || 0,
      o_interacao: instagramData.engagement || 0,
      o_curtidas: instagramData.likes || 0,
      o_comentarios: instagramData.comments || 0,
      o_salvamentos: instagramData.saves || 0,
      o_compartilhamento: instagramData.shares || 0,
      o_engajamento: instagramData.engagement_rate || 0,
      o_num_stories: instagramData.stories || 0,
      o_visu_stories: instagramData.story_views || 0,
      o_retencao_stories: instagramData.story_retention || 0,
      
      // Meta Ads
      m_valor_investido: adsData.spend || 0,
      m_alcance: adsData.reach || 0,
      m_impressoes: adsData.impressions || 0,
      m_frequencia: adsData.frequency || 0,
      m_cpm: adsData.cpm || 0,
      m_cliques: adsData.clicks || 0,
      m_ctr: adsData.ctr || 0,
      m_cpc: adsData.cpc || 0,
      m_conversas_iniciadas: adsData.messaging_conversations_started || 0,
      m_reproducoes_25: adsData.video_p25_watched || 0,
      m_reproducoes_75: adsData.video_p75_watched || 0,
      
      fonte: 'api_meta',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('marketing_semanal')
      .upsert(dadosMarketing, { 
        onConflict: 'bar_id,ano,semana',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error('Erro ao salvar dados:', error);
      throw error;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Marketing Meta sincronizado para semana ${semana}/${ano}`,
        dados: dadosMarketing
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
  // Primeiro dia do ano
  const jan1 = new Date(ano, 0, 1);
  // Encontrar a primeira quinta-feira do ano (semana ISO começa na segunda)
  const dayOfWeek = jan1.getDay();
  const daysToFirstThursday = (4 - dayOfWeek + 7) % 7;
  const firstThursday = new Date(ano, 0, 1 + daysToFirstThursday);
  
  // Primeira segunda-feira da semana 1
  const firstMonday = new Date(firstThursday);
  firstMonday.setDate(firstThursday.getDate() - 3);
  
  // Calcular início da semana desejada
  const dataInicio = new Date(firstMonday);
  dataInicio.setDate(firstMonday.getDate() + (semana - 1) * 7);
  
  // Fim da semana (domingo)
  const dataFim = new Date(dataInicio);
  dataFim.setDate(dataInicio.getDate() + 6);
  
  return {
    dataInicio: dataInicio.toISOString().split('T')[0],
    dataFim: dataFim.toISOString().split('T')[0]
  };
}

// Buscar dados do Meta Ads
async function buscarMetaAds(dataInicio: string, dataFim: string): Promise<any> {
  if (!META_ACCESS_TOKEN || !META_AD_ACCOUNT_ID) {
    console.warn('Meta Ads não configurado - retornando dados vazios');
    return {};
  }

  try {
    const fields = [
      'spend',
      'reach',
      'impressions',
      'frequency',
      'cpm',
      'clicks',
      'ctr',
      'cpc',
      'actions' // Inclui conversas iniciadas
    ].join(',');

    const url = `https://graph.facebook.com/${META_API_VERSION}/${META_AD_ACCOUNT_ID}/insights?` +
      `fields=${fields}` +
      `&time_range={"since":"${dataInicio}","until":"${dataFim}"}` +
      `&access_token=${META_ACCESS_TOKEN}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('Erro Meta Ads:', data.error);
      return {};
    }

    if (!data.data || data.data.length === 0) {
      return {};
    }

    const insights = data.data[0];
    
    // Extrair conversas iniciadas das actions
    let conversasIniciadas = 0;
    if (insights.actions) {
      const conversaAction = insights.actions.find(
        (a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d'
      );
      conversasIniciadas = conversaAction ? parseInt(conversaAction.value) : 0;
    }

    return {
      spend: parseFloat(insights.spend) || 0,
      reach: parseInt(insights.reach) || 0,
      impressions: parseInt(insights.impressions) || 0,
      frequency: parseFloat(insights.frequency) || 0,
      cpm: parseFloat(insights.cpm) || 0,
      clicks: parseInt(insights.clicks) || 0,
      ctr: parseFloat(insights.ctr) || 0,
      cpc: parseFloat(insights.cpc) || 0,
      messaging_conversations_started: conversasIniciadas
    };
  } catch (error) {
    console.error('Erro ao buscar Meta Ads:', error);
    return {};
  }
}

// Buscar dados do Instagram Orgânico
async function buscarInstagramOrganico(dataInicio: string, dataFim: string): Promise<any> {
  if (!META_ACCESS_TOKEN || !META_INSTAGRAM_ID) {
    console.warn('Instagram não configurado - retornando dados vazios');
    return {};
  }

  try {
    // Buscar insights da conta
    const insightsUrl = `https://graph.facebook.com/${META_API_VERSION}/${META_INSTAGRAM_ID}/insights?` +
      `metric=reach,impressions,profile_views` +
      `&period=day` +
      `&since=${dataInicio}` +
      `&until=${dataFim}` +
      `&access_token=${META_ACCESS_TOKEN}`;

    const insightsResponse = await fetch(insightsUrl);
    const insightsData = await insightsResponse.json();

    // Buscar posts do período
    const mediaUrl = `https://graph.facebook.com/${META_API_VERSION}/${META_INSTAGRAM_ID}/media?` +
      `fields=id,timestamp,like_count,comments_count,insights.metric(reach,engagement,shares,saved)` +
      `&since=${dataInicio}` +
      `&until=${dataFim}` +
      `&access_token=${META_ACCESS_TOKEN}`;

    const mediaResponse = await fetch(mediaUrl);
    const mediaData = await mediaResponse.json();

    // Buscar stories
    const storiesUrl = `https://graph.facebook.com/${META_API_VERSION}/${META_INSTAGRAM_ID}/stories?` +
      `fields=id,timestamp,insights.metric(reach,impressions,exits,replies)` +
      `&access_token=${META_ACCESS_TOKEN}`;

    const storiesResponse = await fetch(storiesUrl);
    const storiesData = await storiesResponse.json();

    // Agregar dados
    let totalReach = 0;
    let totalEngagement = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalSaves = 0;
    let postCount = 0;

    if (mediaData.data) {
      for (const post of mediaData.data) {
        postCount++;
        totalLikes += post.like_count || 0;
        totalComments += post.comments_count || 0;
        
        if (post.insights?.data) {
          for (const insight of post.insights.data) {
            if (insight.name === 'reach') totalReach += insight.values[0]?.value || 0;
            if (insight.name === 'engagement') totalEngagement += insight.values[0]?.value || 0;
            if (insight.name === 'shares') totalShares += insight.values[0]?.value || 0;
            if (insight.name === 'saved') totalSaves += insight.values[0]?.value || 0;
          }
        }
      }
    }

    // Stories
    let storyCount = 0;
    let storyViews = 0;
    let storyExits = 0;

    if (storiesData.data) {
      for (const story of storiesData.data) {
        storyCount++;
        if (story.insights?.data) {
          for (const insight of story.insights.data) {
            if (insight.name === 'impressions') storyViews += insight.values[0]?.value || 0;
            if (insight.name === 'exits') storyExits += insight.values[0]?.value || 0;
          }
        }
      }
    }

    const storyRetention = storyViews > 0 ? ((storyViews - storyExits) / storyViews * 100) : 0;
    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach * 100) : 0;

    return {
      posts: postCount,
      reach: totalReach,
      engagement: totalEngagement,
      likes: totalLikes,
      comments: totalComments,
      shares: totalShares,
      saves: totalSaves,
      engagement_rate: engagementRate,
      stories: storyCount,
      story_views: storyViews,
      story_retention: storyRetention
    };
  } catch (error) {
    console.error('Erro ao buscar Instagram:', error);
    return {};
  }
}
