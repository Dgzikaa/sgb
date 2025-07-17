import { createClient } from '@supabase/supabase-js'

// ========================================
// 📊 CONFIGURAÇÕES E TIPOS
// ========================================

interface MetaConfig {
  access_token: string
  app_id: string
  app_secret: string
  facebook_page_id?: string
  instagram_account_id?: string
  api_version: string
  page_id?: string
  business_id?: string
}

interface RateLimitInfo {
  platform_usage?: {
    call_count: number
    total_time: number
    total_cputime: number
  }
  business_usage?: {
    call_count: number
    total_time: number
    total_cputime: number
    estimated_time_to_regain_access: number
    type: string
  }
}

interface FacebookPageMetrics {
  page_impressions: number
  page_reach: number
  page_engaged_users: number
  page_fans: number
  page_fan_adds: number
  page_fan_removes: number
  page_actions_post_reactions_total: number
  page_negative_feedback: number
  page_positive_feedback: number
  page_video_views: number
  page_video_complete_views: number
}

interface InstagramAccountMetrics {
  follower_count: number
  following_count: number
  impressions: number
  reach: number
  profile_views: number
}

interface FacebookPost {
  id: string
  message?: string
  story?: string
  link?: string
  created_time: string
  type: string
  insights?: {
    post_impressions: number
    post_reach: number
    post_engaged_users: number
    post_clicks: number
    post_reactions_like_total: number
    post_reactions_love_total: number
    post_reactions_wow_total: number
    post_reactions_haha_total: number
    post_reactions_sad_total: number
    post_reactions_angry_total: number
    post_comments: number
    post_shares: number
  }
}

interface InstagramMedia {
  id: string
  caption?: string
  media_type: string
  media_url?: string
  permalink?: string
  timestamp: string
  insights?: {
    impressions: number
    reach: number
    engagement: number
    likes: number
    comments: number
    shares: number
    saves: number
    plays?: number
    total_interactions?: number
  }
}

interface ApiCredential {
  access_token: string;
  client_id: string;
  client_secret: string;
  configuracoes?: {
    api_version?: string;
    page_id?: string;
    instagram_account_id?: string;
    business_id?: string;
    configuracoes_adicionais?: { business_id?: string }
  };
}

interface SupabaseResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

interface SupabaseUpsertResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

interface SupabaseInsertResponse<T> {
  data: T | null;
  error: { message: string } | null;
}

// ========================================
// 📊 SERVIÇO PRINCIPAL
// ========================================

export class MetaSocialService {
  private supabase
  private config: MetaConfig | null = null
  private barId: number
  private rateLimitInfo: RateLimitInfo = {}

  constructor(barId: number) {
    this.barId = barId
    this.supabase = createClient(
      String(process.env.NEXT_PUBLIC_SUPABASE_URL),
      String(process.env.SUPABASE_SERVICE_ROLE_KEY)
    )
  }

  // ========================================
  // 📊 MONITORAMENTO DE RATE LIMITS
  // ========================================

  private processRateLimitHeaders(response: Response): void {
    try {
      // X-App-Usage header (Platform Rate Limits)
      const appUsage = response.headers.get('X-App-Usage')
      if (appUsage) {
        const parsedAppUsage = JSON.parse(appUsage) as {
          call_count: number;
          total_time: number;
          total_cputime: number;
        };
        this.rateLimitInfo.platform_usage = parsedAppUsage;
      }

      // X-Business-Use-Case-Usage header (Instagram Graph API)
      const bucUsage = response.headers.get('X-Business-Use-Case-Usage')
      if (bucUsage) {
        const parsed: Record<string, Array<{
          call_count: number;
          total_time: number;
          total_cputime: number;
          estimated_time_to_regain_access: number;
          type: string;
        }>> = JSON.parse(bucUsage)
        // Pegar o primeiro business case (normalmente só há um)
        const businessId = Object.keys(parsed)[0]
        if (businessId && parsed[businessId][0]) {
          this.rateLimitInfo.business_usage = parsed[businessId][0]
        }
      }

      // Log se estivermos próximos do limite
      this.checkRateLimitWarnings()
    } catch (error) {
      console.warn('⚠️ Erro ao processar headers de rate limit:', error)
    }
  }

