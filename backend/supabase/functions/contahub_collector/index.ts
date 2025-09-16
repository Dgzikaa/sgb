import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CONTAHUB_BASE_URL = Deno.env.get('CONTAHUB_BASE_URL') || 'https://sp.contahub.com'
const CONTAHUB_EMAIL = Deno.env.get('CONTAHUB_EMAIL')!
const CONTAHUB_PASSWORD = Deno.env.get('CONTAHUB_PASSWORD')!

interface CollectionRequest {
  data_type: string
  data_date: string
  bar_id?: number
  auth_token?: string
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

class ContaHubCollector {
  private supabase: ReturnType<typeof createClient>
  private authToken: string | undefined = undefined
  private userData: Record<string, unknown> | undefined = undefined
  private sessionCookies: string | undefined = undefined

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  }

  async collectSingleDataType(request: CollectionRequest): Promise<CollectionResult> {
    const startTime = Date.now()
    
    console.log(`🔄 [COLLECTOR] Iniciando coleta: ${request.data_type} - ${request.data_date}`)
    
    try {
      // Reutilizar sessão existente ou fazer login
      if (request.auth_token && this.sessionCookies && this.userData) {
        this.authToken = request.auth_token
        console.log(`🍪 [COLLECTOR] Reutilizando sessão existente`)
      } else if (!this.sessionCookies || !this.userData) {
        console.log(`🔑 [COLLECTOR] Fazendo login no ContaHub...`)
        const loginSuccess = await this.contaHubLogin()
        if (!loginSuccess) {
          throw new Error('Falha no login do ContaHub')
        }
        console.log(`✅ [COLLECTOR] Login realizado com sucesso`)
      } else {
        console.log(`🍪 [COLLECTOR] Usando sessão já estabelecida`)
      }

      // Coletar dados do ContaHub
      console.log(`🌐 [COLLECTOR] Fazendo requisição ContaHub para ${request.data_type}...`)
      const rawData = await this.fetchContaHubData(request.data_type, request.data_date)
      
      if (!rawData || !rawData.list || rawData.list.length === 0) {
        console.log(`⚠️ [COLLECTOR] ${request.data_type}: Nenhum dado encontrado`)
        return {
          success: true,
          data_type: request.data_type,
          record_count: 0,
          collection_time_seconds: (Date.now() - startTime) / 1000,
          auth_token: this.authToken
        }
      }

      // Salvar como raw_data
      console.log(`💾 [COLLECTOR] Salvando ${rawData.list.length} registros como raw_data...`)
      const rawDataId = await this.saveRawData(
        request.data_type, 
        rawData, 
        request.data_date, 
        request.bar_id || 3
      )

      const collectionTime = (Date.now() - startTime) / 1000
      
      console.log(`✅ [COLLECTOR] ${request.data_type}: ${rawData.list.length} registros coletados em ${collectionTime}s (ID: ${rawDataId})`)
      
      return {
        success: true,
        data_type: request.data_type,
        raw_data_id: rawDataId,
        record_count: rawData.list.length,
        collection_time_seconds: Math.round(collectionTime * 100) / 100,
        auth_token: this.authToken
      }

    } catch (error) {
      const collectionTime = (Date.now() - startTime) / 1000
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`❌ [COLLECTOR] Erro ao coletar ${request.data_type}: ${errorMessage}`)
      
      return {
        success: false,
        data_type: request.data_type,
        collection_time_seconds: Math.round(collectionTime * 100) / 100,
        error: errorMessage,
        auth_token: this.authToken
      }
    }
  }

  private async contaHubLogin(): Promise<boolean> {
    try {
      // Verificar se as credenciais estão disponíveis
      if (!CONTAHUB_EMAIL || !CONTAHUB_PASSWORD) {
        throw new Error('Credenciais ContaHub não configuradas (CONTAHUB_EMAIL/CONTAHUB_PASSWORD)')
      }

      console.log(`🔑 [COLLECTOR] Fazendo login ContaHub com email: ${CONTAHUB_EMAIL}`)
      console.log(`🌐 [COLLECTOR] URL de login: ${CONTAHUB_BASE_URL}/rest/contahub.cmds.UsuarioCmd/login`)
      console.log(`📧 [COLLECTOR] Email configurado: ${CONTAHUB_EMAIL ? 'SIM' : 'NÃO'}`)
      console.log(`🔒 [COLLECTOR] Password configurado: ${CONTAHUB_PASSWORD ? 'SIM' : 'NÃO'}`)

      const loginData = new URLSearchParams({
        usr_email: CONTAHUB_EMAIL,
        usr_password: CONTAHUB_PASSWORD
      })

            const response = await fetch(`${CONTAHUB_BASE_URL}/rest/contahub.cmds.UsuarioCmd/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: loginData
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ [COLLECTOR] Login failed - Status: ${response.status}, Response: ${errorText}`)
        throw new Error(`Login failed: ${response.status} - ${errorText}`)
      }
      
      // Capturar cookies de sessão do response
      const setCookieHeaders = response.headers.get('set-cookie')
      if (setCookieHeaders) {
        this.sessionCookies = setCookieHeaders
        console.log(`🍪 [COLLECTOR] Cookies de sessão capturados`)
      }
      
      const result = await response.json()
      console.log(`✅ [COLLECTOR] Login successful, user data received:`, result)
      
      // ContaHub retorna os dados do usuário diretamente, não um token separado
      this.authToken = `usr=${result.usr}&emp=${result.emp}&nfe=${result.nfe}`
      this.userData = result

      return !!this.authToken
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error('❌ [COLLECTOR] Erro no login ContaHub:', errorMessage)
      return false
    }
  }

  // Lista de grupos para fallback do analítico
  private readonly GRUPOS_ANALITICO = [
    'Adicionais', 'Baldes', 'Bebidas Não Alcoólicas', 'Bebidas Prontas', 'Cervejas', 
    'Combos', 'Dose Dupla', 'Doses', 'Drinks Autorais', 'Drinks Classicos', 
    'Drinks sem Álcool', 'Espressos', 'Fest Moscow', 'Garrafas', 'Happy Hour', 
    'Insumos', 'Pegue e Pague', 'Pratos Individuais', 'Pratos Para Compartilhar - P/ 4 Pessoas', 
    'Sanduíches', 'Sobremesas', 'Venda Volante', 'Vinhos'
  ]

  private async fetchContaHubData(dataType: string, dataDate: string) {
    if (!this.userData) {
      throw new Error('Dados do usuário não disponíveis')
    }

    // Para analítico, tentar primeiro normal, depois por grupos se der erro 500
    if (dataType === 'analitico') {
      // Para 13/09, usar diretamente coleta por grupos (sabemos que dá erro 500)
      if (dataDate === '2025-09-13') {
        console.log(`🔍 [COLLECTOR] Data 13/09 detectada, usando coleta por grupos diretamente...`)
        return await this.fetchAnaliticoPorGrupos(dataDate)
      }
      
      try {
        console.log(`🔍 [COLLECTOR] Tentando coleta normal do analítico...`)
        return await this.fetchSingleQuery(dataType, dataDate)
      } catch (error) {
        console.log(`❌ [COLLECTOR] Erro na coleta normal: ${error.message}`)
        if (error.message.includes('500') || error.message.includes('Internal Server Error') || error.message.includes('HTTP 500')) {
          console.log(`⚠️ [COLLECTOR] Erro 500 detectado, tentando coleta por grupos...`)
          return await this.fetchAnaliticoPorGrupos(dataDate)
        }
        throw error
      }
    }

    // Para outros tipos, usar método normal
    return await this.fetchSingleQuery(dataType, dataDate)
  }

  private async fetchSingleQuery(dataType: string, dataDate: string) {
    if (!this.userData) {
      throw new Error('Dados do usuário não disponíveis')
    }

    // Gerar timestamp dinâmico para cada query
    const queryTimestamp = Date.now()
    
    // Usar dados do usuário logado
    const emp_id = this.userData.emp
    const nfe = this.userData.nfe || 1
    
    // Construir URL específica para cada tipo de dados com parâmetros corretos
    let url: string
    
    switch (dataType) {
      case 'pagamentos':
        url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=7&d0=${dataDate}&d1=${dataDate}&meio=&emp=${emp_id}&nfe=${nfe}`
        break
        
      case 'periodo':
        url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=5&d0=${dataDate}&d1=${dataDate}&emp=${emp_id}&nfe=${nfe}`
        break
        
      case 'fatporhora':
        url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=101&d0=${dataDate}&d1=${dataDate}&emp=${emp_id}&nfe=${nfe}`
        break
        
      case 'analitico':
        url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${dataDate}&d1=${dataDate}&produto=&grupo=&local=&turno=&mesa=&emp=${emp_id}&nfe=${nfe}`
        break
        
      case 'tempo':
        url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=81&d0=${dataDate}&d1=${dataDate}&prod=&grupo=&local=&emp=${emp_id}&nfe=${nfe}`
        break
        
      case 'prodporhora':
        url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=95&d0=${dataDate}&d1=${dataDate}&prod=&grupo=&turno=&emp=${emp_id}&nfe=${nfe}`
        break
        
      default:
        throw new Error(`Tipo de dados não suportado: ${dataType}`)
    }
    
    console.log(`🔍 [COLLECTOR] Fazendo requisição ContaHub: ${url}`)
    
    // Preparar headers com cookies de sessão
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }
    
    if (this.sessionCookies) {
      headers['Cookie'] = this.sessionCookies
      console.log(`🍪 [COLLECTOR] Usando cookies de sessão para autenticação`)
    }
    
    const response = await fetch(url, {
      method: 'GET',
      headers
    })

    if (!response.ok) {
      throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  private async fetchAnaliticoPorGrupos(dataDate: string): Promise<Record<string, unknown>> {
    console.log(`🔄 [COLLECTOR] Iniciando coleta analítico por grupos para ${dataDate}`)
    
    if (!this.userData) {
      throw new Error('Dados do usuário não disponíveis')
    }

    const userData = this.userData as any
    const emp_id = userData.emp_id || '3768'
    const nfe = userData.nfe || '1'
    
    const allRecords: any[] = []
    let totalRecords = 0
    
    // Coletar cada grupo separadamente
    for (const grupo of this.GRUPOS_ANALITICO) {
      try {
        console.log(`📊 [COLLECTOR] Coletando grupo: ${grupo}`)
        
        const queryTimestamp = Date.now()
        const grupoEncoded = encodeURIComponent(grupo)
        const url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${dataDate}&d1=${dataDate}&produto=&grupo=${grupoEncoded}&local=&turno=&mesa=&emp=${emp_id}&nfe=${nfe}`
        
        // Preparar headers com cookies de sessão
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        }
        
        if (this.sessionCookies) {
          headers['Cookie'] = this.sessionCookies
        }
        
        const response = await fetch(url, {
          method: 'GET',
          headers
        })
        
        if (!response.ok) {
          console.log(`⚠️ [COLLECTOR] Erro HTTP ${response.status} para grupo ${grupo}`)
          continue
        }
        
        const data = await response.json()
        
        if (data && data.list && Array.isArray(data.list) && data.list.length > 0) {
          allRecords.push(...data.list)
          totalRecords += data.list.length
          console.log(`✅ [COLLECTOR] Grupo ${grupo}: ${data.list.length} registros`)
        } else {
          console.log(`⚠️ [COLLECTOR] Grupo ${grupo}: sem dados`)
        }
        
        // Pequena pausa entre requests para evitar sobrecarga
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`❌ [COLLECTOR] Erro no grupo ${grupo}: ${error.message}`)
        // Continuar com próximo grupo mesmo se um falhar
      }
    }
    
    console.log(`✅ [COLLECTOR] Coleta por grupos concluída: ${totalRecords} registros de ${this.GRUPOS_ANALITICO.length} grupos`)
    
    // Retornar no mesmo formato esperado
    return {
      list: allRecords,
      total: totalRecords,
      collected_by_groups: true
    }
  }

  private async saveRawData(dataType: string, rawData: Record<string, unknown>, dataDate: string, barId: number): Promise<number> {
    const list = rawData.list as unknown[] | undefined
    const recordCount = list ? list.length : 0
    
    // Primeiro, tenta fazer upsert
    const { data: upsertData, error: upsertError } = await this.supabase
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
        ignoreDuplicates: false // Mudado para false para sempre retornar o registro
      })
      .select('id')

    if (upsertError) {
      throw new Error(`Erro ao salvar raw_data: ${upsertError.message}`)
    }

    // Se o upsert retornou dados, usa o primeiro
    if (upsertData && upsertData.length > 0) {
      return upsertData[0].id as number
    }

    // Se não retornou dados (caso raro), busca o registro existente
    const { data: existingData, error: selectError } = await this.supabase
      .from('contahub_raw_data')
      .select('id')
      .eq('bar_id', barId)
      .eq('data_type', dataType)
      .eq('data_date', dataDate)
      .single()

    if (selectError) {
      throw new Error(`Erro ao buscar raw_data existente: ${selectError.message}`)
    }

    return existingData.id as number
  }
}

// Handler da Edge Function
serve(async (req) => {
  console.log(`🚀 [COLLECTOR] Edge Function iniciada - Method: ${req.method}`)
  console.log(`🔧 [COLLECTOR] Verificando secrets...`)
  console.log(`📧 CONTAHUB_EMAIL: ${CONTAHUB_EMAIL ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`)
  console.log(`🔒 CONTAHUB_PASSWORD: ${CONTAHUB_PASSWORD ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`)
  console.log(`🌐 CONTAHUB_BASE_URL: ${CONTAHUB_BASE_URL}`)
  console.log(`🔑 SERVICE_ROLE_KEY: ${SERVICE_ROLE_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`)
  
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
    if (!request.data_type || !request.data_date) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'data_type e data_date são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validar data_type
    const validDataTypes = ['analitico', 'fatporhora', 'pagamentos', 'periodo', 'tempo', 'prodporhora']
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

    console.log(`🚀 [COLLECTOR] Iniciando coleta - Tipo: ${request.data_type}, Data: ${request.data_date}`)
    
    const collector = new ContaHubCollector()
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
    console.error('❌ [COLLECTOR] Erro na Edge Function:', errorMessage)
    
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
