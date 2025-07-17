import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('ðŸ” Testando API de funÃ§Ãµes...')
    
    // Fazer requisiÃ§Ã£o para a API de funÃ§Ãµes
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/usuarios/funcoes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('ðŸ“¡ Status da resposta:', response.status)
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro na API de funÃ§Ãµes',
        status: response.status,
        statusText: response.statusText
      }, { status: 500 })
    }
    
    const data = await response.json()
    console.log('ðŸ“Š Dados recebidos:', data)
    
    return NextResponse.json({
      success: true,
      message: 'API de funÃ§Ãµes funcionando corretamente',
      data: data,
      funcoes: data.funcoes || [],
      total: data.total || 0
    })
    
  } catch (error) {
    console.error('âŒ Erro no teste da API de funÃ§Ãµes:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste da API de funÃ§Ãµes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
