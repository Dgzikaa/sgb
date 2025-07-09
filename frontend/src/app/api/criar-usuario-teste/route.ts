import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verificar se tem as variáveis
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ 
        error: 'Variáveis de ambiente não configuradas',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!serviceKey
        }
      }, { status: 500 });
    }

    // Criar cliente Supabase
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Email e senha do usuário teste
    const email = 'teste@sgbsistema.com';
    const senha = 'teste123';
    const nome = 'Usuário Teste';

    // Criar usuário no Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true
    });

    if (authError && !authError.message.includes('already registered')) {
      return NextResponse.json({ 
        error: 'Erro ao criar usuário no Auth',
        details: authError.message
      }, { status: 500 });
    }

    // Obter o user_id
    let userId = authUser?.user?.id;
    
    // Se o usuário já existe, buscar o ID pela tabela auth.users
    if (!userId) {
      const { data: existingUsers } = await supabase
        .from('auth.users')
        .select('id')
        .eq('email', email)
        .single();
      
      userId = existingUsers?.id;
    }

    if (!userId) {
      return NextResponse.json({ 
        error: 'Não foi possível obter o ID do usuário'
      }, { status: 500 });
    }

    // Verificar se já existe na tabela usuarios_bar
    const { data: existing } = await supabase
      .from('usuarios_bar')
      .select('*')
      .eq('email', email)
      .single();

    if (existing) {
      // Atualizar usuário existente
      await supabase
        .from('usuarios_bar')
        .update({
          user_id: userId,
          ativo: true,
          senha_redefinida: true
        })
        .eq('email', email);

      return NextResponse.json({
        message: 'Usuário teste já existe e foi atualizado',
        credentials: {
          email,
          senha,
          info: 'Use estas credenciais para fazer login'
        }
      });
    }

    // Criar novo usuário na tabela usuarios_bar
    const { error: dbError } = await supabase
      .from('usuarios_bar')
      .insert({
        user_id: userId,
        bar_id: 1, // Bar ID padrão
        email,
        nome,
        role: 'admin',
        ativo: true,
        senha_redefinida: true,
        modulos_permitidos: ['todos']
      });

    if (dbError) {
      return NextResponse.json({ 
        error: 'Erro ao criar usuário no banco',
        details: dbError.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Usuário teste criado com sucesso!',
      credentials: {
        email,
        senha,
        info: 'Use estas credenciais para fazer login'
      }
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro inesperado',
      details: error.message
    }, { status: 500 });
  }
} 