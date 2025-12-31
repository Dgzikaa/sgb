import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser } from '@/middleware/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 401 })
    }

    const supabase = await getAdminClient()

    const { data, error } = await supabase
      .from('sistema_alertas')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Erro ao buscar alertas:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Erro na API de alertas:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
