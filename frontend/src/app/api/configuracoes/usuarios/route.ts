import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - Listar todos os usuários
export async function GET() {
  try {
    const { data: usuarios, error } = await supabase
      .from('usuarios_bar')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) throw error;

    // Garantir que modulos_permitidos seja sempre um array
    const usuariosFormatados = usuarios?.map(u => {
      let modulosPermitidos: string[] = [];
      
      if (Array.isArray(u.modulos_permitidos)) {
        modulosPermitidos = u.modulos_permitidos;
      } else if (u.modulos_permitidos && typeof u.modulos_permitidos === 'string') {
        // Se vier como string JSON, fazer parse
        try {
          modulosPermitidos = JSON.parse(u.modulos_permitidos);
        } catch {
          modulosPermitidos = [];
        }
      } else if (u.modulos_permitidos && typeof u.modulos_permitidos === 'object') {
        // Se vier como objeto (já parseado pelo Postgres JSONB), usar direto
        modulosPermitidos = u.modulos_permitidos;
      }
      
      return {
        ...u,
        modulos_permitidos: modulosPermitidos
      };
    }) || [];

    return NextResponse.json({ usuarios: usuariosFormatados });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo usuário
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error('❌ Erro ao fazer parse do JSON:', jsonError);
      return NextResponse.json(
        { error: 'Dados JSON inválidos' },
        { status: 400 }
      );
    }
    
    const { email, nome, role, bar_id, modulos_permitidos, ativo = true, celular, telefone, cpf, data_nascimento, endereco, cep, cidade, estado } = body;

    if (!email || !nome || !role || !bar_id) {
      return NextResponse.json(
        { error: 'Email, nome, role e bar são obrigatórios' },
        { status: 400 }
      );
    }

    // Garantir que modulos_permitidos seja um array
    const modulosArray = Array.isArray(modulos_permitidos) ? modulos_permitidos : [];

    // 1. Primeiro criar usuário no Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'TempPassword123!', // Senha temporária - usuário deve redefinir
      email_confirm: true, // Auto-confirmar email
      user_metadata: {
        nome,
        role,
      }
    });

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError);
      return NextResponse.json(
        { error: `Erro ao criar usuário: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authUser.user) {
      return NextResponse.json(
        { error: 'Falha ao criar usuário no sistema de autenticação' },
        { status: 500 }
      );
    }

    // 2. Depois criar registro na tabela usuarios_bar
    const { data: usuario, error } = await supabase
      .from('usuarios_bar')
      .insert({
        user_id: authUser.user.id, // UUID do usuário criado no Auth
        bar_id: parseInt(bar_id),
        email,
        nome,
        role,
        modulos_permitidos: modulosArray,
        ativo,
        celular,
        telefone,
        cpf,
        data_nascimento,
        endereco,
        cep,
        cidade,
        estado,
        senha_redefinida: false, // Marcar que precisa redefinir senha
        criado_em: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Se falhar ao criar na tabela usuarios_bar, remover usuário do Auth
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw error;
    }

    // 3. Enviar email de boas-vindas com credenciais
    let emailSent = false;
    try {
      // Verificar se estamos em desenvolvimento local
      const baseUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : (process.env.NEXT_PUBLIC_APP_URL || 'https://sgbv2.vercel.app');

      const emailResponse = await fetch(`${baseUrl}/api/emails/user-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          nome,
          email,
          senha_temporaria: 'TempPassword123!',
          role,
          loginUrl: baseUrl
        })
      });

      // Verificar se a resposta é JSON válida
      const contentType = emailResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const emailResult = await emailResponse.json();
        
        if (!emailResponse.ok) {
          console.warn('⚠️ Falha ao enviar email de boas-vindas:', emailResult.error);
        } else {
          console.log('✅ Email de boas-vindas enviado com sucesso');
          emailSent = true;
        }
      } else {
        // Resposta não é JSON (provavelmente HTML de erro)
        const textResponse = await emailResponse.text();
        console.warn('⚠️ Resposta não-JSON da API de email:', textResponse.substring(0, 200));
      }
    } catch (emailError) {
      console.warn('⚠️ Erro ao enviar email de boas-vindas:', emailError);
      // Não falhar o cadastro por causa do email
    }

    return NextResponse.json({ 
      usuario,
      message: emailSent 
        ? 'Usuário criado com sucesso! Email com credenciais de acesso foi enviado.' 
        : 'Usuário criado com sucesso! ⚠️ Email não pôde ser enviado - verifique configurações.',
      emailSent,
      credentials: emailSent ? undefined : {
        email,
        senha_temporaria: 'TempPassword123!',
        message: 'Como o email não foi enviado, aqui estão as credenciais:'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar usuário
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, nome, role, modulos_permitidos, ativo, celular, telefone, cpf, data_nascimento, endereco, cep, cidade, estado } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // Garantir que modulos_permitidos seja um array
    const modulosArray = Array.isArray(modulos_permitidos) ? modulos_permitidos : [];

    // 1. Buscar user_id atual para atualizar Auth
    const { data: currentUser, error: fetchError } = await supabase
      .from('usuarios_bar')
      .select('user_id, email as current_email')
      .eq('id', id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // 2. Atualizar Supabase Auth (se houver user_id)
    if (currentUser.user_id) {
      try {
        const authUpdates: any = {
          user_metadata: {
            nome,
            role,
          }
        };

        // Se o email mudou, atualizar também
        if (email && email !== currentUser.current_email) {
          authUpdates.email = email;
          console.log(`📧 Atualizando email no Auth: ${currentUser.current_email} → ${email}`);
        }

        const { error: authError } = await supabase.auth.admin.updateUserById(
          currentUser.user_id,
          authUpdates
        );

        if (authError) {
          console.warn('⚠️ Erro ao atualizar Auth (continuando):', authError.message);
        } else {
          console.log('✅ Supabase Auth atualizado com sucesso');
        }
      } catch (authUpdateError) {
        console.warn('⚠️ Erro ao atualizar Auth:', authUpdateError);
        // Não falhar a operação por isso
      }
    }

    // 3. Atualizar tabela usuarios_bar
    const { data: usuario, error } = await supabase
      .from('usuarios_bar')
      .update({
        email,
        nome,
        role,
        modulos_permitidos: modulosArray,
        ativo,
        celular,
        telefone,
        cpf,
        data_nascimento,
        endereco,
        cep,
        cidade,
        estado,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Usuário ${nome} atualizado com sucesso (ID: ${id})`);

    return NextResponse.json({ 
      usuario, 
      message: 'Usuário atualizado com sucesso',
      auth_updated: !!currentUser.user_id 
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar usuário (exclusão completa)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID do usuário é obrigatório' },
        { status: 400 }
      );
    }

    // 1. Buscar dados do usuário para obter o user_id do Auth
    const { data: usuario, error: fetchError } = await supabase
      .from('usuarios_bar')
      .select('user_id, email, nome')
      .eq('id', id)
      .single();

    if (fetchError || !usuario) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    console.log(`🗑️ Iniciando exclusão completa do usuário: ${usuario.email}`);

    // 2. Excluir da tabela usuarios_bar
    const { error: deleteTableError } = await supabase
      .from('usuarios_bar')
      .delete()
      .eq('id', id);

    if (deleteTableError) {
      console.error('❌ Erro ao excluir da tabela usuarios_bar:', deleteTableError);
      throw deleteTableError;
    }

    console.log('✅ Usuário removido da tabela usuarios_bar');

    // 3. Excluir do Supabase Auth (se user_id existir)
    if (usuario.user_id) {
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(usuario.user_id);
        
        if (authDeleteError) {
          console.warn('⚠️ Erro ao excluir do Auth (usuário pode já ter sido removido):', authDeleteError.message);
        } else {
          console.log('✅ Usuário removido do Supabase Auth');
        }
      } catch (authError) {
        console.warn('⚠️ Erro na exclusão do Auth:', authError);
        // Não falhar a operação se o Auth der erro
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Usuário ${usuario.nome} (${usuario.email}) foi excluído completamente do sistema`
    });

  } catch (error) {
    console.error('❌ Erro ao excluir usuário:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
