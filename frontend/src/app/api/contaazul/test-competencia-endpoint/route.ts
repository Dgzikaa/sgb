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
    
    console.log('ðŸ§ª TESTANDO NOVO ENDPOINT COM DATA_COMPETENCIA...')

    // âœ… USAR HELPER QUE RENOVA AUTOMATICAMENTE (igual sync-dados-brutos)
    const accessToken = await getValidContaAzulToken(parseInt(barId))
    
    if (!accessToken) {
      console.error('âŒ NÃ£o foi possÃ­vel obter token vÃ¡lido (renovaÃ§Ã£o automÃ¡tica falhou)')
      return NextResponse.json({ 
        error: 'Token ContaAzul indisponÃ­vel. Verifique as credenciais ou reautorize.' 
      }, { status: 401 })
    }

    console.log('âœ… Token vÃ¡lido obtido (com renovaÃ§Ã£o automÃ¡tica se necessÃ¡rio)')

    // TESTE 1: Contas a Receber com data_competencia
    console.log('ðŸ” TESTE 1: Endpoint contas-a-receber com data_competencia...')
    
    const urlReceitas = new URL('https://api.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-receber/buscar')
    urlReceitas.searchParams.append('pagina', '1')
    urlReceitas.searchParams.append('tamanho_pagina', '20')
    urlReceitas.searchParams.append('data_vencimento_de', '2024-01-31')
    urlReceitas.searchParams.append('data_vencimento_ate', '2025-12-31')
    urlReceitas.searchParams.append('data_competencia_de', '2024-01-31')
    urlReceitas.searchParams.append('data_competencia_ate', '2025-12-31')

    const responseReceitas = await fetch(urlReceitas.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    let dadosReceitas = null
    if (responseReceitas.ok) {
      dadosReceitas = await responseReceitas.json()
      console.log('âœ… TESTE 1 bem-sucedido! Total de itens:', dadosReceitas?.itens?.length || 0)
    } else {
      console.error('âŒ TESTE 1 falhou:', responseReceitas.status, responseReceitas.statusText)
      const errorText = await responseReceitas.text()
      console.error('Erro detalhado:', errorText)
    }

    // TESTE 2: Contas a Pagar com data_competencia
    console.log('ðŸ” TESTE 2: Endpoint contas-a-pagar com data_competencia...')
    
    const urlDespesas = new URL('https://api.contaazul.com/v1/financeiro/eventos-financeiros/contas-a-pagar/buscar')
    urlDespesas.searchParams.append('pagina', '1')
    urlDespesas.searchParams.append('tamanho_pagina', '20')
    urlDespesas.searchParams.append('data_vencimento_de', '2024-01-31')
    urlDespesas.searchParams.append('data_vencimento_ate', '2025-12-31')
    urlDespesas.searchParams.append('data_competencia_de', '2024-01-31')
    urlDespesas.searchParams.append('data_competencia_ate', '2025-12-31')

    const responseDespesas = await fetch(urlDespesas.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    let dadosDespesas = null
    if (responseDespesas.ok) {
      dadosDespesas = await responseDespesas.json()
      console.log('âœ… TESTE 2 bem-sucedido! Total de itens:', dadosDespesas?.itens?.length || 0)
    } else {
      console.error('âŒ TESTE 2 falhou:', responseDespesas.status, responseDespesas.statusText)
      const errorText = await responseDespesas.text()
      console.error('Erro detalhado:', errorText)
    }

    // Analisar estrutura dos dados retornados
    const analise = {
      receitas: {
        total_itens: dadosReceitas?.itens?.length || 0,
        tem_data_competencia: false,
        campos_disponiveis: [] as string[],
        amostra_campos: null as any,
        primeiro_item: null as any
      },
      despesas: {
        total_itens: dadosDespesas?.itens?.length || 0,
        tem_data_competencia: false,
        campos_disponiveis: [] as string[],
        amostra_campos: null as any,
        primeiro_item: null as any
      }
    }

    // Analisar receitas
    if (dadosReceitas?.itens && dadosReceitas.itens.length > 0) {
      const primeiroItem = dadosReceitas.itens[0]
      analise.receitas.campos_disponiveis = Object.keys(primeiroItem)
      analise.receitas.tem_data_competencia = 'data_competencia' in primeiroItem
      analise.receitas.primeiro_item = primeiroItem
      analise.receitas.amostra_campos = {
        id: primeiroItem.id || null,
        descricao: primeiroItem.descricao || null,
        valor: primeiroItem.valor || null,
        data_vencimento: primeiroItem.data_vencimento || null,
        data_competencia: primeiroItem.data_competencia || null,
        data_pagamento: primeiroItem.data_pagamento || null,
        categoria: primeiroItem.categoria || null
      }
    }

    // Analisar despesas
    if (dadosDespesas?.itens && dadosDespesas.itens.length > 0) {
      const primeiroItem = dadosDespesas.itens[0]
      analise.despesas.campos_disponiveis = Object.keys(primeiroItem)
      analise.despesas.tem_data_competencia = 'data_competencia' in primeiroItem
      analise.despesas.primeiro_item = primeiroItem
      analise.despesas.amostra_campos = {
        id: primeiroItem.id || null,
        descricao: primeiroItem.descricao || null,
        valor: primeiroItem.valor || null,
        data_vencimento: primeiroItem.data_vencimento || null,
        data_competencia: primeiroItem.data_competencia || null,
        data_pagamento: primeiroItem.data_pagamento || null,
        categoria: primeiroItem.categoria || null
      }
    }

    return NextResponse.json({
      sucesso: true,
      message: 'Teste de endpoints com data_competencia concluÃ­do',
      analise,
      dados_completos: {
        receitas: dadosReceitas,
        despesas: dadosDespesas
      },
      conclusoes: {
        endpoint_receitas_funciona: responseReceitas.ok,
        endpoint_despesas_funciona: responseDespesas.ok,
        receitas_tem_competencia: analise.receitas.tem_data_competencia,
        despesas_tem_competencia: analise.despesas.tem_data_competencia,
        viavel_para_dre: analise.receitas.tem_data_competencia && analise.despesas.tem_data_competencia
      }
    })

  } catch (error) {
    console.error('âŒ Erro interno no teste:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
