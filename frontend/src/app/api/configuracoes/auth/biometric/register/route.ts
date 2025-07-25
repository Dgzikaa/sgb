import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { credentialId, publicKey, userEmail, barId } = await request.json();

    if (!credentialId || !publicKey || !userEmail || !barId) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não fornecidos' },
        { status: 400 }
      );
    }

    console.log('📝 Registrando credencial biométrica para:', userEmail);

    // Buscar usuário na tabela usuarios_bar
    const { data: usuario, error: userError } = await supabase
      .from('usuarios_bar')
      .select('id, biometric_credentials')
      .eq('email', userEmail)
      .eq('bar_id', barId)
      .single();

    if (userError || !usuario) {
      console.error('❌ Usuário não encontrado:', userError);
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Preparar nova credencial
    const newCredential = {
      id: credentialId,
      publicKey: publicKey,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      deviceInfo: {
        userAgent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
      },
    };

    // Pegar credenciais existentes ou criar array vazio
    const existingCredentials = usuario.biometric_credentials || [];

    // Verificar se credencial já existe
    const credentialExists = existingCredentials.some(
      (cred: any) => cred.id === credentialId
    );
    if (credentialExists) {
      return NextResponse.json(
        { error: 'Credencial biométrica já está registrada' },
        { status: 409 }
      );
    }

    // Adicionar nova credencial ao array
    const updatedCredentials = [...existingCredentials, newCredential];

    // Atualizar usuário com nova credencial
    const { data, error } = await supabase
      .from('usuarios_bar')
      .update({
        biometric_credentials: updatedCredentials,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', usuario.id)
      .select('id, email, biometric_credentials')
      .single();

    if (error) {
      console.error('❌ Erro ao salvar credencial:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar credencial biométrica' },
        { status: 500 }
      );
    }

    console.log(
      '✅ Credencial biométrica registrada com sucesso para usuário:',
      data.id
    );

    return NextResponse.json({
      success: true,
      message: 'Biometria registrada com sucesso',
      credentialId: credentialId,
      totalCredentials: data.biometric_credentials?.length || 0,
    });
  } catch (error) {
    console.error('❌ Erro na API de registro biométrico:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
