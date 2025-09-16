import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CONTAHUB_BASE_URL = 'https://sp.contahub.com'

interface CollectionRequest {
  data_date: string
  bar_id?: number
  auth_token: string
}

interface CollectionResult {
  success: boolean
  data_date: string
  grupos_coletados: string[]
  total_records: number
  collection_time_seconds: number
  errors: string[]
}

class ContaHubAnaliticoCollector {
  private supabase: ReturnType<typeof createClient>

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  }

  // Lista dos grupos principais baseada no 12/09
  private readonly GRUPOS = [
    'Baldes',
    'Cervejas', 
    'Drinks Classicos',
    'Happy Hour',
    'Bebidas Não Alcoólicas',
    'Pratos Para Compartilhar - P/ 4 Pessoas',
    'Doses',
    'Combos',
    'Sanduíches',
    'Bebidas Prontas',
    'Fest Moscow',
    'Drinks Autorais',
    'Pratos Individuais',
    'Venda Volante',
    'Drinks sem Álcool',
    'Garrafas',
    'Vinhos',
    'Dose Dupla',
    'Sobremesas',
    'Insumos'
  ]

  async collectAnaliticoPorGrupos(request: CollectionRequest): Promise<CollectionResult> {
    const startTime = Date.now()
    const gruposColetados: string[] = []
    const errors: string[] = []
    let totalRecords = 0
    
    console.log(`🔄 [ANALITICO-GRUPOS] Iniciando coleta por grupos: ${request.data_date}`)
    
    try {
      // Extrair parâmetros do auth_token
      const authParams = new URLSearchParams(request.auth_token)
      const emp_id = authParams.get('emp') || '3768'
      const nfe = authParams.get('nfe') || '1'
      
      // Limpar dados existentes para essa data
      await this.clearExistingData(request.data_date, request.bar_id || 3)
      
      // Coletar cada grupo separadamente
      for (const grupo of this.GRUPOS) {
        try {
          console.log(`📊 [ANALITICO-GRUPOS] Coletando grupo: ${grupo}`)
          
          const queryTimestamp = Date.now()
          const grupoEncoded = encodeURIComponent(grupo)
          const url = `${CONTAHUB_BASE_URL}/rest/contahub.cmds.QueryCmd/execQuery/${queryTimestamp}?qry=77&d0=${request.data_date}&d1=${request.data_date}&produto=&grupo=${grupoEncoded}&local=&turno=&mesa=&emp=${emp_id}&nfe=${nfe}`
          
          console.log(`🌐 [ANALITICO-GRUPOS] URL: ${url}`)
          
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          })
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
          
          const data = await response.json()
          
          if (data && data.list && Array.isArray(data.list) && data.list.length > 0) {
            // Salvar dados do grupo
            await this.saveGrupoData(grupo, data, request.data_date, request.bar_id || 3)
            gruposColetados.push(grupo)
            totalRecords += data.list.length
            console.log(`✅ [ANALITICO-GRUPOS] Grupo ${grupo}: ${data.list.length} registros`)
          } else {
            console.log(`⚠️ [ANALITICO-GRUPOS] Grupo ${grupo}: sem dados`)
          }
          
          // Pequena pausa entre requests
          await new Promise(resolve => setTimeout(resolve, 100))
          
        } catch (error) {
          const errorMsg = `Erro no grupo ${grupo}: ${error.message}`
          console.error(`❌ [ANALITICO-GRUPOS] ${errorMsg}`)
          errors.push(errorMsg)
        }
      }
      
      // Processar dados coletados
      if (totalRecords > 0) {
        await this.processCollectedData(request.data_date, request.bar_id || 3)
      }
      
      const endTime = Date.now()
      const collectionTime = (endTime - startTime) / 1000
      
      console.log(`✅ [ANALITICO-GRUPOS] Coleta concluída: ${gruposColetados.length} grupos, ${totalRecords} registros em ${collectionTime}s`)
      
      return {
        success: true,
        data_date: request.data_date,
        grupos_coletados: gruposColetados,
        total_records: totalRecords,
        collection_time_seconds: collectionTime,
        errors
      }
      
    } catch (error) {
      const endTime = Date.now()
      const collectionTime = (endTime - startTime) / 1000
      
      console.error(`❌ [ANALITICO-GRUPOS] Erro geral: ${error.message}`)
      
      return {
        success: false,
        data_date: request.data_date,
        grupos_coletados: gruposColetados,
        total_records: totalRecords,
        collection_time_seconds: collectionTime,
        errors: [...errors, error.message]
      }
    }
  }

  private async clearExistingData(dataDate: string, barId: number): Promise<void> {
    console.log(`🗑️ [ANALITICO-GRUPOS] Limpando dados existentes para ${dataDate}`)
    
    // Deletar dados processados
    await this.supabase
      .from('contahub_analitico')
      .delete()
      .eq('trn_dtgerencial', dataDate)
      .eq('bar_id', barId)
    
    // Deletar raw_data de analitico
    await this.supabase
      .from('contahub_raw_data')
      .delete()
      .eq('data_date', dataDate)
      .eq('bar_id', barId)
      .eq('data_type', 'analitico')
  }

  private async saveGrupoData(grupo: string, data: any, dataDate: string, barId: number): Promise<void> {
    // Salvar como raw_data temporário
    const { error } = await this.supabase
      .from('contahub_raw_data')
      .insert({
        data_type: 'analitico',
        raw_json: data,
        data_date: dataDate,
        bar_id: barId,
        record_count: data.list?.length || 0,
        processed: false,
        created_at: new Date().toISOString(),
        grupo_filtro: grupo // Campo adicional para identificar o grupo
      })
    
    if (error) {
      throw new Error(`Erro ao salvar raw_data do grupo ${grupo}: ${error.message}`)
    }
  }

  private async processCollectedData(dataDate: string, barId: number): Promise<void> {
    console.log(`⚙️ [ANALITICO-GRUPOS] Processando dados coletados para ${dataDate}`)
    
    // Buscar todos os raw_data de analitico para essa data
    const { data: rawDataList, error: fetchError } = await this.supabase
      .from('contahub_raw_data')
      .select('*')
      .eq('data_date', dataDate)
      .eq('bar_id', barId)
      .eq('data_type', 'analitico')
      .eq('processed', false)
    
    if (fetchError) {
      throw new Error(`Erro ao buscar raw_data: ${fetchError.message}`)
    }
    
    if (!rawDataList || rawDataList.length === 0) {
      console.log(`⚠️ [ANALITICO-GRUPOS] Nenhum raw_data encontrado para processar`)
      return
    }
    
    // Processar cada raw_data
    for (const rawData of rawDataList) {
      try {
        const jsonData = rawData.raw_json as any
        
        if (jsonData && jsonData.list && Array.isArray(jsonData.list)) {
          // Inserir registros no contahub_analitico
          const records = jsonData.list.map((item: any) => ({
            ...item,
            bar_id: barId,
            trn_dtgerencial: dataDate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
          
          if (records.length > 0) {
            const { error: insertError } = await this.supabase
              .from('contahub_analitico')
              .insert(records)
            
            if (insertError) {
              console.error(`❌ [ANALITICO-GRUPOS] Erro ao inserir registros do grupo ${rawData.grupo_filtro}: ${insertError.message}`)
            } else {
              console.log(`✅ [ANALITICO-GRUPOS] Inseridos ${records.length} registros do grupo ${rawData.grupo_filtro}`)
            }
          }
        }
        
        // Marcar como processado
        await this.supabase
          .from('contahub_raw_data')
          .update({ processed: true })
          .eq('id', rawData.id)
        
      } catch (error) {
        console.error(`❌ [ANALITICO-GRUPOS] Erro ao processar raw_data ${rawData.id}: ${error.message}`)
      }
    }
  }
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { data_date, bar_id, auth_token } = await req.json()
    
    if (!data_date || !auth_token) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'data_date e auth_token são obrigatórios' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    const collector = new ContaHubAnaliticoCollector()
    const result = await collector.collectAnaliticoPorGrupos({
      data_date,
      bar_id: bar_id || 3,
      auth_token
    })
    
    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
    
  } catch (error) {
    console.error('❌ [ANALITICO-GRUPOS] Erro no endpoint:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
