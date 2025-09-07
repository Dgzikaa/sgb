import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const NIBO_BASE_URL = 'https://api.nibo.com.br/empresas/v1'

interface CollectionRequest {
  data_type: string
  start_date: string
  end_date: string
  bar_id?: number
  api_token?: string
  organization_id?: string
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

class NiboCollector {
  private supabase: ReturnType<typeof createClient>
  private credentials: any = null

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  }

  async collectSingleDataType(request: CollectionRequest): Promise<CollectionResult> {
    const startTime = Date.now()
    
    console.log(`🔄 [NIBO COLLECTOR] Iniciando coleta: ${request.data_type} - ${request.start_date} a ${request.end_date}`)
    
    try {
      // Carregar credenciais se não fornecidas
      if (!request.api_token || !request.organization_id) {
        console.log(`🔑 [NIBO COLLECTOR] Carregando credenciais do banco...`)
        const credentialsLoaded = await this.loadCredentials(request.bar_id || 3)
        if (!credentialsLoaded) {
          throw new Error('Falha ao carregar credenciais NIBO')
        }
      } else {
        this.credentials = {
          api_token: request.api_token,
          organization_id: request.organization_id,
          bar_id: request.bar_id || 3
        }
      }

      // Coletar dados da API NIBO
      console.log(`🌐 [NIBO COLLECTOR] Fazendo requisição NIBO para ${request.data_type}...`)
      const rawData = await this.fetchNiboData(request.data_type, request.start_date, request.end_date)
      
      if (!rawData || !rawData.items || rawData.items.length === 0) {
        console.log(`⚠️ [NIBO COLLECTOR] ${request.data_type}: Nenhum dado encontrado`)
        return {
          success: true,
          data_type: request.data_type,
          record_count: 0,
          collection_time_seconds: (Date.now() - startTime) / 1000,
          api_token: this.credentials?.api_token,
          organization_id: this.credentials?.organization_id
        }
      }

      // Salvar como raw_data
      console.log(`💾 [NIBO COLLECTOR] Salvando ${rawData.items.length} registros como raw_data...`)
      const rawDataId = await this.saveRawData(
        request.data_type, 
        rawData, 
        request.start_date,
        request.end_date,
        request.bar_id || 3
      )

      const collectionTime = (Date.now() - startTime) / 1000
      
      console.log(`✅ [NIBO COLLECTOR] ${request.data_type}: ${rawData.items.length} registros coletados em ${collectionTime}s (ID: ${rawDataId})`)
      
      return {
        success: true,
        data_type: request.data_type,
        raw_data_id: rawDataId,
        record_count: rawData.items.length,
        collection_time_seconds: Math.round(collectionTime * 100) / 100,
        api_token: this.credentials?.api_token,
        organization_id: this.credentials?.organization_id
      }

    } catch (error) {
      const collectionTime = (Date.now() - startTime) / 1000
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ [NIBO COLLECTOR] Erro ao coletar ${request.data_type}: ${errorMessage}`)
      
      return {
        success: false,
        data_type: request.data_type,
        collection_time_seconds: Math.round(collectionTime * 100) / 100,
        error: errorMessage,
        api_token: this.credentials?.api_token,
        organization_id: this.credentials?.organization_id
      }
    }
  }

  private async loadCredentials(barId: number): Promise<boolean> {
    try {
      const { data: credencial, error } = await this.supabase
        .from('api_credentials')
        .select('api_token, empresa_id')
        .eq('sistema', 'nibo')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .single()

      if (error || !credencial?.api_token) {
        console.error('❌ Credenciais NIBO não encontradas:', error?.message)
        return false
      }

      this.credentials = {
        api_token: String(credencial.api_token),
        organization_id: String(credencial.empresa_id || ''),
        bar_id: barId
      }

      console.log('✅ Credenciais NIBO carregadas do banco de dados')
      return true
    } catch (error: unknown) {
      console.error('❌ Erro ao carregar credenciais:', error)
      return false
    }
  }

  private async fetchNiboData(dataType: string, startDate: string, endDate: string) {
    if (!this.credentials) {
      throw new Error('Credenciais NIBO não carregadas')
    }

    // Mapear tipos de dados para endpoints NIBO
    let endpoint: string
    let filterField: string
    
    switch (dataType) {
      case 'agendamentos':
        endpoint = 'schedules'
        filterField = 'accrualDate' // CORREÇÃO: usar accrualDate em vez de competenceDate
        break
      case 'stakeholders':
        endpoint = 'stakeholders'
        filterField = 'updateDate'
        break
      case 'categorias':
        endpoint = 'categories'
        filterField = 'updateDate'
        break
      default:
        throw new Error(`Tipo de dados não suportado: ${dataType}`)
    }

    // Buscar todas as páginas da API NIBO
    const allItems = []
    let skip = 0
    const top = 500
    let hasMore = true

    console.log(`📄 Buscando ${endpoint} com paginação (${filterField}: ${startDate} a ${endDate})...`)

    while (hasMore) {
      const url = new URL(`${NIBO_BASE_URL}/${endpoint}`)
      url.searchParams.set('apitoken', this.credentials.api_token)
      url.searchParams.set('$filter', `${filterField} ge ${startDate} and ${filterField} le ${endDate}`)
      url.searchParams.set('$orderby', `${filterField} desc`)
      url.searchParams.set('$top', top.toString())
      url.searchParams.set('$skip', skip.toString())

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apitoken': this.credentials.api_token
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HTTP ${response.status}: ${response.statusText}`)
        console.error(`❌ Response body: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      
      if (!data || !data.items || data.items.length === 0) {
        hasMore = false
        break
      }

      allItems.push(...data.items)
      console.log(`  📄 Página ${Math.floor(skip/top) + 1}: ${data.items.length} registros`)
      
      if (data.items.length < top) {
        hasMore = false
      } else {
        skip += top
      }

      // Pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    return { items: allItems }
  }

  private async saveRawData(dataType: string, rawData: any, startDate: string, endDate: string, barId: number): Promise<number> {
    const recordCount = rawData.items ? rawData.items.length : 0
    
    const { data, error } = await this.supabase
      .from('nibo_raw_data')
      .upsert({
        data_type: dataType,
        raw_json: rawData,
        start_date: startDate,
        end_date: endDate,
        bar_id: barId,
        record_count: recordCount,
        processed: false,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'bar_id,data_type,start_date,end_date',
        ignoreDuplicates: false
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Erro ao salvar raw_data: ${error.message}`)
    }

    return data.id as number
  }
}

// Handler da Edge Function
serve(async (req) => {
  console.log(`🚀 [NIBO COLLECTOR] Edge Function iniciada - Method: ${req.method}`)
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const request: CollectionRequest = await req.json()
    
    // Validações
    if (!request.data_type || !request.start_date || !request.end_date) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'data_type, start_date e end_date são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar data_type
    const validDataTypes = ['agendamentos', 'stakeholders', 'categorias']
    if (!validDataTypes.includes(request.data_type)) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: `data_type deve ser um de: ${validDataTypes.join(', ')}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`🚀 [NIBO COLLECTOR] Iniciando coleta - Tipo: ${request.data_type}, Período: ${request.start_date} a ${request.end_date}`)
    
    const collector = new NiboCollector()
    const result = await collector.collectSingleDataType(request)
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [NIBO COLLECTOR] Erro na Edge Function:', errorMessage)
    
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
