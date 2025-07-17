import { createClient } from '@supabase/supabase-js'

// ========================================
// üîß CONFIGURA·á·ïES E TIPOS
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

// ========================================
// üåê SERVI·áO PRINCIPAL
// ========================================

export class MetaSocialService {
  private supabase: any
  private config: MetaConfig | null = null
  private barId: number
  private rateLimitInfo: RateLimitInfo = {}

  constructor(barId: number) {
    this.barId = barId
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }

  // ========================================
  // üìä MONITORAMENTO DE RATE LIMITS
  // ========================================

  private processRateLimitHeaders(response: Response): void {
    try {
      // X-App-Usage header (Platform Rate Limits)
      const appUsage = response.headers.get('X-App-Usage')
      if (appUsage) {
        this.rateLimitInfo.platform_usage = JSON.parse(appUsage)
      }

      // X-Business-Use-Case-Usage header (Instagram Graph API)
      const bucUsage = response.headers.get('X-Business-Use-Case-Usage')
      if (bucUsage) {
        const parsed = JSON.parse(bucUsage)
        // Pegar o primeiro business case (normalmente s·≥ h·° um)
        const businessId = Object.keys(parsed)[0]
        if (businessId && parsed[businessId][0]) {
          this.rateLimitInfo.business_usage = parsed[businessId][0]
        }
      }

      // Log se estivermos pr·≥ximos do limite
      this.checkRateLimitWarnings()
    } catch (error) {
      console.warn('ö†Ô∏è Erro ao processar headers de rate limit:', error)
    }
  }

  private checkRateLimitWarnings(): void {
    const { platform_usage, business_usage } = this.rateLimitInfo

    // Avisar se plataforma estiver acima de 70%
    if (platform_usage && platform_usage.call_count > 70) {
      console.warn(`ö†Ô∏è Platform Rate Limit: ${platform_usage.call_count}% usado`)
    }

    // Avisar se business usage estiver acima de 70%
    if (business_usage && business_usage.call_count > 70) {
      console.warn(`ö†Ô∏è Business Use Case Rate Limit: ${business_usage.call_count}% usado`)
      if (business_usage.estimated_time_to_regain_access > 0) {
        console.warn(`è∞ Tempo para recuperar acesso: ${business_usage.estimated_time_to_regain_access} minutos`)
      }
    }
  }

  getRateLimitInfo(): RateLimitInfo {
    return { ...this.rateLimitInfo }
  }

  // ========================================
  // üîë GERENCIAMENTO DE CONFIGURA·á·ÉO
  // ========================================

  async initializeConfig(): Promise<boolean> {
    try {
      console.log('üîß Inicializando configura·ß·£o Meta para bar:', this.barId)

      const { data, error } = await this.supabase
        .from('api_credentials')
        .select('*')
        .eq('bar_id', this.barId)
        .eq('sistema', 'meta')
        .eq('ativo', true)
        .single()

      if (error || !data) {
        console.error('ùå Configura·ß·£o Meta n·£o encontrada:', error)
        return false
      }

      // Combinar dados b·°sicos com configura·ß·µes unificadas
      const configs = data.configuracoes || {}
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

      console.log('úÖ Configura·ß·£o Meta carregada')
      return true
    } catch (error) {
      console.error('ùå Erro ao inicializar configura·ß·£o Meta:', error)
      return false
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) {
      console.error('ùå Configura·ß·£o n·£o inicializada')
      return false
    }

    try {
      console.log('üîç Testando conex·£o com Meta API...')

      // Testar com uma chamada simples
      const response = await fetch(
        `https://graph.facebook.com/${this.config.api_version}/me?access_token=${this.config.access_token}`,
        { method: 'GET' }
      )

      // Processar headers de rate limit
      this.processRateLimitHeaders(response)
      
      const data = await response.json()

      if (response.ok && data.id) {
        console.log('úÖ Conex·£o com Meta API OK')
        
        // Atualizar timestamp de ·∫ltimo teste
        await this.supabase
          .from('api_credentials')
          .update({ atualizado_em: new Date().toISOString() })
          .eq('bar_id', this.barId)
          .eq('sistema', 'meta')

        return true
      } else {
        console.error('ùå Erro na conex·£o Meta API:', data)
        return false
      }
    } catch (error) {
      console.error('ùå Erro ao testar conex·£o Meta:', error)
      return false
    }
  }

