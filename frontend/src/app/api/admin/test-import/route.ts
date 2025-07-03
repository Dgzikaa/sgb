import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Teste de API funcionando...')
    
    return NextResponse.json({
      success: true,
      message: 'API funcionando corretamente!',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Erro no teste: ' + String(error) 
    }, { status: 500 })
  }
} 