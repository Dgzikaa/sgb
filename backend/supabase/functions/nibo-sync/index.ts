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

// Configuração Discord
const DISCORD_CONFIG = {
  webhookUrl: Deno.env.get('DISCORD_NIBO_WEBHOOK')!,
  cronSecret: Deno.env.get('CRON_SECRET')!
}

interface NiboCredentials {
  api_token: string
  organization_id: string
  bar_id: string
}

class NiboSyncService {
  private supabase: ReturnType<typeof createClient>
  private credentials: NiboCredentials | null = null

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseServiceKey)
  }

  async loadCredentials(barId: number): Promise<boolean> {
    try {
      // Buscar credenciais do banco de dados na tabela api_credentials
      const { data: credencial, error } = await this.supabase
        .from('api_credentials')
        .select('api_token, empresa_id')
        .eq('sistema', 'nibo')
        .eq('bar_id', barId)
        .eq('ativo', true)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar credenciais NIBO:', error.message)
        return false
      }

      if (!credencial?.api_token) {
        console.error('❌ Credenciais NIBO não encontradas para o bar', barId)
        return false
      }

      this.credentials = {
        api_token: credencial.api_token,
        organization_id: credencial.empresa_id || '',
        bar_id: barId.toString()
      }

      console.log('✅ Credenciais NIBO carregadas do banco de dados')
      return true
    } catch (error: unknown) {
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
        const errorText = await response.text()
        console.error(`❌ HTTP ${response.status}: ${response.statusText}`)
        console.error(`❌ Response body: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      return data
    } catch (error: unknown) {
      console.error(`❌ Erro ao buscar ${endpoint}:`, error instanceof Error ? error.message : 'Erro desconhecido')
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
        $skip: skip,
        $orderby: 'id' // NIBO exige ordenação para usar $skip
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
      
      // Testar primeiro sem paginação - se retornar limite, volta para paginação
      console.log('🔍 Testando busca sem paginação...')
      let stakeholders
      try {
        const result = await this.fetchNiboData('stakeholders')
        stakeholders = result?.items || []
        console.log(`📊 Busca simples retornou: ${stakeholders.length} stakeholders`)
        
        // Se retornou exatamente 500, pode estar limitado - usar paginação
        if (stakeholders.length === 500) {
          console.log('⚠️ Retornou exatamente 500 - pode estar limitado, usando paginação...')
          stakeholders = await this.fetchNiboDataPaginated('stakeholders')
        }
      } catch (error) {
        console.log('❌ Erro na busca simples, usando paginação...')
        stakeholders = await this.fetchNiboDataPaginated('stakeholders')
      }
      
      if (!stakeholders || stakeholders.length === 0) {
        console.log('ℹ️ Nenhum stakeholder encontrado')
        return { success: true, count: 0 }
      }

      console.log(`📊 Processando ${stakeholders.length} stakeholders...`)

      // Buscar stakeholders existentes para evitar duplicatas
      const { data: existingStakeholders } = await this.supabase
        .from('nibo_stakeholders')
        .select('nibo_id')
        .eq('bar_id', this.credentials.bar_id)

      const existingIds = new Set(existingStakeholders?.map((s: { nibo_id: unknown }) => String(s.nibo_id)) || [])
      
      let inseridos = 0
      let atualizados = 0
      let erros = 0

      for (const stakeholder of stakeholders) {
        try {
          const stakeholderData = {
            nibo_id: stakeholder.id,
            bar_id: this.credentials.bar_id,
            nome: stakeholder.name,
            email: stakeholder.email,
            telefone: stakeholder.phone,
            tipo: stakeholder.type,
            ativo: stakeholder.active,
            data_sincronizacao: new Date().toISOString()
          }

          const isNew = !existingIds.has(stakeholder.id)
          
          const { error } = await this.supabase
            .from('nibo_stakeholders')
            .upsert(stakeholderData, {
              onConflict: 'nibo_id'
            })

          if (error) {
            console.error('❌ Erro ao inserir stakeholder:', error)
            erros++
          } else {
            if (isNew) {
              inseridos++
            } else {
              atualizados++
            }
          }
        } catch (error: unknown) {
          console.error('❌ Erro ao processar stakeholder:', error)
          erros++
        }
      }

      console.log(`✅ Stakeholders sincronizados: ${inseridos} novos, ${atualizados} atualizados, ${erros} erros`)
      return { success: true, count: inseridos, updated: atualizados, errors: erros }

    } catch (error: unknown) {
      console.error('❌ Erro na sincronização de stakeholders:', error)
      // Continuar mesmo com erro de stakeholders para não travar outras sincronizações
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', count: 0, updated: 0, errors: 1 }
    }
  }

  async syncCategories() {
    if (!this.credentials) return { success: false, error: 'Credenciais não carregadas' }

    try {
      console.log('🔄 Sincronizando TODAS as categorias...')
      
      // Buscar TODAS as categorias (sem filtro de data)
      console.log(`📅 Buscando TODAS as categorias (sem filtro de data)`)
      
      const url = new URL('https://api.nibo.com.br/empresas/v1/categories')
      // Sem filtro de data - pegar TUDO
      url.searchParams.set('$top', '5000') // Limite máximo para pegar todas
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apitoken': this.credentials.api_token
        }
      })

      if (!response.ok) {
        throw new Error(`API NIBO falhou: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      
      if (!data?.items || data.items.length === 0) {
        console.log('ℹ️ Nenhuma categoria encontrada')
        return { success: true, count: 0, updated: 0, errors: 0 }
      }

      console.log(`📊 Processando ${data.items.length} categorias...`)
      
      let inseridas = 0
      let erros = 0

      // Processar sequencialmente (mais simples)
      for (const category of data.items) {
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
              onConflict: 'nibo_id'
            })

          if (error) {
            console.error('❌ Erro ao inserir categoria:', error)
            erros++
          } else {
            inseridas++
          }
        } catch (error: unknown) {
          console.error('❌ Erro ao processar categoria:', error)
          erros++
        }
      }

      console.log(`✅ Categorias sincronizadas: ${inseridas} processadas, ${erros} erros`)
      return { success: true, count: inseridas, updated: 0, errors: erros }

    } catch (error: unknown) {
      console.error('❌ Erro na sincronização de categorias:', error)
      // Continuar mesmo com erro de categorias para não travar outras sincronizações
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido', count: 0, updated: 0, errors: 1 }
    }
  }

  async syncAgendamentos() {
    if (!this.credentials) return { success: false, error: 'Credenciais não carregadas' }

    try {
      console.log('🔄 Sincronizando agendamentos (Background Job)...')

      // Gerar batch ID único para este job
      const batchId = crypto.randomUUID()
      console.log(`📋 Batch ID: ${batchId}`)

      // Buscar agendamentos dos últimos 30 dias
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const filterDate = thirtyDaysAgo.toISOString().split('T')[0]
      
      console.log(`📅 Buscando agendamentos dos últimos 30 dias (desde ${filterDate})...`)
      
      // Buscar todas as páginas da API NIBO
      const allAgendamentos = []
      let skip = 0
      const top = 500 // Maior para reduzir requests
      let hasMore = true
      let pageCount = 0

      while (hasMore) {
        pageCount++
        const pageParams = {
          $filter: `createDate ge ${filterDate}`,
          $orderby: "createDate desc",
          $top: top,
          $skip: skip
        }

        console.log(`📄 Buscando página ${pageCount} (skip: ${skip}, top: ${top})...`)

        const data = await this.fetchNiboData('schedules', pageParams)
        const items = data?.items || []
        
        if (!items || items.length === 0) {
          console.log(`📄 Página ${pageCount}: Nenhum dado retornado`)
          hasMore = false
          break
        }

        allAgendamentos.push(...items)
        console.log(`📄 Página ${pageCount}: ${items.length} agendamentos`)
        
        skip += top
        
        // Se retornou menos que o top, chegou ao fim
        if (items.length < top) {
          console.log(`📄 Página ${pageCount}: Última página (${items.length} < ${top})`)
          hasMore = false
        }

        // Pequena pausa para não sobrecarregar a API NIBO
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      if (allAgendamentos.length === 0) {
        console.log('ℹ️ Nenhum agendamento encontrado')
        return { success: true, count: 0, message: 'Nenhum agendamento encontrado' }
      }

      console.log(`📊 Total de agendamentos encontrados: ${allAgendamentos.length}`)

      // Criar job de controle
      await this.supabase
        .from('nibo_background_jobs')
        .insert({
          batch_id: batchId,
          bar_id: this.credentials.bar_id,
          job_type: 'agendamentos',
          status: 'pending',
          total_records: allAgendamentos.length
        })

      // Inserir dados brutos na tabela temporária (bulk insert)
      console.log('💾 Inserindo dados na tabela temporária...')
      const tempData = allAgendamentos.map(agendamento => ({
        batch_id: batchId,
        bar_id: this.credentials.bar_id,
        raw_data: agendamento
      }))

      // Inserir em batches para não sobrecarregar
      const insertBatchSize = 100
      for (let i = 0; i < tempData.length; i += insertBatchSize) {
        const batch = tempData.slice(i, i + insertBatchSize)
        await this.supabase
          .from('nibo_temp_agendamentos')
          .insert(batch)
        
        console.log(`💾 Inseridos ${Math.min(i + insertBatchSize, tempData.length)}/${tempData.length} registros temporários`)
      }

      // Iniciar processamento em background (assíncrono)
      console.log('🚀 Iniciando processamento em background...')
      this.supabase.rpc('process_nibo_agendamentos_background', { p_batch_id: batchId })
        .then(() => {
          console.log('✅ Background job iniciado com sucesso')
        })
        .catch((error) => {
          console.error('❌ Erro ao iniciar background job:', error)
        })

      console.log(`✅ Agendamentos enviados para processamento background: ${allAgendamentos.length} registros`)
      return { 
        success: true, 
        count: allAgendamentos.length, 
        message: `${allAgendamentos.length} agendamentos enviados para processamento em background`,
        batch_id: batchId,
        processing_mode: 'background'
      }

    } catch (error: unknown) {
      console.error('❌ Erro na sincronização de agendamentos:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }

  async sendDiscordNotification(title: string, description: string, color: number = 0x00ff00) {
    try {
      // Buscar webhook do banco em vez de env var
      const { data: webhookConfig, error: webhookError } = await this.supabase
        .from('api_credentials')
        .select('configuracoes')
        .eq('sistema', 'nibo')
        .eq('bar_id', this.credentials?.bar_id || '3')
        .eq('ativo', true)
        .single()

      if (webhookError || !webhookConfig?.configuracoes?.webhook_url) {
        console.warn('⚠️ Discord webhook não configurado no banco:', webhookError?.message)
        return
      }

      const webhookUrl = webhookConfig.configuracoes.webhook_url
      console.log('🔗 Webhook Discord encontrado no banco')

      const embed = {
        title: title,
        description: description,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'SGB - Sincronização NIBO'
        }
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      })

      console.log('✅ Notificação Discord enviada')
    } catch (error: unknown) {
      console.error('❌ Erro ao enviar notificação Discord:', error)
    }
  }

  async syncAll() {
    if (!this.credentials) return { success: false, error: 'Credenciais não carregadas' }

    console.log('🚀 Iniciando sincronização completa NIBO...')
    
    // Notificar início
    await this.sendDiscordNotification(
      '🔄 Sincronização NIBO Iniciada',
      `Iniciando sincronização automática para o bar ${this.credentials.bar_id}`,
      0x0099ff
    )
    
    const results = {
      stakeholders: await this.syncStakeholders(),
      categories: await this.syncCategories(),
      agendamentos: await this.syncAgendamentos(),
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

    // Calcular estatísticas
    const totalStakeholders = (results.stakeholders.count || 0) + (results.stakeholders.updated || 0)
    const totalCategories = (results.categories.count || 0) + (results.categories.updated || 0)
    const totalAgendamentos = (results.agendamentos.count || 0) + (results.agendamentos.updated || 0)
    const totalErrors = (results.stakeholders.errors || 0) + (results.categories.errors || 0) + (results.agendamentos.errors || 0)

    // Notificar conclusão
    const color = totalErrors > 0 ? 0xff9900 : 0x00ff00
    const status = totalErrors > 0 ? '⚠️ Concluída com erros' : '✅ Concluída com sucesso'
    
    // Determinar mensagem baseada no modo de processamento
    const agendamentosMsg = results.agendamentos.processing_mode === 'background' 
      ? `**Agendamentos:** ${results.agendamentos.count} enviados para processamento em background 🚀`
      : `**Agendamentos:** ${totalAgendamentos} (${results.agendamentos.count} novos, ${results.agendamentos.updated} atualizados)`
    
    await this.sendDiscordNotification(
      `${status} - Sincronização NIBO`,
      `**Stakeholders:** ${totalStakeholders} (${results.stakeholders.count} novos, ${results.stakeholders.updated} atualizados)\n` +
      `**Categorias:** ${totalCategories} (${results.categories.count} novas, ${results.categories.updated} atualizadas)\n` +
      agendamentosMsg + `\n` +
      `**Erros:** ${totalErrors}\n` +
      `**Bar ID:** ${this.credentials.bar_id}` +
      (results.agendamentos.batch_id ? `\n**Batch ID:** \`${results.agendamentos.batch_id}\`` : ''),
      color
    )

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
    const requestBody = await req.text()
    console.log('📥 Recebido body:', requestBody)
    
    const { barId, cronSecret } = JSON.parse(requestBody || '{}')
    
    // Permitir acesso do pgcron sem verificação rigorosa
    if (cronSecret === 'pgcron_nibo') {
      console.log('✅ Acesso autorizado via pgcron')
    } else if (cronSecret && !['pgcron_nibo', 'manual_test'].includes(cronSecret)) {
      return new Response(
        JSON.stringify({ error: 'CRON_SECRET inválido' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
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
    const credentialsLoaded = await niboSync.loadCredentials(parseInt(barId))
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