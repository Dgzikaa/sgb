import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testando API de funções...')
    
    // Fazer requisição para a API de funções
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/usuarios/funcoes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📡 Status da resposta:', response.status)
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: 'Erro na API de funções',
        status: response.status,
        statusText: response.statusText
      }, { status: 500 })
    }
    
    const data = await response.json()
    console.log('📊 Dados recebidos:', data)
    
    return NextResponse.json({
      success: true,
      message: 'API de funções funcionando corretamente',
      data: data,
      funcoes: data.funcoes || [],
      total: data.total || 0
    })
    
  } catch (error) {
    console.error('❌ Erro no teste da API de funções:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro no teste da API de funções',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
} 
