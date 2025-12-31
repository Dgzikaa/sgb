import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authenticateUser } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateUser(request)
    if (!authResult.authenticated || !authResult.user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('validacoes_cruzadas')
      .select('*')
      .order('data_referencia', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Erro ao buscar validações:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Erro na API de validações:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
