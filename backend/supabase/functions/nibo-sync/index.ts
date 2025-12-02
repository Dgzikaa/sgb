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
const _DISCORD_CONFIG = {
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
        api_token: String(credencial.api_token),
        organization_id: String(credencial.empresa_id || ''),
        bar_id: barId.toString()
      }

      console.log('✅ Credenciais NIBO carregadas do banco de dados')
      return true
    } catch (error: unknown) {
      console.error('❌ Erro ao carregar credenciais:', error)
      return false
    }
  }

  async fetchNiboData(endpoint: string, params: Record<string, string | number> = {}) {
    if (!this.credentials) {
      throw new Error('Credenciais NIBO não carregadas')
    }

    const url = new URL(`${NIBO_CONFIG.baseUrl}/${endpoint}`)
    url.searchParams.set('apitoken', this.credentials.api_token)
    
    // Adicionar parâmetros OData
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
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

  async fetchNiboDataPaginated(endpoint: string, params: Record<string, string | number> = {}) {
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
      } catch (_error) {
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

  async syncAgendamentos(syncMode: string = 'continuous') {
    if (!this.credentials) return { success: false, error: 'Credenciais não carregadas' }

    try {
      console.log(`🔄 Sincronizando agendamentos (${syncMode})...`)

      // Gerar batch ID único para este job
      const batchId = crypto.randomUUID()
      console.log(`📋 Batch ID: ${batchId}`)

      // Calcular período baseado no modo de sincronização
      let filterDateStart: string
      let filterDateEnd: string
      let periodDescription: string

      if (syncMode === 'daily_complete') {
        // Sincronização diária completa: últimos 3 meses
        const threeMonthsAgo = new Date()
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
        filterDateStart = threeMonthsAgo.toISOString().split('T')[0]
        
        // ✅ CORREÇÃO: Adicionar data final para não pegar dados futuros
        const oneMonthAhead = new Date()
        oneMonthAhead.setMonth(oneMonthAhead.getMonth() + 1)
        filterDateEnd = oneMonthAhead.toISOString().split('T')[0]
        
        periodDescription = 'últimos 3 meses + 1 mês futuro'
        console.log('📅 MODO DIÁRIO COMPLETO: Sincronizando últimos 3 meses + 1 mês futuro')
      } else {
        // Sincronização contínua: últimos 7 dias
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        filterDateStart = sevenDaysAgo.toISOString().split('T')[0]
        
        // ✅ CORREÇÃO: Adicionar data final
        const sevenDaysAhead = new Date()
        sevenDaysAhead.setDate(sevenDaysAhead.getDate() + 7)
        filterDateEnd = sevenDaysAhead.toISOString().split('T')[0]
        
        periodDescription = 'últimos 7 dias + próximos 7 dias'
        console.log('📅 MODO CONTÍNUO: Sincronizando últimos 7 dias + próximos 7 dias')
      }
      
      console.log(`📅 Buscando agendamentos com data de competência entre ${filterDateStart} e ${filterDateEnd}...`)
      
      // 🔥 PAGINAÇÃO OTIMIZADA - Processar em batches pequenos
      const allAgendamentos = []
      let skip = 0
      const top = 200
      let hasMore = true
      let pageCount = 0
      const maxPagesPerExecution = 5 // 🔥 PROCESSAR APENAS 5 PÁGINAS POR VEZ (1000 registros)
      const startTime = Date.now()
      const maxExecutionTime = 45000 // 45 segundos de limite

      console.log(`⏱️ Configuração: ${maxPagesPerExecution} páginas por execução, timeout ${maxExecutionTime}ms`)

      while (hasMore && pageCount < maxPagesPerExecution) {
        // Verificar tempo de execução
        const elapsedTime = Date.now() - startTime
        if (elapsedTime > maxExecutionTime) {
          console.log(`⏱️ Timeout atingido após ${elapsedTime}ms, parando na página ${pageCount}`)
          break
        }

        pageCount++
        const pageParams = {
          $filter: `accrualDate ge ${filterDateStart} and accrualDate le ${filterDateEnd}`,
          $orderby: "accrualDate desc",
          $top: top,
          $skip: skip
        }

        console.log(`📄 Buscando página ${pageCount}/${maxPagesPerExecution} (skip: ${skip}, top: ${top})...`)

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

        // Pausa pequena entre páginas
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      if (hasMore) {
        console.log(`📊 Processamento parcial: ${pageCount} páginas (${allAgendamentos.length} registros). Mais dados disponíveis.`)
      }

      if (allAgendamentos.length === 0) {
        console.log('ℹ️ Nenhum agendamento encontrado')
        return { success: true, count: 0, message: 'Nenhum agendamento encontrado' }
      }

      console.log(`📊 Total de agendamentos encontrados na API: ${allAgendamentos.length}`)

      // 🧠 FILTRO INTELIGENTE - Verificar quais realmente precisam processamento
      console.log('🔍 Verificando quais agendamentos precisam ser processados...')
      
      const niboIds = allAgendamentos.map(a => a.scheduleId).filter(Boolean)
      
      if (niboIds.length === 0) {
        console.log('⚠️ Nenhum scheduleId válido encontrado')
        return { success: true, count: 0, message: 'Nenhum ID válido encontrado' }
      }

      // Buscar registros existentes no banco
      const { data: existingRecords, error: existingError } = await this.supabase
        .from('nibo_agendamentos')
        .select('nibo_id, data_atualizacao')
        .eq('bar_id', this.credentials.bar_id)
        .in('nibo_id', niboIds)

      if (existingError) {
        console.error('❌ Erro ao buscar registros existentes:', existingError)
      }

      const existingMap = new Map(
        (existingRecords || []).map(record => [record.nibo_id, new Date(String(record.data_atualizacao))])
      )

      // Filtrar apenas novos ou realmente alterados
      const agendamentosParaProcessar = allAgendamentos.filter(agendamento => {
        const niboId = agendamento.scheduleId
        if (!niboId) return false

        const existingUpdateTime = existingMap.get(niboId)
        
        // Se não existe, é novo
        if (!existingUpdateTime) {
          return true
        }

        // Se existe, verificar se foi alterado
        const niboUpdateTime = new Date(agendamento.updateDate)
        return niboUpdateTime > existingUpdateTime
      })

      const novos = agendamentosParaProcessar.filter(a => !existingMap.has(a.scheduleId)).length
      const alterados = agendamentosParaProcessar.length - novos
      const ignorados = allAgendamentos.length - agendamentosParaProcessar.length

      console.log(`📊 Análise de processamento:`)
      console.log(`  • Novos: ${novos}`)
      console.log(`  • Alterados: ${alterados}`)
      console.log(`  • Ignorados (iguais): ${ignorados}`)
      console.log(`  • Total para processar: ${agendamentosParaProcessar.length}`)

      if (agendamentosParaProcessar.length === 0) {
        console.log('✅ Nenhum agendamento novo ou alterado - nada para processar')
        return { 
          success: true, 
          count: 0, 
          message: `Verificados ${allAgendamentos.length} agendamentos - todos iguais, nada para processar`,
          stats: { total: allAgendamentos.length, novos: 0, alterados: 0, ignorados: allAgendamentos.length }
        }
      }

      // Criar job de controle
      await this.supabase
        .from('nibo_background_jobs')
        .insert({
          batch_id: batchId,
          bar_id: this.credentials.bar_id,
          job_type: 'agendamentos',
          status: 'pending',
          total_records: agendamentosParaProcessar.length
        })

      // Inserir dados brutos na tabela temporária (bulk insert)
      console.log('💾 Inserindo dados na tabela temporária...')
      const tempData = agendamentosParaProcessar.map(agendamento => ({
        batch_id: batchId,
        bar_id: this.credentials!.bar_id,
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

      // Processar em batches otimizados para evitar timeout
      console.log('🚀 Processamento: iniciando em batches otimizados')
      try {
        let processedRecords = 0
        
        // Processar em batches de 100 registros por vez
        const processBatchSize = 100
        let totalBatches = Math.ceil(agendamentosParaProcessar.length / processBatchSize)
        
        console.log(`⚙️ Total: ${agendamentosParaProcessar.length} registros em ${totalBatches} batches de ${processBatchSize}`)
        
        // Processar todos em batches
        for (let i = 0; i < agendamentosParaProcessar.length; i += processBatchSize) {
          // Verificar tempo de execução
          const elapsedTime = Date.now() - startTime
          if (elapsedTime > maxExecutionTime) {
            console.log(`⏱️ Timeout durante processamento após ${elapsedTime}ms, processados ${processedRecords} registros`)
            break
          }

          const batch = agendamentosParaProcessar.slice(i, i + processBatchSize)
          const batchNumber = Math.floor(i / processBatchSize) + 1
          
          // Preparar batch para upsert em massa
          const processedBatch = batch.map(agendamento => ({
            nibo_id: String(agendamento.scheduleId || agendamento.id || ''),
            bar_id: this.credentials!.bar_id,
            tipo: String(agendamento.type || 'receita'),
            status: String(agendamento.status || 'pendente'),
            valor: parseFloat(agendamento.value || 0),
            valor_pago: parseFloat(agendamento.paidValue || 0),
            data_vencimento: agendamento.dueDate ? new Date(agendamento.dueDate).toISOString().split('T')[0] : null,
            data_pagamento: agendamento.paymentDate ? new Date(agendamento.paymentDate).toISOString().split('T')[0] : null,
            data_competencia: agendamento.accrualDate ? new Date(agendamento.accrualDate).toISOString().split('T')[0] : null,
            descricao: String(agendamento.description || ''),
            observacoes: String(agendamento.notes || ''),
            categoria_id: String(agendamento.category?.id || ''),
            categoria_nome: String(agendamento.category?.name || ''),
            stakeholder_id: String(agendamento.stakeholder?.id || ''),
            stakeholder_nome: String(agendamento.stakeholder?.name || ''),
            stakeholder_tipo: String(agendamento.stakeholder?.type || ''),
            conta_bancaria_id: String(agendamento.bankAccount?.id || ''),
            conta_bancaria_nome: String(agendamento.bankAccount?.name || ''),
            centro_custo_id: String(agendamento.costCenter?.id || ''),
            centro_custo_nome: String(agendamento.costCenter?.name || ''),
            numero_documento: String(agendamento.documentNumber || ''),
            numero_parcela: parseInt(agendamento.installmentNumber) || null,
            total_parcelas: parseInt(agendamento.totalInstallments) || null,
            recorrente: Boolean(agendamento.recurring),
            frequencia_recorrencia: String(agendamento.recurrenceFrequency || ''),
            data_atualizacao: agendamento.updateDate ? new Date(agendamento.updateDate).toISOString() : null,
            usuario_atualizacao: String(agendamento.updateUser || ''),
            titulo: String(agendamento.title || ''),
            anexos: agendamento.attachments || null,
            tags: agendamento.tags || null,
            recorrencia_config: agendamento.recurrenceConfig || null,
            deletado: Boolean(agendamento.deleted),
            criado_em: new Date().toISOString(),
            atualizado_em: new Date().toISOString()
          }))

          // Upsert em massa para melhor performance
          const { error: upsertError } = await this.supabase
            .from('nibo_agendamentos')
            .upsert(processedBatch, {
              onConflict: 'nibo_id',
              ignoreDuplicates: false
            })

          if (!upsertError) {
            processedRecords += processedBatch.length
            console.log(`✅ Batch ${batchNumber}/${totalBatches}: ${processedBatch.length} registros (${processedRecords}/${agendamentosParaProcessar.length} total)`)
          } else {
            console.error(`❌ Erro no batch ${batchNumber}:`, upsertError.message)
          }
          
          // Pequena pausa entre batches
          await new Promise(resolve => setTimeout(resolve, 50))
        }
        
        // Atualizar status do job
        await this.supabase
          .from('nibo_background_jobs')
          .update({
            status: 'completed',
            processed_records: processedRecords,
            completed_at: new Date().toISOString()
          })
          .eq('batch_id', batchId)
        
        console.log(`✅ Processamento concluído: ${processedRecords} registros processados de ${agendamentosParaProcessar.length} total`)
        
        
      } catch (error: unknown) {
        console.error('❌ Erro no processamento otimizado:', error)
        
        // Marcar job como erro
        await this.supabase
          .from('nibo_background_jobs')
          .update({
            status: 'error',
            error_message: error instanceof Error ? error.message : String(error),
            completed_at: new Date().toISOString()
          })
          .eq('batch_id', batchId)
      }

      console.log(`✅ Agendamentos enviados para processamento background: ${agendamentosParaProcessar.length} registros`)
      return { 
        success: true, 
        count: agendamentosParaProcessar.length, 
        message: `${agendamentosParaProcessar.length} agendamentos enviados para processamento em background (${novos} novos, ${alterados} alterados)`,
        batch_id: batchId,
        processing_mode: 'background',
        stats: { 
          total_found: allAgendamentos.length, 
          novos, 
          alterados, 
          ignorados, 
          processed: agendamentosParaProcessar.length 
        }
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

      if (webhookError || !webhookConfig?.configuracoes || typeof webhookConfig.configuracoes !== 'object' || !('webhook_url' in webhookConfig.configuracoes)) {
        console.warn('⚠️ Discord webhook não configurado no banco:', webhookError?.message)
        return
      }

      const webhookUrl = (webhookConfig.configuracoes as { webhook_url: string }).webhook_url
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

  async syncAll(syncMode: string = 'continuous') {
    if (!this.credentials) return { success: false, error: 'Credenciais não carregadas' }

    const modeDescription = syncMode === 'daily_complete' ? 'DIÁRIA COMPLETA (3 meses)' : 'CONTÍNUA (7 dias)'
    console.log(`🚀 Iniciando sincronização ${modeDescription} NIBO...`)
    
    // Notificar início
    await this.sendDiscordNotification(
      `🔄 Sincronização NIBO ${modeDescription} Iniciada`,
      `Iniciando sincronização ${modeDescription.toLowerCase()} para o bar ${this.credentials.bar_id}`,
      0x0099ff
    )
    
    const results = {
      stakeholders: await this.syncStakeholders(),
      categories: await this.syncCategories(),
      agendamentos: await this.syncAgendamentos(syncMode),
      timestamp: new Date().toISOString(),
      sync_mode: syncMode
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
    const totalAgendamentos = (results.agendamentos.count || 0)
    const totalErrors = (results.stakeholders.errors || 0) + (results.categories.errors || 0)

    // Notificar conclusão
    const color = totalErrors > 0 ? 0xff9900 : 0x00ff00
    const status = totalErrors > 0 ? '⚠️ Concluída com erros' : '✅ Concluída com sucesso'
    
    // Determinar mensagem baseada no modo de processamento  
    const agendamentosMsg = results.agendamentos.processing_mode === 'background' 
      ? `**Agendamentos:** ${results.agendamentos.count} enviados para processamento em background 🚀`
      : `**Agendamentos:** ${totalAgendamentos} processados`
    
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
    
    const { barId, cronSecret, sync_mode } = JSON.parse(requestBody || '{}')
    
    // Verificar autenticação - aceitar SERVICE_ROLE_KEY ou cronSecret
    const authHeader = req.headers.get('authorization')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (authHeader && authHeader.includes(serviceRoleKey || '')) {
      console.log('✅ Acesso autorizado via SERVICE_ROLE_KEY')
    } else if (cronSecret === 'pgcron_nibo' || cronSecret === 'manual_test') {
      console.log('✅ Acesso autorizado via cronSecret')
    } else {
      return new Response(
        JSON.stringify({ error: 'CRON_SECRET inválido' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    const syncMode = sync_mode || 'continuous'
    console.log(`🔧 Modo de sincronização: ${syncMode}`)
    
    if (!barId) {
      return new Response(
        JSON.stringify({ error: 'Bar ID é obrigatório' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`🔄 Iniciando sincronização NIBO para bar ${barId} (modo: ${syncMode})...`)

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
    const result = await niboSync.syncAll(syncMode)

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