#!/usr/bin/env -S deno run --allow-net --allow-env

/**
 * NIBO BACKLOG COMPLETO - Nova Arquitetura Robusta
 * 
 * Este script faz o backlog completo dos dados NIBO usando a nova arquitetura:
 * 1. Collector -> 2. Orchestrator -> 3. Processor
 * 
 * INTELIGENTE: Detecta automaticamente quando não há mais dados disponíveis
 * 
 * Uso:
 * deno run --allow-net --allow-env nibo-backlog-complete.js
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configurações
const SUPABASE_URL = 'https://uqtgsvujwcbymjmvkjhy.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNjYzNzQ4NiwiZXhwIjoyMDIyMjEzNDg2fQ.yMjbxJJ0fNXOgw_-F-sDC_M_T6fgCZRzZcLtY0Jz4cE'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzMTExNjYsImV4cCI6MjA2Njg4NzE2Nn0.59x53jDOpNe9yVevnP-TcXr6Dkj0QjU8elJb636xV6M'
const BAR_ID = 3

// Função para gerar períodos dinamicamente desde setembro 2024
function generateBacklogPeriods() {
  const periods = []
  const startDate = new Date('2024-09-01') // Início dos dados
  const currentDate = new Date()
  
  // Adicionar 6 meses no futuro para capturar dados futuros
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 6, 1)
  
  let currentPeriod = new Date(startDate)
  
  while (currentPeriod <= endDate) {
    const year = currentPeriod.getFullYear()
    const month = currentPeriod.getMonth()
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1)
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0)
    
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    
    periods.push({
      start: firstDay.toISOString().split('T')[0],
      end: lastDay.toISOString().split('T')[0],
      name: `${monthNames[month]} ${year}`
    })
    
    // Próximo mês
    currentPeriod = new Date(year, month + 1, 1)
  }
  
  return periods
}

// Gerar períodos dinamicamente
const BACKLOG_PERIODS = generateBacklogPeriods()

class NiboBacklogManager {
  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    this.baseUrl = `${SUPABASE_URL}/functions/v1`
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}` // Usar ANON key para Edge Functions
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async executeBacklog() {
    console.log('🚀 INICIANDO BACKLOG COMPLETO NIBO - NOVA ARQUITETURA')
    console.log('=' .repeat(80))
    console.log(`📊 Períodos disponíveis: ${BACKLOG_PERIODS.length} (Set/2024 até ${BACKLOG_PERIODS[BACKLOG_PERIODS.length-1]?.name})`)
    console.log(`🏪 Bar ID: ${BAR_ID}`)
    console.log(`🔧 Arquitetura: Collector -> Orchestrator -> Processor`)
    console.log(`🛑 Auto-stop: Após 3 períodos consecutivos sem dados`)
    console.log('=' .repeat(80))

    const startTime = Date.now()
    let totalSuccess = 0
    let totalErrors = 0
    let totalRecords = 0
    let consecutiveEmptyPeriods = 0
    let lastPeriodWithData = null
    const maxConsecutiveEmpty = 3

    // Processar cada período
    for (let i = 0; i < BACKLOG_PERIODS.length; i++) {
      const period = BACKLOG_PERIODS[i]
      
      try {
        console.log(`\n📅 [${i+1}/${BACKLOG_PERIODS.length}] Processando ${period.name}...`)
        console.log(`   📊 Período: ${period.start} a ${period.end}`)
        
        // Chamar orchestrator para sync contínuo (que processará o período)
        const result = await this.callOrchestrator({
          sync_type: 'continuous',
          bar_id: BAR_ID,
          data_types: ['agendamentos']
        }, period.start, period.end)
        
        if (result.success) {
          const recordsProcessed = result.summary?.total_records_processed || 0
          
          if (recordsProcessed > 0) {
            totalSuccess++
            totalRecords += recordsProcessed
            consecutiveEmptyPeriods = 0 // Reset contador
            lastPeriodWithData = period.name
            
            console.log(`   ✅ ${period.name}: ${recordsProcessed} registros processados`)
            console.log(`   ⏱️ Duração: ${result.summary?.total_duration || 0}s`)
          } else {
            consecutiveEmptyPeriods++
            console.log(`   ⚪ ${period.name}: Sem dados disponíveis (${consecutiveEmptyPeriods}/${maxConsecutiveEmpty})`)
            
            // Verificar se devemos parar
            if (consecutiveEmptyPeriods >= maxConsecutiveEmpty) {
              console.log(`\n🛑 PARANDO BACKLOG: ${maxConsecutiveEmpty} períodos consecutivos sem dados`)
              console.log(`📊 Último período com dados: ${lastPeriodWithData}`)
              break
            }
          }
        } else {
          totalErrors++
          console.error(`   ❌ ${period.name}: ${result.error || 'Erro desconhecido'}`)
        }
        
        // Pausa entre períodos para não sobrecarregar
        if (i < BACKLOG_PERIODS.length - 1) {
          console.log(`   ⏳ Aguardando 5s antes do próximo período...`)
          await this.sleep(5000) // Reduzido de 30s para 5s
        }
        
      } catch (error) {
        totalErrors++
        console.error(`   ❌ Erro ao processar ${period.name}:`, error.message)
      }
    }

    // Resumo final
    const endTime = Date.now()
    const totalDuration = (endTime - startTime) / 1000

    console.log('\n' + '=' .repeat(80))
    console.log('🎉 BACKLOG COMPLETO CONCLUÍDO!')
    console.log('=' .repeat(80))
    console.log(`📊 Períodos com dados: ${totalSuccess}`)
    console.log(`📈 Total de registros: ${totalRecords.toLocaleString('pt-BR')}`)
    console.log(`❌ Erros: ${totalErrors}`)
    console.log(`📅 Último período com dados: ${lastPeriodWithData}`)
    console.log(`⏱️ Duração total: ${Math.round(totalDuration)}s (${Math.round(totalDuration/60)}min)`)
    console.log(`🏁 Concluído em: ${new Date().toLocaleString('pt-BR')}`)
    console.log('=' .repeat(80))

    // Enviar notificação Discord se configurado
    await this.sendDiscordNotification(totalSuccess, totalErrors, totalRecords, totalDuration, lastPeriodWithData)

    return {
      success: totalErrors === 0,
      periods_processed: totalSuccess,
      total_records: totalRecords,
      errors: totalErrors,
      duration_seconds: totalDuration,
      last_period_with_data: lastPeriodWithData
    }
  }

  async callOrchestrator(request, startDate, endDate) {
    // Modificar o request para incluir datas específicas se necessário
    const modifiedRequest = {
      ...request,
      // Adicionar período específico se o orchestrator suportar
      custom_period: {
        start_date: startDate,
        end_date: endDate
      }
    }

    console.log(`🔄 Chamando orchestrator para ${startDate} a ${endDate}...`)
    
    const response = await fetch(`${this.baseUrl}/nibo_orchestrator`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(modifiedRequest)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    return await response.json()
  }

  async sendDiscordNotification(successCount, errorCount, totalRecords, duration, lastPeriod) {
    try {
      const message = {
        embeds: [{
          title: "🎉 NIBO Backlog Completo - Concluído",
          color: errorCount === 0 ? 0x00ff00 : 0xff9900,
          fields: [
            { name: "📊 Períodos Processados", value: `${successCount}`, inline: true },
            { name: "📈 Total de Registros", value: `${totalRecords.toLocaleString('pt-BR')}`, inline: true },
            { name: "❌ Erros", value: `${errorCount}`, inline: true },
            { name: "📅 Último Período", value: lastPeriod || 'N/A', inline: true },
            { name: "⏱️ Duração", value: `${Math.round(duration/60)}min`, inline: true },
            { name: "🏁 Concluído", value: new Date().toLocaleString('pt-BR'), inline: true }
          ],
          footer: { text: "SGB - Sistema de Gestão de Bares | Nova Arquitetura NIBO" }
        }]
      }

      await fetch(`${this.baseUrl}/discord-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` // Discord precisa de SERVICE_ROLE
        },
        body: JSON.stringify(message)
      })
    } catch (error) {
      console.log('⚠️ Erro ao enviar notificação Discord:', error.message)
    }
  }
}

// Executar backlog
if (import.meta.main) {
  const manager = new NiboBacklogManager()
  
  try {
    const result = await manager.executeBacklog()
    
    if (result.success) {
      console.log('\n✅ BACKLOG CONCLUÍDO COM SUCESSO!')
      Deno.exit(0)
    } else {
      console.log('\n⚠️ BACKLOG CONCLUÍDO COM ALGUNS ERROS')
      Deno.exit(1)
    }
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO NO BACKLOG:', error.message)
    Deno.exit(1)
  }
}