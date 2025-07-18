import type {
  SupabaseResponse,
  SupabaseError,
  ApiResponse,
  User,
  UserInfo,
  Bar,
  Checklist,
  ChecklistItem,
  Event,
  Notification,
  DashboardData,
  AIAgentConfig,
  AgentStatus
} from '@/types/global'

﻿import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId') || '3'
    
    console.log('Ã°Å¸Â§Âª TESTANDO API v2 DO CONTAAZUL (igual sync-dados-brutos)...')

    const supabase = createSupabaseClient()

    // 1. Buscar credenciais (igual sync-dados-brutos)
    console.log('Ã°Å¸â€Â Verificando credenciais ContaAzul...')
    const { data: credentials, error: credError } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .eq('ativo', true)
      .single()

    if (credError || !credentials) {
      return NextResponse.json({ 
        error: 'Credenciais ContaAzul nÃ¡Â£o encontradas',
        details: credError?.message 
      }, { status: 404 })
    }

    // 2. Verificar token (igual sync-dados-brutos - SEM renovaÃ¡Â§Ã¡Â£o automÃ¡Â¡tica)
    const agora = new Date()
    const expiraEm = new Date(credentials.expires_at)
    
    if (expiraEm <= agora) {
      return NextResponse.json({ 
        error: 'Token ContaAzul expirado. RenovaÃ¡Â§Ã¡Â£o necessÃ¡Â¡ria.',
        expires_at: credentials.expires_at,
        agora: agora.toISOString() 
      }, { status: 401 })
    }

    console.log('Å“â€¦ Token vÃ¡Â¡lido atÃ¡Â©:', expiraEm.toLocaleString())

    const headers = {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json'
    }

    // 3. Usar a mesma base URL da sync-dados-brutos
    const baseUrl = 'https://api-v2.contaazul.com'

    const testes = []

    // TESTE 1: Categorias (igual sync-dados-brutos)
    console.log('Ã°Å¸Â§Âª TESTE 1: Categorias v2...')
    try {
      const urlCategorias = `${baseUrl}/v1/categorias?pagina=1&tamanho_pagina=10`
      const respCategorias = await fetch(urlCategorias, { headers })
      
      const categoriasData = await respCategorias.json()
      
      testes.push({
        nome: 'Categorias v2',
        url: urlCategorias,
        status: respCategorias.status,
        ok: respCategorias.ok,
        dados: categoriasData,
        erro: respCategorias.ok ? null : JSON.stringify(categoriasData)
      })
    } catch (error) {
      testes.push({
        nome: 'Categorias v2',
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    // TESTE 2: Receitas v2
    console.log('Ã°Å¸Â§Âª TESTE 2: Receitas v2...')
    try {
      const urlReceitas = `${baseUrl}/v1/receitas?pagina=1&tamanho_pagina=5`
      const respReceitas = await fetch(urlReceitas, { headers })
      
      const receitasData = await respReceitas.json()
      
      testes.push({
        nome: 'Receitas v2',
        url: urlReceitas,
        status: respReceitas.status,
        ok: respReceitas.ok,
        dados: receitasData,
        erro: respReceitas.ok ? null : JSON.stringify(receitasData)
      })
    } catch (error) {
      testes.push({
        nome: 'Receitas v2',
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    // TESTE 3: Despesas v2
    console.log('Ã°Å¸Â§Âª TESTE 3: Despesas v2...')
    try {
      const urlDespesas = `${baseUrl}/v1/despesas?pagina=1&tamanho_pagina=5`
      const respDespesas = await fetch(urlDespesas, { headers })
      
      const despesasData = await respDespesas.json()
      
      testes.push({
        nome: 'Despesas v2',
        url: urlDespesas,
        status: respDespesas.status,
        ok: respDespesas.ok,
        dados: despesasData,
        erro: respDespesas.ok ? null : JSON.stringify(despesasData)
      })
    } catch (error) {
      testes.push({
        nome: 'Despesas v2',
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    return NextResponse.json({
      sucesso: true,
      message: 'Teste API v2 ContaAzul concluÃ¡Â­do',
      credenciais: {
        bar_id: credentials.bar_id,
        expires_at: credentials.expires_at,
        token_length: credentials.access_token.length,
        token_refresh_count: credentials.token_refresh_count
      },
      testes,
      resumo: {
        total_testes: testes.length,
        testes_ok: testes.filter((t) => t.ok).length,
        algum_funcionou: testes.some(t => t.ok)
      }
    })

  } catch (error) {
    console.error('ÂÅ’ Erro interno:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 

