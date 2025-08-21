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

interface DataTypeConfig {
  batch_size: number
  table: string
}

class ContaHubProcessor {
  private supabase: ReturnType<typeof createClient>
  
  private dataTypes: Record<string, DataTypeConfig> = {
    'analitico': { batch_size: 100, table: 'contahub_analitico' },
    'fatporhora': { batch_size: 100, table: 'contahub_fatporhora' },
    'pagamentos': { batch_size: 100, table: 'contahub_pagamentos' },
    'periodo': { batch_size: 100, table: 'contahub_periodo' },
    'tempo': { batch_size: 100, table: 'contahub_tempo' }
  }

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  }

  async processSingleRawData(request: ProcessingRequest): Promise<ProcessingResult> {
    const startTime = Date.now()
    
    console.log(`⚙️ [PROCESSOR] Iniciando processamento - Raw ID: ${request.raw_data_id}`)
    
    try {
      // Buscar raw_data
      const { data: rawDataRecord, error } = await this.supabase
        .from('contahub_raw_data')
        .select('*')
        .eq('id', request.raw_data_id)
        .single()

      if (error || !rawDataRecord) {
        throw new Error(`Raw data ${request.raw_data_id} não encontrado`)
      }

      const dataType = request.data_type || rawDataRecord.data_type
      const config = this.dataTypes[String(dataType)]
      
      if (!config) {
        throw new Error(`Tipo de dados não suportado: ${dataType}`)
      }

      console.log(`📋 [PROCESSOR] Processando ${dataType} - Batch size: ${config.batch_size}`)

      // Verificar se já foi processado
      if (rawDataRecord.processed) {
        console.log(`⚠️ [PROCESSOR] Raw data ${request.raw_data_id} já foi processado`)
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
        case 'fatporhora':
          records = this.parseFatporhoraData(rawDataRecord.raw_json as any)
          break
        case 'pagamentos':
          records = this.parsePagamentosData(rawDataRecord.raw_json as any)
          break
        case 'periodo':
          records = this.parsePeriodoData(rawDataRecord.raw_json as any)
          break
        case 'tempo':
          records = this.parseTempoData(rawDataRecord.raw_json as any)
          break
        case 'analitico':
          records = this.parseAnaliticoData(rawDataRecord.raw_json as any)
          break
        default:
          throw new Error(`Processamento não implementado para: ${dataType}`)
      }

      if (!records || records.length === 0) {
        console.log(`⚠️ [PROCESSOR] Nenhum registro para processar`)
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

      console.log(`📊 [PROCESSOR] ${records.length} registros para processar`)

      // Processar em batches menores para evitar timeout
      let totalInserted = 0
      const batchSize = Math.min(config.batch_size, 100) // Máximo 100 registros por batch
      
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        const enrichedBatch = this.enrichRecords(batch, rawDataRecord as any, String(dataType))
        
        console.log(`🔄 [PROCESSOR] Processando batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(records.length/batchSize)} (${batch.length} registros)`)
        
        const insertedCount = await this.insertBatch(enrichedBatch, config.table)
        totalInserted += insertedCount
        
        console.log(`✅ [PROCESSOR] Batch inserido: ${insertedCount} registros`)
        
        // Pequena pausa entre batches para evitar sobrecarga
        if (i + batchSize < records.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }

      // Marcar como processado (sempre, mesmo se não inseriu nada)
      await this.markRawDataProcessed(request.raw_data_id)

      const processingTime = (Date.now() - startTime) / 1000

      console.log(`🎉 [PROCESSOR] Processamento concluído: ${totalInserted}/${records.length} registros em ${processingTime}s`)

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
      console.error(`❌ [PROCESSOR] Erro no processamento: ${errorMessage}`)
      
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

  private parseFatporhoraData(rawJson: any): Record<string, unknown>[] {
    console.log(`🚀 [FATPORHORA] parseFatporhoraData INICIADA!`)
    
    const list = rawJson.list as any[] | undefined
    if (!rawJson || !list) {
      console.log(`⚠️ [FATPORHORA] Lista vazia ou inválida`)
      return []
    }
    
    console.log(`🔍 [DEBUG FATPORHORA] Processando ${list.length} registros`)
    console.log(`🔍 [DEBUG FATPORHORA] Primeiro item:`, JSON.stringify(list[0], null, 2))
    
    return list.map((item: any, index: number) => {
      // Extrair hora do formato "HH:MM" ou número
      let hora = 0
      const horaRaw = item.hora || 0
      if (typeof horaRaw === 'string' && horaRaw.includes(':')) {
        hora = parseInt(horaRaw.split(':')[0])
      } else {
        hora = parseInt(horaRaw) || 0
      }
      
      // Extrair data do campo vd_dtgerencial
      const dataRaw = item.vd_dtgerencial || ''
      const data = String(dataRaw).split('T')[0] || null
      
      if (index === 0) {
        console.log(`🔍 [DEBUG FATPORHORA] Mapeamento do primeiro registro:`, {
          original_vd_dtgerencial: item.vd_dtgerencial,
          mapped_vd_dtgerencial: data,
          original_hora: item.hora,
          mapped_hora: hora,
          original_valor: item.$valor,
          mapped_valor: parseFloat(item.$valor || 0)
        })
      }
      
      return {
        vd_dtgerencial: data,
        dds: parseInt(item.dds) || null,
        dia: String(item.dia || ''),
        hora,
        qtd: parseFloat(item.qtd || 0),
        valor: parseFloat(item.$valor || 0)
      }
    })
  }

  private parsePagamentosData(rawJson: any): Record<string, unknown>[] {
    const list = rawJson.list as any[] | undefined
    if (!rawJson || !list) return []
    
    return list.map((item: any) => {
      const safeFloat = (value: unknown) => {
        if (value === null || value === '' || value === 'null') return 0.0
        try {
          return parseFloat(String(value)) || 0.0
        } catch {
          return 0.0
        }
      }
      
      return {
        vd: String(item.vd || item.id || ''),
        trn: String(item.trn || item.id || ''),
        dt_gerencial: item.dt_gerencial ? String(item.dt_gerencial).split('T')[0] : null,
        hr_lancamento: String(item.hr_lancamento || ''),
        hr_transacao: String(item.hr_transacao || ''),
        dt_transacao: item.dt_transacao ? String(item.dt_transacao).split('T')[0] : null,
        mesa: String(item.mesa || ''),
        cli: parseInt(item.cli) || 0,
        cliente: String(item.cliente || item.descricao || ''),
        vr_pagamentos: safeFloat(item.$vr_pagamentos || item.valor),
        pag: String(item.pag || ''),
        valor: safeFloat(item.$valor || item.valor),
        taxa: safeFloat(item.$taxa),
        perc: safeFloat(item.$perc),
        liquido: safeFloat(item.$liquido || item.valor),
        tipo: String(item.tipo || ''),
        meio: String(item.meio || item.tipo || ''),
        cartao: String(item.cartao || ''),
        autorizacao: String(item.autorizacao || ''),
        dt_credito: item.dt_credito ? String(item.dt_credito).split('T')[0] : null,
        usr_abriu: String(item.usr_abriu || ''),
        usr_lancou: String(item.usr_lancou || ''),
        usr_aceitou: String(item.usr_aceitou || ''),
        motivodesconto: String(item.motivodesconto || '')
      }
    })
  }

  private parsePeriodoData(rawJson: any): Record<string, unknown>[] {
    const list = rawJson.list as any[] | undefined
    if (!rawJson || !list) return []
    
    return list.map((item: any) => {
      // Calcular semana do ano
      let semana = 1
      const dataGerencial = item.dt_gerencial
      if (dataGerencial) {
        try {
          const dt = new Date(String(dataGerencial).split('T')[0])
          const inicioAno = new Date(dt.getFullYear(), 0, 1)
          const diasDesdeInicio = Math.floor((dt.getTime() - inicioAno.getTime()) / (24 * 60 * 60 * 1000))
          semana = Math.floor((diasDesdeInicio + inicioAno.getDay() + 1) / 7) + 1
        } catch {
          semana = 1
        }
      }
      
      // Processar cli_dtnasc com validação
      let cliDtnasc = null
      if (item.cli_dtnasc) {
        const dtNascStr = String(item.cli_dtnasc).split('T')[0]
        if (dtNascStr && dtNascStr !== '0001-01-01') {
          cliDtnasc = dtNascStr
        }
      }
      
      const safeInt = (value: unknown) => {
        if (value === null || value === '' || value === 'null') return 0
        try {
          return parseInt(parseFloat(String(value))) || 0
        } catch {
          return 0
        }
      }
      
      const safeFloat = (value: unknown) => {
        if (value === null || value === '' || value === 'null') return 0.0
        try {
          return parseFloat(value) || 0.0
        } catch {
          return 0.0
        }
      }
      
      return {
        dt_gerencial: dataGerencial ? String(dataGerencial).split('T')[0] : null,
        tipovenda: String(item.tipovenda || ''),
        vd_mesadesc: String(item.vd_mesadesc || ''),
        vd_localizacao: String(item.vd_localizacao || ''),
        cht_nome: String(item.cht_nome || ''),
        cli_nome: String(item.cli_nome || ''),
        cli_dtnasc: cliDtnasc,
        cli_email: String(item.cli_email || ''),
        cli_fone: String(item.cli_fone || ''),
        usr_abriu: String(item.usr_abriu || ''),
        pessoas: safeInt(item.pessoas),
        qtd_itens: safeInt(item.qtd_itens),
        vr_pagamentos: safeFloat(item.$vr_pagamentos),
        vr_produtos: safeFloat(item.$vr_produtos),
        vr_repique: safeFloat(item.$vr_repique),
        vr_couvert: safeFloat(item.$vr_couvert),
        vr_desconto: safeFloat(item.$vr_desconto),
        motivo: String(item.motivo || ''),
        dt_contabil: item.dt_contabil ? String(item.dt_contabil).split('T')[0] : null,
        ultimo_pedido: String(item.ultimo_pedido || ''),
        vd_dtcontabil: item.vd_dtcontabil ? String(item.vd_dtcontabil).split('T')[0] : null,
        semana
      }
    })
  }

  private parseTempoData(rawJson: any): Record<string, unknown>[] {
    console.log(`🚀 [TEMPO] parseTempoData INICIADA!`)
    
    const list = rawJson.list as any[] | undefined
    if (!rawJson || !list) {
      console.log(`🔍 [DEBUG TEMPO] rawJson ou list vazio:`, { rawJson: !!rawJson, list: !!list })
      return []
    }
    
    console.log(`🔍 [DEBUG TEMPO] Processando ${list.length} registros`)
    console.log(`🔍 [DEBUG TEMPO] Primeiro item:`, JSON.stringify(list[0], null, 2))
    
    return list.map((item: any, index: number) => {
      // Função auxiliar para converter timestamps ISO para timestamp PostgreSQL
      const extractTimestamp = (isoString: string) => {
        if (!isoString || isoString === '' || isoString === 'undefined' || isoString === 'null') {
          return null
        }
        
        try {
          // Formato esperado: "2025-02-01T18:48:53-0300"
          // Converter para formato PostgreSQL: "2025-02-01 18:48:53"
          
          // Remover timezone e converter T para espaço
          let cleanString = isoString
            .replace(/T/, ' ')
            .replace(/-0300$/, '')
            .replace(/\+0000$/, '')
            .replace(/-03:00$/, '')
            .replace(/\+00:00$/, '')
            .replace(/Z$/, '')
          
          // Validar se é um timestamp válido antes de processar
          const date = new Date(isoString)
          if (isNaN(date.getTime())) {
            console.log(`⚠️ [TEMPO] Timestamp inválido: "${isoString}"`)
            return null
          }
          
          // Garantir formato correto YYYY-MM-DD HH:MM:SS
          if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(cleanString)) {
            console.log(`⚠️ [TEMPO] Formato timestamp incorreto após limpeza: "${cleanString}" (original: "${isoString}")`)
            return null
          }
          
          console.log(`✅ [TEMPO] Timestamp convertido: "${isoString}" → "${cleanString}"`)
          return cleanString
          
        } catch (error) {
          console.log(`❌ [TEMPO] Erro ao processar timestamp: "${isoString}"`, error)
          return null
        }
      }
      
      // Extrair data do campo 'dia'
      const dataRaw = item.dia || ''
      const data = String(dataRaw).split('T')[0] || null
      
      return {
        // Campos básicos
        data,
        grp_desc: String(item.grp_desc || ''),
        prd_desc: String(item.prd_desc || ''),
        vd_mesadesc: String(item.vd_mesadesc || ''),
        vd_localizacao: String(item.vd_localizacao || ''),
        itm: String(item.itm || ''),
        
        // Timestamps
        t0_lancamento: extractTimestamp(String(item['t0-lancamento'] || '')),
        t1_prodini: extractTimestamp(String(item['t1-prodini'] || '')),
        t2_prodfim: extractTimestamp(String(item['t2-prodfim'] || '')),
        t3_entrega: extractTimestamp(String(item['t3-entrega'] || '')),
        
        // Intervalos de tempo
        t0_t1: parseInt(String(item['t0-t1'] || '0')) || null,
        t0_t2: parseInt(String(item['t0-t2'] || '0')) || null,
        t0_t3: parseInt(String(item['t0-t3'] || '0')) || null,
        t1_t2: parseInt(String(item['t1-t2'] || '0')) || null,
        t1_t3: parseInt(String(item['t1-t3'] || '0')) || null,
        t2_t3: parseInt(String(item['t2-t3'] || '0')) || null,
        
        // Produtos e usuários
        prd: parseInt(item.prd) || null,
        prd_idexterno: String(item.prd || ''),
        loc_desc: String(item.loc_desc || ''),
        usr_abriu: String(item.usr_abriu || ''),
        usr_lancou: String(item.usr_lancou || ''),
        usr_produziu: String(item.usr_produziu || ''),
        usr_entregou: String(item.usr_entregou || ''),
        usr_transfcancelou: String(item.usr_transfcancelou || ''),
        
        // Campos adicionais
        prefixo: String(item.prefixo || ''),
        tipovenda: String(item.tipovenda || ''),
        ano: parseInt(item.ano) || null,
        mes: parseInt(String(item.mes).split('-')[1]) || null, // Extrair mês de "2025-02"
        dia: data, // Usar a mesma data extraída
        dds: parseInt(item.dds) || null,
        diadasemana: String(item.diadasemana || ''),
        hora: String(item.hora || ''),
        itm_qtd: parseInt(item.itm_qtd) || 0
      }
      
      if (index === 0) {
        console.log(`🔍 [DEBUG TEMPO] Timestamps originais:`, {
          't0-lancamento': item['t0-lancamento'],
          't1-prodini': item['t1-prodini'],
          't2-prodfim': item['t2-prodfim'],
          't3-entrega': item['t3-entrega']
        })
        
        console.log(`🔍 [DEBUG TEMPO] Timestamps processados:`, {
          t0_lancamento: extractTimestamp(String(item['t0-lancamento'] || '')),
          t1_prodini: extractTimestamp(String(item['t1-prodini'] || '')),
          t2_prodfim: extractTimestamp(String(item['t2-prodfim'] || '')),
          t3_entrega: extractTimestamp(String(item['t3-entrega'] || ''))
        })
        
        console.log(`🔍 [DEBUG TEMPO] Intervalos numéricos:`, {
          't0-t1': item['t0-t1'],
          't0-t2': item['t0-t2'], 
          't0-t3': item['t0-t3'],
          't1-t2': item['t1-t2'],
          't1-t3': item['t1-t3'],
          't2-t3': item['t2-t3']
        })
      }
      
      return {
        // Campos básicos
        data,
        grp_desc: String(item.grp_desc || ''),
        prd_desc: String(item.prd_desc || ''),
        vd_mesadesc: String(item.vd_mesadesc || ''),
        vd_localizacao: String(item.vd_localizacao || ''),
        itm: String(item.itm || ''),
        
        // Timestamps
        t0_lancamento: extractTimestamp(String(item['t0-lancamento'] || '')),
        t1_prodini: extractTimestamp(String(item['t1-prodini'] || '')),
        t2_prodfim: extractTimestamp(String(item['t2-prodfim'] || '')),
        t3_entrega: extractTimestamp(String(item['t3-entrega'] || '')),
        
        // Intervalos de tempo
        t0_t1: parseInt(String(item['t0-t1'] || '0')) || null,
        t0_t2: parseInt(String(item['t0-t2'] || '0')) || null,
        t0_t3: parseInt(String(item['t0-t3'] || '0')) || null,
        t1_t2: parseInt(String(item['t1-t2'] || '0')) || null,
        t1_t3: parseInt(String(item['t1-t3'] || '0')) || null,
        t2_t3: parseInt(String(item['t2-t3'] || '0')) || null,
        
        // Produtos e usuários
        prd: parseInt(item.prd) || null,
        prd_idexterno: String(item.prd || ''),
        loc_desc: String(item.loc_desc || ''),
        usr_abriu: String(item.usr_abriu || ''),
        usr_lancou: String(item.usr_lancou || ''),
        usr_produziu: String(item.usr_produziu || ''),
        usr_entregou: String(item.usr_entregou || ''),
        usr_transfcancelou: String(item.usr_transfcancelou || ''),
        
        // Campos adicionais
        prefixo: String(item.prefixo || ''),
        tipovenda: String(item.tipovenda || ''),
        ano: parseInt(item.ano) || null,
        mes: parseInt(String(item.mes).split('-')[1]) || null, // Extrair mês de "2025-02"
        dia: data, // Usar a mesma data extraída
        dds: parseInt(item.dds) || null,
        diadasemana: String(item.diadasemana || ''),
        hora: String(item.hora || ''),
        itm_qtd: parseInt(item.itm_qtd) || 0
      }
    })
  }

  private parseAnaliticoData(rawJson: any): Record<string, unknown>[] {
    console.log(`🚀 [ANALITICO] parseAnaliticoData INICIADA!`)
    
    const list = rawJson.list as any[] | undefined
    if (!rawJson || !list) {
      console.log(`⚠️ [ANALITICO] Lista vazia ou inválida`)
      return []
    }
    
    console.log(`🔍 [DEBUG ANALITICO] Processando ${list.length} registros`)
    console.log(`🔍 [DEBUG ANALITICO] Primeiro item:`, JSON.stringify(list[0], null, 2))
    
    return list.map((item: any, index: number) => {
      // Extrair data do campo trn_dtgerencial
      const dataRaw = item.trn_dtgerencial || ''
      const data = String(dataRaw).split('T')[0] || null
      
      if (index === 0) {
        console.log(`🔍 [DEBUG ANALITICO] Mapeamento do primeiro registro:`, {
          original_trn_dtgerencial: item.trn_dtgerencial,
          mapped_trn_dtgerencial: data,
          original_mes: item.mes,
          mapped_mes: parseInt(String(item.mes).split('-')[1]) || null
        })
      }
      
      return {
        // Campos básicos
        vd_mesadesc: String(item.vd_mesadesc || ''),
        vd_localizacao: String(item.vd_localizacao || ''),
        itm: parseInt(item.itm) || null,
        trn: parseInt(item.trn) || null,
        trn_desc: String(item.trn_desc || ''),
        prefixo: String(item.prefixo || ''),
        tipo: String(item.tipo || ''),
        tipovenda: String(item.tipovenda || ''),
        
        // Campos de data e tempo
        ano: parseInt(item.ano) || null,
        mes: parseInt(String(item.mes).split('-')[1]) || null, // Extrair mês de "2025-02"
        trn_dtgerencial: data,
        
        // Usuário e produtos
        usr_lancou: String(item.usr_lancou || ''),
        prd: String(item.prd || ''),
        prd_desc: String(item.prd_desc || ''),
        grp_desc: String(item.grp_desc || ''),
        loc_desc: String(item.loc_desc || ''),
        
        // Valores numéricos
        qtd: parseFloat(item.qtd) || 0,
        desconto: parseFloat(item.desconto) || 0,
        valorfinal: parseFloat(item.valorfinal) || 0,
        custo: parseFloat(item.custo) || 0,
        
        // Campos opcionais
        itm_obs: String(item.itm_obs || ''),
        comandaorigem: String(item.comandaorigem || ''),
        itemorigem: String(item.itemorigem || '')
      }
    })
  }

  private enrichRecords(records: Record<string, unknown>[], rawDataRecord: any, dataType: string): Record<string, unknown>[] {
    const crypto = require('crypto')
    
    return records.map((record, index) => {
      // Criar chave única baseada no conteúdo do registro + timestamp
      const recordContent = JSON.stringify(record)
      const uniqueString = `${dataType}_${rawDataRecord.bar_id}_${recordContent}_${Date.now()}_${Math.random()}`
      const idempotencyKey = crypto.createHash('md5').update(uniqueString).digest('hex')
      
      return {
        ...record,
        bar_id: rawDataRecord.bar_id,
        idempotency_key: idempotencyKey
      }
    })
  }

  private async insertBatch(records: Record<string, unknown>[], tableName: string): Promise<number> {
    try {
      console.log(`💾 [PROCESSOR] Inserindo ${records.length} registros na tabela ${tableName}`)
      
      const { data, error } = await this.supabase
        .from(tableName)
        .insert(records)
        .select('id')

      if (error) {
        console.error(`❌ [PROCESSOR] Erro ao inserir em ${tableName}:`, error)
        return 0
      }

      const inserted = data ? data.length : 0
      console.log(`✅ [PROCESSOR] Inseridos: ${inserted}/${records.length} registros`)
      
      return inserted
      
    } catch (error) {
      console.error(`❌ [PROCESSOR] Erro ao inserir batch em ${tableName}:`, error)
      return 0
    }
  }

  private async markRawDataProcessed(rawDataId: number): Promise<void> {
    await this.supabase
      .from('contahub_raw_data')
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

    console.log(`🚀 [PROCESSOR] Iniciando processamento - Raw ID: ${request.raw_data_id}`)
    
    const processor = new ContaHubProcessor()
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
    console.error('❌ [PROCESSOR] Erro na Edge Function:', errorMessage)
    
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
