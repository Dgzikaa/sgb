import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { authenticateUser, authErrorResponse } from '@/middleware/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser(request)
    if (!user) {
      return authErrorResponse('Usuá¡rio ná£o autenticado')
    }

    const body = await request.json()
    const { bar_id, user_id } = body

    if (!bar_id || !user_id) {
      return NextResponse.json(
        { error: 'bar_id e user_id sá£o obrigatá³rios' },
        { status: 400 }
      )
    }

    const supabase = await getAdminClient()
    
    // ðŸŽ¯ BUSCAR TODOS OS DADOS EM UMA Sá“ CONSULTA
    const badges = {
      // Principais
      checklist: 0,
      producao: 0, 
      contaazul: 0,
      marketing: 0,
      configuracoes: 0,
      notifications: 0,
      home: 0,
      visaoGeral: 0
    }

    try {
      // 1. CHECKLISTS PENDENTES (todos os tipos)
      const { data: checklists } = await supabase
        .from('checklist_execucoes')
        .select('id')
        .eq('bar_id', bar_id)
        .is('concluido_em', null)
      
      badges.checklist = checklists?.length || 0

      // 2. PRODUá‡á•ES PENDENTES (todos os tipos)
      const { data: producoes } = await supabase
        .from('producoes')
        .select('id')
        .eq('bar_id', bar_id)
        .in('status', ['pendente', 'em_andamento'])
      
      badges.producao = producoes?.length || 0

      // 3. NOTIFICAá‡á•ES NáƒO LIDAS
      const { data: notificacoes } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('bar_id', bar_id)
        .eq('lida', false)
      
      badges.notifications = notificacoes?.length || 0

      // 4. ALERTAS DO SISTEMA (visá£o geral)
      const { data: alertas } = await supabase
        .from('sistema_alertas')
        .select('id')
        .eq('bar_id', bar_id)
        .is('resolvido_em', null)
      
      badges.visaoGeral = alertas?.length || 0

      // 5. CONTAAZUL - Sync pendentes/erros
      const { data: contaazulLogs } = await supabase
        .from('contaazul_sync_log')
        .select('id')
        .eq('bar_id', bar_id)
        .eq('status', 'erro')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      
      badges.contaazul = contaazulLogs?.length || 0

      // 6. MARKETING - Posts recentes
      const { data: posts } = await supabase
        .from('instagram_posts')
        .select('id')
        .eq('bar_id', bar_id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      
      badges.marketing = posts?.length || 0

      // 7. CONFIGURAá‡á•ES - Para admins apenas
      if (user.role === 'admin') {
        const { data: integracoes } = await supabase
          .from('integracoes_config')
          .select('id')
          .eq('bar_id', bar_id)
          .eq('ativo', false)
        
        badges.configuracoes = integracoes?.length || 0
      }

      // 8. HOME - Resumo geral
      badges.home = badges.checklist + badges.notifications + badges.visaoGeral

    } catch (queryError) {
      console.error('Erro nas queries de badges:', queryError)
      // Continuar com badges zerados em caso de erro
    }

    return NextResponse.json({
      success: true,
      badges,
      summary: {
        total_issues: Object.values(badges).reduce((sum, count) => sum + count, 0),
        critical_issues: badges.visaoGeral,
        pending_tasks: badges.checklist + badges.producao
      }
    })

  } catch (error) {
    console.error('Erro na API badges consolidada:', error)
    return NextResponse.json({ 
      success: true,
      badges: {
        checklist: 0, producao: 0, contaazul: 0, marketing: 0,
        configuracoes: 0, notifications: 0, home: 0, visaoGeral: 0
      }
    })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
} 
