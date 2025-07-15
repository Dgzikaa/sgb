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
    
    let alertasPendentes = 0

    // 1. Alertas de sistema ativos
    const { data: alertasSistema, error: alertasError } = await supabase
      .from('sistema_alertas')
      .select('id, status_alerta')
      .eq('bar_id', bar_id)
      .is('resolvido_em', null)

    if (!alertasError && alertasSistema) {
      alertasPendentes += alertasSistema.length
    }

    // 2. Checklists atrasados
    const { data: checklistsAtrasados, error: checklistsError } = await supabase
      .from('checklist_execucoes')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('status_execucao', 'pendente')
      .lt('data_limite', new Date().toISOString())

    if (!checklistsError && checklistsAtrasados) {
      alertasPendentes += checklistsAtrasados.length
    }

    // 3. Integrações com erro
    const { data: integracoesErro, error: integracoesError } = await supabase
      .from('api_credentials')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .neq('status_conexao', 'ativo')

    if (!integracoesError && integracoesErro) {
      alertasPendentes += integracoesErro.length
    }

    // 4. Backups atrasados
    const { data: ultimoBackup, error: backupError } = await supabase
      .from('system_backups')
      .select('created_at')
      .eq('bar_id', bar_id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!backupError && ultimoBackup && ultimoBackup.length > 0) {
      const ultimaData = new Date(ultimoBackup[0].created_at)
      const agora = new Date()
      const diasSemBackup = Math.floor((agora.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diasSemBackup > 7) {
        alertasPendentes += 1
      }
    }

    return NextResponse.json({
      success: true,
      alertas_pendentes: alertasPendentes,
      detalhes: {
        alertas_sistema: alertasSistema?.length || 0,
        checklists_atrasados: checklistsAtrasados?.length || 0,
        integracoes_erro: integracoesErro?.length || 0,
        backup_atrasado: ultimoBackup && ultimoBackup.length > 0 ? 
          Math.floor((new Date().getTime() - new Date(ultimoBackup[0].created_at).getTime()) / (1000 * 60 * 60 * 24)) > 7 ? 1 : 0 : 0
      }
    })

  } catch (error) {
    console.error('Erro na API dashboard/alertas:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      alertas_pendentes: 0 
    }, { status: 500 })
  }
} 