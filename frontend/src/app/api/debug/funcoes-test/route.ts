import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('Ã°Å¸â€Â Testando API de funÃ¡Â§Ã¡Âµes...')
    
    // Fazer requisiÃ¡Â§Ã¡Â£o para a API de funÃ¡Â§Ã¡Âµes
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/usuarios/funcoes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('Ã°Å¸â€œÂ¡ Status da resposta:', response.status)
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro na API de funÃ¡Â§Ã¡Âµes',
        status: response.status,
        statusText: response.statusText
      }, { status: 500 })
    }
    
    const data = await response.json()
    console.log('Ã°Å¸â€œÅ  Dados recebidos:', data)
    
    return NextResponse.json({
      success: true,
      message: 'API de funÃ¡Â§Ã¡Âµes funcionando corretamente',
      data: data,
      funcoes: data.funcoes || [],
      total: data.total || 0
    })
    
  } catch (error) {
    console.error('ÂÅ’ Erro no teste da API de funÃ¡Â§Ã¡Âµes:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste da API de funÃ¡Â§Ã¡Âµes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 

