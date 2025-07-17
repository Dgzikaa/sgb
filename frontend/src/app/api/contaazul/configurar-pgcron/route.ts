import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { barId, action = 'configure' } = await request.json()

    if (!barId) {
      return NextResponse.json({ error: 'barId Ã© obrigatÃ³rio' }, { status: 400 })
    }

    // Chamar Edge Function do pgcron
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pgcron-contaazul-discord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        action,
        barId
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error || 'Erro ao configurar pgcron' 
      }, { status: response.status })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro na API de configuraÃ§Ã£o pgcron:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barId = searchParams.get('barId')

    if (!barId) {
      return NextResponse.json({ error: 'barId Ã© obrigatÃ³rio' }, { status: 400 })
    }

    // Verificar status dos cron jobs
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pgcron-contaazul-discord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        action: 'status',
        barId
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error || 'Erro ao verificar status' 
      }, { status: response.status })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro ao verificar status pgcron:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { barId } = await request.json()

    if (!barId) {
      return NextResponse.json({ error: 'barId Ã© obrigatÃ³rio' }, { status: 400 })
    }

    // Remover cron jobs
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/pgcron-contaazul-discord`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        action: 'remove',
        barId
      })
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ 
        error: data.error || 'Erro ao remover cron jobs' 
      }, { status: response.status })
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Erro ao remover pgcron:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor' 
    }, { status: 500 })
  }
} 
