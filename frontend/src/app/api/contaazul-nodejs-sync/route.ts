import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserAuth } from '@/lib/auth-helper'
import crypto from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Função para salvar status da sincronização
async function salvarStatusSync(status: any) {
  try {
    const statusFile = require('path').join(process.cwd(), 'temp', 'contaazul_nodejs_status.json')
    await require('fs').promises.writeFile(statusFile, JSON.stringify(status, null, 2), 'utf-8')
  } catch (error) {
    console.warn('⚠️ Erro ao salvar status:', error)
  }
}

// Função para fazer login no ContaAzul via API
async function fazerLoginContaAzul(email: string, senha: string) {
  console.log('🔐 Fazendo login no ContaAzul via API...')
  
  // Primeiro, tentar obter o token de acesso
  const loginResponse = await fetch('https://api.contaazul.com/auth/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username: email,
      password: senha,
      client_id: process.env.CONTAAZUL_CLIENT_ID || '',
      client_secret: process.env.CONTAAZUL_CLIENT_SECRET || ''
    }).toString()
  })
  
  if (!loginResponse.ok) {
    throw new Error(`Login failed: ${loginResponse.status}`)
  }
  
  const tokenData = await loginResponse.json()
  console.log('✅ Login ContaAzul realizado com sucesso')
  
  return tokenData.access_token
}

// Função para buscar dados financeiros via API
async function buscarDadosFinanceiros(accessToken: string, dataInicio: string, dataFim: string) {
  console.log(`📊 Buscando dados financeiros de ${dataInicio} até ${dataFim}...`)
  
  const endpoints = [
    '/v1/financial/accounts',
    '/v1/financial/entries',
    '/v1/financial/categories',
    '/v1/contacts/customers',
    '/v1/contacts/suppliers'
  ]
  
  const dadosColetados = []
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Coletando dados de ${endpoint}...`)
      
      const response = await fetch(`https://api.contaazul.com${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.warn(`⚠️ Erro ao buscar ${endpoint}: ${response.status}`)
        continue
      }
      
      const dados = await response.json()
      dadosColetados.push({
        endpoint,
        dados: dados.data || dados,
        total: dados.total || (Array.isArray(dados.data) ? dados.data.length : 0)
      })
      
      console.log(`✅ ${endpoint}: ${dados.total || 0} registros coletados`)
      
      // Pausa entre requests
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      console.error(`❌ Erro ao buscar ${endpoint}:`, error)
    }
  }
  
  return dadosColetados
}

// Função para processar e salvar dados no Supabase
async function processarESalvarDados(dadosColetados: any[], barId: number) {
  console.log('💾 Processando e salvando dados no Supabase...')
  
  let totalInseridos = 0
  const agora = new Date().toISOString()
  
  for (const colecao of dadosColetados) {
    const { endpoint, dados } = colecao
    
    if (!Array.isArray(dados) || dados.length === 0) {
      console.log(`⚠️ Sem dados para processar em ${endpoint}`)
      continue
    }
    
    console.log(`📋 Processando ${dados.length} registros de ${endpoint}...`)
    
    // Mapear dados para estrutura da tabela contaazul
    const registrosProcessados = dados.map((registro: any, index: number) => {
      // Adaptar dados baseado no endpoint
      let registroMapeado = {
        id: `nodejs_${endpoint.replace(/\//g, '_')}_${barId}_${Date.now()}_${index}`,
        bar_id: barId,
        descricao: registro.description || registro.name || 'Sem descrição',
        valor: 0,
        categoria: null,
        centro_custo: null,
        data_competencia: new Date().toISOString().split('T')[0],
        data_vencimento: null,
        status: 'sincronizado',
        tipo: 'receita',
        cliente_fornecedor: null,
        documento: null,
        forma_pagamento: null,
        observacoes: null,
        dados_originais: registro,
        sincronizado_em: agora
      }
      
      // Processamento específico por endpoint
      switch (endpoint) {
        case '/v1/financial/entries':
          registroMapeado.valor = parseFloat(registro.value || 0)
          registroMapeado.tipo = registro.type === 'income' ? 'receita' : 'despesa'
          registroMapeado.data_competencia = registro.date || registroMapeado.data_competencia
          registroMapeado.data_vencimento = registro.due_date || null
          registroMapeado.categoria = registro.category?.name || null
          registroMapeado.documento = registro.document_number || null
          break
          
        case '/v1/contacts/customers':
        case '/v1/contacts/suppliers':
          registroMapeado.cliente_fornecedor = registro.name || null
          registroMapeado.descricao = `Contato: ${registro.name || 'Sem nome'}`
          registroMapeado.observacoes = registro.notes || null
          break
          
        case '/v1/financial/categories':
          registroMapeado.categoria = registro.name || null
          registroMapeado.descricao = `Categoria: ${registro.name || 'Sem nome'}`
          break
      }
      
      return registroMapeado
    })
    
    // Inserir em lotes
    const LOTE_SIZE = 50
    for (let i = 0; i < registrosProcessados.length; i += LOTE_SIZE) {
      const lote = registrosProcessados.slice(i, i + LOTE_SIZE)
      
      try {
        const { error } = await supabase
          .from('contaazul')
          .insert(lote)
        
        if (error) {
          console.error(`❌ Erro ao inserir lote de ${endpoint}:`, error)
          continue
        }
        
        totalInseridos += lote.length
        console.log(`✅ Inserido lote de ${lote.length} registros de ${endpoint}`)
        
      } catch (error) {
        console.error(`❌ Erro ao inserir lote de ${endpoint}:`, error)
      }
    }
  }
  
  console.log(`🎉 Total inserido: ${totalInseridos} registros`)
  return totalInseridos
}

