import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const { alerta_id } = await request.json()

    if (!alerta_id) {
      return NextResponse.json({ success: false, error: 'ID do alerta não fornecido' }, { status: 400 })
    }

    const supabase = createClient()

    const { error } = await supabase
      .from('sistema_alertas')
      .update({ 
        resolvido: true, 
        resolvido_em: new Date().toISOString(),
        resolvido_por: authResult.user.nome || authResult.user.email
      })
      .eq('id', alerta_id)

    if (error) {
      console.error('Erro ao resolver alerta:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Alerta resolvido' })
  } catch (error: any) {
    console.error('Erro na API de resolver alerta:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
