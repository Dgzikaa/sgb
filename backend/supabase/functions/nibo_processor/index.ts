import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ProcessingRequest {
  raw_data_id: number
  data_type?: string // Opcional, será detectado automaticamente
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

class NiboProcessor {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  }

  async processSingleRawData(request: ProcessingRequest): Promise<ProcessingResult> {
    const startTime = Date.now()
    
    console.log(`⚙️ [NIBO PROCESSOR] Iniciando processamento - Raw ID: ${request.raw_data_id}`)
    
    try {
      // Buscar raw_data
      const { data: rawDataRecord, error } = await this.supabase
        .from('nibo_raw_data')
        .select('*')
        .eq('id', request.raw_data_id)
        .single()

      if (error || !rawDataRecord) {
        throw new Error(`Raw data ${request.raw_data_id} não encontrado`)
      }

      const dataType = request.data_type || rawDataRecord.data_type

      console.log(`📋 [NIBO PROCESSOR] Processando ${dataType}`)

      // Verificar se já foi processado
      if (rawDataRecord.processed) {
        console.log(`⚠️ [NIBO PROCESSOR] Raw data ${request.raw_data_id} já foi processado`)
        return {
          success: true,
          data_type: dataType,
          raw_data_id: request.raw_data_id,
          total_records: Number(rawDataRecord.record_count || 0),
          inserted_records: 0,
          processing_time_seconds: 0
        }
      }

      // Extrair e processar registros baseado no tipo
      let records: Record<string, unknown>[] = []
      
      switch (dataType) {
        case 'agendamentos':
          records = this.parseAgendamentosData(rawDataRecord.raw_json as any)
          break
        case 'stakeholders':
          records = this.parseStakeholdersData(rawDataRecord.raw_json as any)
          break
        case 'categorias':
          records = this.parseCategoriasData(rawDataRecord.raw_json as any)
          break
        default:
          throw new Error(`Processamento não implementado para: ${dataType}`)
      }

      if (!records || records.length === 0) {
        console.log(`⚠️ [NIBO PROCESSOR] Nenhum registro para processar`)
        await this.markRawDataProcessed(request.raw_data_id)
        
        return {
          success: true,
          data_type: dataType,
          raw_data_id: request.raw_data_id,
          total_records: 0,
          inserted_records: 0,
          processing_time_seconds: (Date.now() - startTime) / 1000
        }
      }

      console.log(`📊 [NIBO PROCESSOR] ${records.length} registros para processar`)

      // Processar em batches otimizados (SUPABASE LIMIT: 1000 registros)
      let totalInserted = 0
      const batchSize = 1000 // Limite máximo do Supabase
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        const enrichedBatch = this.enrichRecords(batch, rawDataRecord as any, String(dataType))
        
        console.log(`🔄 [NIBO PROCESSOR] Processando batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${batch.length} registros)`)
        
        const insertedCount = await this.insertBatch(enrichedBatch, 'nibo_agendamentos') // Tudo vai para nibo_agendamentos
        totalInserted += insertedCount
        
        console.log(`✅ [NIBO PROCESSOR] Batch inserido: ${insertedCount} registros`)
      }

      // Marcar como processado
      await this.markRawDataProcessed(request.raw_data_id)

      const processingTime = (Date.now() - startTime) / 1000

      console.log(`🎉 [NIBO PROCESSOR] Processamento concluído: ${totalInserted}/${records.length} registros em ${processingTime}s`)

      return {
        success: true,
        data_type: dataType,
        raw_data_id: request.raw_data_id,
        total_records: records.length,
        inserted_records: totalInserted,
        processing_time_seconds: Math.round(processingTime * 100) / 100
      }

    } catch (error) {
      const processingTime = (Date.now() - startTime) / 1000
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ [NIBO PROCESSOR] Erro no processamento: ${errorMessage}`)
      
      return {
        success: false,
        data_type: String(request.data_type || 'unknown'),
        raw_data_id: request.raw_data_id,
        total_records: 0,
        inserted_records: 0,
        processing_time_seconds: Math.round(processingTime * 100) / 100,
        error: errorMessage
      }
    }
  }

  private parseAgendamentosData(rawJson: any): Record<string, unknown>[] {
    console.log(`🚀 [AGENDAMENTOS] parseAgendamentosData INICIADA!`)
    
    const items = rawJson.items as any[] | undefined
    if (!rawJson || !items) {
      console.log(`⚠️ [AGENDAMENTOS] Lista vazia ou inválida`)
      return []
    }
    
    console.log(`🔍 [DEBUG AGENDAMENTOS] Processando ${items.length} registros`)
    console.log(`🔍 [DEBUG AGENDAMENTOS] Primeiro item:`, JSON.stringify(items[0], null, 2))
    
    return items.map((item: any, index: number) => {
      if (index === 0) {
        console.log(`🔍 [DEBUG AGENDAMENTOS] Mapeamento do primeiro registro:`, {
          original_id: item.id,
          original_description: item.description,
          original_value: item.value,
          original_accrualDate: item.accrualDate,
          original_category: item.category
        })
      }
      
      return {
        nibo_id: String(item.scheduleId || item.id || ''), // CORREÇÃO: usar scheduleId primeiro
        tipo: String(item.type || 'receita'),
        status: String(item.status || 'pendente'),
        valor: parseFloat(item.value || 0),
        valor_pago: parseFloat(item.paidValue || 0),
        data_vencimento: item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : null,
        data_pagamento: item.paymentDate ? new Date(item.paymentDate).toISOString().split('T')[0] : null,
        data_competencia: item.accrualDate ? new Date(item.accrualDate).toISOString().split('T')[0] : null,
        descricao: String(item.description || ''),
        observacoes: String(item.notes || ''),
        categoria_id: String(item.category?.id || ''),
        categoria_nome: String(item.category?.name || ''),
        stakeholder_id: String(item.stakeholder?.id || ''),
        stakeholder_nome: String(item.stakeholder?.name || ''),
        stakeholder_tipo: String(item.stakeholder?.type || ''),
        conta_bancaria_id: String(item.bankAccount?.id || ''),
        conta_bancaria_nome: String(item.bankAccount?.name || ''),
        centro_custo_id: String(item.costCenter?.id || ''),
        centro_custo_nome: String(item.costCenter?.name || ''),
        numero_documento: String(item.documentNumber || ''),
        numero_parcela: parseInt(item.installmentNumber) || null,
        total_parcelas: parseInt(item.totalInstallments) || null,
        recorrente: Boolean(item.recurring),
        frequencia_recorrencia: String(item.recurrenceFrequency || ''),
        data_atualizacao: item.updateDate ? new Date(item.updateDate).toISOString() : null,
        usuario_atualizacao: String(item.updateUser || ''),
        titulo: String(item.title || ''),
        anexos: item.attachments || null,
        tags: item.tags || null,
        recorrencia_config: item.recurrenceConfig || null,
        deletado: Boolean(item.deleted),
        criado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString()
      }
    })
  }

  private parseStakeholdersData(rawJson: any): Record<string, unknown>[] {
    const items = rawJson.items as any[] | undefined
    if (!rawJson || !items) return []
    
    return items.map((item: any) => ({
      nibo_id: String(item.id || ''),
      nome: String(item.name || ''),
      email: String(item.email || ''),
      telefone: String(item.phone || ''),
      tipo: String(item.type || ''),
      ativo: Boolean(item.active),
      data_sincronizacao: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }))
  }

  private parseCategoriasData(rawJson: any): Record<string, unknown>[] {
    const items = rawJson.items as any[] | undefined
    if (!rawJson || !items) return []
    
    return items.map((item: any) => ({
      nibo_id: String(item.id || ''),
      nome: String(item.name || ''),
      tipo: String(item.type || ''),
      ativo: Boolean(item.active),
      data_sincronizacao: new Date().toISOString(),
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    }))
  }

  private enrichRecords(records: Record<string, unknown>[], rawDataRecord: any, dataType: string): Record<string, unknown>[] {
    return records.map((record, index) => {
      return {
        ...record,
        bar_id: rawDataRecord.bar_id
      }
    })
  }

  private async insertBatch(records: Record<string, unknown>[], tableName: string): Promise<number> {
    try {
      console.log(`💾 [NIBO PROCESSOR] Inserindo ${records.length} registros na tabela ${tableName}`)
      console.log(`🔍 [DEBUG] Primeiro registro:`, JSON.stringify(records[0], null, 2))
      
      const { data, error } = await this.supabase
        .from(tableName)
        .upsert(records, {
          onConflict: 'nibo_id',
          ignoreDuplicates: false
        })
        .select('id')

      if (error) {
        console.error(`❌ [NIBO PROCESSOR] Erro ao inserir em ${tableName}:`, JSON.stringify(error, null, 2))
        console.error(`❌ [NIBO PROCESSOR] Detalhes do erro:`, error.message, error.details, error.hint)
        return 0
      }

      const inserted = data ? data.length : 0
      console.log(`✅ [NIBO PROCESSOR] Inseridos: ${inserted}/${records.length} registros`)
      
      return inserted
      
    } catch (error) {
      console.error(`❌ [NIBO PROCESSOR] Erro ao inserir batch em ${tableName}:`, error)
      return 0
    }
  }

  private async markRawDataProcessed(rawDataId: number): Promise<void> {
    await this.supabase
      .from('nibo_raw_data')
      .update({ 
        processed: true, 
        processed_at: new Date().toISOString() 
      })
      .eq('id', rawDataId)
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
    const request: ProcessingRequest = await req.json()
    
    // Validações
    if (!request.raw_data_id) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'raw_data_id é obrigatório' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 [NIBO PROCESSOR] Iniciando processamento - Raw ID: ${request.raw_data_id}`)
    
    const processor = new NiboProcessor()
    const result = await processor.processSingleRawData(request)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [NIBO PROCESSOR] Erro na Edge Function:', errorMessage)
    
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
