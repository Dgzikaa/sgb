import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('ðŸ” Testando API de funá§áµes...')
    
    // Fazer requisiá§á£o para a API de funá§áµes
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
        error: 'Erro na API de funá§áµes',
        status: response.status,
        statusText: response.statusText
      }, { status: 500 })
    }
    
    const data = await response.json()
    console.log('ðŸ“Š Dados recebidos:', data)
    
    return NextResponse.json({
      success: true,
      message: 'API de funá§áµes funcionando corretamente',
      data: data,
      funcoes: data.funcoes || [],
      total: data.total || 0
    })
    
  } catch (error) {
    console.error('Œ Erro no teste da API de funá§áµes:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste da API de funá§áµes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
