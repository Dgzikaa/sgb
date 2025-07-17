import { NextRequest, NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase-admin'
import { createClient } from '@supabase/supabase-js'
import { logLoginSuccess, logLoginFailure } from '@/lib/audit-logger'

export async function POST(request: NextRequest) {
  console.log('ðŸš€ API de login iniciada')
  
  // Capturar informaá§áµes do cliente para logging
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const sessionId = request.headers.get('x-session-id') || `session_${Date.now()}`;
  
  // Verificar variá¡veis de ambiente logo no iná­cio
  console.log('ðŸ” Verificando variá¡veis de ambiente...')
  console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'FALTANDO')
  console.log('ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'FALTANDO')
  console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO')
  console.log('SERVICE_ROLE_KEY_ALT:', process.env.SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO')
  
  try {
    const { email, senha } = await request.json()

    console.log('ðŸ” Tentativa de login:', { email })

    if (!email || !senha) {
      await logLoginFailure({
        email: email || 'ná£o fornecido',
        reason: 'Email e senha sá£o obrigatá³rios',
        ipAddress: clientIp,
        userAgent,
        sessionId
      });
      
      return NextResponse.json(
        { success: false, error: 'Email e senha sá£o obrigatá³rios' },
        { status: 400 }
      )
    }

    console.log('ðŸ”‘ Iniciando autenticaá§á£o com Supabase Auth...')

    // Obter cliente administrativo
    let adminClient
    try {
      adminClient = await getAdminClient()
    } catch (adminError) {
      console.error('Œ Erro ao obter cliente administrativo:', adminError)
      return NextResponse.json(
        { success: false, error: 'Configuraá§á£o administrativa ná£o disponá­vel' },
        { status: 500 }
      )
    }

    // Criar cliente para autenticaá§á£o (sem service role)
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('ðŸ” Tentando autenticar usuá¡rio...')

    // Tentar autenticar com Supabase Auth
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email,
      password: senha
    })

    if (authError || !authData.user) {
      console.log('Œ Falha na autenticaá§á£o:', authError?.message)
      
      await logLoginFailure({
        email,
        reason: authError?.message || 'Usuá¡rio ná£o encontrado',
        ipAddress: clientIp,
        userAgent,
        sessionId
      });
      
      return NextResponse.json(
        { success: false, error: 'Email ou senha incorretos' },
        { status: 401 }
      )
    }

    console.log('œ… Autenticaá§á£o bem-sucedida. User ID:', authData.user.id)
    console.log('ðŸ“Š Buscando dados do usuá¡rio na tabela usuarios_bar...')

    // Buscar dados do usuá¡rio na tabela usuarios_bar
    let { data: usuarios, error: dbError } = await adminClient
      .from('usuarios_bar')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('ativo', true)

    console.log('ðŸ” Query executada - User ID:', authData.user.id)
    console.log('ðŸ” Usuá¡rios encontrados:', usuarios?.length || 0)
    
    // Se ná£o encontrou usuá¡rio ativo, tentar buscar qualquer usuá¡rio com esse user_id
    if (!usuarios || usuarios.length === 0) {
      const { data: todosUsuarios } = await adminClient
        .from('usuarios_bar')
        .select('*')
        .eq('user_id', authData.user.id)
      
      console.log('ðŸ” Todos os usuá¡rios (incluindo inativos):', todosUsuarios?.length || 0)
      if (todosUsuarios && todosUsuarios.length > 0) {
        console.log('ðŸ” Usuá¡rio encontrado mas inativo:', todosUsuarios[0])
      }
      
      // Tambá©m tentar buscar por email
      const { data: usuariosPorEmail } = await adminClient
        .from('usuarios_bar')
        .select('*')
        .eq('email', email)
      
      console.log('ðŸ” Usuá¡rios encontrados por email:', usuariosPorEmail?.length || 0)
      if (usuariosPorEmail && usuariosPorEmail.length > 0) {
        console.log('ðŸ” Usuá¡rio por email:', usuariosPorEmail[0])
      }
    }

    if (dbError) {
      console.error('Œ Erro ao buscar usuá¡rio no banco:', dbError)
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      )
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('Œ Usuá¡rio ná£o encontrado na tabela usuarios_bar')
      
      // Verificar se existe usuá¡rio por email mas com user_id diferente
      const { data: usuariosPorEmail } = await adminClient
        .from('usuarios_bar')
        .select('*')
        .eq('email', email)
      
      if (usuariosPorEmail && usuariosPorEmail.length > 0) {
        const usuarioExistente = usuariosPorEmail[0]
        console.log('ðŸ”§ Detectado user_id desatualizado. Corrigindo...')
        console.log('ðŸ”§ ID antigo:', usuarioExistente.user_id)
        console.log('ðŸ”§ ID novo:', authData.user.id)
        
        // Atualizar o user_id na tabela para corresponder ao Supabase Auth
        const { error: updateError } = await adminClient
          .from('usuarios_bar')
          .update({ user_id: authData.user.id })
          .eq('email', email)
        
        if (updateError) {
          console.error('Œ Erro ao atualizar user_id:', updateError)
          return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
          )
        }
        
        console.log('œ… User_id atualizado com sucesso!')
        
        // Buscar novamente o usuá¡rio com o ID atualizado
        const { data: usuariosAtualizados, error: newDbError } = await adminClient
          .from('usuarios_bar')
          .select('*')
          .eq('user_id', authData.user.id)
          .eq('ativo', true)
        
        if (newDbError) {
          console.error('Œ Erro ao buscar usuá¡rio atualizado:', newDbError)
          return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
          )
        }
        
        if (usuariosAtualizados && usuariosAtualizados.length > 0) {
          // Continuar com o fluxo normal usando os dados atualizados
          usuarios = usuariosAtualizados
          console.log('œ… Login continuando com dados atualizados')
        }
      }
      
      // Se ainda ná£o encontrou usuá¡rio, retornar erro
      if (!usuarios || usuarios.length === 0) {
        await logLoginFailure({
          email,
          reason: 'Usuá¡rio ná£o encontrado ou inativo na tabela usuarios_bar',
          ipAddress: clientIp,
          userAgent,
          sessionId
        });
        
        return NextResponse.json(
          { success: false, error: 'Usuá¡rio ná£o encontrado ou inativo' },
          { status: 401 }
        )
      }
    }

    console.log('œ… Usuá¡rio encontrado:', usuarios[0].nome)

    // Montar dados do usuá¡rio
    const usuarioPrincipal = usuarios[0]

    // Verificar se precisa redefinir senha (primeiro acesso)
    if (!usuarioPrincipal.senha_redefinida) {
      console.log('ðŸ”‘ Primeiro acesso detectado - redirecionando para redefiniá§á£o de senha')
      
      // Gerar token para redefiniá§á£o
      const token = Buffer.from(`${usuarioPrincipal.email}:${Date.now()}`).toString('base64')
      
      // Detectar automaticamente o domá­nio baseado no request
      const protocol = request.headers.get('x-forwarded-proto') || 'https'
      const host = request.headers.get('host') || request.headers.get('x-forwarded-host')
      
      let baseUrl
      if (host?.includes('vercel.app') || host?.includes('sgbv2')) {
        baseUrl = `${protocol}://${host}`
      } else if (host?.includes('localhost')) {
        baseUrl = `http://${host}`
      } else {
        // Fallback para produá§á£o
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
        message: 'á‰ necessá¡rio redefinir sua senha no primeiro acesso'
      })
    }
    
    const baresAcesso = usuarios.map((u: any) => ({
      bar_id: u.bar_id,
      role: u.role,
      modulos_permitidos: u.modulos_permitidos
    }))

    console.log('ðŸ” Buscando dados completos dos bares...')
    
    // Buscar dados completos dos bares (incluindo nome)
    const barIds = [...new Set(baresAcesso.map((b: any) => b.bar_id))]
    const { data: barsData, error: barsError } = await adminClient
      .from('bars')
      .select('id, nome')
      .in('id', barIds)
      .eq('ativo', true)

    if (barsError) {
      console.error('Œ Erro ao buscar dados dos bares:', barsError)
    }

    console.log('œ… Dados dos bares encontrados:', barsData?.length || 0)

    // Enriquecer baresAcesso com nome dos bares
    const baresComNome = baresAcesso.map((bar: any) => {
      const barData = barsData?.find((b: any) => b.id === bar.bar_id)
      return {
        ...bar,
        id: bar.bar_id, // Para compatibilidade com BarContext
        nome: barData?.nome || `Bar ${bar.bar_id}`
      }
    })

    console.log('ðŸ” Buscando credenciais de APIs...')
    
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
    console.log('œ… Credenciais encontradas para', credenciaisPorBar.length, 'bares')

    // Fazer logout do authClient (ná£o queremos manter sessá£o no servidor)
    await authClient.auth.signOut()

    const response = {
      success: true,
      user: {
        ...usuarioPrincipal,
        availableBars: baresComNome,
        credenciais_apis: credenciaisPorBar
      }
    }

    console.log('ðŸŽ‰ LOGIN BEM-SUCEDIDO para:', usuarioPrincipal.nome)
    
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
    
    // Salvar cookie com dados bá¡sicos do usuá¡rio (para middleware)
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

  } catch (error: any) {
    console.error('ðŸ”¥ Erro fatal na API de login:', error)
    
    // Log de erro interno 
    await logLoginFailure({
      email: 'unknown',
      reason: `Erro interno do servidor: ${error.message}`,
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
