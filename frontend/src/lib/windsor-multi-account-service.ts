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
// 🚀 WINDSOR.AI MULTI-ACCOUNT SERVICE
// ========================================
// Serviço para gerenciar 2 contas Windsor.ai:
// Conta 1: Menos é Mais (Standard) - 5 fontes
// Conta 2: Ordinário + Deboche (Basic) - 3 fontes, 6 contas

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuração Windsor.ai
const WINDSOR_BASE_URL = 'https://api.windsor.ai/v1'

// Mapeamento de conectores Windsor.ai
const WINDSOR_CONNECTORS = {
  facebook_ads: 'facebook_ads',
  instagram: 'instagram',
  google_ads: 'google_ads',
  youtube: 'youtube',
  twitter: 'twitter',
  meta_business: 'meta_business'
} as const

export interface WindsorAccount {
  id: number
  windsor_account_name: string
  windsor_plan: 'basic' | 'standard'
  api_key: string
  webhook_url?: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface WindsorCompanyMapping {
  id: number
  windsor_account_id: number
  company_name: string
  bar_id?: number
  platform: string
  platform_account_id: string
  platform_account_name?: string
  enabled: boolean
  sync_frequency: 'hourly' | 'daily'
  last_sync_at?: string
  created_at: string
}

export interface WindsorDataV2 {
  id: number
  windsor_account_id: number
  company_name: string
  bar_id?: number
  platform: string
  platform_account_id: string
  date_from: string
  date_to: string
  connector: string
  raw_data: unknown
  processed_data: unknown[]
  metrics_collected: string[]
  collected_at: string
  created_at: string
}

export interface WindsorMetricsV2 {
  id: number
  windsor_account_id: number
  company_name: string
  bar_id?: number
  platform: string
  platform_account_id: string
  date: string
  campaign_name?: string
  adset_name?: string
  impressions: number
  reach: number
  clicks: number
  spend: number
  conversions: number
  ctr: number
  cpc: number
  cpm: number
  conversion_rate: number
  data_source: string
  last_updated: string
}

export interface WindsorLogV2 {
  id: number
  windsor_account_id?: number
  company_name?: string
  level: 'info' | 'warning' | 'error'
  event_type: string
  platform?: string
  platform_account_id?: string
  message: string
  details: unknown
  created_at: string
}

export class WindsorMultiAccountService {
  private baseUrl = WINDSOR_BASE_URL

  // ========================================
  // 📊 GESTÃO DE CONTAS WINDSOR.AI
  // ========================================

  /**
   * Obter todas as contas Windsor.ai
   */
  async getAccounts(): Promise<WindsorAccount[]> {
    try {
      const { data, error } = await supabase
        .from('windsor_accounts')
        .select('*')
        .order('windsor_account_name')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter contas Windsor.ai:', error)
      return []
    }
  }

  /**
   * Obter conta Windsor.ai por nome
   */
  async getAccount(accountName: string): Promise<WindsorAccount | null> {
    try {
      const { data, error } = await supabase
        .from('windsor_accounts')
        .select('*')
        .eq('windsor_account_name', accountName)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Erro ao obter conta Windsor.ai:', error)
      return null
    }
  }

  /**
   * Criar ou atualizar conta Windsor.ai
   */
  async upsertAccount(account: Partial<WindsorAccount>): Promise<WindsorAccount | null> {
    try {
      const { data, error } = await supabase
        .from('windsor_accounts')
        .upsert(account, { onConflict: 'windsor_account_name' })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Erro ao salvar conta Windsor.ai:', error)
      return null
    }
  }

  // ========================================
  // 🏢 GESTÃO DE MAPEAMENTOS EMPRESA
  // ========================================

  /**
   * Obter mapeamentos por empresa
   */
  async getCompanyMappings(companyName: string): Promise<WindsorCompanyMapping[]> {
    try {
      const { data, error } = await supabase
        .from('windsor_company_mapping')
        .select('*')
        .eq('company_name', companyName)
        .order('platform')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter mapeamentos da empresa:', error)
      return []
    }
  }

  /**
   * Obter todos os mapeamentos
   */
  async getAllMappings(): Promise<WindsorCompanyMapping[]> {
    try {
      const { data, error } = await supabase
        .from('windsor_company_mapping')
        .select('*')
        .order('company_name, platform')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('❌ Erro ao obter mapeamentos:', error)
      return []
    }
  }

