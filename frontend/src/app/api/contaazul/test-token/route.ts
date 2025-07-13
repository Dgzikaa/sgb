import { NextRequest, NextResponse } from 'next/server'
import { getValidContaAzulToken } from '@/lib/contaazul-auth-helper'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId') || '3'
    
    console.log('🔑 TESTANDO TOKEN CONTAAZUL...')

    const accessToken = await getValidContaAzulToken(parseInt(barId))
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Token indisponível',
        token_length: 0,
        token_valid: false
      }, { status: 401 })
    }

    console.log('✅ Token obtido:', accessToken.substring(0, 20) + '...')

    // Teste simples com categorias
    const response = await fetch('https://api.contaazul.com/v1/financeiro/categorias', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    const responseText = await response.text()
    let responseData = null
    
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = responseText
    }

    return NextResponse.json({
      token_length: accessToken.length,
      token_valid: response.ok,
      response_status: response.status,
      response_headers: Object.fromEntries(response.headers.entries()),
      response_data: responseData,
      error: response.ok ? null : responseText
    })

  } catch (error) {
    console.error('❌ Erro no teste de token:', error)
    return NextResponse.json({ 
      error: 'Erro interno',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 