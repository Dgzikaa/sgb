import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

// ========================================
// 🚀 WINDSOR.AI SERVICE
// ========================================
// Serviço para integração com Windsor.ai
// Funciona com plano Free (30 dias) + armazenamento próprio
// Preserva histórico completo no nosso banco

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuração Windsor.ai
const WINDSOR_API_KEY = process.env.WINDSOR_API_KEY
const WINDSOR_BASE_URL = 'https://api.windsor.ai/v1'

// Mapeamento de conectores Windsor.ai
const WINDSOR_CONNECTORS = {
  facebook: 'facebook_ads',
  instagram: 'instagram',
  google: 'google_ads',
  tiktok: 'tiktok_ads',
  linkedin: 'linkedin_ads'
} as const

export interface WindsorConfig {
  enabled: boolean
  api_key?: string
  webhook_url?: string
  connectors: {
    [key: string]: {
      enabled: boolean
      account_ids: string[]
      metrics: string[]
      dimensions: string[]
    }
  }
  sync_schedule: {
    frequency: 'daily' | 'hourly'
    time: string
    timezone: string
  }
  filters: Record<string, unknown>
  plan: 'free' | 'basic' | 'standard' | 'plus' | 'professional' | 'enterprise'
}

export interface WindsorData {
  bar_id: number
  platform: string
  date_from: string
  date_to: string
  connector: string
  raw_data: unknown
  processed_data: unknown[]
  metrics_collected: string[]
}

export interface WindsorMetrics {
  bar_id: number
  platform: string
  date: string
  campaign_name: string
  adset_name: string
  impressions: number
  reach: number
  clicks: number
  spend: number
  conversions: number
  ctr: number
  cpc: number
  cpm: number
  conversion_rate: number
}

