import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🔍 Teste básico - API funcionando')
  
  try {
    const timestamp = new Date().toISOString()
    const env = process.env.NODE_ENV || 'unknown'
    
    // Verificar se as variáveis de ambiente principais existem
    const envCheck = {
      NODE_ENV: env,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL
    }
    
    console.log('✅ Teste básico executado com sucesso')
    
    return NextResponse.json({
      success: true,
      message: 'API funcionando normalmente',
      timestamp,
      environment: envCheck
    })
    
  } catch (error: any) {
    console.error('❌ Erro no teste básico:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro no teste básico',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    return NextResponse.json({
      success: true,
      message: 'POST funcionando',
      receivedData: body
    })
    
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Erro no POST',
      details: error.message
    }, { status: 500 })
  }
} 