  private checkRateLimitWarnings(): void {
    const { platform_usage, business_usage } = this.rateLimitInfo

    // Avisar se plataforma estiver acima de 70%
    if (platform_usage && platform_usage.call_count > 70) {
      console.warn(`⚠️ Platform Rate Limit: ${platform_usage.call_count}% usado`)
    }

    // Avisar se business usage estiver acima de 70%
    if (business_usage && business_usage.call_count > 70) {
      console.warn(`⚠️ Business Use Case Rate Limit: ${business_usage.call_count}% usado`)
      if (business_usage.estimated_time_to_regain_access > 0) {
        console.warn(`⚠️ Tempo para recuperar acesso: ${business_usage.estimated_time_to_regain_access} minutos`)
      }
    }
  }

  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo }
  }

  // ========================================
  // ⚙️ GERENCIAMENTO DE CONFIGURAÇÃO
  // ========================================

  async initializeConfig(): Promise<boolean> {
    try {
      console.log('🔄 Inicializando configuração Meta para bar:', this.barId)

      const { data, error } = await this.supabase
        .from('api_credentials')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('sistema', 'meta')
        .eq('ativo', true)
        .single() as SupabaseResponse<ApiCredential>;

      if (error || !data) {
        console.error('❌ Configuração Meta não encontrada:', error)
        return false
      }

      // Combinar dados básicos com configurações unificadas
      const configs = data.configuracoes || {};
      this.config = {
        access_token: data.access_token,
        app_id: data.client_id,
        app_secret: data.client_secret,
        api_version: configs.api_version || 'v18.0',
        facebook_page_id: configs.page_id,
        instagram_account_id: configs.instagram_account_id,
        page_id: configs.page_id,
        business_id: configs.configuracoes_adicionais?.business_id || configs.business_id
      }
      console.log('✅ Configuração Meta carregada')
      return true
    } catch (error) {
      console.error('❌ Erro ao inicializar configuração Meta:', error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) {
      console.error('❌ Configuração não inicializada')
      return false
    }

    try {
      console.log('🔌 Testando conexão com Meta API...')

      // Testar com uma chamada simples
      const response = await fetch(
        `https://graph.facebook.com/${this.config.api_version}/me?access_token=${this.config.access_token}`,
        { method: 'GET' }
      )

      // Processar headers de rate limit
      this.processRateLimitHeaders(response)
      
      const data: { id?: string } = await response.json()

      if (response.ok && data && data.id) {
        console.log('✅ Conexão com Meta API OK')
        
        // Atualizar timestamp de último teste
        const { error: updateError } = await this.supabase
          .from('api_credentials')
          .update({ atualizado_em: new Date().toISOString() })
          .eq('bar_id', this.barId)
          .eq('sistema', 'meta') as SupabaseResponse<unknown>;

        if (updateError) {
          console.warn('⚠️ Erro ao atualizar timestamp de teste:', updateError)
        }

        return true
      } else {
        console.error('❌ Erro na conexão Meta API:', data)
        return false
      }
    } catch (error) {
      console.error('❌ Erro ao testar conexão Meta:', error)
      return false
    }
  }

  // ========================================
  // 📊 COLETA DE MÉTRICAS DO FACEBOOK
  // ========================================

  async collectFacebookMetrics(
    period: 'day' | 'week' | 'month' = 'day',
    since?: string,
    until?: string
  ): Promise<boolean> {
    if (!this.config?.facebook_page_id) {
      console.error('❌ Page ID do Facebook não configurado')
      return false
    }

    try {
      console.log(`🔄 Coletando métricas do Facebook - período: ${period}`)
      
      const logId = await this.startCollectionLog('facebook_page', { period, since, until })

      // Definir métricas a serem coletadas
      const pageMetrics = [
        'page_impressions',
        'page_reach',
        'page_engaged_users',
        'page_fans',
        'page_fan_adds',
        'page_fan_removes',
        'page_actions_post_reactions_total',
        'page_negative_feedback',
        'page_positive_feedback',
        'page_video_views',
        'page_video_complete_views'
      ].join(',')

      // Definir período
      const dateRange = this.getDateRange(period, since, until)
      const params = new URLSearchParams({
        metric: pageMetrics,
        period: period,
        access_token: this.config.access_token,
        ...dateRange
      })

      // Fazer chamada à API
      const response = await fetch(
        `https://graph.facebook.com/${this.config.api_version}/${this.config.facebook_page_id}/insights?${params.toString()}`,
        { method: 'GET' }
      )

      // Processar headers de rate limit
      this.processRateLimitHeaders(response)
      
      const rawData = await response.json();
      const data = rawData as { error?: { message?: string } } & { data?: unknown[] };

      if (!response.ok) {
        throw new Error(`Facebook API Error: ${data.error?.message || 'Unknown error'}`)
      }

      // Processar dados
      const safeData = Array.isArray(data.data)
        ? (data.data.filter(item => typeof item === 'object' && item !== null && 'name' in item && 'values' in item) as Array<{ name: string; values: Array<{ value?: number }> }>)
        : [];
      const processedData = this.processFacebookMetrics(safeData)
      
      // Salvar no banco
      const saved = await this.saveFacebookMetrics(processedData, period, data)

      await this.finishCollectionLog(logId, saved ? 'sucesso' : 'erro', {
        registros_processados: 1,
        registros_novos: saved ? 1 : 0
      })

      console.log(`✅ Métricas do Facebook coletadas: 1 registro`)
      return true

    } catch (error) {
      console.error('❌ Erro ao coletar métricas do Facebook:', error)
      return false
    }
  }

  // ========================================
  // 📊 COLETA DE MÉTRICAS DO INSTAGRAM
  // ========================================

  async collectInstagramMetrics(
    period: 'day' | 'week' | 'month' = 'day',
    since?: string,
    until?: string
  ): Promise<boolean> {
    if (!this.config?.instagram_account_id) {
      console.error('❌ Account ID do Instagram não configurado')
      return false
    }

    try {
      console.log(`🔄 Coletando métricas do Instagram - período: ${period}`)
      
      const logId = await this.startCollectionLog('instagram_account', { period, since, until })

      // Definir métricas a serem coletadas
      const accountMetrics = [
        'follower_count',
        'following_count',
        'impressions',
        'reach',
        'profile_views'
      ].join(',')

      // Definir período
      const dateRange = this.getDateRange(period, since, until)
      const params = new URLSearchParams({
        metric: accountMetrics,
        period: period,
        access_token: this.config.access_token,
        ...dateRange
      })

      // Fazer chamada à API
      const response = await fetch(
        `https://graph.facebook.com/${this.config.api_version}/${this.config.instagram_account_id}/insights?${params.toString()}`,
        { method: 'GET' }
      )

      // Processar headers de rate limit
      this.processRateLimitHeaders(response)
      
      const rawData = await response.json();
      const data = rawData as { error?: { message?: string } } & { data?: unknown[] };

      if (!response.ok) {
        throw new Error(`Instagram API Error: ${data.error?.message || 'Unknown error'}`)
      }

      // Processar dados
      const safeData = Array.isArray(data.data)
        ? (data.data.filter(item => typeof item === 'object' && item !== null && 'name' in item && 'values' in item) as Array<{ name: string; values: Array<{ value?: number }> }>)
        : [];
      const processedData = this.processInstagramMetrics(safeData)
      
      // Salvar no banco
      const saved = await this.saveInstagramMetrics(processedData, period, data)

      await this.finishCollectionLog(logId, saved ? 'sucesso' : 'erro', {
        registros_processados: 1,
        registros_novos: saved ? 1 : 0
      })

      console.log(`✅ Métricas do Instagram coletadas: 1 registro`)
      return true

    } catch (error) {
      console.error('❌ Erro ao coletar métricas do Instagram:', error)
      return false
    }
  }

  // ========================================
  // 📊 COLETA DE POSTS DO FACEBOOK
  // ========================================

  async collectFacebookPosts(limit = 25): Promise<boolean> {
    if (!this.config?.facebook_page_id) {
      console.error('❌ Page ID do Facebook não configurado')
      return false
    }

    try {
      console.log(`🔄 Coletando posts do Facebook - limite: ${limit}`)
      
      const logId = await this.startCollectionLog('facebook_posts', { limit })

      // Buscar posts
      const params = new URLSearchParams({
        fields: 'id,message,story,link,created_time,type,insights{post_impressions,post_reach,post_engaged_users,post_clicks,post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total,post_reactions_haha_total,post_reactions_sad_total,post_reactions_angry_total,post_comments,post_shares}',
        limit: limit.toString(),
        access_token: this.config.access_token
      })

      const response = await fetch(
        `https://graph.facebook.com/${this.config.api_version}/${this.config.facebook_page_id}/posts?${params.toString()}`,
        { method: 'GET' }
      )

      // Processar headers de rate limit
      this.processRateLimitHeaders(response)
      
      const rawData = await response.json();
      const data = rawData as { error?: { message?: string } } & { data?: unknown[] };

      if (!response.ok) {
        throw new Error(`Facebook Posts API Error: ${data.error?.message || 'Unknown error'}`)
      }

      // Processar e salvar posts
      const posts = data.data || []
      let saved = 0
      let updated = 0

      for (const post of posts) {
        const result = await this.saveFacebookPost(post as FacebookPost)
        if (result === 'new') saved++
        else if (result === 'updated') updated++
      }

      await this.finishCollectionLog(logId, 'sucesso', {
        registros_processados: posts.length,
        registros_novos: saved,
        registros_atualizados: updated
      })

      console.log(`✅ Posts do Facebook coletados: ${posts.length} posts, ${saved} novos, ${updated} atualizados`)
      return true

    } catch (error) {
      console.error('❌ Erro ao coletar posts do Facebook:', error)
      return false
    }
  }

  // ========================================
  // 📊 COLETA DE POSTS DO INSTAGRAM
  // ========================================

  async collectInstagramPosts(limit = 25): Promise<boolean> {
    if (!this.config?.instagram_account_id) {
      console.error('❌ Account ID do Instagram não configurado')
      return false
    }

    try {
      console.log(`🔄 Coletando posts do Instagram - limite: ${limit}`)
      
      const logId = await this.startCollectionLog('instagram_posts', { limit })

      // Buscar posts
      const params = new URLSearchParams({
        fields: 'id,caption,media_type,media_url,permalink,timestamp,insights{impressions,reach,engagement,likes,comments,shares,saves,plays,total_interactions}',
        limit: limit.toString(),
        access_token: this.config.access_token
      })

      const response = await fetch(
        `https://graph.facebook.com/${this.config.api_version}/${this.config.instagram_account_id}/media?${params.toString()}`,
        { method: 'GET' }
      )

      // Processar headers de rate limit
      this.processRateLimitHeaders(response)
      
      const rawData = await response.json();
      const data = rawData as { error?: { message?: string } } & { data?: unknown[] };

      if (!response.ok) {
        throw new Error(`Instagram Posts API Error: ${data.error?.message || 'Unknown error'}`)
      }

      // Processar e salvar posts
      const posts = data.data || []
      let saved = 0
      let updated = 0

      for (const post of posts) {
        const result = await this.saveInstagramPost(post as InstagramMedia)
        if (result === 'new') saved++
        else if (result === 'updated') updated++
      }

      await this.finishCollectionLog(logId, 'sucesso', {
        registros_processados: posts.length,
        registros_novos: saved,
        registros_atualizados: updated
      })

      console.log(`✅ Posts do Instagram coletados: ${posts.length} posts, ${saved} novos, ${updated} atualizados`)
      return true

    } catch (error) {
      console.error('❌ Erro ao coletar posts do Instagram:', error)
      return false
    }
  }

  // ========================================
  // 📊 PROCESSAMENTO DE DADOS
  // ========================================

  private processFacebookMetrics(rawData: Array<{ name: string; values: Array<{ value?: number }> }>): FacebookPageMetrics {
    const metrics: Record<string, number> = {};
    for (const item of rawData) {
      if (
        typeof item === 'object' &&
        item !== null &&
        typeof item.name === 'string' &&
        Array.isArray(item.values)
      ) {
        const metricName = item.name;
        const values = item.values;
        if (values.length > 0) {
          const latestValue = values[values.length - 1];
          metrics[metricName] = typeof latestValue.value === 'number' ? latestValue.value : 0;
        }
      }
    }
    return {
      page_impressions: metrics.page_impressions || 0,
      page_reach: metrics.page_reach || 0,
      page_engaged_users: metrics.page_engaged_users || 0,
      page_fans: metrics.page_fans || 0,
      page_fan_adds: metrics.page_fan_adds || 0,
      page_fan_removes: metrics.page_fan_removes || 0,
      page_actions_post_reactions_total: metrics.page_actions_post_reactions_total || 0,
      page_negative_feedback: metrics.page_negative_feedback || 0,
      page_positive_feedback: metrics.page_positive_feedback || 0,
      page_video_views: metrics.page_video_views || 0,
      page_video_complete_views: metrics.page_video_complete_views || 0
    };
  }

  private processInstagramMetrics(rawData: Array<{ name: string; values: Array<{ value?: number }> }>): InstagramAccountMetrics {
    const metrics: Record<string, number> = {};
    for (const item of rawData) {
      if (
        typeof item === 'object' &&
        item !== null &&
        typeof item.name === 'string' &&
        Array.isArray(item.values)
      ) {
        const metricName = item.name;
        const values = item.values;
        if (values.length > 0) {
          const latestValue = values[values.length - 1];
          metrics[metricName] = typeof latestValue.value === 'number' ? latestValue.value : 0;
        }
      }
    }
    return {
      follower_count: metrics.follower_count || 0,
      following_count: metrics.following_count || 0,
      impressions: metrics.impressions || 0,
      reach: metrics.reach || 0,
      profile_views: metrics.profile_views || 0
    };
  }

  // ========================================
  // 📊 SALVAMENTO NO BANCO
  // ========================================

  private async saveFacebookMetrics(
    metrics: FacebookPageMetrics,
    period: string,
    rawData: unknown
  ): Promise<boolean> {
    try {
      const dataReferencia = new Date().toISOString().split('T')[0];
      const { error } = await this.supabase
        .from('facebook_metrics')
        .upsert({
          bar_id: this.barId,
          data_referencia: dataReferencia,
          periodo: period,
          ...metrics,
          raw_data: rawData
        }, {
          onConflict: 'bar_id,data_referencia,periodo'
        }) as SupabaseUpsertResponse<FacebookPageMetrics>;
      if (error) {
        console.error('❌ Erro ao salvar métricas do Facebook:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar métricas do Facebook:', error);
      return false;
    }
  }

  private async saveInstagramMetrics(
    metrics: InstagramAccountMetrics,
    period: string,
    rawData: unknown
  ): Promise<boolean> {
    try {
      const dataReferencia = new Date().toISOString().split('T')[0];
      const { error } = await this.supabase
        .from('instagram_metrics')
        .upsert({
          bar_id: this.barId,
          data_referencia: dataReferencia,
          periodo: period,
          ...metrics,
          raw_data: rawData
        }, {
          onConflict: 'bar_id,data_referencia,periodo'
        }) as SupabaseUpsertResponse<InstagramAccountMetrics>;
      if (error) {
        console.error('❌ Erro ao salvar métricas do Instagram:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar métricas do Instagram:', error);
      return false;
    }
  }

  private async saveFacebookPost(post: FacebookPost): Promise<'new' | 'updated' | 'error'> {
    try {
      const { data, error } = await this.supabase
        .from('facebook_posts')
        .upsert(post, { onConflict: 'id' }) as SupabaseUpsertResponse<FacebookPost>;
      if (error) {
        console.error('❌ Erro ao salvar post do Facebook:', error);
        return 'error';
      }
      return data ? 'new' : 'updated';
    } catch (error) {
      console.error('❌ Erro ao salvar post do Facebook:', error);
      return 'error';
    }
  }

  private async saveInstagramPost(post: InstagramMedia): Promise<'new' | 'updated' | 'error'> {
    try {
      const { data, error } = await this.supabase
        .from('instagram_posts')
        .upsert(post, { onConflict: 'id' }) as SupabaseUpsertResponse<InstagramMedia>;
      if (error) {
        console.error('❌ Erro ao salvar post do Instagram:', error);
        return 'error';
      }
      return data ? 'new' : 'updated';
    } catch (error) {
      console.error('❌ Erro ao salvar post do Instagram:', error);
      return 'error';
    }
  }

  // ========================================
  // 📊 UTILITÁRIOS
  // ========================================

  private getDateRange(period: string, since?: string, until?: string): Record<string, string> {
    const result: Record<string, string> = {}
    
    if (since) result.since = since
    if (until) result.until = until
    
    // Se não foi especificado, usar defaults baseados no período
    if (!since && !until) {
      const today = new Date()
      const daysAgo = period === 'day' ? 1 : period === 'week' ? 7 : 30
      
      const startDate = new Date(today)
      startDate.setDate(startDate.getDate() - daysAgo)
      
      result.since = startDate.toISOString().split('T')[0]
      result.until = today.toISOString().split('T')[0]
    }
    
    return result
  }

  private async startCollectionLog(tipo: string, params: Record<string, unknown>): Promise<number> {
    const { data, error } = await this.supabase
      .from('meta_coletas_log')
      .insert({
        bar_id: this.barId,
        tipo_coleta: tipo,
        parametros_coleta: params,
        status: 'iniciada'
      })
      .select('id')
      .single() as SupabaseInsertResponse<{ id: number }>;

    if (error || !data) {
      console.error('❌ Erro ao criar log de coleta:', error)
      return 0
    }

    return data.id
  }

  private async finishCollectionLog(
    logId: number,
    status: 'sucesso' | 'erro',
    stats: {
      registros_processados?: number
      registros_novos?: number
      registros_atualizados?: number
    }
  ): Promise<void> {
    if (logId === 0) return

    const { error } = await this.supabase
      .from('meta_coletas_log')
      .update({
        status,
        finalizada_em: new Date().toISOString(),
        ...stats
      })
      .eq('id', logId) as SupabaseResponse<unknown>;

    if (error) {
      console.error('❌ Erro ao finalizar log de coleta:', error)
    }
  }

  // ========================================
  // 📊 MÉTRICAS PÚBLICOS PRINCIPAIS
  // ========================================

  async collectAllMetrics(): Promise<boolean> {
    console.log('🔄 Iniciando coleta completa de métricas Meta...')
    
    if (!await this.initializeConfig()) {
      return false
    }

    if (!await this.testConnection()) {
      return false
    }

    const results = await Promise.allSettled([
      this.collectFacebookMetrics('day'),
      this.collectInstagramMetrics('day'),
      this.collectFacebookPosts(25),
      this.collectInstagramPosts(25)
    ])

    const successful = results.filter((r) => r.status === 'fulfilled').length
    const total = results.length

    // Log com informações de rate limit
    const rateLimitInfo = this.getRateLimitInfo()
    console.log(`🔍 Coleta completa finalizada: ${successful}/${total} sucessos`)
    
    if (rateLimitInfo.business_usage) {
      console.log(`⚠️ Rate Limit Usage: ${rateLimitInfo.business_usage.call_count}% (Business)`)
    }
    if (rateLimitInfo.platform_usage) {
      console.log(`⚠️ Rate Limit Usage: ${rateLimitInfo.platform_usage.call_count}% (Platform)`)
    }

    // Consolidar métricas se pelo menos Facebook ou Instagram teve sucesso
    if (successful >= 2) {
      await this.consolidateMetrics()
    }

    return successful >= 2
  }

  async consolidateMetrics(): Promise<void> {
    console.log('🔄 Consolidando métricas sociais...')
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { error } = await this.supabase
        .rpc('consolidar_metricas_sociais', {
          p_bar_id: this.barId,
          p_data_referencia: today,
          p_periodo: 'day'
        }) as SupabaseResponse<unknown>;

      if (error) {
        console.error('❌ Erro ao consolidar métricas:', error)
      } else {
        console.log('✅ Métricas consolidadas com sucesso')
      }
    } catch (error) {
      console.error('❌ Erro ao consolidar métricas:', error)
    }
  }
}

// ========================================
// 📏 FACTORY FUNCTION
// ========================================

export async function createMetaSocialService(barId: number): Promise<MetaSocialService | null> {
  const service = new MetaSocialService(barId)
  
  if (await service.initializeConfig()) {
    return service
  }
  
  return null
} 