export class WindsorAIService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = WINDSOR_API_KEY || ''
    this.baseUrl = WINDSOR_BASE_URL
  }

  // ========================================
  // 🔧 CONFIGURAÇÃO E SETUP
  // ========================================

  /**
   * Verificar se Windsor.ai está configurado
   */
  async isConfigured(barId: number): Promise<boolean> {
    try {
      const { data: barConfig } = await supabase
        .from('bars')
        .select('windsor_config')
        .eq('id', barId)
        .single()

      return barConfig?.windsor_config?.enabled === true && !!this.apiKey
    } catch (error) {
      console.error('❌ Erro ao verificar configuração Windsor.ai:', error)
      return false
    }
  }

  /**
   * Obter configuração Windsor.ai de um bar
   */
  async getConfig(barId: number): Promise<WindsorConfig | null> {
    try {
      const { data: barConfig } = await supabase
        .from('bars')
        .select('windsor_config')
        .eq('id', barId)
        .single()

      return barConfig?.windsor_config || null
    } catch (error) {
      console.error('❌ Erro ao obter configuração Windsor.ai:', error)
      return null
    }
  }

  /**
   * Atualizar configuração Windsor.ai
   */
  async updateConfig(barId: number, config: Partial<WindsorConfig>): Promise<boolean> {
    try {
      const currentConfig = await this.getConfig(barId)
      const updatedConfig = { ...currentConfig, ...config }

      const { error } = await supabase
        .from('bars')
        .update({ windsor_config: updatedConfig })
        .eq('id', barId)

      if (error) throw error

      // Log da atualização
      await this.logEvent(barId, 'config_updated', 'Configuração Windsor.ai atualizada', {
        config_changes: Object.keys(config)
      })

      return true
    } catch (error) {
      console.error('❌ Erro ao atualizar configuração Windsor.ai:', error)
      return false
    }
  }

  // ========================================
  // 📊 COLETA DE DADOS
  // ========================================

  /**
   * Coletar dados de uma plataforma específica
   */
  async collectData(params: {
    barId: number
    platform: string
    dateFrom?: string
    dateTo?: string
    metrics?: string[]
  }): Promise<WindsorData | null> {
    const { barId, platform, dateFrom, dateTo, metrics } = params

    try {
      console.log('🔄 Windsor.ai - Iniciando coleta:', { barId, platform, dateFrom, dateTo })

      // Verificar configuração
      const config = await this.getConfig(barId)
      if (!config?.enabled) {
        throw new Error('Windsor.ai não está habilitado para este bar')
      }

      const connector = WINDSOR_CONNECTORS[platform as keyof typeof WINDSOR_CONNECTORS]
      if (!connector) {
        throw new Error(`Plataforma ${platform} não suportada`)
      }

      // Preparar query
      const queryData = {
        connector,
        date_from: dateFrom || this.getDefaultDateFrom(),
        date_to: dateTo || this.getDefaultDateTo(),
        metrics: metrics || config.connectors[platform]?.metrics || [
          'impressions',
          'reach',
          'clicks',
          'spend',
          'conversions'
        ],
        dimensions: config.connectors[platform]?.dimensions || ['date', 'campaign_name'],
        filters: config.filters || {}
      }

      // Fazer chamada para Windsor.ai
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Windsor.ai API Error: ${response.status} - ${errorData}`)
      }

      const windsorData = await response.json()

      // Processar dados
      const processedData = this.processWindsorData(windsorData, barId, platform)

      // Salvar no banco
      const { data: savedData, error: saveError } = await supabase
        .from('windsor_data')
        .insert({
          bar_id: barId,
          platform,
          date_from: queryData.date_from,
          date_to: queryData.date_to,
          connector,
          raw_data: windsorData,
          processed_data: processedData,
          metrics_collected: queryData.metrics
        })
        .select()
        .single()

      if (saveError) throw saveError

      // Log de sucesso
      await this.logEvent(barId, 'collect_success', 'Coleta Windsor.ai concluída', {
        platform,
        records_processed: processedData.length,
        date_range: `${queryData.date_from} a ${queryData.date_to}`
      })

      return savedData

    } catch (error) {
      console.error('❌ Erro na coleta Windsor.ai:', error)
      
      // Log de erro
      await this.logEvent(barId, 'collect_error', 'Erro na coleta Windsor.ai', {
        platform,
        error: error instanceof Error ? error.message : String(error)
      })

      return null
    }
  }

  /**
   * Coletar dados de todas as plataformas habilitadas
   */
  async collectAllData(barId: number, dateFrom?: string, dateTo?: string): Promise<WindsorData[]> {
    try {
      const config = await this.getConfig(barId)
      if (!config?.enabled) {
        throw new Error('Windsor.ai não está habilitado')
      }

      const enabledPlatforms = Object.entries(config.connectors)
        .filter(([_, connector]) => connector.enabled)
        .map(([platform, _]) => platform)

      console.log('🔄 Windsor.ai - Coletando todas as plataformas:', enabledPlatforms)

      const results: WindsorData[] = []

      for (const platform of enabledPlatforms) {
        const result = await this.collectData({
          barId,
          platform,
          dateFrom,
          dateTo
        })

        if (result) {
          results.push(result)
        }

        // Delay entre chamadas para evitar rate limiting
        await this.delay(1000)
      }

      return results

    } catch (error) {
      console.error('❌ Erro na coleta completa Windsor.ai:', error)
      return []
    }
  }

  // ========================================
  // 📈 MÉTRICAS E ANÁLISES
  // ========================================

  /**
   * Obter métricas consolidadas
   */
  async getMetrics(params: {
    barId: number
    platform?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<WindsorMetrics[]> {
    try {
      const { barId, platform, dateFrom, dateTo } = params

      let query = supabase
        .from('windsor_metrics_daily')
        .select('*')
        .eq('bar_id', barId)

      if (platform) {
        query = query.eq('platform', platform)
      }

      if (dateFrom) {
        query = query.gte('date', dateFrom)
      }

      if (dateTo) {
        query = query.lte('date', dateTo)
      }

      const { data, error } = await query.order('date', { ascending: false })

      if (error) throw error

      return data || []

    } catch (error) {
      console.error('❌ Erro ao obter métricas Windsor.ai:', error)
      return []
    }
  }

  /**
   * Obter resumo de métricas
   */
  async getMetricsSummary(barId: number, dateFrom?: string, dateTo?: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('windsor_metrics_summary')
        .select('*')
        .eq('bar_id', barId)
        .gte('date', dateFrom || this.getDefaultDateFrom())
        .lte('date', dateTo || this.getDefaultDateTo())
        .order('date', { ascending: false })

      if (error) throw error

      return data || []

    } catch (error) {
      console.error('❌ Erro ao obter resumo Windsor.ai:', error)
      return []
    }
  }

  // ========================================
  // 🔍 MONITORAMENTO E LOGS
  // ========================================

  /**
   * Registrar evento de log
   */
  async logEvent(
    barId: number,
    eventType: string,
    message: string,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    try {
      await supabase
        .from('windsor_logs')
        .insert({
          bar_id: barId,
          level: 'info',
          event_type: eventType,
          message,
          details
        })
    } catch (error) {
      console.error('❌ Erro ao registrar log Windsor.ai:', error)
    }
  }

  /**
   * Obter logs recentes
   */
  async getLogs(barId: number, limit = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('windsor_logs')
        .select('*')
        .eq('bar_id', barId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return data || []

    } catch (error) {
      console.error('❌ Erro ao obter logs Windsor.ai:', error)
      return []
    }
  }

  /**
   * Obter status da integração
   */
  async getIntegrationStatus(barId: number): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('get_windsor_integration_status', {
        bar_id_param: barId
      })

      if (error) throw error

      return data

    } catch (error) {
      console.error('❌ Erro ao obter status Windsor.ai:', error)
      return null
    }
  }

  // ========================================
  // 🧹 LIMPEZA E MANUTENÇÃO
  // ========================================

  /**
   * Limpar dados antigos
   */
  async cleanupOldData(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_old_windsor_data')

      if (error) throw error

      console.log(`🧹 Windsor.ai - Limpeza concluída: ${data} registros removidos`)
      return data

    } catch (error) {
      console.error('❌ Erro na limpeza Windsor.ai:', error)
      return 0
    }
  }

  // ========================================
  // 🔧 MÉTODOS AUXILIARES
  // ========================================

  /**
   * Processar dados do Windsor.ai
   */
  private processWindsorData(windsorData: unknown, barId: number, platform: string): unknown[] {
    const processed: unknown[] = []

    if (!windsorData.data || !Array.isArray(windsorData.data)) {
      return processed
    }

    for (const row of windsorData.data) {
      const processedRow = {
        bar_id: barId,
        platform,
        date: row.date || row.date_start,
        campaign_name: row.campaign_name || 'N/A',
        adset_name: row.adset_name || 'N/A',
        impressions: parseInt(row.impressions) || 0,
        reach: parseInt(row.reach) || 0,
        clicks: parseInt(row.clicks) || 0,
        spend: parseFloat(row.spend) || 0,
        conversions: parseInt(row.conversions) || 0,
        ctr: parseFloat(row.ctr) || 0,
        cpc: parseFloat(row.cpc) || 0,
        cpm: parseFloat(row.cpm) || 0,
        raw_row: row
      }

      processed.push(processedRow)
    }

    return processed
  }

  /**
   * Obter data padrão (30 dias atrás)
   */
  private getDefaultDateFrom(): string {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split('T')[0]
  }

  /**
   * Obter data atual
   */
  private getDefaultDateTo(): string {
    return new Date().toISOString().split('T')[0]
  }

  /**
   * Delay entre chamadas
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Instância singleton
export const windsorAIService = new WindsorAIService() 