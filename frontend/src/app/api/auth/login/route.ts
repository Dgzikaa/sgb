import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { logLoginSuccess, logLoginFailure } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  console.log('Ã°Å¸Å¡â‚¬ API de login iniciada')
  
  // Capturar informaÃ¡Â§Ã¡Âµes do cliente para logging
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const sessionId = request.headers.get('x-session-id') || `session_${Date.now()}`;
  
  // Verificar variÃ¡Â¡veis de ambiente logo no inÃ¡Â­cio
  console.log('Ã°Å¸â€Â Verificando variÃ¡Â¡veis de ambiente...')
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'FALTANDO')
  console.log('ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'FALTANDO')
  console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO')
  console.log('SERVICE_ROLE_KEY_ALT:', process.env.SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO')
  
  try {
    const { email, senha } = await request.json()

    console.log('Ã°Å¸â€Â Tentativa de login:', { email })

    if (!email || !senha) {
      await logLoginFailure({
        email: email || 'nÃ¡Â£o fornecido',
        reason: 'Email e senha sÃ¡Â£o obrigatÃ¡Â³rios',
        ipAddress: clientIp,
        userAgent,
        sessionId
      });
      
      return NextResponse.json(
        { success: false, error: 'Email e senha sÃ¡Â£o obrigatÃ¡Â³rios' },
        { status: 400 }
      )
    }

    console.log('Ã°Å¸â€â€˜ Iniciando autenticaÃ¡Â§Ã¡Â£o com Supabase Auth...')

    // Obter cliente administrativo
    let adminClient
    try {
      adminClient = await getAdminClient()
    } catch (adminError) {
      console.error('ÂÅ’ Erro ao obter cliente administrativo:', adminError)
      return NextResponse.json(
        { success: false, error: 'ConfiguraÃ¡Â§Ã¡Â£o administrativa nÃ¡Â£o disponÃ¡Â­vel' },
        { status: 500 }
      )
    }

    // Criar cliente para autenticaÃ¡Â§Ã¡Â£o (sem service role)
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('Ã°Å¸â€Â Tentando autenticar usuÃ¡Â¡rio...')

    // Tentar autenticar com Supabase Auth
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password: senha
    })

    if (authError || !authData.user) {
      console.log('ÂÅ’ Falha na autenticaÃ¡Â§Ã¡Â£o:', authError?.message)
      
      await logLoginFailure({
        email,
        reason: authError?.message || 'UsuÃ¡Â¡rio nÃ¡Â£o encontrado',
        ipAddress: clientIp,
        userAgent,
        sessionId
      });
      
      return NextResponse.json(
        { success: false, error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    console.log('Å“â€¦ AutenticaÃ¡Â§Ã¡Â£o bem-sucedida. User ID:', authData.user.id)
    console.log('Ã°Å¸â€œÅ  Buscando dados do usuÃ¡Â¡rio na tabela usuarios_bar...')

    // Buscar dados do usuÃ¡Â¡rio na tabela usuarios_bar
    let { data: usuarios, error: dbError } = await adminClient
      .from('usuarios_bar')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('ativo', true)

    console.log('Ã°Å¸â€Â Query executada - User ID:', authData.user.id)
    console.log('Ã°Å¸â€Â UsuÃ¡Â¡rios encontrados:', usuarios?.length || 0)
    
    // Se nÃ¡Â£o encontrou usuÃ¡Â¡rio ativo, tentar buscar qualquer usuÃ¡Â¡rio com esse user_id
    if (!usuarios || usuarios.length === 0) {
      const { data: todosUsuarios } = await adminClient
        .from('usuarios_bar')
        .select('*')
        .eq('user_id', authData.user.id)
      
      console.log('Ã°Å¸â€Â Todos os usuÃ¡Â¡rios (incluindo inativos):', todosUsuarios?.length || 0)
      if (todosUsuarios && todosUsuarios.length > 0) {
        console.log('Ã°Å¸â€Â UsuÃ¡Â¡rio encontrado mas inativo:', todosUsuarios[0])
      }
      
      // TambÃ¡Â©m tentar buscar por email
      const { data: usuariosPorEmail } = await adminClient
        .from('usuarios_bar')
        .select('*')
        .eq('email', email)
      
      console.log('Ã°Å¸â€Â UsuÃ¡Â¡rios encontrados por email:', usuariosPorEmail?.length || 0)
      if (usuariosPorEmail && usuariosPorEmail.length > 0) {
        console.log('Ã°Å¸â€Â UsuÃ¡Â¡rio por email:', usuariosPorEmail[0])
      }
    }

    if (dbError) {
      console.error('ÂÅ’ Erro ao buscar usuÃ¡Â¡rio no banco:', dbError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('ÂÅ’ UsuÃ¡Â¡rio nÃ¡Â£o encontrado na tabela usuarios_bar')
      
      // Verificar se existe usuÃ¡Â¡rio por email mas com user_id diferente
      const { data: usuariosPorEmail } = await adminClient
        .from('usuarios_bar')
        .select('*')
        .eq('email', email)
      
      if (usuariosPorEmail && usuariosPorEmail.length > 0) {
        const usuarioExistente = usuariosPorEmail[0]
        console.log('Ã°Å¸â€Â§ Detectado user_id desatualizado. Corrigindo...')
        console.log('Ã°Å¸â€Â§ ID antigo:', usuarioExistente.user_id)
        console.log('Ã°Å¸â€Â§ ID novo:', authData.user.id)
        
        // Atualizar o user_id na tabela para corresponder ao Supabase Auth
        const { error: updateError } = await adminClient
          .from('usuarios_bar')
          .update({ user_id: authData.user.id })
          .eq('email', email)
        
        if (updateError) {
          console.error('ÂÅ’ Erro ao atualizar user_id:', updateError)
          return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
          )
        }
        
        console.log('Å“â€¦ User_id atualizado com sucesso!')
        
        // Buscar novamente o usuÃ¡Â¡rio com o ID atualizado
        const { data: usuariosAtualizados, error: newDbError } = await adminClient
          .from('usuarios_bar')
          .select('*')
          .eq('user_id', authData.user.id)
          .eq('ativo', true)
        
        if (newDbError) {
          console.error('ÂÅ’ Erro ao buscar usuÃ¡Â¡rio atualizado:', newDbError)
          return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
          )
        }
        
        if (usuariosAtualizados && usuariosAtualizados.length > 0) {
          // Continuar com o fluxo normal usando os dados atualizados
          usuarios = usuariosAtualizados
          console.log('Å“â€¦ Login continuando com dados atualizados')
        }
      }
      
      // Se ainda nÃ¡Â£o encontrou usuÃ¡Â¡rio, retornar erro
      if (!usuarios || usuarios.length === 0) {
        await logLoginFailure({
          email,
          reason: 'UsuÃ¡Â¡rio nÃ¡Â£o encontrado ou inativo na tabela usuarios_bar',
          ipAddress: clientIp,
          userAgent,
          sessionId
        });
        
        return NextResponse.json(
          { success: false, error: 'UsuÃ¡Â¡rio nÃ¡Â£o encontrado ou inativo' },
          { status: 401 }
        )
      }
    }

    console.log('Å“â€¦ UsuÃ¡Â¡rio encontrado:', usuarios[0].nome)

    // Montar dados do usuÃ¡Â¡rio
    const usuarioPrincipal = usuarios[0]

    // Verificar se precisa redefinir senha (primeiro acesso)
    if (!usuarioPrincipal.senha_redefinida) {
      console.log('Ã°Å¸â€â€˜ Primeiro acesso detectado - redirecionando para redefiniÃ¡Â§Ã¡Â£o de senha')
      
      // Gerar token para redefiniÃ¡Â§Ã¡Â£o
      const token = Buffer.from(`${usuarioPrincipal.email}:${Date.now()}`).toString('base64')
      
      // Detectar automaticamente o domÃ¡Â­nio baseado no request
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
      
      let baseUrl
      if (host?.includes('vercel.app') || host?.includes('sgbv2')) {
        baseUrl = `${protocol}://${host}`
      } else if (host?.includes('localhost')) {
        baseUrl = `http://${host}`
      } else {
        // Fallback para produÃ¡Â§Ã¡Â£o
        baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sgbv2.vercel.app'
      }
      
      const linkRedefinicao = `${baseUrl}/redefinir-senha?email=${encodeURIComponent(usuarioPrincipal.email)}&token=${token}`
      
      return NextResponse.json({
        success: false,
        requirePasswordReset: true,
        redirectUrl: linkRedefinicao,
        user: {
          nome: usuarioPrincipal.nome,
          email: usuarioPrincipal.email
        },
        message: 'Ã¡â€° necessÃ¡Â¡rio redefinir sua senha no primeiro acesso'
      })
    }
    
    const baresAcesso = usuarios.map((u: any) => ({
      bar_id: u.bar_id,
      role: u.role,
      modulos_permitidos: u.modulos_permitidos
    }))

    console.log('Ã°Å¸â€Â Buscando dados completos dos bares...')
    
    // Buscar dados completos dos bares (incluindo nome)
    const barIds = [...new Set(baresAcesso.map((b: any) => b.bar_id))]
    const { data: barsData, error: barsError } = await adminClient
      .from('bars')
      .select('id, nome')
      .in('id', barIds)
      .eq('ativo', true)

    if (barsError) {
      console.error('ÂÅ’ Erro ao buscar dados dos bares:', barsError)
    }

    console.log('Å“â€¦ Dados dos bares encontrados:', barsData?.length || 0)

    // Enriquecer baresAcesso com nome dos bares
    const baresComNome = baresAcesso.map((bar: any) => {
      const barData = barsData?.find((b: any) => b.id === bar.bar_id)
      return {
        ...bar,
        id: bar.bar_id, // Para compatibilidade com BarContext
        nome: barData?.nome || `Bar ${bar.bar_id}`
      }
    })

    console.log('Ã°Å¸â€Â Buscando credenciais de APIs...')
    
    // Buscar credenciais de APIs
    const credenciaisPromises = baresComNome.map(async (bar: any) => {
      const { data: credenciais } = await adminClient
        .from('api_credentials')
        .select('*')
        .eq('bar_id', bar.bar_id)
        .eq('ativo', true)

      return {
        bar_id: bar.bar_id,
        credenciais: credenciais || []
      }
    })

    const credenciaisPorBar = await Promise.all(credenciaisPromises)
    console.log('Å“â€¦ Credenciais encontradas para', credenciaisPorBar.length, 'bares')

    // Fazer logout do authClient (nÃ¡Â£o queremos manter sessÃ¡Â£o no servidor)
    await authClient.auth.signOut()

    const response = {
      success: true,
      user: {
        ...usuarioPrincipal,
        availableBars: baresComNome,
        credenciais_apis: credenciaisPorBar
      }
    }

    console.log('Ã°Å¸Å½â€° LOGIN BEM-SUCEDIDO para:', usuarioPrincipal.nome)
    
    // Log de login bem-sucedido
    await logLoginSuccess({
      userId: usuarioPrincipal.user_id,
      userEmail: usuarioPrincipal.email,
      userName: usuarioPrincipal.nome,
      userRole: usuarioPrincipal.role,
      barId: usuarioPrincipal.bar_id,
      ipAddress: clientIp,
      userAgent,
      sessionId
    });
    
    // Criar resposta com cookie para o middleware
    const nextResponse = NextResponse.json(response)
    
    // Salvar cookie com dados bÃ¡Â¡sicos do usuÃ¡Â¡rio (para middleware)
    const userCookie = {
      id: usuarioPrincipal.id,
      email: usuarioPrincipal.email,
      nome: usuarioPrincipal.nome,
      role: usuarioPrincipal.role
    }
    
    nextResponse.cookies.set('sgb_user', JSON.stringify(userCookie), {
      httpOnly: false, // Permitir acesso via JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7 // 7 dias
    })
    
    return nextResponse

  } catch (error) {
    console.error('Ã°Å¸â€Â¥ Erro fatal na API de login:', error)
    
    // Log de erro interno 
    await logLoginFailure({
      email: 'unknown',
      reason: `Erro interno do servidor: ${(error as any).message}`,
      ipAddress: clientIp,
      userAgent,
      sessionId
    });
    
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
} 

