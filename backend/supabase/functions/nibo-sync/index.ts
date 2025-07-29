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

  loadCredentials(): boolean {
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
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
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
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
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
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }

  async syncAgendamentos() {
    if (!this.credentials) return { success: false, error: 'Credenciais não carregadas' }

    try {
      console.log('🔄 Sincronizando agendamentos...')

      // Buscar agendamentos desde 2024 com paginação completa
      const allAgendamentos = []
      let skip = 0
      const top = 500 // NIBO tem limite de 500 por página
      let hasMore = true
      let pageCount = 0

      console.log('📄 Buscando agendamentos com paginação completa...')

      while (hasMore) {
        pageCount++
        // Buscar apenas últimos 30 dias para otimizar performance
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const filterDate = thirtyDaysAgo.toISOString().split('T')[0] // YYYY-MM-DD
        
        const pageParams = {
          $filter: `createDate ge ${filterDate}`,
          $orderby: "createDate desc",
          $top: top,
          $skip: skip
        }

        console.log(`📄 Buscando página ${pageCount} (skip: ${skip}, top: ${top})...`)

        const data = await this.fetchNiboDataPaginated('schedules', pageParams)
        
        if (!data || data.length === 0) {
          console.log(`📄 Página ${pageCount}: Nenhum dado retornado`)
          hasMore = false
          break
        }

        allAgendamentos.push(...data)
        console.log(`📄 Página ${pageCount}: ${data.length} agendamentos`)
        
        skip += top
        
        // Se retornou menos que o top, chegou ao fim
        if (data.length < top) {
          console.log(`📄 Página ${pageCount}: Última página (${data.length} < ${top})`)
          hasMore = false
        }

        // Pequena pausa para não sobrecarregar a API
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (allAgendamentos.length === 0) {
        console.log('ℹ️ Nenhum agendamento encontrado')
        return { success: true, count: 0 }
      }

      console.log(`📊 Total de agendamentos encontrados: ${allAgendamentos.length}`)

      // Buscar agendamentos existentes para evitar duplicatas
      const { data: existingAgendamentos } = await this.supabase
        .from('nibo_agendamentos')
        .select('nibo_id')
        .eq('bar_id', this.credentials.bar_id)

      const existingIds = new Set(existingAgendamentos?.map((a: { nibo_id: unknown }) => String(a.nibo_id)) || [])

      let inseridos = 0
      let atualizados = 0
      let erros = 0

      for (const agendamento of allAgendamentos) {
        try {
          // Buscar categoria se existir
          let categoriaId = null
          if (agendamento.category?.id) {
            const { data: categoria } = await this.supabase
              .from('nibo_categorias')
              .select('id')
              .eq('nibo_id', agendamento.category.id)
              .single()
            categoriaId = categoria?.id
          }

          // Buscar stakeholder se existir
          let stakeholderId = null
          if (agendamento.stakeholder?.id) {
            const { data: stakeholder } = await this.supabase
              .from('nibo_stakeholders')
              .select('id')
              .eq('nibo_id', agendamento.stakeholder.id)
              .single()
            stakeholderId = stakeholder?.id
          }

          // Buscar conta bancária se existir
          let contaBancariaId = null
          if (agendamento.bankAccount?.id) {
            const { data: contaBancaria } = await this.supabase
              .from('nibo_contas_bancarias')
              .select('id')
              .eq('nibo_id', agendamento.bankAccount.id)
              .single()
            contaBancariaId = contaBancaria?.id
          }

          // Processar centro de custo
          let centroCustoId = null
          let centroCustoNome = null
          let centroCustoConfig = {}

          if (agendamento.costCenters && agendamento.costCenters.length > 0) {
            // Pegar o primeiro centro de custo (assumindo que é o principal)
            const primeiroCentroCusto = agendamento.costCenters[0]
            centroCustoId = primeiroCentroCusto.costCenterId
            centroCustoNome = primeiroCentroCusto.costCenterDescription
            centroCustoConfig = {
              costCenters: agendamento.costCenters,
              costCenterValueType: agendamento.costCenterValueType || 0
            }
          }

          const agendamentoData = {
            nibo_id: agendamento.scheduleId,
            bar_id: this.credentials.bar_id,
            tipo: agendamento.type === 'Credit' ? 'Receivable' : 'Payable',
            titulo: agendamento.description,
            status: agendamento.isPaid ? 'Paid' : (agendamento.isDued ? 'Overdue' : 'Open'),
            valor: agendamento.value,
            valor_pago: agendamento.paidValue || 0,
            data_vencimento: agendamento.dueDate,
            data_pagamento: agendamento.isPaid ? agendamento.dueDate : null,
            descricao: agendamento.description,
            observacoes: agendamento.description,
            categoria_id: agendamento.category?.id || null,
            categoria_nome: agendamento.category?.name || null,
            stakeholder_id: agendamento.stakeholder?.id || null,
            stakeholder_nome: agendamento.stakeholder?.name || null,
            stakeholder_tipo: agendamento.stakeholder?.type || null,
            conta_bancaria_id: agendamento.bankAccount?.id || null,
            conta_bancaria_nome: agendamento.bankAccount?.name || null,
            centro_custo_id: centroCustoId,
            centro_custo_nome: centroCustoNome,
            centro_custo_config: centroCustoConfig,
            numero_documento: null,
            numero_parcela: null,
            total_parcelas: null,
            recorrente: agendamento.hasRecurrence || false,
            frequencia_recorrencia: null,
            anexos: [],
            tags: [],
            recorrencia_config: {},
            deletado: agendamento.isDeleted || false,
            stakeholder_id_interno: stakeholderId,
            conta_bancaria_id_interno: contaBancariaId,
            data_atualizacao: agendamento.updateDate || agendamento.createDate,
            usuario_atualizacao: agendamento.updateUser || agendamento.createUser
          }

          const isNew = !existingIds.has(agendamento.scheduleId)

          const { error } = await this.supabase
            .from('nibo_agendamentos')
            .upsert(agendamentoData, {
              onConflict: 'nibo_id'
            })

          if (error) {
            console.error('❌ Erro ao inserir agendamento:', error)
            erros++
          } else {
            if (isNew) {
              inseridos++
            } else {
              atualizados++
            }

            // Log para registros com centro de custo
            if (centroCustoId) {
              console.log(`  ✅ Agendamento com centro de custo: ${agendamento.description} -> ${centroCustoNome}`)
            }
          }
        } catch (error: unknown) {
          console.error('❌ Erro ao processar agendamento:', error)
          erros++
        }
      }

      console.log(`✅ Agendamentos sincronizados: ${inseridos} novos, ${atualizados} atualizados, ${erros} erros`)
      return { success: true, count: inseridos, updated: atualizados, errors: erros }

    } catch (error: unknown) {
      console.error('❌ Erro na sincronização de agendamentos:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' }
    }
  }

  async sendDiscordNotification(title: string, description: string, color: number = 0x00ff00) {
    if (!DISCORD_CONFIG.webhookUrl) {
      console.warn('⚠️ Discord webhook não configurado')
      return
    }

    try {
      const embed = {
        title: title,
        description: description,
        color: color,
        timestamp: new Date().toISOString(),
        footer: {
          text: 'SGB - Sincronização NIBO'
        }
      }

      await fetch(DISCORD_CONFIG.webhookUrl, {
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
    
    await this.sendDiscordNotification(
      `${status} - Sincronização NIBO`,
      `**Stakeholders:** ${totalStakeholders} (${results.stakeholders.count} novos, ${results.stakeholders.updated} atualizados)\n` +
      `**Categorias:** ${totalCategories} (${results.categories.count} novas, ${results.categories.updated} atualizadas)\n` +
      `**Agendamentos:** ${totalAgendamentos} (${results.agendamentos.count} novos, ${results.agendamentos.updated} atualizados)\n` +
      `**Erros:** ${totalErrors}\n` +
      `**Bar ID:** ${this.credentials.bar_id}`,
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
    } else if (cronSecret && cronSecret !== DISCORD_CONFIG.cronSecret) {
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
    const credentialsLoaded = niboSync.loadCredentials()
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