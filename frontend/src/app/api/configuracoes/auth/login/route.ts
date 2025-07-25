import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminClient } from '@/lib/supabase-admin';

// ========================================
// 🔐 API PARA AUTENTICAÇÃO
// ========================================

interface UsuarioBar {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  ativo: boolean;
  senha_redefinida: boolean;
  permissao: string;
  bar_id: string;
  modulos_permitidos?: string[];
}

interface LoginFailureLog {
  email: string;
  reason: string;
  ipAddress: string;
  userAgent: string;
  sessionId: string;
}

// Função temporária para log de falha
async function logLoginFailure(data: LoginFailureLog) {
  console.log('❌ Login failed:', data);
  // TODO: Implementar log real
}

// ========================================
// 🔐 POST /api/auth/login
// ========================================

export async function POST(request: NextRequest) {
  console.log('🚀 API de login iniciada');

  // Capturar informações do cliente para logging
  const forwarded = request.headers.get('x-forwarded-for');
  const clientIp = forwarded
    ? forwarded.split(',')[0]
    : request.headers.get('x-real-ip') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const sessionId =
    request.headers.get('x-session-id') || `session_${Date.now()}`;

  // Verificar variáveis de ambiente logo no início
  console.log('🔍 Verificando variáveis de ambiente...');
  console.log(
    'SUPABASE_URL:',
    process.env.NEXT_PUBLIC_SUPABASE_URL ? 'OK' : 'FALTANDO'
  );
  console.log(
    'ANON_KEY:',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'FALTANDO'
  );
  console.log(
    'SERVICE_ROLE_KEY:',
    process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO'
  );
  console.log(
    'SERVICE_ROLE_KEY_ALT:',
    process.env.SERVICE_ROLE_KEY ? 'OK' : 'FALTANDO'
  );

  try {
    const { email, password, senha } = await request.json();

    // Aceitar tanto 'password' quanto 'senha' para compatibilidade
    const userPassword = password || senha;

    console.log('🔐 Tentativa de login:', { email });

    if (!email || !userPassword) {
      await logLoginFailure({
        email: email || 'não fornecido',
        reason: 'Email e senha são obrigatórios',
        ipAddress: clientIp,
        userAgent,
        sessionId,
      });

      return NextResponse.json(
        { success: false, error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    console.log('🔑 Iniciando autenticação com Supabase Auth...');

    // Obter cliente administrativo
    let adminClient;
    try {
      adminClient = await getAdminClient();
    } catch (adminError) {
      console.error('❌ Erro ao obter cliente administrativo:', adminError);
      return NextResponse.json(
        { success: false, error: 'Configuração administrativa não disponível' },
        { status: 500 }
      );
    }

    // Criar cliente para autenticação (sem service role)
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    console.log('🔍 Tentando autenticar usuário...');

    // Tentar autenticar com Supabase Auth
    const { data: authData, error: authError } =
      await authClient.auth.signInWithPassword({
        email,
        password: userPassword,
      });

    if (authError || !authData.user) {
      console.log('❌ Falha na autenticação:', authError?.message);

      await logLoginFailure({
        email,
        reason: authError?.message || 'Usuário não encontrado',
        ipAddress: clientIp,
        userAgent,
        sessionId,
      });

      return NextResponse.json(
        { success: false, error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    console.log('✅ Autenticação bem-sucedida. User ID:', authData.user.id);
    console.log('📊 Buscando dados do usuário na tabela usuarios_bar...');

    // Buscar dados do usuário na tabela usuarios_bar
    const { data: usuarios, error: dbError } = await adminClient
      .from('usuarios_bar')
      .select('*')
      .eq('user_id', authData.user.id)
      .eq('ativo', true);

    console.log('🔍 Query executada - User ID:', authData.user.id);
    console.log('🔍 Usuários encontrados:', usuarios?.length || 0);

    // Se não encontrou usuário ativo, tentar buscar qualquer usuário com esse user_id
    if (!usuarios || usuarios.length === 0) {
      const { data: todosUsuarios } = await adminClient
        .from('usuarios_bar')
        .select('*')
        .eq('user_id', authData.user.id);

      console.log(
        '🔍 Todos os usuários (incluindo inativos):',
        todosUsuarios?.length || 0
      );
      if (todosUsuarios && todosUsuarios.length > 0) {
        console.log('🔍 Usuário encontrado mas inativo:', todosUsuarios[0]);
      }

      // Também tentar buscar por email
      const { data: usuariosPorEmail } = await adminClient
        .from('usuarios_bar')
        .select('*')
        .eq('email', email);

      console.log(
        '🔍 Usuários encontrados por email:',
        usuariosPorEmail?.length || 0
      );
      if (usuariosPorEmail && usuariosPorEmail.length > 0) {
        console.log('🔍 Usuário por email:', usuariosPorEmail[0]);
      }
    }

    if (dbError) {
      console.error('❌ Erro ao buscar usuário no banco:', dbError);
      return NextResponse.json(
        { success: false, error: 'Erro interno do servidor' },
        { status: 500 }
      );
    }

    let usuariosAtivos = usuarios;
    if (!usuariosAtivos || usuariosAtivos.length === 0) {
      console.log('❌ Usuário não encontrado na tabela usuarios_bar');

      // Verificar se existe usuário por email mas com user_id diferente
      const { data: usuariosPorEmail } = await adminClient
        .from('usuarios_bar')
        .select('*')
        .eq('email', email);

      if (usuariosPorEmail && usuariosPorEmail.length > 0) {
        const usuarioExistente = usuariosPorEmail[0];
        console.log('🔧 Detectado user_id desatualizado. Corrigindo...');
        console.log('🔧 ID antigo:', usuarioExistente.user_id);
        console.log('🔧 ID novo:', authData.user.id);

        // Atualizar o user_id na tabela para corresponder ao Supabase Auth
        const { error: updateError } = await adminClient
          .from('usuarios_bar')
          .update({ user_id: authData.user.id })
          .eq('email', email);

        if (updateError) {
          console.error('❌ Erro ao atualizar user_id:', updateError);
          return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
          );
        }

        console.log('✅ User_id atualizado com sucesso!');

        // Buscar novamente o usuário com o ID atualizado
        const { data: usuariosAtualizados, error: newDbError } =
          await adminClient
            .from('usuarios_bar')
            .select('*')
            .eq('user_id', authData.user.id)
            .eq('ativo', true);

        if (newDbError) {
          console.error('❌ Erro ao buscar usuário atualizado:', newDbError);
          return NextResponse.json(
            { success: false, error: 'Erro interno do servidor' },
            { status: 500 }
          );
        }

        if (usuariosAtualizados && usuariosAtualizados.length > 0) {
          // Continuar com o fluxo normal usando os dados atualizados
          usuariosAtivos = usuariosAtualizados;
          console.log('✅ Login continuando com dados atualizados');
        }
      }

      // Se ainda não encontrou usuário, retornar erro
      if (!usuariosAtivos || usuariosAtivos.length === 0) {
        await logLoginFailure({
          email,
          reason: 'Usuário não encontrado ou inativo na tabela usuarios_bar',
          ipAddress: clientIp,
          userAgent,
          sessionId,
        });

        return NextResponse.json(
          { success: false, error: 'Usuário não encontrado ou inativo' },
          { status: 401 }
        );
      }
    }

    console.log('✅ Usuário encontrado:', usuariosAtivos[0].nome);

    // Montar dados do usuário
    const usuarioPrincipal = usuariosAtivos[0];

    // Verificar se precisa redefinir senha (primeiro acesso)
    if (!usuarioPrincipal.senha_redefinida) {
      console.log(
        '🔑 Primeiro acesso detectado - redirecionando para redefinição de senha'
      );

      // Gerar token para redefinição
      const token = Buffer.from(
        `${usuarioPrincipal.email}:${Date.now()}`
      ).toString('base64');

      // Detectar automaticamente o domínio baseado no request
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const host =
        request.headers.get('host') || request.headers.get('x-forwarded-host');

      let baseUrl;
      if (host?.includes('vercel.app') || host?.includes('sgbv2')) {
        baseUrl = `${protocol}://${host}`;
      } else if (host?.includes('localhost')) {
        baseUrl = `http://${host}`;
      } else {
        // Fallback para produção
        baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sgbv2.vercel.app';
      }

      const linkRedefinicao = `${baseUrl}/usuarios/redefinir-senha?email=${encodeURIComponent(usuarioPrincipal.email)}&token=${token}`;

      return NextResponse.json({
        success: false,
        requirePasswordReset: true,
        redirectUrl: linkRedefinicao,
        user: {
          nome: usuarioPrincipal.nome,
          email: usuarioPrincipal.email,
        },
        message: 'É necessário redefinir sua senha no primeiro acesso',
      });
    }

    const baresAcesso = usuariosAtivos.map((u: UsuarioBar) => ({
      bar_id: u.bar_id,
      role: u.permissao,
      modulos_permitidos: u.modulos_permitidos, // Assuming modulos_permitidos is part of UsuarioBar
    }));

    console.log('🔍 Buscando dados completos dos bares...');

    // Buscar dados completos dos bares (incluindo nome)
    const barIds = [
      ...new Set(baresAcesso.map((b: { bar_id: string }) => b.bar_id)),
    ];
    const { data: barsData, error: barsError } = await adminClient
      .from('bars')
      .select('id, nome')
      .in('id', barIds)
      .eq('ativo', true);

    if (barsError) {
      console.error('❌ Erro ao buscar dados dos bares:', barsError);
    }

    console.log('✅ Dados dos bares encontrados:', barsData?.length || 0);

    // Enriquecer baresAcesso com nome dos bares
    const baresComNome = baresAcesso.map(
      (bar: {
        bar_id: string;
        role: string;
        modulos_permitidos?: string[];
      }) => {
        const barData = barsData?.find(
          (b: { id: string; nome: string }) => b.id === bar.bar_id
        );
        return {
          ...bar,
          id: bar.bar_id, // Para compatibilidade com BarContext
          nome: barData?.nome || `Bar ${bar.bar_id}`,
        };
      }
    );

    console.log('🔍 Buscando credenciais de APIs...');

    // Buscar credenciais de APIs
    const credenciaisPromises = baresComNome.map(
      async (bar: { bar_id: string }) => {
        const { data: credenciais } = await adminClient
          .from('api_credentials')
          .select('*')
          .eq('bar_id', bar.bar_id)
          .eq('ativo', true);

        return {
          bar_id: bar.bar_id,
          credenciais: credenciais || [],
        };
      }
    );

    const credenciaisPorBar = await Promise.all(credenciaisPromises);
    console.log(
      '✅ Credenciais encontradas para',
      credenciaisPorBar.length,
      'bares'
    );

    // Fazer logout do authClient (não queremos manter sessão no servidor)
    await authClient.auth.signOut();

    const response = {
      success: true,
      user: {
        ...usuarioPrincipal,
        availableBars: baresComNome,
        credenciais_apis: credenciaisPorBar,
      },
    };

    console.log('🎉 LOGIN BEM-SUCEDIDO para:', usuarioPrincipal.nome);

    // Criar resposta com cookie para o middleware
    const nextResponse = NextResponse.json(response);

    // Salvar cookie com dados básicos do usuário (para middleware)
    const userCookie = {
      id: usuarioPrincipal.id,
      email: usuarioPrincipal.email,
      nome: usuarioPrincipal.nome,
      role: usuarioPrincipal.permissao,
    };

    nextResponse.cookies.set('sgb_user', JSON.stringify(userCookie), {
      httpOnly: false, // Permitir acesso via JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 dias
    });

    return nextResponse;
  } catch (error: unknown) {
    console.error('🔥 Erro fatal na API de login:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido';

    // Log de erro interno
    await logLoginFailure({
      email: 'unknown',
      reason: `Erro interno do servidor: ${errorMessage}`,
      ipAddress: clientIp,
      userAgent,
      sessionId,
    });

    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
