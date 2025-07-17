import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getValidContaAzulToken } from '@/lib/contaazul-auth-helper'

export const dynamic = 'force-dynamic'

function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId') || '3'
    
    console.log('ðŸ” TESTANDO ENDPOINTS BÃSICOS DO CONTAAZUL...')

    // âœ… USAR HELPER QUE RENOVA AUTOMATICAMENTE (igual sync-dados-brutos)
    const accessToken = await getValidContaAzulToken(parseInt(barId))
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Token ContaAzul indisponÃ­vel. Verifique as credenciais ou reautorize.',
        details: 'RenovaÃ§Ã£o automÃ¡tica falhou'
      }, { status: 401 })
    }

    const resultados = {
      credenciais_ok: true,
      access_token_length: accessToken.length,
      testes: [] as any[]
    }

    // TESTE 1: Endpoint bÃ¡sico de receitas (antigo)
    console.log('ðŸ§ª TESTE 1: Endpoint receitas bÃ¡sico...')
    try {
      const urlReceitas = 'https://api.contaazul.com/v1/financeiro/contas-a-receber'
      const responseReceitas = await fetch(urlReceitas, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      resultados.testes.push({
        nome: 'Receitas bÃ¡sico',
        url: urlReceitas,
        status: responseReceitas.status,
        ok: responseReceitas.ok,
        erro: responseReceitas.ok ? null : await responseReceitas.text()
      })
    } catch (error) {
      resultados.testes.push({
        nome: 'Receitas bÃ¡sico',
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    // TESTE 2: Endpoint bÃ¡sico de despesas (antigo)
    console.log('ðŸ§ª TESTE 2: Endpoint despesas bÃ¡sico...')
    try {
      const urlDespesas = 'https://api.contaazul.com/v1/financeiro/contas-a-pagar'
      const responseDespesas = await fetch(urlDespesas, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      resultados.testes.push({
        nome: 'Despesas bÃ¡sico',
        url: urlDespesas,
        status: responseDespesas.status,
        ok: responseDespesas.ok,
        erro: responseDespesas.ok ? null : await responseDespesas.text()
      })
    } catch (error) {
      resultados.testes.push({
        nome: 'Despesas bÃ¡sico',
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    // TESTE 3: Endpoint de categorias
    console.log('ðŸ§ª TESTE 3: Endpoint categorias...')
    try {
      const urlCategorias = 'https://api.contaazul.com/v1/financeiro/categorias'
      const responseCategorias = await fetch(urlCategorias, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      resultados.testes.push({
        nome: 'Categorias',
        url: urlCategorias,
        status: responseCategorias.status,
        ok: responseCategorias.ok,
        erro: responseCategorias.ok ? null : await responseCategorias.text()
      })
    } catch (error) {
      resultados.testes.push({
        nome: 'Categorias',
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    // TESTE 4: Endpoint novo com competÃªncia (exato da documentaÃ§Ã£o)
    console.log('ðŸ§ª TESTE 4: Endpoint com competÃªncia...')
    try {
      const urlCompetencia = new URL('https://api.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-receber/buscar')
      urlCompetencia.searchParams.append('pagina', '1')
      urlCompetencia.searchParams.append('tamanho_pagina', '5')
      urlCompetencia.searchParams.append('data_vencimento_de', '2024-01-01')
      urlCompetencia.searchParams.append('data_vencimento_ate', '2025-12-31')
      
      const responseCompetencia = await fetch(urlCompetencia.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      let dadosCompetencia = null
      if (responseCompetencia.ok) {
        dadosCompetencia = await responseCompetencia.json()
      }
      
      resultados.testes.push({
        nome: 'Eventos financeiros com buscar',
        url: urlCompetencia.toString(),
        status: responseCompetencia.status,
        ok: responseCompetencia.ok,
        dados: dadosCompetencia,
        erro: responseCompetencia.ok ? null : await responseCompetencia.text()
      })
    } catch (error) {
      resultados.testes.push({
        nome: 'Eventos financeiros com buscar',
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    // TESTE 5: Endpoint sÃ³ de eventos financeiros
    console.log('ðŸ§ª TESTE 5: Endpoint eventos financeiros...')
    try {
      const urlEventos = 'https://api.contaazul.com/v1/financeiro/eventos-financeiros'
      const responseEventos = await fetch(urlEventos, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      
      resultados.testes.push({
        nome: 'Eventos financeiros bÃ¡sico',
        url: urlEventos,
        status: responseEventos.status,
        ok: responseEventos.ok,
        erro: responseEventos.ok ? null : await responseEventos.text()
      })
    } catch (error) {
      resultados.testes.push({
        nome: 'Eventos financeiros bÃ¡sico',
        erro: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }

    return NextResponse.json({
      sucesso: true,
      message: 'Testes de endpoints bÃ¡sicos concluÃ­dos',
      resultados,
      resumo: {
        total_testes: resultados.testes.length,
        testes_ok: resultados.testes.filter((t: any) => t.ok).length,
        algum_funcionou: resultados.testes.some(t => t.ok)
      }
    })

  } catch (error) {
    console.error('âŒ Erro interno:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