// Rota principal
export async function POST(request: NextRequest) {
  try {
    const user = await getUserAuth(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Usuário não autenticado' }, { status: 401 })
    }

    console.log(`🚀 [NodeJS] Iniciando sincronização ContaAzul Node.js para bar_id: ${user.bar_id}`)

    // Salvar status inicial
    await salvarStatusSync({
      executando: true,
      ultima_execucao: new Date().toISOString(),
      status: 'executando',
      mensagem: 'Iniciando sincronização ContaAzul Node.js...'
    })

    // 1. Buscar credenciais
    console.log('🔍 [NodeJS] Buscando credenciais do ContaAzul...')
    const { data: credentialsData, error: credentialsError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'contaazul')
      .single()

    if (credentialsError || !credentialsData) {
      const errorMsg = 'Credenciais do ContaAzul não encontradas'
      console.error('❌ [NodeJS]', errorMsg)
      
      await salvarStatusSync({
        executando: false,
        ultima_execucao: new Date().toISOString(),
        status: 'erro',
        mensagem: errorMsg
      })
      
      return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
    }

    const { username: email, password: senha } = credentialsData
    console.log('✅ [NodeJS] Credenciais encontradas')

    // 2. Limpar dados antigos
    console.log('🧹 [NodeJS] Limpando dados antigos...')
    await salvarStatusSync({
      executando: true,
      ultima_execucao: new Date().toISOString(),
      status: 'executando',
      mensagem: 'Limpando dados antigos...'
    })

    const { error: deleteError } = await supabase
      .from('contaazul')
      .delete()
      .eq('bar_id', user.bar_id)

    if (deleteError) {
      console.error('❌ [NodeJS] Erro ao limpar dados:', deleteError)
    } else {
      console.log('✅ [NodeJS] Dados antigos limpos')
    }

    // 3. Tentar login via API
    await salvarStatusSync({
      executando: true,
      ultima_execucao: new Date().toISOString(),
      status: 'executando',
      mensagem: 'Fazendo login na API do ContaAzul...'
    })

    let accessToken
    try {
      accessToken = await fazerLoginContaAzul(email, senha)
    } catch (error: any) {
      console.error('❌ [NodeJS] Erro no login API:', error)
      
      await salvarStatusSync({
        executando: false,
        ultima_execucao: new Date().toISOString(),
        status: 'erro',
        mensagem: `Erro no login API: ${error.message}`
      })
      
      return NextResponse.json({ 
        success: false, 
        error: `Erro no login API: ${error.message}` 
      }, { status: 500 })
    }

    // 4. Buscar dados via API
    await salvarStatusSync({
      executando: true,
      ultima_execucao: new Date().toISOString(),
      status: 'executando',
      mensagem: 'Buscando dados via API...'
    })

    const dataInicio = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 dias atrás
    const dataFim = new Date().toISOString().split('T')[0] // Hoje

    const dadosColetados = await buscarDadosFinanceiros(accessToken, dataInicio, dataFim)

    // 5. Processar e salvar dados
    await salvarStatusSync({
      executando: true,
      ultima_execucao: new Date().toISOString(),
      status: 'executando',
      mensagem: 'Processando e salvando dados...'
    })

    const totalInseridos = await processarESalvarDados(dadosColetados, user.bar_id)

    // 6. Salvar status final
    await salvarStatusSync({
      executando: false,
      ultima_execucao: new Date().toISOString(),
      status: 'sucesso',
      registros_processados: totalInseridos,
      mensagem: `SUCCESS Node.js: ${totalInseridos} registros processados`
    })

    return NextResponse.json({
      success: true,
      message: 'Sincronização Node.js concluída com sucesso',
      registros_processados: totalInseridos,
      endpoints_coletados: dadosColetados.length,
      metodo: 'API ContaAzul + Node.js'
    })

  } catch (error: any) {
    console.error('❌ [NodeJS] Erro geral:', error)
    
    await salvarStatusSync({
      executando: false,
      ultima_execucao: new Date().toISOString(),
      status: 'erro',
      mensagem: `Erro geral: ${error.message}`
    })
    
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
} 