  /**
   * Criar ou atualizar mapeamento
   */
  async upsertMapping(mapping: Partial<WindsorCompanyMapping>): Promise<WindsorCompanyMapping | null> {
    try {
      const { data, error } = await supabase
        .from('windsor_company_mapping')
        .upsert(mapping, { 
          onConflict: 'windsor_account_id,company_name,platform,platform_account_id' 
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Erro ao salvar mapeamento:', error)
      return null
    }
  }

  // ========================================
  // 📊 COLETA DE DADOS MULTI-CONTA
  // ========================================

  /**
   * Coletar dados de uma empresa específica
   */
  async collectCompanyData(params: {
    companyName: string
    platform?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<WindsorDataV2[]> {
    const { companyName, platform, dateFrom, dateTo } = params

    try {
      console.log('🔄 Windsor.ai - Coletando dados da empresa:', companyName)

      // Obter mapeamentos da empresa
      const mappings = await this.getCompanyMappings(companyName)
      if (mappings.length === 0) {
        throw new Error(`Nenhum mapeamento encontrado para empresa: ${companyName}`)
      }

      // Filtrar por plataforma se especificada
      const targetMappings = platform 
        ? mappings.filter(m => m.platform === platform)
        : mappings

      const results: WindsorDataV2[] = []

      for (const mapping of targetMappings) {
        if (!mapping.enabled) continue

        // Obter conta Windsor.ai
        const account = await this.getAccountById(mapping.windsor_account_id)
        if (!account?.enabled) continue

        const result = await this.collectData({
          account,
          mapping,
          dateFrom,
          dateTo
        })

        if (result) {
          results.push(result)
        }

        // Delay entre chamadas
        await this.delay(1000)
      }

      return results

    } catch (error) {
      console.error('❌ Erro na coleta da empresa:', error)
      
      await this.logEvent({
        companyName,
        level: 'error',
        eventType: 'collect_error',
        message: 'Erro na coleta de dados da empresa',
        details: { error: error instanceof Error ? error.message : String(error) }
      })

      return []
    }
  }

  /**
   * Coletar dados de todas as empresas
   */
  async collectAllCompaniesData(dateFrom?: string, dateTo?: string): Promise<WindsorDataV2[]> {
    try {
      const mappings = await this.getAllMappings()
      const companies = [...new Set(mappings.map(m => m.company_name))]

      console.log('🔄 Windsor.ai - Coletando todas as empresas:', companies)

      const allResults: WindsorDataV2[] = []

      for (const company of companies) {
        const results = await this.collectCompanyData({
          companyName: company,
          dateFrom,
          dateTo
        })

        allResults.push(...results)

        // Delay entre empresas
        await this.delay(2000)
      }

      return allResults

    } catch (error) {
      console.error('❌ Erro na coleta completa:', error)
      return []
    }
  }

  /**
   * Coletar dados de um mapeamento específico
   */
  private async collectData(params: {
    account: WindsorAccount
    mapping: WindsorCompanyMapping
    dateFrom?: string
    dateTo?: string
  }): Promise<WindsorDataV2 | null> {
    const { account, mapping, dateFrom, dateTo } = params

    try {
      const connector = WINDSOR_CONNECTORS[mapping.platform as keyof typeof WINDSOR_CONNECTORS]
      if (!connector) {
        throw new Error(`Plataforma ${mapping.platform} não suportada`)
      }

      // Preparar query Windsor.ai
      const queryData = {
        connector,
        date_from: dateFrom || this.getDefaultDateFrom(),
        date_to: dateTo || this.getDefaultDateTo(),
        metrics: [
          'impressions',
          'reach',
          'clicks',
          'spend',
          'conversions',
          'ctr',
          'cpc',
          'cpm'
        ],
        dimensions: ['date', 'campaign_name', 'adset_name'],
        filters: {
          account_id: mapping.platform_account_id
        }
      }

      // Fazer chamada para Windsor.ai
      const response = await fetch(`${this.baseUrl}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${account.api_key}`,
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
      const processedData = this.processWindsorData(windsorData, mapping)

      // Salvar no banco
      const { data: savedData, error: saveError } = await supabase
        .from('windsor_data_v2')
        .insert({
          windsor_account_id: account.id,
          company_name: mapping.company_name,
          bar_id: mapping.bar_id,
          platform: mapping.platform,
          platform_account_id: mapping.platform_account_id,
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

      // Atualizar último sync
      await this.updateLastSync(mapping.id)

      // Log de sucesso
      await this.logEvent({
        accountId: account.id,
        companyName: mapping.company_name,
        level: 'info',
        eventType: 'collect_success',
        platform: mapping.platform,
        platformAccountId: mapping.platform_account_id,
        message: 'Coleta Windsor.ai concluída',
        details: {
          records_processed: processedData.length,
          date_range: `${queryData.date_from} a ${queryData.date_to}`
        }
      })

      return savedData

    } catch (error) {
      console.error('❌ Erro na coleta:', error)
      
      await this.logEvent({
        accountId: account.id,
        companyName: mapping.company_name,
        level: 'error',
        eventType: 'collect_error',
        platform: mapping.platform,
        platformAccountId: mapping.platform_account_id,
        message: 'Erro na coleta Windsor.ai',
        details: { error: error instanceof Error ? error.message : String(error) }
      })

      return null
    }
  }

  // ========================================
  // 📈 MÉTRICAS E ANÁLISES
  // ========================================

  /**
   * Obter métricas por empresa
   */
  async getCompanyMetrics(params: {
    companyName: string
    platform?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<WindsorMetricsV2[]> {
    const { companyName, platform, dateFrom, dateTo } = params

    try {
      let query = supabase
        .from('windsor_metrics_daily_v2')
        .select('*')
        .eq('company_name', companyName)

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
      console.error('❌ Erro ao obter métricas da empresa:', error)
      return []
    }
  }

  /**
   * Obter métricas consolidadas
   */
  async getConsolidatedMetrics(params: {
    dateFrom?: string
    dateTo?: string
  }): Promise<any[]> {
    const { dateFrom, dateTo } = params

    try {
      let query = supabase
        .from('windsor_metrics_summary_v2')
        .select('*')

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
      console.error('❌ Erro ao obter métricas consolidadas:', error)
      return []
    }
  }

  // ========================================
  // 🔍 LOGS E MONITORAMENTO
  // ========================================

  /**
   * Registrar evento de log
   */
  async logEvent(params: {
    accountId?: number
    companyName?: string
    level: 'info' | 'warning' | 'error'
    eventType: string
    platform?: string
    platformAccountId?: string
    message: string
    details?: unknown
  }): Promise<void> {
    try {
      await supabase
        .from('windsor_logs_v2')
        .insert({
          windsor_account_id: params.accountId,
          company_name: params.companyName,
          level: params.level,
          event_type: params.eventType,
          platform: params.platform,
          platform_account_id: params.platformAccountId,
          message: params.message,
          details: params.details || {}
        })

    } catch (error) {
      console.error('❌ Erro ao registrar log:', error)
    }
  }

  /**
   * Obter logs por empresa
   */
  async getCompanyLogs(companyName: string, limit: number = 100): Promise<WindsorLogV2[]> {
    try {
      const { data, error } = await supabase
        .from('windsor_logs_v2')
        .select('*')
        .eq('company_name', companyName)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []

    } catch (error) {
      console.error('❌ Erro ao obter logs da empresa:', error)
      return []
    }
  }

  // ========================================
  // 🔧 MÉTODOS AUXILIARES
  // ========================================

  /**
   * Obter conta Windsor.ai por ID
   */
  private async getAccountById(id: number): Promise<WindsorAccount | null> {
    try {
      const { data, error } = await supabase
        .from('windsor_accounts')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('❌ Erro ao obter conta por ID:', error)
      return null
    }
  }

  /**
   * Atualizar último sync do mapeamento
   */
  private async updateLastSync(mappingId: number): Promise<void> {
    try {
      await supabase
        .from('windsor_company_mapping')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', mappingId)

    } catch (error) {
      console.error('❌ Erro ao atualizar último sync:', error)
    }
  }

  /**
   * Processar dados do Windsor.ai
   */
  private processWindsorData(windsorData: unknown, mapping: WindsorCompanyMapping): unknown[] {
    const processed: unknown[] = []

    if (!windsorData.data || !Array.isArray(windsorData.data)) {
      return processed
    }

    for (const row of windsorData.data) {
      const processedRow = {
        bar_id: mapping.bar_id,
        company_name: mapping.company_name,
        platform: mapping.platform,
        platform_account_id: mapping.platform_account_id,
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
    return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }

  /**
   * Obter data padrão (hoje)
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

// Instância global do serviço
export const windsorMultiAccountService = new WindsorMultiAccountService() 