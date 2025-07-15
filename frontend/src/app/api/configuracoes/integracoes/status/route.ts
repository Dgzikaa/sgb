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
    
    // Buscar integrações com problemas ou inativas
    const { data: integracoesPendentes, error: integracoesError } = await supabase
      .from('integracoes_config')
      .select('id, servico, ativo, status')
      .eq('bar_id', bar_id)
      .or('ativo.eq.false,status.eq.erro,status.eq.desconectado')

    if (integracoesError) {
      console.error('Erro ao buscar integrações status:', integracoesError)
      return NextResponse.json({ 
        success: true,
        integracoes_pendentes: 0 
      })
    }

    const totalIntegracoes = integracoesPendentes?.length || 0

    return NextResponse.json({
      success: true,
      integracoes_pendentes: totalIntegracoes,
      detalhes: {
        total: totalIntegracoes
      }
    })

  } catch (error) {
    console.error('Erro na API configuracoes/integracoes/status:', error)
    return NextResponse.json({ 
      success: true,
      integracoes_pendentes: 0 
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
} 