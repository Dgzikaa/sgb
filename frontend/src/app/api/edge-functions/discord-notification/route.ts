import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validar se bar_id foi fornecido
    if (!body.bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      )
    }

    // URL da edge function no Supabase
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/discord-notification`
    
    // Fazer chamada para a edge function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    
    if (!response.ok) {
      console.error('❌ Erro na edge function:', data)
      return NextResponse.json(
        { success: false, error: data.error || 'Erro na edge function' },
        { status: response.status }
      )
    }

    console.log('✅ Notificação Discord enviada via edge function')
    return NextResponse.json(data)

  } catch (error) {
    console.error('❌ Erro no proxy da edge function:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 