  // ========================================
  // üìä COLETA DE M·âTRICAS DO FACEBOOK
  // ========================================

  async collectFacebookMetrics(
    period: 'day' | 'week' | 'month' = 'day',
    since?: string,
    until?: string
  ): Promise<boolean> {
    if (!this.config?.facebook_page_id) {
      console.error('ùå Page ID do Facebook n·£o configurado')
      return false
    }

    try {
      console.log(`üìä Coletando m·©tricas do Facebook - per·≠odo: ${period}`)
      
      const logId = await this.startCollectionLog('facebook_page', { period, since, until })

      // Definir m·©tricas a serem coletadas
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

      // Definir per·≠odo
      const dateRange = this.getDateRange(period, since, until)
      const params = new URLSearchParams({
        metric: pageMetrics,
        period: period,
        access_token: this.config.access_token,
        ...dateRange
      })

      // Fazer chamada ·† API
      const response = await fetch(
        `https://graph.facebook.com/${this.config.api_version}/${this.config.facebook_page_id}/insights?${params}`,
        { method: 'GET' }
      )

      // Processar headers de rate limit
      this.processRateLimitHeaders(response)
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Facebook API Error: ${data.error?.message || 'Unknown error'}`)
      }

      // Processar dados
      const processedData = this.processFacebookMetrics(data.data || [])
      
      // Salvar no banco
      const saved = await this.saveFacebookMetrics(processedData, period, data)

      await this.finishCollectionLog(logId, saved ? 'sucesso' : 'erro', {
        registros_processados: 1,
        registros_novos: saved ? 1 : 0
      })

      console.log(`úÖ M·©tricas do Facebook coletadas: 1 registro`)
      return true

    } catch (error: any) {
      console.error('ùå Erro ao coletar m·©tricas do Facebook:', error)
      return false
    }
  }

  // ========================================
  // üì∏ COLETA DE M·âTRICAS DO INSTAGRAM
  // ========================================

  async collectInstagramMetrics(
    period: 'day' | 'week' | 'month' = 'day',
    since?: string,
    until?: string
  ): Promise<boolean> {
    if (!this.config?.instagram_account_id) {
      console.error('ùå Account ID do Instagram n·£o configurado')
      return false
    }

    try {
      console.log(`üì∏ Coletando m·©tricas do Instagram - per·≠odo: ${period}`)
      
      const logId = await this.startCollectionLog('instagram_account', { period, since, until })

      // Definir m·©tricas a serem coletadas
      const accountMetrics = [
        'follower_count',
        'following_count',
        'impressions',
        'reach',
        'profile_views'
      ].join(',')

      // Definir per·≠odo
      const dateRange = this.getDateRange(period, since, until)
      const params = new URLSearchParams({
        metric: accountMetrics,
        period: period,
        access_token: this.config.access_token,
        ...dateRange
      })

      // Fazer chamada ·† API
      const response = await fetch(
        `https://graph.facebook.com/${this.config.api_version}/${this.config.instagram_account_id}/insights?${params}`,
        { method: 'GET' }
      )

      // Processar headers de rate limit
      this.processRateLimitHeaders(response)
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Instagram API Error: ${data.error?.message || 'Unknown error'}`)
      }

      // Processar dados
      const processedData = this.processInstagramMetrics(data.data || [])
      
      // Salvar no banco
      const saved = await this.saveInstagramMetrics(processedData, period, data)

      await this.finishCollectionLog(logId, saved ? 'sucesso' : 'erro', {
        registros_processados: 1,
        registros_novos: saved ? 1 : 0
      })

      console.log(`úÖ M·©tricas do Instagram coletadas: 1 registro`)
      return true

    } catch (error: any) {
      console.error('ùå Erro ao coletar m·©tricas do Instagram:', error)
      return false
    }
  }

  // ========================================
  // üìù COLETA DE POSTS DO FACEBOOK
  // ========================================

  async collectFacebookPosts(limit: number = 25): Promise<boolean> {
    if (!this.config?.facebook_page_id) {
      console.error('ùå Page ID do Facebook n·£o configurado')
      return false
    }

    try {
      console.log(`üìù Coletando posts do Facebook - limite: ${limit}`)
      
      const logId = await this.startCollectionLog('facebook_posts', { limit })

      // Buscar posts
      const params = new URLSearchParams({
        fields: 'id,message,story,link,created_time,type,insights{post_impressions,post_reach,post_engaged_users,post_clicks,post_reactions_like_total,post_reactions_love_total,post_reactions_wow_total,post_reactions_haha_total,post_reactions_sad_total,post_reactions_angry_total,post_comments,post_shares}',
        limit: limit.toString(),
        access_token: this.config.access_token
      })

      const response = await fetch(
        `https://graph.facebook.com/${this.config.api_version}/${this.config.facebook_page_id}/posts?${params}`,
        { method: 'GET' }
      )

