import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    console.log('🔍 Debug Ad Accounts Live - Listando todas as contas disponíveis...')

    // Obter credenciais do Meta
    const { data: credenciais } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('sistema', 'meta')
      .eq('bar_id', 3)
      .single()

    if (!credenciais || !credenciais.access_token) {
      throw new Error('❌ Credenciais do Meta não encontradas')
    }

    const accessToken = credenciais.access_token

    // Buscar TODAS as ad accounts do usuário
    const adAccountsUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name,balance,amount_spent,spend_cap,owner,business&access_token=${accessToken}`
    
    console.log('🔗 URL:', adAccountsUrl.replace(accessToken, 'ACCESS_TOKEN'))
    
    const response = await fetch(adAccountsUrl)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(`Meta API Error: ${response.status} - ${JSON.stringify(error)}`)
    }
    
    const data = await response.json()
    const allAccounts = data.data || []
    
    console.log(`📊 Total de ad accounts encontradas: ${allAccounts.length}`)
    
    // Analisar cada conta
    const accountsAnalysis = allAccounts.map((account: any) => {
      const isOrdinaryDeboche = 
        account.id === 'act_943600147532423' ||
        account.name?.toLowerCase().includes('deboche') ||
        account.name?.toLowerCase().includes('ordinário') ||
        account.name?.toLowerCase().includes('ordinario')
      
      return {
        id: account.id,
        name: account.name,
        account_status: account.account_status,
        currency: account.currency,
        amount_spent: account.amount_spent,
        is_ordinary_deboche: isOrdinaryDeboche,
        business: account.business,
        owner: account.owner
      }
    })
    
    // Separar contas relevantes
    const relevantAccounts = accountsAnalysis.filter(acc => acc.is_ordinary_deboche)
    const otherAccounts = accountsAnalysis.filter(acc => !acc.is_ordinary_deboche)
    
    return NextResponse.json({
      success: true,
      data: {
        total_accounts: allAccounts.length,
        relevant_accounts: relevantAccounts,
        other_accounts: otherAccounts.slice(0, 5), // Primeiras 5 outras contas
        filter_analysis: {
          exact_id_match: allAccounts.filter((acc: any) => acc.id === 'act_943600147532423').length,
          deboche_name_match: allAccounts.filter((acc: any) => acc.name?.toLowerCase().includes('deboche')).length,
          ordinario_name_match: allAccounts.filter((acc: any) => acc.name?.toLowerCase().includes('ordinario')).length
        },
        credenciais_info: {
          sistema: credenciais.sistema,
          bar_id: credenciais.bar_id,
          ambiente: credenciais.ambiente,
          ativo: credenciais.ativo,
          configuracoes_keys: Object.keys(credenciais.configuracoes || {})
        }
      }
    })

  } catch (error: any) {
    console.error('❌ Erro ao debugar ad accounts:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.stack
    }, { status: 500 })
  }
} 