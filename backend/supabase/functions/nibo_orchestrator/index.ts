import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Configurações
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface OrchestrationRequest {
  sync_type: 'continuous' | 'monthly_validation'
  bar_id?: number
  target_month?: string // YYYY-MM para validação mensal
  data_types?: string[] // Opcional: especificar quais tipos processar
  custom_period?: { // NOVO: período customizado para backlog
    start_date: string
    end_date: string
  }
}

interface OrchestrationResult {
  success: boolean
  sync_type: string
  bar_id: number
  summary: {
    total_duration: number
    collection_phase: CollectionPhase
    processing_phase: ProcessingPhase
    total_records_collected: number
    total_records_processed: number
  }
  error?: string
}

interface CollectionPhase {
  duration: number
  results: CollectionResult[]
  errors: Record<string, unknown>[]
}

interface ProcessingPhase {
  duration: number
  results: ProcessingResult[]
  errors: Record<string, unknown>[]
}

interface CollectionResult {
  success: boolean
  data_type: string
  raw_data_id?: number
  record_count?: number
  collection_time_seconds: number
  api_token?: string
  organization_id?: string
  error?: string
}

interface ProcessingResult {
  success: boolean
  data_type: string
  raw_data_id: number
  total_records: number
  inserted_records: number
  processing_time_seconds: number
  error?: string
}

class NiboOrchestrator {
  private baseUrl: string
  private headers: Record<string, string>
  
