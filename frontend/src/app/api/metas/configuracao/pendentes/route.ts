import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuário não autenticado')
    }

    const body = await request.json()
    const { bar_id, user_id } = body

    if (!bar_id || !user_id) {
      return NextResponse.json(
        { error: 'bar_id e user_id são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = await getAdminClient()
    
    // Buscar metas de negócio sem configuração ou inativas
    const { data: metasPendentes, error: metasError } = await supabase
      .from('metas_negocio')
      .select('id, nome, ativo')
      .eq('bar_id', bar_id)
      .eq('ativo', false)

    if (metasError) {
      console.error('Erro ao buscar metas configuração:', metasError)
      return NextResponse.json({ 
        success: true,
        metas_config_pendentes: 0 
      })
    }

    const totalMetas = metasPendentes?.length || 0

    return NextResponse.json({
      success: true,
      metas_config_pendentes: totalMetas,
      detalhes: {
        total: totalMetas
      }
    })

  } catch (error) {
    console.error('Erro na API metas/configuracao/pendentes:', error)
    return NextResponse.json({ 
      success: true,
      metas_config_pendentes: 0 
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
} 