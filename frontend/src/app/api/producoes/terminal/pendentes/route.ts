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
    
    // Buscar pedidos pendentes no terminal
    const { data: terminalPendentes, error: terminalError } = await supabase
      .from('terminal_pedidos')
      .select('id, status, criado_em, tempo_estimado, prioridade')
      .eq('bar_id', bar_id)
      .in('status', ['aguardando', 'preparando', 'pausado'])

    if (terminalError) {
      console.error('Erro ao buscar terminal pendentes:', terminalError)
      return NextResponse.json({ 
        error: 'Erro ao buscar terminal pendentes',
        terminal_pendentes: 0 
      }, { status: 500 })
    }

    // Separar por status
    const aguardando = terminalPendentes?.filter((t: any) => t.status === 'aguardando') || []
    const preparando = terminalPendentes?.filter((t: any) => t.status === 'preparando') || []
    const pausados = terminalPendentes?.filter((t: any) => t.status === 'pausado') || []

    // Calcular pedidos atrasados
    const agora = new Date()
    const atrasados = terminalPendentes?.filter((t: any) => {
      if (!t.criado_em || !t.tempo_estimado) return false
      const criadoEm = new Date(t.criado_em)
      const tempoDecorrido = Math.floor((agora.getTime() - criadoEm.getTime()) / (1000 * 60)) // em minutos
      return tempoDecorrido > t.tempo_estimado
    }) || []

    // Separar por prioridade
    const altaPrioridade = terminalPendentes?.filter((t: any) => t.prioridade === 'alta') || []
    const mediaPrioridade = terminalPendentes?.filter((t: any) => t.prioridade === 'media') || []
    const baixaPrioridade = terminalPendentes?.filter((t: any) => t.prioridade === 'baixa') || []

    // Buscar equipamentos com problemas
    const { data: equipamentosProblema, error: equipamentosError } = await supabase
      .from('terminal_equipamentos')
      .select('id, nome, status')
      .eq('bar_id', bar_id)
      .in('status', ['manutencao', 'erro', 'inativo'])

    const totalPendentes = terminalPendentes?.length || 0

    return NextResponse.json({
      success: true,
      terminal_pendentes: totalPendentes,
      detalhes: {
        aguardando: aguardando.length,
        preparando: preparando.length,
        pausados: pausados.length,
        atrasados: atrasados.length,
        por_prioridade: {
          alta: altaPrioridade.length,
          media: mediaPrioridade.length,
          baixa: baixaPrioridade.length
        },
        equipamentos_problema: equipamentosProblema?.length || 0,
        total: totalPendentes
      }
    })

  } catch (error) {
    console.error('Erro na API producoes/terminal/pendentes:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      terminal_pendentes: 0 
    }, { status: 500 })
  }
} 