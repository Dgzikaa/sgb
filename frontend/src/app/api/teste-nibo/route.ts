import { NextRequest, NextResponse } from 'next/server'

const NIBO_CONFIG = {
  BASE_URL: "https://api.nibo.com.br/empresas/v1",
  API_TOKEN: process.env.NIBO_API_TOKEN
}

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando conexão com NIBO...')
    console.log('🔑 Token configurado:', NIBO_CONFIG.API_TOKEN ? 'SIM' : 'NÃO')
    
    if (!NIBO_CONFIG.API_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'Token do NIBO não configurado',
        config: {
          hasToken: false,
          tokenLength: 0
        }
      }, { status: 500 })
    }

    // Testar uma requisição simples para o NIBO
    const response = await fetch(`${NIBO_CONFIG.BASE_URL}/categories`, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'apitoken': NIBO_CONFIG.API_TOKEN
      }
    })

    console.log('📡 Status da resposta NIBO:', response.status)
    console.log('📡 Headers da resposta:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erro do NIBO:', errorText)
      
      return NextResponse.json({
        success: false,
        error: `Erro ${response.status}: ${response.statusText}`,
        details: errorText,
        config: {
          hasToken: true,
          tokenLength: NIBO_CONFIG.API_TOKEN.length,
          baseUrl: NIBO_CONFIG.BASE_URL
        }
      }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      message: 'Conexão com NIBO funcionando',
      data: data,
      config: {
        hasToken: true,
        tokenLength: NIBO_CONFIG.API_TOKEN.length,
        baseUrl: NIBO_CONFIG.BASE_URL
      }
    })

  } catch (error: any) {
    console.error('❌ Erro no teste NIBO:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      config: {
        hasToken: !!NIBO_CONFIG.API_TOKEN,
        tokenLength: NIBO_CONFIG.API_TOKEN?.length || 0,
        baseUrl: NIBO_CONFIG.BASE_URL
      }
    }, { status: 500 })
  }
} 