      // Processar headers de rate limit
      this.processRateLimitHeaders(response)
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Facebook Posts API Error: ${data.error?.message || 'Unknown error'}`)
      }

      // Processar e salvar posts
      const posts = data.data || []
      let saved = 0
      let updated = 0

      for (const post of posts) {
        const result = await this.saveFacebookPost(post)
        if (result === 'new') saved++
        else if (result === 'updated') updated++
      }

      await this.finishCollectionLog(logId, 'sucesso', {
        registros_processados: posts.length,
        registros_novos: saved,
        registros_atualizados: updated
      })

      console.log(`úÖ Posts do Facebook coletados: ${posts.length} posts, ${saved} novos, ${updated} atualizados`)
      return true

    } catch (error: any) {
      console.error('ùå Erro ao coletar posts do Facebook:', error)
      return false
    }
  }

  // ========================================
  // üì± COLETA DE POSTS DO INSTAGRAM
  // ========================================

  async collectInstagramPosts(limit: number = 25): Promise<boolean> {
    if (!this.config?.instagram_account_id) {
      console.error('ùå Account ID do Instagram n·£o configurado')
      return false
    }

    try {
      console.log(`üì± Coletando posts do Instagram - limite: ${limit}`)
      
      const logId = await this.startCollectionLog('instagram_posts', { limit })

      // Buscar posts
      const params = new URLSearchParams({
        fields: 'id,caption,media_type,media_url,permalink,timestamp,insights{impressions,reach,engagement,likes,comments,shares,saves,plays,total_interactions}',
        limit: limit.toString(),
        access_token: this.config.access_token
      })

      const response = await fetch(
        `https://graph.facebook.com/${this.config.api_version}/${this.config.instagram_account_id}/media?${params}`,
        { method: 'GET' }
      )

      // Processar headers de rate limit
      this.processRateLimitHeaders(response)
      
      const data = await response.json()

      if (!response.ok) {
        throw new Error(`Instagram Posts API Error: ${data.error?.message || 'Unknown error'}`)
      }

      // Processar e salvar posts
      const posts = data.data || []
      let saved = 0
      let updated = 0

      for (const post of posts) {
        const result = await this.saveInstagramPost(post)
        if (result === 'new') saved++
        else if (result === 'updated') updated++
      }

      await this.finishCollectionLog(logId, 'sucesso', {
        registros_processados: posts.length,
        registros_novos: saved,
        registros_atualizados: updated
      })

      console.log(`úÖ Posts do Instagram coletados: ${posts.length} posts, ${saved} novos, ${updated} atualizados`)
      return true

    } catch (error: any) {
      console.error('ùå Erro ao coletar posts do Instagram:', error)
      return false
    }
  }

  // ========================================
  // üîÑ PROCESSAMENTO DE DADOS
  // ========================================

  private processFacebookMetrics(rawData: any[]): FacebookPageMetrics {
    const metrics: any = {}
    
    for (const item of rawData) {
      const metricName = item.name
      const values = item.values || []
      
      if (values.length > 0) {
        const latestValue = values[values.length - 1]
        metrics[metricName] = latestValue.value || 0
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
    }
  }

  private processInstagramMetrics(rawData: any[]): InstagramAccountMetrics {
    const metrics: any = {}
    
    for (const item of rawData) {
      const metricName = item.name
      const values = item.values || []
      
      if (values.length > 0) {
        const latestValue = values[values.length - 1]
        metrics[metricName] = latestValue.value || 0
      }
    }

    return {
      follower_count: metrics.follower_count || 0,
      following_count: metrics.following_count || 0,
      impressions: metrics.impressions || 0,
      reach: metrics.reach || 0,
      profile_views: metrics.profile_views || 0
    }
  }

  // ========================================
  // üíæ SALVAMENTO NO BANCO
  // ========================================

  private async saveFacebookMetrics(
    metrics: FacebookPageMetrics,
    period: string,
    rawData: any
  ): Promise<boolean> {
    try {
      const dataReferencia = new Date().toISOString().split('T')[0]
      
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
        })

      if (error) {
        console.error('ùå Erro ao salvar m·©tricas do Facebook:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('ùå Erro ao salvar m·©tricas do Facebook:', error)
      return false
    }
  }

  private async saveInstagramMetrics(
    metrics: InstagramAccountMetrics,
    period: string,
    rawData: any
  ): Promise<boolean> {
    try {
      const dataReferencia = new Date().toISOString().split('T')[0]
      
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
        })

      if (error) {
        console.error('ùå Erro ao salvar m·©tricas do Instagram:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('ùå Erro ao salvar m·©tricas do Instagram:', error)
      return false
    }
  }

  private async saveFacebookPost(post: FacebookPost): Promise<'new' | 'updated' | 'error'> {
    try {
      const insights = post.insights || ({} as any)
      
      const { error } = await this.supabase
        .from('facebook_posts')
        .upsert({
          bar_id: this.barId,
          post_id: post.id,
          post_type: post.type,
          message: post.message,
          story: post.story,
          link_url: post.link,
          created_time: post.created_time,
          likes: insights.post_reactions_like_total || 0,
          comments: insights.post_comments || 0,
          shares: insights.post_shares || 0,
          clicks: insights.post_clicks || 0,
          impressions: insights.post_impressions || 0,
          reach: insights.post_reach || 0,
          angry_reactions: insights.post_reactions_angry_total || 0,
          haha_reactions: insights.post_reactions_haha_total || 0,
          love_reactions: insights.post_reactions_love_total || 0,
          sad_reactions: insights.post_reactions_sad_total || 0,
          wow_reactions: insights.post_reactions_wow_total || 0,
          raw_data: post
        }, {
          onConflict: 'bar_id,post_id'
        })

      if (error) {
        console.error('ùå Erro ao salvar post do Facebook:', error)
        return 'error'
      }

      return 'new' // Supabase upsert n·£o retorna se foi insert ou update
    } catch (error) {
      console.error('ùå Erro ao salvar post do Facebook:', error)
      return 'error'
    }
  }

  private async saveInstagramPost(post: InstagramMedia): Promise<'new' | 'updated' | 'error'> {
    try {
      const insights = post.insights || ({} as any)
      
      const { error } = await this.supabase
        .from('instagram_posts')
        .upsert({
          bar_id: this.barId,
          media_id: post.id,
          media_type: post.media_type,
          caption: post.caption,
          media_url: post.media_url,
          permalink: post.permalink,
          timestamp: post.timestamp,
          likes: insights.likes || 0,
          comments: insights.comments || 0,
          shares: insights.shares || 0,
          saves: insights.saves || 0,
          impressions: insights.impressions || 0,
          reach: insights.reach || 0,
          plays: insights.plays || 0,
          total_interactions: insights.total_interactions || 0,
          raw_data: post
        }, {
          onConflict: 'bar_id,media_id'
        })

      if (error) {
        console.error('ùå Erro ao salvar post do Instagram:', error)
        return 'error'
      }

      return 'new' // Supabase upsert n·£o retorna se foi insert ou update
    } catch (error) {
      console.error('ùå Erro ao salvar post do Instagram:', error)
      return 'error'
    }
  }

  // ========================================
  // üîç UTILIT·ÅRIOS
  // ========================================

  private getDateRange(period: string, since?: string, until?: string): Record<string, string> {
    const result: Record<string, string> = {}
    
    if (since) result.since = since
    if (until) result.until = until
    
    // Se n·£o foi especificado, usar defaults baseados no per·≠odo
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

  private async startCollectionLog(tipo: string, params: any): Promise<number> {
    const { data, error } = await this.supabase
      .from('meta_coletas_log')
      .insert({
        bar_id: this.barId,
        tipo_coleta: tipo,
        parametros_coleta: params,
        status: 'iniciada'
      })
      .select('id')
      .single()

    if (error) {
      console.error('ùå Erro ao criar log de coleta:', error)
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

    await this.supabase
      .from('meta_coletas_log')
      .update({
        status,
        finalizada_em: new Date().toISOString(),
        ...stats
      })
      .eq('id', logId)
  }

  // ========================================
  // üéØ M·âTODOS P·öBLICOS PRINCIPAIS
  // ========================================

  async collectAllMetrics(): Promise<boolean> {
    console.log('üöÄ Iniciando coleta completa de m·©tricas Meta...')
    
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

    const successful = results.filter((r: any) => r.status === 'fulfilled').length
    const total = results.length

    // Log com informa·ß·µes de rate limit
    const rateLimitInfo = this.getRateLimitInfo()
    console.log(`üìä Coleta completa finalizada: ${successful}/${total} sucessos`)
    
    if (rateLimitInfo.business_usage) {
      console.log(`üìà Rate Limit Usage: ${rateLimitInfo.business_usage.call_count}% (Business)`)
    }
    if (rateLimitInfo.platform_usage) {
      console.log(`üìà Rate Limit Usage: ${rateLimitInfo.platform_usage.call_count}% (Platform)`)
    }

    // Consolidar m·©tricas se pelo menos Facebook ou Instagram teve sucesso
    if (successful >= 2) {
      await this.consolidateMetrics()
    }

    return successful >= 2
  }

  async consolidateMetrics(): Promise<void> {
    console.log('üîÑ Consolidando m·©tricas sociais...')
    
    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { error } = await this.supabase
        .rpc('consolidar_metricas_sociais', {
          p_bar_id: this.barId,
          p_data_referencia: today,
          p_periodo: 'day'
        })

      if (error) {
        console.error('ùå Erro ao consolidar m·©tricas:', error)
      } else {
        console.log('úÖ M·©tricas consolidadas com sucesso')
      }
    } catch (error) {
      console.error('ùå Erro ao consolidar m·©tricas:', error)
    }
  }
}

// ========================================
// üè≠ FACTORY FUNCTION
// ========================================

export async function createMetaSocialService(barId: number): Promise<MetaSocialService | null> {
  const service = new MetaSocialService(barId)
  
  if (await service.initializeConfig()) {
    return service
  }
  
  return null
} 
