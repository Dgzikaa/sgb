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
    
    // Buscar competências pendentes no ContaAzul
    const { data: competenciasPendentes, error: competenciasError } = await supabase
      .from('contaazul_competencias')
      .select('id, mes_competencia, ano_competencia, status, data_vencimento')
      .eq('bar_id', bar_id)
      .in('status', ['pendente', 'em_processamento', 'erro'])

    if (competenciasError) {
      console.error('Erro ao buscar competências pendentes:', competenciasError)
      return NextResponse.json({ 
        error: 'Erro ao buscar competências pendentes',
        competencia_pendentes: 0 
      }, { status: 500 })
    }

    // Separar por status
    const pendentes = competenciasPendentes?.filter((c: any) => c.status === 'pendente') || []
    const emProcessamento = competenciasPendentes?.filter((c: any) => c.status === 'em_processamento') || []
    const comErro = competenciasPendentes?.filter((c: any) => c.status === 'erro') || []

    // Verificar competências vencidas
    const agora = new Date()
    const vencidas = competenciasPendentes?.filter((c: any) => {
      if (!c.data_vencimento) return false
      return new Date(c.data_vencimento) < agora
    }) || []

    // Verificar competências vencendo em 7 dias
    const seteDiasFrente = new Date()
    seteDiasFrente.setDate(agora.getDate() + 7)
    const vencendoSoon = competenciasPendentes?.filter((c: any) => {
      if (!c.data_vencimento) return false
      const dataVencimento = new Date(c.data_vencimento)
      return dataVencimento > agora && dataVencimento <= seteDiasFrente
    }) || []

    // Buscar documentos pendentes para competência
    const { data: documentosPendentes, error: documentosError } = await supabase
      .from('contaazul_documentos')
      .select('id, tipo_documento, competencia_id')
      .eq('bar_id', bar_id)
      .eq('status', 'pendente_envio')

    const totalPendentes = competenciasPendentes?.length || 0

    return NextResponse.json({
      success: true,
      competencia_pendentes: totalPendentes,
      detalhes: {
        pendentes: pendentes.length,
        em_processamento: emProcessamento.length,
        com_erro: comErro.length,
        vencidas: vencidas.length,
        vencendo_em_7_dias: vencendoSoon.length,
        documentos_pendentes: documentosPendentes?.length || 0,
        total: totalPendentes
      }
    })

  } catch (error) {
    console.error('Erro na API contaazul/competencia/pendentes:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      competencia_pendentes: 0 
    }, { status: 500 })
  }
} 