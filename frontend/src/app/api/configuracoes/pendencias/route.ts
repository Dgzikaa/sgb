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
    
    let totalConfiguracoesPendentes = 0

    // 1. Integrações inativas ou com erro
    const { data: integracoes, error: integracoesError } = await supabase
      .from('api_credentials')
      .select('id, sistema, status_conexao')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .neq('status_conexao', 'ativo')

    if (!integracoesError && integracoes) {
      totalConfiguracoesPendentes += integracoes.length
    }

    // 2. Checklists sem configuração ou inativos
    const { data: checklistsInativos, error: checklistsError } = await supabase
      .from('checklists')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('ativo', false)

    if (!checklistsError && checklistsInativos) {
      totalConfiguracoesPendentes += checklistsInativos.length
    }

    // 3. Metas sem configuração ou não ativas
    const { data: metasInativas, error: metasError } = await supabase
      .from('metas_negocio')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('meta_ativa', false)

    if (!metasError && metasInativas) {
      totalConfiguracoesPendentes += metasInativas.length
    }

    // 4. Webhooks não configurados
    const { data: webhooksNaoConfig, error: webhooksError } = await supabase
      .from('api_credentials')
      .select('id, sistema')
      .eq('bar_id', bar_id)
      .is('webhook_url', null)

    if (!webhooksError && webhooksNaoConfig) {
      totalConfiguracoesPendentes += webhooksNaoConfig.length
    }

    // 5. Usuários sem permissões definidas
    const { data: usuariosSemPermissao, error: usuariosError } = await supabase
      .from('usuarios')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('ativo', true)
      .or('modulos_permitidos.is.null,modulos_permitidos.eq.{}')

    if (!usuariosError && usuariosSemPermissao) {
      totalConfiguracoesPendentes += usuariosSemPermissao.length
    }

    // 6. Templates não configurados
    const { data: templatesNaoConfig, error: templatesError } = await supabase
      .from('templates')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('ativo', false)

    if (!templatesError && templatesNaoConfig) {
      totalConfiguracoesPendentes += templatesNaoConfig.length
    }

    // 7. Configurações de segurança pendentes
    const { data: configSeguranca, error: segurancaError } = await supabase
      .from('security_settings')
      .select('id')
      .eq('bar_id', bar_id)
      .eq('configurado', false)

    if (!segurancaError && configSeguranca) {
      totalConfiguracoesPendentes += configSeguranca.length
    }

    return NextResponse.json({
      success: true,
      total_configuracoes_pendentes: totalConfiguracoesPendentes,
      detalhes: {
        integracoes_inativas: integracoes?.length || 0,
        checklists_inativos: checklistsInativos?.length || 0,
        metas_inativas: metasInativas?.length || 0,
        webhooks_nao_configurados: webhooksNaoConfig?.length || 0,
        usuarios_sem_permissao: usuariosSemPermissao?.length || 0,
        templates_nao_configurados: templatesNaoConfig?.length || 0,
        config_seguranca_pendente: configSeguranca?.length || 0,
        total: totalConfiguracoesPendentes
      }
    })

  } catch (error) {
    console.error('Erro na API configuracoes/pendencias:', error)
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      total_configuracoes_pendentes: 0 
    }, { status: 500 })
  }
} 