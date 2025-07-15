import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    // Buscar configuração Meta
    const { data: config } = await supabase
      .from('api_credentials')
      .select('access_token')
      .eq('bar_id', 3)
      .eq('sistema', 'meta')
      .single()

    if (!config) {
      return NextResponse.json({ error: 'Configuração não encontrada' })
    }

    // Buscar todas as ad accounts
    const url = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status&access_token=${config.access_token}`
    const response = await fetch(url)
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro na Meta API', data })
    }

    const accounts = data.data || []
    
    // Retornar lista simples e clara
    const simpleList = accounts.map((acc: any, i: number) => 
      `${i+1}. ${acc.id} | ${acc.name} | ${acc.account_status === 1 ? 'ATIVA' : 'INATIVA'}`
    )

    return NextResponse.json({
      total: accounts.length,
      accounts: simpleList,
      raw_data: accounts
    })

  } catch (error: any) {
    return NextResponse.json({ error: error.message })
  }
} 