import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CONTAHUB_BASE_URL = 'https://api.contahub.com.br'
const BAR_ID = 3 // ID padrão do bar

interface ContaHubCredentials {
  username: string
  password: string
}

interface DataTypeConfig {
  batch_size: number
  table: string
}

interface CollectionResult {
  id: number
  data_type: string
  record_count: number
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

class UnifiedContaHubWorker {
  private supabase: any
  private authToken: string | null = null
  
  private dataTypes: Record<string, DataTypeConfig> = {
    'analitico': { batch_size: 100, table: 'contahub_analitico' },
    'fatporhora': { batch_size: 100, table: 'contahub_fatporhora' },
    'pagamentos': { batch_size: 100, table: 'contahub_pagamentos' },
    'periodo': { batch_size: 100, table: 'contahub_periodo' },
    'tempo': { batch_size: 100, table: 'contahub_tempo' }
  }

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  }

  async processFullSync(dataDate: string, barId: number = BAR_ID) {
    const startTime = Date.now()
    
    console.log(`🚀 Iniciando sincronização completa - Data: ${dataDate}, Bar: ${barId}`)
    
    try {
      // Passo 1: Login no ContaHub
      const loginSuccess = await this.contaHubLogin()
      if (!loginSuccess) {
        throw new Error('Falha no login do ContaHub')
      }
      
      console.log('✅ Login ContaHub realizado com sucesso')
      
      // Passo 2: Coletar todos os dados com sleep aleatório
      const collectedData = await this.collectAllData(dataDate, barId)
      
      // Passo 3: Processar todos os dados coletados
      const processingResults = await this.processAllCollectedData(collectedData)
      
      // Resultado final
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      
      const result = {
        success: true,
        data_date: dataDate,
        bar_id: barId,
        collection: collectedData,
        processing: processingResults,
        summary: {
          total_duration: Math.round(duration * 100) / 100,
          types_collected: collectedData.collected?.length || 0,
          types_processed: processingResults.processed?.length || 0,
          total_records_collected: collectedData.collected?.reduce((sum: number, item: any) => sum + (item.record_count || 0), 0) || 0,
          total_records_processed: processingResults.processed?.reduce((sum: number, result: any) => sum + (result.inserted_records || 0), 0) || 0
        }
      }
      
      console.log(`🎉 Sincronização completa concluída em ${duration}s`)
      console.log(`📊 Coletados: ${result.summary.total_records_collected} registros`)
      console.log(`📈 Processados: ${result.summary.total_records_processed} registros`)
      
      return result
      
    } catch (error) {
      console.error(`❌ Erro na sincronização completa: ${error}`)
      return {
        success: false,
        error: error.message,
        data_date: dataDate,
        bar_id: barId,
        duration: (Date.now() - startTime) / 1000
      }
    }
  }

