import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('📋 LISTANDO TODAS AS AD ACCOUNTS...')

    // Buscar configuração Meta
    const { data: config } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', 3)
      .eq('sistema', 'meta')
      .single()

    if (!config) {
      return NextResponse.json({
        success: false,
        error: 'Configuração Meta não encontrada'
      })
    }

    const accessToken = config.access_token

    // Buscar todas as ad accounts
    const url = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency&access_token=${accessToken}`
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro na Meta API',
        response_data: data
      })
    }

    const allAccounts = data.data || []

    // Formatar para exibir claramente
    const accountsList = allAccounts.map((account: any, index: number) => {
      const isOrdinario = account.name?.toLowerCase().includes('ordinario') || 
                         account.name?.toLowerCase().includes('ordinário') ||
                         account.name?.toLowerCase().includes('bar')
      
      return {
        index: index + 1,
        id: account.id,
        name: account.name,
        status: account.account_status === 1 ? 'ATIVA' : 'INATIVA',
        currency: account.currency,
        is_ordinario_candidate: isOrdinario,
        clean_id: account.id.replace('act_', '')
      }
    })

    // Identificar candidatos do Ordinário
    const ordinarioCandidates = accountsList.filter(acc => acc.is_ordinario_candidate)

    return NextResponse.json({
      success: true,
      total_accounts: accountsList.length,
      ordinario_candidates_count: ordinarioCandidates.length,
      ordinario_candidates: ordinarioCandidates,
      all_accounts: accountsList,
      recommendation: ordinarioCandidates.length > 0 ? 
        `Use a conta: ${ordinarioCandidates[0].id} (${ordinarioCandidates[0].name})` :
        'Nenhuma conta com nome relacionado ao Ordinário encontrada'
    })

  } catch (error: any) {
    console.error('❌ Erro:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
} 