import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    const supabase = createClient(supabaseUrl, serviceKey);

    // Email e senha do usuário teste
    const email = 'teste@sgbsistema.com';
    const senha = 'teste123';
    const nome = 'Usuário Teste';

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
    // Usar um ID temporário
    const tempUserId = `temp_${Date.now()}`;
    
    const { error: dbError } = await supabase
      .from('usuarios_bar')
      .insert({
        user_id: tempUserId,
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
      },
      nota: 'Este usuário foi criado apenas na tabela usuarios_bar. O login real ainda precisa ser criado no Supabase Auth.'
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Erro inesperado',
      details: error.message
    }, { status: 500 });
  }
} 