  private async contaHubLogin(): Promise<boolean> {
    try {
      // Buscar credenciais do banco
      const { data: credentials, error } = await this.supabase
        .from('credenciais')
        .select('username, password')
        .eq('servico', 'contahub')
        .eq('ativo', true)
        .single()

      if (error || !credentials) {
        throw new Error('Credenciais ContaHub não encontradas')
      }

      const loginData = {
        username: credentials.username,
        password: credentials.password
      }

      const response = await fetch(`${CONTAHUB_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData)
      })

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`)
      }

      const result = await response.json()
      this.authToken = result.token

      return !!this.authToken
    } catch (error) {
      console.error('❌ Erro no login ContaHub:', error)
      return false
    }
  }

  private async collectAllData(dataDate: string, barId: number) {
    console.log('📥 Iniciando coleta de todos os tipos de dados...')
    
    const collected: CollectionResult[] = []
    const errors: any[] = []
    const dataTypeKeys = Object.keys(this.dataTypes)
    
    for (let i = 0; i < dataTypeKeys.length; i++) {
      const dataType = dataTypeKeys[i]
      
      try {
        console.log(`🔄 [DEBUG] Processando tipo ${i+1}/5: ${dataType}`)
        
        // Sleep aleatório APENAS entre coletas ContaHub (evitar rate limit)
        if (i > 0) {
          const sleepTime = Math.floor(Math.random() * (30 - 5 + 1)) + 5 // 5-30 segundos
          console.log(`⏳ [DEBUG] Aguardando ${sleepTime}s antes da próxima coleta ContaHub...`)
          await this.sleep(sleepTime * 1000)
        }
        
        console.log(`📊 [DEBUG] Iniciando coleta ${dataType}...`)
        
        // Coletar dados do ContaHub
        console.log(`🌐 [DEBUG] Fazendo requisição ContaHub para ${dataType}...`)
        const rawData = await this.fetchContaHubData(dataType, dataDate)
        console.log(`📥 [DEBUG] Resposta ContaHub recebida para ${dataType}`)
        
        if (rawData && rawData.list && rawData.list.length > 0) {
          console.log(`📊 [DEBUG] ${dataType}: ${rawData.list.length} registros encontrados`)
          
          // Salvar como raw_data
          console.log(`💾 [DEBUG] Salvando raw_data para ${dataType}...`)
          const result = await this.saveRawData(dataType, rawData, dataDate, barId)
          console.log(`✅ [DEBUG] Raw_data salvo para ${dataType}`)
          
          collected.push(result)
          console.log(`✅ ${dataType}: ${result.record_count} registros coletados (ID: ${result.id})`)
        } else {
          console.log(`⚠️ [DEBUG] ${dataType}: Nenhum dado encontrado ou lista vazia`)
        }
        
      } catch (error) {
        const errorMsg = `Erro ao coletar ${dataType}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        errors.push({
          data_type: dataType,
          error: errorMsg
        })
      }
    }
    
    return {
      collected,
      errors,
      summary: {
        collected_count: collected.length,
        error_count: errors.length,
        total_records: collected.reduce((sum, item) => sum + (item.record_count || 0), 0)
      }
    }
  }

  private async fetchContaHubData(dataType: string, dataDate: string) {
    if (!this.authToken) {
      throw new Error('Token de autenticação não disponível')
    }

    const url = `${CONTAHUB_BASE_URL}/relatorio/${dataType}?data=${dataDate}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  private async saveRawData(dataType: string, rawData: any, dataDate: string, barId: number): Promise<CollectionResult> {
    const recordCount = rawData.list ? rawData.list.length : 0
    
    const { data, error } = await this.supabase
      .from('contahub_raw_data')
      .upsert({
        data_type: dataType,
        raw_json: rawData,
        data_date: dataDate,
        bar_id: barId,
        record_count: recordCount,
        processed: false,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'bar_id,data_type,data_date',
        ignoreDuplicates: true
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Erro ao salvar raw_data: ${error.message}`)
    }

    return {
      id: data.id,
      data_type: dataType,
      record_count: recordCount
    }
  }

  private async processAllCollectedData(collectedData: any) {
    console.log(`⚙️ [DEBUG] Iniciando processamento de ${collectedData.collected?.length || 0} tipos de dados coletados...`)
    
    const processed: ProcessingResult[] = []
    const errors: any[] = []
    
    for (const rawDataInfo of collectedData.collected || []) {
      try {
        const dataType = rawDataInfo.data_type
        const rawDataId = rawDataInfo.id
        
        console.log(`🔄 [DEBUG] Processando ${dataType} (raw_id: ${rawDataId})...`)
        
        // Processar baseado no tipo
        console.log(`⚙️ [DEBUG] Chamando processamento para ${dataType}...`)
        const result = await this.processByType(dataType, rawDataId)
        console.log(`✅ [DEBUG] Processamento retornou para ${dataType}: success=${result.success}`)
        
        if (result.success) {
          processed.push(result)
          console.log(`✅ ${dataType}: ${result.inserted_records || 0} registros processados`)
        } else {
          const errorMsg = `Falha no processamento de ${dataType}: ${result.error || 'Erro desconhecido'}`
          console.error(`❌ ${errorMsg}`)
          errors.push({
            data_type: dataType,
            raw_data_id: rawDataId,
            error: errorMsg
          })
        }
        
      } catch (error) {
        const errorMsg = `Erro no processamento: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        errors.push({
          data_type: rawDataInfo.data_type || 'unknown',
          raw_data_id: rawDataInfo.id,
          error: errorMsg
        })
      }
    }
    
    return {
      processed,
      errors,
      summary: {
        processed_count: processed.length,
        error_count: errors.length,
        total_records: processed.reduce((sum, result) => sum + (result.inserted_records || 0), 0)
      }
    }
  }

  private async processByType(dataType: string, rawDataId: number): Promise<ProcessingResult> {
    console.log(`🎯 [DEBUG] Entrando em processByType: ${dataType}, raw_id: ${rawDataId}`)
    
    const config = this.dataTypes[dataType]
    if (!config) {
      return {
        success: false,
        data_type: dataType,
        raw_data_id: rawDataId,
        total_records: 0,
        inserted_records: 0,
        processing_time_seconds: 0,
        error: `Tipo de dados não suportado: ${dataType}`
      }
    }
    
    const batchSize = config.batch_size
    console.log(`📋 [DEBUG] Config para ${dataType}: batch_size=${batchSize}`)
    
    const startTime = Date.now()
    
    try {
      // Buscar raw_data
      const { data: rawDataRecord, error } = await this.supabase
        .from('contahub_raw_data')
        .select('*')
        .eq('id', rawDataId)
        .single()

      if (error || !rawDataRecord) {
        throw new Error(`Raw data ${rawDataId} não encontrado`)
      }

      // Extrair e processar registros baseado no tipo
      let records: any[] = []
      
      switch (dataType) {
        case 'fatporhora':
          records = this.parseFatporhoraData(rawDataRecord.raw_json)
          break
        case 'pagamentos':
          records = this.parsePagamentosData(rawDataRecord.raw_json)
          break
        case 'periodo':
          records = this.parsePeriodoData(rawDataRecord.raw_json)
          break
        case 'tempo':
          records = this.parseTempoData(rawDataRecord.raw_json)
          break
        case 'analitico':
          // Para analítico, usar worker específico se necessário
          records = this.parseAnaliticoData(rawDataRecord.raw_json)
          break
        default:
          throw new Error(`Processamento não implementado para: ${dataType}`)
      }

      if (!records || records.length === 0) {
        return {
          success: true,
          data_type: dataType,
          raw_data_id: rawDataId,
          total_records: 0,
          inserted_records: 0,
          processing_time_seconds: 0
        }
      }

      // Processar em batches
      let totalInserted = 0
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize)
        const enrichedBatch = this.enrichRecords(batch, rawDataRecord, dataType)
        
        // Inserir usando REST API
        const insertedCount = await this.insertBatch(enrichedBatch, config.table)
        totalInserted += insertedCount
      }

      // Marcar como processado
      if (totalInserted > 0) {
        await this.markRawDataProcessed(rawDataId)
      }

      const processingTime = (Date.now() - startTime) / 1000

      return {
        success: true,
        data_type: dataType,
        raw_data_id: rawDataId,
        total_records: records.length,
        inserted_records: totalInserted,
        processing_time_seconds: Math.round(processingTime * 100) / 100
      }

    } catch (error) {
      return {
        success: false,
        data_type: dataType,
        raw_data_id: rawDataId,
        total_records: 0,
        inserted_records: 0,
        processing_time_seconds: (Date.now() - startTime) / 1000,
        error: error.message
      }
    }
  }

  private parseFatporhoraData(rawJson: any): any[] {
    if (!rawJson || !rawJson.list) return []
    
    return rawJson.list.map((item: any) => {
      // Extrair hora do formato "HH:MM" ou número
      let hora = 0
      const horaRaw = item.hora || 0
      if (typeof horaRaw === 'string' && horaRaw.includes(':')) {
        hora = parseInt(horaRaw.split(':')[0])
      } else {
        hora = parseInt(horaRaw) || 0
      }
      
      return {
        vd_dtgerencial: item.vd_dtgerencial ? item.vd_dtgerencial.split('T')[0] : null,
        hora,
        valor: parseFloat(item.$valor || 0),
        dds: String(item.dds || ''),
        dia: String(item.dia || ''),
        qtd: parseFloat(item.qtd || 0)
      }
    })
  }

  private parsePagamentosData(rawJson: any): any[] {
    if (!rawJson || !rawJson.list) return []
    
    return rawJson.list.map((item: any) => {
      const safeFloat = (value: any) => {
        if (value === null || value === '' || value === 'null') return 0.0
        try {
          return parseFloat(value) || 0.0
        } catch {
          return 0.0
        }
      }
      
      return {
        vd: String(item.vd || ''),
        trn: String(item.trn || ''),
        dt_gerencial: item.dt_gerencial ? item.dt_gerencial.split('T')[0] : null,
        hr_lancamento: String(item.hr_lancamento || ''),
        hr_transacao: String(item.hr_transacao || ''),
        dt_transacao: item.dt_transacao ? item.dt_transacao.split('T')[0] : null,
        mesa: String(item.mesa || ''),
        cli: parseInt(item.cli) || 0,
        cliente: String(item.cliente || ''),
        vr_pagamentos: safeFloat(item.$vr_pagamentos),
        pag: String(item.pag || ''),
        valor: safeFloat(item.$valor),
        taxa: safeFloat(item.$taxa),
        perc: safeFloat(item.$perc),
        liquido: safeFloat(item.$liquido),
        tipo: String(item.tipo || ''),
        meio: String(item.meio || ''),
        cartao: String(item.cartao || ''),
        autorizacao: String(item.autorizacao || ''),
        dt_credito: item.dt_credito ? item.dt_credito.split('T')[0] : null,
        usr_abriu: String(item.usr_abriu || ''),
        usr_lancou: String(item.usr_lancou || ''),
        usr_aceitou: String(item.usr_aceitou || ''),
        motivodesconto: String(item.motivodesconto || '')
      }
    })
  }

  private parsePeriodoData(rawJson: any): any[] {
    if (!rawJson || !rawJson.list) return []
    
    return rawJson.list.map((item: any) => {
      // Calcular semana do ano
      let semana = 1
      const dataGerencial = item.dt_gerencial
      if (dataGerencial) {
        try {
          const dt = new Date(dataGerencial.split('T')[0])
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
        const dtNascStr = item.cli_dtnasc.split('T')[0]
        if (dtNascStr && dtNascStr !== '0001-01-01') {
          cliDtnasc = dtNascStr
        }
      }
      
      const safeInt = (value: any) => {
        if (value === null || value === '' || value === 'null') return 0
        try {
          return parseInt(parseFloat(value)) || 0
        } catch {
          return 0
        }
      }
      
      const safeFloat = (value: any) => {
        if (value === null || value === '' || value === 'null') return 0.0
        try {
          return parseFloat(value) || 0.0
        } catch {
          return 0.0
        }
      }
      
      return {
        dt_gerencial: dataGerencial ? dataGerencial.split('T')[0] : null,
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
        dt_contabil: item.dt_contabil ? item.dt_contabil.split('T')[0] : null,
        ultimo_pedido: String(item.ultimo_pedido || ''),
        vd_dtcontabil: item.vd_dtcontabil ? item.vd_dtcontabil.split('T')[0] : null,
        semana
      }
    })
  }

  private parseTempoData(rawJson: any): any[] {
    if (!rawJson || !rawJson.list) return []
    
    return rawJson.list.map((item: any) => {
      // Função auxiliar para converter timestamps ISO para timestamp simples
      const extractTimestamp = (isoString: string) => {
        if (!isoString) return null
        return isoString.split('-03')[0] || isoString
      }
      
      // Extrair data do campo 'dia'
      const dataRaw = item.dia || ''
      const data = dataRaw.split('T')[0] || null
      
      return {
        data,
        vd_mesadesc: String(item.vd_mesadesc || ''),
        itm: String(item.itm || ''),
        prd: parseInt(item.prd) || null,
        prd_idexterno: String(item.prd || ''),
        prd_desc: String(item.prd_desc || ''),
        grp_desc: String(item.grp_desc || ''),
        loc_desc: String(item.loc_desc || ''),
        usr_lancou: String(item.usr_lancou || ''),
        itm_qtd: parseInt(item.itm_qtd) || 0,
        t0_lancamento: extractTimestamp(item['t0-lancamento']),
        t1_prodini: extractTimestamp(item['t1-prodini']),
        t2_prodfim: extractTimestamp(item['t2-prodfim']),
        t3_entrega: extractTimestamp(item['t3-entrega']),
        t0_t2: parseInt(item['t0-t2']) || null,
        t0_t3: parseInt(item['t0-t3']) || null
      }
    })
  }

  private parseAnaliticoData(rawJson: any): any[] {
    if (!rawJson || !rawJson.list) return []
    
    // Implementação básica - pode ser expandida conforme necessário
    return rawJson.list.map((item: any) => ({
      // Mapear campos conforme estrutura da tabela contahub_analitico
      ...item
    }))
  }

  private enrichRecords(records: any[], rawDataRecord: any, dataType: string): any[] {
    return records.map((record, index) => ({
      ...record,
      bar_id: rawDataRecord.bar_id,
      idempotency_key: `${dataType}_${rawDataRecord.id}_${index}_${Date.now()}`
    }))
  }

  private async insertBatch(records: any[], tableName: string): Promise<number> {
    try {
      // Processar em sub-batches de 1000 (limite do Supabase)
      let totalInserted = 0
      
      for (let i = 0; i < records.length; i += 1000) {
        const subBatch = records.slice(i, i + 1000)
        
        const { data, error } = await this.supabase
          .from(tableName)
          .upsert(subBatch, { 
            onConflict: 'idempotency_key',
            ignoreDuplicates: false 
          })
          .select('id')

        if (error) {
          console.error(`❌ Erro ao inserir batch em ${tableName}:`, error)
          continue
        }

        const inserted = data ? data.length : 0
        totalInserted += inserted
        console.log(`✅ Sub-batch ${tableName} inserido: ${inserted} registros`)
      }
      
      return totalInserted
      
    } catch (error) {
      console.error(`❌ Erro ao inserir batch em ${tableName}:`, error)
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
    const { data_date, bar_id } = await req.json()
    
    if (!data_date) {
      return new Response(
        JSON.stringify({ error: 'data_date é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 Iniciando Unified ContaHub Worker - Data: ${data_date}, Bar: ${bar_id || BAR_ID}`)
    
    const worker = new UnifiedContaHubWorker()
    const result = await worker.processFullSync(data_date, bar_id)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    console.error('❌ Erro na Edge Function:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
