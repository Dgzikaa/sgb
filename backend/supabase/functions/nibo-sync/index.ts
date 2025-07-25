import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Configuração NIBO
const NIBO_CONFIG = {
  baseUrl: 'https://api.nibo.com.br/empresas/v1',
  apiToken: Deno.env.get('NIBO_API_TOKEN')!,
  organizationId: Deno.env.get('NIBO_ORGANIZATION_ID')!,
  barId: Deno.env.get('NIBO_BAR_ID')!
}

interface NiboCredentials {
  api_token: string
  organization_id: string
  bar_id: string
}

class NiboSyncService {
  private supabase: any
  private credentials: NiboCredentials | null = null

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey)
  }

  async loadCredentials(barId: string): Promise<boolean> {
    try {
      // Usar variáveis de ambiente do Vercel
      if (!NIBO_CONFIG.apiToken || !NIBO_CONFIG.organizationId || !NIBO_CONFIG.barId) {
        console.error('❌ Variáveis de ambiente NIBO não configuradas')
        return false
      }

      this.credentials = {
        api_token: NIBO_CONFIG.apiToken,
        organization_id: NIBO_CONFIG.organizationId,
        bar_id: NIBO_CONFIG.barId
      }

      console.log('✅ Credenciais NIBO carregadas das variáveis de ambiente')
      return true
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais:', error)
      return false
    }
  }

  async fetchNiboData(endpoint: string, params: Record<string, any> = {}) {
    if (!this.credentials) {
      throw new Error('Credenciais NIBO não carregadas')
    }

    const url = new URL(`${NIBO_CONFIG.baseUrl}/${endpoint}`)
    url.searchParams.set('apitoken', this.credentials.api_token)
    
    // Adicionar parâmetros OData
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apitoken': this.credentials.api_token
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`❌ Erro ao buscar ${endpoint}:`, error.message)
      throw error
    }
  }

  async fetchNiboDataPaginated(endpoint: string, params: Record<string, any> = {}) {
    const allItems = []
    let skip = 0
    const top = 100
    let hasMore = true

    console.log(`📄 Buscando ${endpoint} com paginação...`)

    while (hasMore) {
      const pageParams = {
        ...params,
        $top: top,
        $skip: skip
      }

      const data = await this.fetchNiboData(endpoint, pageParams)
      
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

    return allItems
  }

  async syncStakeholders() {
    if (!this.credentials) return { success: false, error: 'Credenciais não carregadas' }

    try {
      console.log('🔄 Sincronizando stakeholders...')
      
      const stakeholders = await this.fetchNiboDataPaginated('stakeholders')
      
      if (!stakeholders || stakeholders.length === 0) {
        console.log('ℹ️ Nenhum stakeholder encontrado')
        return { success: true, count: 0 }
      }

      let inseridos = 0
      let erros = 0

      for (const stakeholder of stakeholders) {
        try {
          const { error } = await this.supabase
            .from('nibo_stakeholders')
            .upsert({
              nibo_id: stakeholder.id,
              bar_id: this.credentials.bar_id,
              nome: stakeholder.name,
              email: stakeholder.email,
              telefone: stakeholder.phone,
              tipo: stakeholder.type,
              ativo: stakeholder.active,
              data_sincronizacao: new Date().toISOString()
            }, {
              onConflict: 'nibo_id,bar_id'
            })

          if (error) {
            console.error('❌ Erro ao inserir stakeholder:', error)
            erros++
          } else {
            inseridos++
          }
        } catch (error) {
          console.error('❌ Erro ao processar stakeholder:', error)
          erros++
        }
      }

      console.log(`✅ Stakeholders sincronizados: ${inseridos} inseridos, ${erros} erros`)
      return { success: true, count: inseridos, errors: erros }

    } catch (error) {
      console.error('❌ Erro na sincronização de stakeholders:', error)
      return { success: false, error: error.message }
    }
  }

  async syncCategories() {
    if (!this.credentials) return { success: false, error: 'Credenciais não carregadas' }

    try {
      console.log('🔄 Sincronizando categorias...')
      
      const categories = await this.fetchNiboDataPaginated('categories')
      
      if (!categories || categories.length === 0) {
        console.log('ℹ️ Nenhuma categoria encontrada')
        return { success: true, count: 0 }
      }

      let inseridas = 0
      let erros = 0

      for (const category of categories) {
        try {
          const { error } = await this.supabase
            .from('nibo_categorias')
            .upsert({
              nibo_id: category.id,
              bar_id: this.credentials.bar_id,
              nome: category.name,
              tipo: category.type,
              ativo: category.active,
              data_sincronizacao: new Date().toISOString()
            }, {
              onConflict: 'nibo_id,bar_id'
            })

          if (error) {
            console.error('❌ Erro ao inserir categoria:', error)
            erros++
          } else {
            inseridas++
          }
        } catch (error) {
          console.error('❌ Erro ao processar categoria:', error)
          erros++
        }
      }

      console.log(`✅ Categorias sincronizadas: ${inseridas} inseridas, ${erros} erros`)
      return { success: true, count: inseridas, errors: erros }

    } catch (error) {
      console.error('❌ Erro na sincronização de categorias:', error)
      return { success: false, error: error.message }
    }
  }

  async syncAll() {
    if (!this.credentials) return { success: false, error: 'Credenciais não carregadas' }

    console.log('🚀 Iniciando sincronização completa NIBO...')
    
    const results = {
      stakeholders: await this.syncStakeholders(),
      categories: await this.syncCategories(),
      timestamp: new Date().toISOString()
    }

    // Registrar log de sincronização
    await this.supabase
      .from('nibo_logs_sincronizacao')
      .insert({
        bar_id: this.credentials.bar_id,
        tipo_sincronizacao: 'completa',
        resultados: results,
        status: 'concluida',
        data_inicio: new Date().toISOString()
      })

    console.log('✅ Sincronização NIBO concluída:', results)
    return { success: true, results }
  }
}

serve(async (req) => {
  // Configurar CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { barId } = await req.json()
    
    if (!barId) {
      return new Response(
        JSON.stringify({ error: 'Bar ID é obrigatório' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔄 Iniciando sincronização NIBO para bar ${barId}...`)

    const niboSync = new NiboSyncService()
    
    // Carregar credenciais
    const credentialsLoaded = await niboSync.loadCredentials(barId)
    if (!credentialsLoaded) {
      return new Response(
        JSON.stringify({ error: 'Credenciais NIBO não encontradas' }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Executar sincronização
    const result = await niboSync.syncAll()

    return new Response(
      JSON.stringify(result),
      { 
        status: result.success ? 200 : 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Erro na Edge Function NIBO Sync:', error)
    
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 