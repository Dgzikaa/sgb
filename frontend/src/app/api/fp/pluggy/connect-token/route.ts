import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import { getPluggyClient } from '@/lib/pluggy-client'

// Helper para pegar CPF do usuário autenticado
async function getUserCPF(supabase: any, user: any) {
  const { data: userData } = await supabase
    .from('usuarios_bar')
    .select('cpf')
    .eq('user_id', user.id)
    .limit(1)

  if (!userData || userData.length === 0 || !userData[0].cpf) {
    const { data: userDataByEmail } = await supabase
      .from('usuarios_bar')
      .select('cpf')
      .eq('email', user.email)
      .limit(1)
    
    if (userDataByEmail && userDataByEmail.length > 0) {
      return userDataByEmail[0].cpf.replace(/[^\d]/g, '')
    }
  }

  if (userData && userData.length > 0 && userData[0].cpf) {
    return userData[0].cpf.replace(/[^\d]/g, '')
  }

  throw new Error('CPF não encontrado')
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const cpf = await getUserCPF(supabase, user)

    // Criar connect token no Pluggy
    const pluggyClient = getPluggyClient()
    const connectToken = await pluggyClient.createConnectToken(cpf)

    return NextResponse.json({ success: true, data: connectToken })
  } catch (error: any) {
    console.error('Erro ao criar connect token:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
