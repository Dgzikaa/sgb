import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, senha } = await request.json()

    console.log('🔐 Tentativa de login:', { email })

    if (!email || !senha) {
      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      )
    }

    // Usar edge function remota deployada no Supabase
    const edgeFunctionUrl = 'https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/login'
    
    console.log('📡 Chamando edge function remota:', edgeFunctionUrl)
    console.log('📦 Payload:', { email })
    
    try {
      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
        },
        body: JSON.stringify({ email, password: senha })
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers))
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ Edge function error:', response.status, errorText)
        
        return NextResponse.json(
          { success: false, error: `Edge function retornou erro ${response.status}: ${errorText}` },
          { status: 502 }
        )
      }

      const result = await response.json()
      console.log('✅ Edge function resultado:', result)
      
      return NextResponse.json(result)
      
    } catch (fetchError: any) {
      console.error('🌐 Erro de conexão com edge function:', fetchError.message)
      
      return NextResponse.json(
        { success: false, error: `Não foi possível conectar com o servidor de autenticação: ${fetchError.message}` },
        { status: 503 }
      )
    }
    
  } catch (error: any) {
    console.error('🔥 Erro fatal na API de login:', error)
    return NextResponse.json(
      { success: false, error: `Erro de conexão: ${error.message}` },
      { status: 500 }
    )
  }
} 