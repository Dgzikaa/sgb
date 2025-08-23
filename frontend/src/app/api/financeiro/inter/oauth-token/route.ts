import { NextRequest, NextResponse } from 'next/server';
import { getInterCredentials } from '@/lib/api-credentials';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bar_id } = body;

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔐 Gerando token OAuth do Inter para bar_id:', bar_id);

    // Buscar credenciais do Inter do banco de dados
    const credenciais = await getInterCredentials(bar_id);
    if (!credenciais) {
      return NextResponse.json(
        {
          success: false,
          error: 'Credenciais do Inter não encontradas para este bar',
        },
        { status: 400 }
      );
    }

    console.log('✅ Credenciais encontradas:', {
      client_id: credenciais.client_id,
      client_secret: credenciais.client_secret ? '***' : 'não encontrado',
    });

    // Usar a API local inter-auth que já está funcionando
    const authResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/inter-auth`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bar_id,
          client_id: credenciais.client_id,
          client_secret: credenciais.client_secret,
        }),
      }
    );

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error(
        '❌ Erro na autenticação Inter:',
        authResponse.status,
        errorText
      );
      return NextResponse.json(
        {
          success: false,
          error: `Falha na autenticação: ${authResponse.status}`,
        },
        { status: 500 }
      );
    }

    const tokenData = await authResponse.json();
    console.log('✅ Token gerado com sucesso:', {
      access_token: tokenData.access_token ? '***' : 'não encontrado',
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
    });

    return NextResponse.json({
      success: true,
      data: tokenData,
    });
  } catch (error) {
    console.error('❌ Erro ao gerar token OAuth:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