  private dataTypes = ['agendamentos'] // Foco principal nos agendamentos

  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`
    this.headers = {
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    }
  }

  async orchestrateSync(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now()
    const barId = request.bar_id || 3
    const dataTypesToProcess = request.data_types || this.dataTypes
    
    console.log(`🎯 [NIBO ORCHESTRATOR] Iniciando sincronização ${request.sync_type}`)
    console.log(`🏪 Bar ID: ${barId}`)
    console.log(`📊 Tipos: ${dataTypesToProcess.join(', ')}`)
    
    try {
      // Determinar período baseado no tipo de sync ou custom_period
      let startDate: string, endDate: string
      
      if (request.custom_period) {
        // PRIORIDADE: usar período customizado se fornecido
        startDate = request.custom_period.start_date
        endDate = request.custom_period.end_date
        console.log(`📅 [CUSTOM] Usando período customizado: ${startDate} a ${endDate}`)
      } else {
        // Usar lógica padrão
        const dateRange = this.calculateDateRange(request.sync_type, request.target_month)
        startDate = dateRange.startDate
        endDate = dateRange.endDate
        console.log(`📅 [AUTO] Período calculado: ${startDate} a ${endDate}`)
      }
      
      console.log(`📅 Período: ${startDate} a ${endDate}`)
      
      // FASE 1: COLETA DE DADOS
      console.log(`\\n🔄 [NIBO ORCHESTRATOR] === FASE 1: COLETA DE DADOS ===`)
      const collectionPhase = await this.executeCollectionPhase(
        dataTypesToProcess,
        startDate,
        endDate,
        barId
      )
      
      console.log(`✅ [NIBO ORCHESTRATOR] Coleta concluída: ${collectionPhase.results.length} sucessos, ${collectionPhase.errors.length} erros`)
      
      // FASE 2: PROCESSAMENTO DE DADOS
      console.log(`\\n⚙️ [NIBO ORCHESTRATOR] === FASE 2: PROCESSAMENTO DE DADOS ===`)
      const processingPhase = await this.executeProcessingPhase(collectionPhase.results)
      
      console.log(`✅ [NIBO ORCHESTRATOR] Processamento concluído: ${processingPhase.results.length} sucessos, ${processingPhase.errors.length} erros`)
      
      // RESULTADO FINAL
      const endTime = Date.now()
      const totalDuration = (endTime - startTime) / 1000
      
      const result: OrchestrationResult = {
        success: true,
        sync_type: request.sync_type,
        bar_id: barId,
        summary: {
          total_duration: Math.round(totalDuration * 100) / 100,
          collection_phase: collectionPhase,
          processing_phase: processingPhase,
          total_records_collected: collectionPhase.results.reduce((sum, r) => sum + (r.record_count || 0), 0),
          total_records_processed: processingPhase.results.reduce((sum, r) => sum + (r.inserted_records || 0), 0)
        }
      }
      
      console.log(`\\n🎉 [NIBO ORCHESTRATOR] SINCRONIZAÇÃO ${request.sync_type.toUpperCase()} CONCLUÍDA`)
      console.log(`⏱️ Duração total: ${result.summary.total_duration}s`)
      console.log(`📥 Coletados: ${result.summary.total_records_collected} registros`)
      console.log(`📤 Processados: ${result.summary.total_records_processed} registros`)
      
      return result
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ [NIBO ORCHESTRATOR] Erro na orquestração: ${errorMessage}`)
      
      return {
        success: false,
        sync_type: request.sync_type,
        bar_id: barId,
        summary: {
          total_duration: (Date.now() - startTime) / 1000,
          collection_phase: { duration: 0, results: [], errors: [] },
          processing_phase: { duration: 0, results: [], errors: [] },
          total_records_collected: 0,
          total_records_processed: 0
        },
        error: errorMessage
      }
    }
  }

  private calculateDateRange(syncType: string, targetMonth?: string): { startDate: string, endDate: string } {
    const hoje = new Date()
    
    if (syncType === 'monthly_validation' && targetMonth) {
      // Validação mensal: todo o mês especificado
      const [year, month] = targetMonth.split('-').map(Number)
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`
      const endDate = new Date(year, month, 0).toISOString().split('T')[0] // Último dia do mês
      return { startDate, endDate }
    } else {
      // Sync contínuo: últimos 7 dias
      const dataInicio = new Date(hoje)
      dataInicio.setDate(hoje.getDate() - 7)
      const startDate = dataInicio.toISOString().split('T')[0]
      const endDate = hoje.toISOString().split('T')[0]
      return { startDate, endDate }
    }
  }

  private async executeCollectionPhase(
    dataTypes: string[],
    startDate: string,
    endDate: string,
    barId: number
  ): Promise<CollectionPhase> {
    const startTime = Date.now()
    const results: CollectionResult[] = []
    const errors: Record<string, unknown>[] = []
    let sharedCredentials: { api_token?: string, organization_id?: string } = {}
    
    for (let i = 0; i < dataTypes.length; i++) {
      const dataType = dataTypes[i]
      
      try {
        console.log(`🔄 [NIBO ORCHESTRATOR] Coletando ${dataType} (${i+1}/${dataTypes.length})...`)
        
        // Sleep entre coletas para evitar rate limit
        if (i > 0) {
          const sleepTime = Math.floor(Math.random() * (10 - 3 + 1)) + 3 // 3-10 segundos
          console.log(`⏳ [NIBO ORCHESTRATOR] Aguardando ${sleepTime}s antes da próxima coleta...`)
          await this.sleep(sleepTime * 1000)
        }
        
        // Chamar collector
        const collectionResult = await this.callCollector({
          data_type: dataType,
          start_date: startDate,
          end_date: endDate,
          bar_id: barId,
          ...sharedCredentials // Reutilizar credenciais se disponíveis
        })
        
        if (collectionResult.success) {
          results.push(collectionResult)
          // Reutilizar credenciais para próximas coletas
          if (collectionResult.api_token && collectionResult.organization_id) {
            sharedCredentials = {
              api_token: collectionResult.api_token,
              organization_id: collectionResult.organization_id
            }
          }
          console.log(`✅ [NIBO ORCHESTRATOR] ${dataType}: ${collectionResult.record_count || 0} registros coletados`)
        } else {
          errors.push({
            data_type: dataType,
            phase: 'collection',
            error: collectionResult.error
          })
          console.error(`❌ [NIBO ORCHESTRATOR] Erro na coleta ${dataType}: ${collectionResult.error}`)
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorMsg = `Erro ao coletar ${dataType}: ${errorMessage}`
        console.error(`❌ [NIBO ORCHESTRATOR] ${errorMsg}`)
        errors.push({
          data_type: dataType,
          phase: 'collection',
          error: errorMsg
        })
      }
    }
    
    const duration = (Date.now() - startTime) / 1000
    
    return {
      duration: Math.round(duration * 100) / 100,
      results,
      errors
    }
  }

  private async executeProcessingPhase(collectionResults: CollectionResult[]): Promise<ProcessingPhase> {
    const startTime = Date.now()
    const results: ProcessingResult[] = []
    const errors: Record<string, unknown>[] = []
    
    // Processar apenas os que foram coletados com sucesso
    const toProcess = collectionResults.filter(r => r.success && r.raw_data_id)
    
    for (let i = 0; i < toProcess.length; i++) {
      const collectionResult = toProcess[i]
      
      try {
        console.log(`⚙️ [NIBO ORCHESTRATOR] Processando ${collectionResult.data_type} (${i+1}/${toProcess.length})...`)
        
        // Chamar processor
        const processingResult = await this.callProcessor({
          raw_data_id: collectionResult.raw_data_id!,
          data_type: collectionResult.data_type
        })
        
        if (processingResult.success) {
          results.push(processingResult)
          console.log(`✅ [NIBO ORCHESTRATOR] ${collectionResult.data_type}: ${processingResult.inserted_records} registros processados`)
        } else {
          errors.push({
            data_type: collectionResult.data_type,
            raw_data_id: collectionResult.raw_data_id,
            phase: 'processing',
            error: processingResult.error
          })
          console.error(`❌ [NIBO ORCHESTRATOR] Erro no processamento ${collectionResult.data_type}: ${processingResult.error}`)
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorMsg = `Erro ao processar ${collectionResult.data_type}: ${errorMessage}`
        console.error(`❌ [NIBO ORCHESTRATOR] ${errorMsg}`)
        errors.push({
          data_type: collectionResult.data_type,
          raw_data_id: collectionResult.raw_data_id,
          phase: 'processing',
          error: errorMsg
        })
      }
    }
    
    const duration = (Date.now() - startTime) / 1000
    
    return {
      duration: Math.round(duration * 100) / 100,
      results,
      errors
    }
  }

  private async callCollector(request: Record<string, unknown>): Promise<CollectionResult> {
    console.log(`🔄 [NIBO ORCHESTRATOR] Chamando collector com:`, JSON.stringify(request))
    
    const response = await fetch(`${this.baseUrl}/nibo_collector`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [NIBO ORCHESTRATOR] Collector error response:`, errorText)
      throw new Error(`Collector HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  private async callProcessor(request: Record<string, unknown>): Promise<ProcessingResult> {
    console.log(`⚙️ [NIBO ORCHESTRATOR] Chamando processor com:`, JSON.stringify(request))
    
    const response = await fetch(`${this.baseUrl}/nibo_processor`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [NIBO ORCHESTRATOR] Processor error response:`, errorText)
      throw new Error(`Processor HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Handler da Edge Function
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: OrchestrationRequest = await req.json()
    
    // Validações
    if (!request.sync_type) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'sync_type é obrigatório (continuous ou monthly_validation)' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (request.sync_type === 'monthly_validation' && !request.target_month) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'target_month é obrigatório para validação mensal (formato: YYYY-MM)' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 [NIBO ORCHESTRATOR] Iniciando orquestração - Tipo: ${request.sync_type}`)
    
    const orchestrator = new NiboOrchestrator()
    const result = await orchestrator.orchestrateSync(request)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [NIBO ORCHESTRATOR] Erro na Edge Function:', errorMessage)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
