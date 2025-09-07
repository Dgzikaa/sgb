/**
 * Script para ressincronizar dados do Nibo para agosto de 2025
 * Executa sincronização direta sem Edge Function
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxdGdzdnVqd2NieW1qbXZramh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwNjYzNzQ4NiwiZXhwIjoyMDIyMjEzNDg2fQ.yMjbxJJ0fNXOgw_-F-sDC_M_T6fgCZRzZcLtY0Jz4cE'

const supabase = createClient(supabaseUrl, supabaseKey)

async function buscarCredenciaisNibo() {
  const { data, error } = await supabase
    .from('api_credentials')
    .select('api_token, empresa_id')
    .eq('sistema', 'nibo')
    .eq('bar_id', 3)
    .eq('ativo', true)
    .single()

  if (error) {
    console.error('❌ Erro ao buscar credenciais:', error)
    return null
  }

  return {
    api_token: data.api_token,
    empresa_id: data.empresa_id
  }
}

async function buscarAgendamentosNibo(credentials, mes, ano) {
  console.log(`📅 Buscando agendamentos do Nibo para ${mes}/${ano}...`)
  
  // Datas do mês
  const startDate = new Date(ano, mes - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(ano, mes, 0).toISOString().split('T')[0]
  
  console.log(`📅 Período: ${startDate} a ${endDate}`)
  
  const allAgendamentos = []
  let skip = 0
  const top = 500
  let hasMore = true
  let pageCount = 0

  while (hasMore) {
    pageCount++
    
    const url = new URL('https://api.nibo.com.br/empresas/v1/schedules')
    url.searchParams.set('apitoken', credentials.api_token)
    url.searchParams.set('$filter', `accrualDate ge ${startDate} and accrualDate le ${endDate}`)
    url.searchParams.set('$orderby', 'accrualDate desc')
    url.searchParams.set('$top', top.toString())
    url.searchParams.set('$skip', skip.toString())

    console.log(`📄 Buscando página ${pageCount} (skip: ${skip})...`)

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'apitoken': credentials.api_token
        }
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ HTTP ${response.status}: ${response.statusText}`)
        console.error(`❌ Response: ${errorText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const items = data?.items || []
      
      if (!items || items.length === 0) {
        console.log(`📄 Página ${pageCount}: Nenhum dado retornado`)
        hasMore = false
        break
      }

      allAgendamentos.push(...items)
      console.log(`📄 Página ${pageCount}: ${items.length} agendamentos`)
      
      skip += top
      
      if (items.length < top) {
        console.log(`📄 Página ${pageCount}: Última página (${items.length} < ${top})`)
        hasMore = false
      }

      // Pausa para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error) {
      console.error(`❌ Erro na página ${pageCount}:`, error)
      throw error
    }
  }

  console.log(`📊 Total encontrado: ${allAgendamentos.length} agendamentos`)
  return allAgendamentos
}

async function buscarCategorias() {
  console.log('📋 Buscando categorias do banco...')
  
  const { data, error } = await supabase
    .from('nibo_categorias')
    .select('nibo_id, nome')
    .eq('bar_id', 3)

  if (error) {
    console.error('❌ Erro ao buscar categorias:', error)
    return new Map()
  }

  const categoriaMap = new Map()
  data.forEach(cat => {
    categoriaMap.set(cat.nibo_id, cat.nome)
  })

  console.log(`📋 ${categoriaMap.size} categorias carregadas`)
  return categoriaMap
}

async function processarAgendamentos(agendamentos, categoriaMap) {
  console.log(`🔄 Processando ${agendamentos.length} agendamentos...`)
  
  const agendamentosProcessados = []
  let processados = 0
  let erros = 0

  for (const agendamento of agendamentos) {
    try {
      const categoriaNome = categoriaMap.get(agendamento.categoryId) || 'Categoria Desconhecida'
      
      const agendamentoData = {
        nibo_id: agendamento.scheduleId,
        bar_id: 3,
        categoria_id: agendamento.categoryId,
        categoria_nome: categoriaNome,
        stakeholder_id: agendamento.stakeholderId,
        valor: parseFloat(agendamento.value || 0),
        descricao: agendamento.description,
        data_competencia: agendamento.accrualDate,
        data_vencimento: agendamento.dueDate,
        data_pagamento: agendamento.paymentDate,
        status: agendamento.status,
        tipo: agendamento.type,
        data_criacao: agendamento.createDate,
        data_atualizacao: agendamento.updateDate,
        data_sincronizacao: new Date().toISOString()
      }

      agendamentosProcessados.push(agendamentoData)
      processados++
      
      if (processados % 100 === 0) {
        console.log(`🔄 Processados: ${processados}/${agendamentos.length}`)
      }
      
    } catch (error) {
      console.error(`❌ Erro ao processar agendamento ${agendamento.scheduleId}:`, error)
      erros++
    }
  }

  console.log(`✅ Processamento concluído: ${processados} processados, ${erros} erros`)
  return agendamentosProcessados
}

async function inserirAgendamentos(agendamentos) {
  console.log(`💾 Inserindo ${agendamentos.length} agendamentos no banco...`)
  
  const batchSize = 100
  let inseridos = 0
  let erros = 0

  for (let i = 0; i < agendamentos.length; i += batchSize) {
    const batch = agendamentos.slice(i, i + batchSize)
    
    try {
      const { error } = await supabase
        .from('nibo_agendamentos')
        .upsert(batch, {
          onConflict: 'nibo_id'
        })

      if (error) {
        console.error(`❌ Erro no batch ${Math.floor(i/batchSize) + 1}:`, error)
        erros += batch.length
      } else {
        inseridos += batch.length
        console.log(`💾 Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} registros inseridos`)
      }
      
    } catch (error) {
      console.error(`❌ Erro no batch ${Math.floor(i/batchSize) + 1}:`, error)
      erros += batch.length
    }
  }

  console.log(`✅ Inserção concluída: ${inseridos} inseridos, ${erros} erros`)
  return { inseridos, erros }
}

async function main() {
  try {
    console.log('🚀 Iniciando ressincronização Nibo - Agosto 2025')
    
    // 1. Buscar credenciais
    const credentials = await buscarCredenciaisNibo()
    if (!credentials) {
      console.error('❌ Credenciais não encontradas')
      return
    }
    console.log('✅ Credenciais carregadas')

    // 2. Buscar categorias
    const categoriaMap = await buscarCategorias()

    // 3. Buscar agendamentos do Nibo
    const agendamentos = await buscarAgendamentosNibo(credentials, 8, 2025)
    
    if (agendamentos.length === 0) {
      console.log('ℹ️ Nenhum agendamento encontrado para agosto/2025')
      return
    }

    // 4. Processar agendamentos
    const agendamentosProcessados = await processarAgendamentos(agendamentos, categoriaMap)

    // 5. Inserir no banco
    const resultado = await inserirAgendamentos(agendamentosProcessados)

    // 6. Registrar log
    await supabase
      .from('nibo_logs_sincronizacao')
      .insert({
        bar_id: 3,
        tipo_sincronizacao: 'ressync_agosto_2025',
        status: 'concluida',
        total_registros: agendamentos.length,
        registros_processados: resultado.inseridos,
        registros_erro: resultado.erros,
        data_inicio: new Date().toISOString()
      })

    console.log('🎉 Ressincronização concluída com sucesso!')
    console.log(`📊 Resumo:`)
    console.log(`   • Total encontrado: ${agendamentos.length}`)
    console.log(`   • Inseridos: ${resultado.inseridos}`)
    console.log(`   • Erros: ${resultado.erros}`)

  } catch (error) {
    console.error('❌ Erro na ressincronização:', error)
    
    // Registrar erro no log
    await supabase
      .from('nibo_logs_sincronizacao')
      .insert({
        bar_id: 3,
        tipo_sincronizacao: 'ressync_agosto_2025',
        status: 'erro',
        mensagem_erro: error.message,
        data_inicio: new Date().toISOString()
      })
  }
}

// Executar
main()
