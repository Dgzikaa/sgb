import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export const dynamic = 'force-dynamic'

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
    
    let syncPendentes = 0

    // 1. Verificar status da conexão ContaAzul
    const { data: contaazulConfig, error: configError } = await supabase
      .from('api_credentials')
      .select('status_conexao, ultima_sincronizacao')
      .eq('bar_id', bar_id)
      .eq('sistema', 'contaazul')
      .eq('ambiente', 'producao')
      .single()

    if (configError || !contaazulConfig) {
      // Se não há configuração, conta como pendência
      syncPendentes += 1
    } else {
      // Verificar se conexão está inativa
      if (contaazulConfig.status_conexao !== 'ativo') {
        syncPendentes += 1
      }

      // Verificar se última sincronização foi há mais de 1 hora
      if (contaazulConfig.ultima_sincronizacao) {
        const ultimaSync = new Date(contaazulConfig.ultima_sincronizacao)
        const agora = new Date()
        const horasSemSync = Math.floor((agora.getTime() - ultimaSync.getTime()) / (1000 * 60 * 60))
        
        if (horasSemSync > 1) {
          syncPendentes += 1
        }
      }
    }

    // 2. Verificar transações pendentes de sincronização
    const { data: transacoesPendentes, error: transacoesError } = await supabase
      .from('contaazul_transacoes')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('status_sync', 'pendente')

    if (!transacoesError && transacoesPendentes) {
      syncPendentes += transacoesPendentes.length
    }

    // 3. Verificar erros de sincronização não resolvidos
    const { data: errosSync, error: errosError } = await supabase
      .from('contaazul_sync_logs')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('status', 'erro')
      .eq('resolvido', false)

    if (!errosError && errosSync) {
      syncPendentes += errosSync.length
    }

    // 4. Verificar produtos não sincronizados
    const { data: produtosNaoSync, error: produtosError } = await supabase
      .from('produtos')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .is('contaazul_id', null)

    if (!produtosError && produtosNaoSync) {
      syncPendentes += produtosNaoSync.length
    }

    return NextResponse.json({
      success: true,
      sync_pendentes: syncPendentes,
      detalhes: {
        conexao_inativa: contaazulConfig?.status_conexao !== 'ativo' ? 1 : 0,
        sync_atrasada: contaazulConfig?.ultima_sincronizacao ? 
          Math.floor((new Date().getTime() - new Date(contaazulConfig.ultima_sincronizacao).getTime()) / (1000 * 60 * 60)) > 1 ? 1 : 0 : 1,
        transacoes_pendentes: transacoesPendentes?.length || 0,
        erros_nao_resolvidos: errosSync?.length || 0,
        produtos_nao_sincronizados: produtosNaoSync?.length || 0,
        total: syncPendentes
      }
    })

  } catch (error) {
    console.error('Erro na API contaazul/status:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      sync_pendentes: 0 
    }, { status: 500 })
  }
} 