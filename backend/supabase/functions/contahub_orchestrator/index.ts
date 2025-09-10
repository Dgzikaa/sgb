import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Configurações
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

interface OrchestrationRequest {
  data_date: string
  bar_id?: number
  data_types?: string[] // Opcional: especificar quais tipos processar
}

interface OrchestrationResult {
  success: boolean
  data_date: string
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
  auth_token?: string
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

class ContaHubOrchestrator {
  private baseUrl: string
  private headers: Record<string, string>
  
  private dataTypes = ['analitico', 'fatporhora', 'pagamentos', 'periodo', 'tempo', 'prodporhora']

  constructor() {
    this.baseUrl = `${SUPABASE_URL}/functions/v1`
    this.headers = {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  }

  async orchestrateFullSync(request: OrchestrationRequest): Promise<OrchestrationResult> {
    const startTime = Date.now()
    const barId = request.bar_id || 3
    const dataTypesToProcess = request.data_types || this.dataTypes
    
    console.log(`🎯 [ORCHESTRATOR] Iniciando sincronização completa`)
    console.log(`📅 Data: ${request.data_date}`)
    console.log(`🏪 Bar ID: ${barId}`)
    console.log(`📊 Tipos: ${dataTypesToProcess.join(', ')}`)
    
    try {
      // FASE 1: COLETA DE DADOS
      console.log(`\n🔄 [ORCHESTRATOR] === FASE 1: COLETA DE DADOS ===`)
      const collectionPhase = await this.executeCollectionPhase(
        request.data_date, 
        barId, 
        dataTypesToProcess
      )
      
      console.log(`✅ [ORCHESTRATOR] Coleta concluída: ${collectionPhase.results.length} sucessos, ${collectionPhase.errors.length} erros`)
      
      // FASE 2: PROCESSAMENTO DE DADOS
      console.log(`\n⚙️ [ORCHESTRATOR] === FASE 2: PROCESSAMENTO DE DADOS ===`)
      const processingPhase = await this.executeProcessingPhase(collectionPhase.results)
      
      console.log(`✅ [ORCHESTRATOR] Processamento concluído: ${processingPhase.results.length} sucessos, ${processingPhase.errors.length} erros`)
      
      // RESULTADO FINAL
      const endTime = Date.now()
      const totalDuration = (endTime - startTime) / 1000
      
      const result: OrchestrationResult = {
        success: true,
        data_date: request.data_date,
        bar_id: barId,
        summary: {
          total_duration: Math.round(totalDuration * 100) / 100,
          collection_phase: collectionPhase,
          processing_phase: processingPhase,
          total_records_collected: collectionPhase.results.reduce((sum, r) => sum + (r.record_count || 0), 0),
          total_records_processed: processingPhase.results.reduce((sum, r) => sum + (r.inserted_records || 0), 0)
        }
      }
      
      console.log(`\n🎉 [ORCHESTRATOR] SINCRONIZAÇÃO COMPLETA CONCLUÍDA`)
      console.log(`⏱️ Duração total: ${result.summary.total_duration}s`)
      console.log(`📥 Coletados: ${result.summary.total_records_collected} registros`)
      console.log(`📤 Processados: ${result.summary.total_records_processed} registros`)
      
      // 🔄 SINCRONIZAÇÃO DE EVENTOS REMOVIDA - USAR BOTÃO "ATUALIZAR" NA INTERFACE
      // A sincronização automática foi removida para evitar conflitos de timing
      // Use o botão "🔄 Atualizar" na interface para reprocessar eventos após o orchestrator
      console.log(`\n📝 [ORCHESTRATOR] Processamento concluído. Use o botão 'Atualizar' na interface para reprocessar eventos.`)
      
      result.eventos_sync = { 
        message: "Sincronização manual necessária - use botão 'Atualizar' na interface" 
      }
      
      return result
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ [ORCHESTRATOR] Erro na orquestração: ${errorMessage}`)
      
      return {
        success: false,
        data_date: request.data_date,
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

  private async executeCollectionPhase(
    dataDate: string, 
    barId: number, 
    dataTypes: string[]
  ): Promise<CollectionPhase> {
    const startTime = Date.now()
    const results: CollectionResult[] = []
    const errors: Record<string, unknown>[] = []
    let authToken: string | undefined = undefined
    
    for (let i = 0; i < dataTypes.length; i++) {
      const dataType = dataTypes[i]
      
      try {
        console.log(`🔄 [ORCHESTRATOR] Coletando ${dataType} (${i+1}/${dataTypes.length})...`)
        
        // Sleep aleatório APENAS entre coletas ContaHub (evitar rate limit)
        if (i > 0) {
          const sleepTime = Math.floor(Math.random() * (30 - 5 + 1)) + 5 // 5-30 segundos
          console.log(`⏳ [ORCHESTRATOR] Aguardando ${sleepTime}s antes da próxima coleta...`)
          await this.sleep(sleepTime * 1000)
        }
        
        // Chamar collector
        const collectionResult = await this.callCollector({
          data_type: dataType,
          data_date: dataDate,
          bar_id: barId,
          auth_token: authToken // Reutilizar token se disponível
        })
        
        if (collectionResult.success) {
          results.push(collectionResult)
          // Reutilizar token para próximas coletas
          if (collectionResult.auth_token) {
            authToken = collectionResult.auth_token
          }
          console.log(`✅ [ORCHESTRATOR] ${dataType}: ${collectionResult.record_count || 0} registros coletados`)
        } else {
          errors.push({
            data_type: dataType,
            phase: 'collection',
            error: collectionResult.error
          })
          console.error(`❌ [ORCHESTRATOR] Erro na coleta ${dataType}: ${collectionResult.error}`)
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorMsg = `Erro ao coletar ${dataType}: ${errorMessage}`
        console.error(`❌ [ORCHESTRATOR] ${errorMsg}`)
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
        console.log(`⚙️ [ORCHESTRATOR] Processando ${collectionResult.data_type} (${i+1}/${toProcess.length})...`)
        
        // Chamar processor
        const processingResult = await this.callProcessor({
          raw_data_id: collectionResult.raw_data_id!,
          data_type: collectionResult.data_type
        })
        
        if (processingResult.success) {
          results.push(processingResult)
          console.log(`✅ [ORCHESTRATOR] ${collectionResult.data_type}: ${processingResult.inserted_records} registros processados`)
        } else {
          errors.push({
            data_type: collectionResult.data_type,
            raw_data_id: collectionResult.raw_data_id,
            phase: 'processing',
            error: processingResult.error
          })
          console.error(`❌ [ORCHESTRATOR] Erro no processamento ${collectionResult.data_type}: ${processingResult.error}`)
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        const errorMsg = `Erro ao processar ${collectionResult.data_type}: ${errorMessage}`
        console.error(`❌ [ORCHESTRATOR] ${errorMsg}`)
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
    // Limpar propriedades undefined para evitar JSON inválido
    const cleanRequest: Record<string, unknown> = {
      data_type: request.data_type,
      data_date: request.data_date,
      bar_id: request.bar_id
    }
    
    if (request.auth_token) {
      cleanRequest.auth_token = request.auth_token
    }
    
    console.log(`🔄 [ORCHESTRATOR] Chamando collector com:`, JSON.stringify(cleanRequest))
    
    const response = await fetch(`${this.baseUrl}/contahub_collector`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(cleanRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [ORCHESTRATOR] Collector error response:`, errorText)
      throw new Error(`Collector HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  private async callProcessor(request: Record<string, unknown>): Promise<ProcessingResult> {
    // Limpar propriedades undefined para evitar JSON inválido
    const cleanRequest: Record<string, unknown> = {
      raw_data_id: request.raw_data_id
    }
    
    if (request.data_type) {
      cleanRequest.data_type = request.data_type
    }
    
    console.log(`⚙️ [ORCHESTRATOR] Chamando processor com:`, JSON.stringify(cleanRequest))
    
    const response = await fetch(`${this.baseUrl}/contahub_processor`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(cleanRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [ORCHESTRATOR] Processor error response:`, errorText)
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
    if (!request.data_date) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'data_date é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 [ORCHESTRATOR] Iniciando orquestração - Data: ${request.data_date}`)
    
    const orchestrator = new ContaHubOrchestrator()
    const result = await orchestrator.orchestrateFullSync(request)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ORCHESTRATOR] Erro na Edge Function:', errorMessage)
    
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
