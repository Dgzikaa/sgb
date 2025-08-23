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

    console.log('🧪 Testando OAuth do Inter para bar_id:', bar_id);

    // Buscar credenciais do Inter
    const credenciais = await getInterCredentials(bar_id);
    if (!credenciais) {
      return NextResponse.json(
        { success: false, error: 'Credenciais do Inter não encontradas' },
        { status: 400 }
      );
    }

    console.log('✅ Credenciais encontradas:', {
      client_id: credenciais.client_id.substring(0, 8) + '...',
      conta_corrente: credenciais.conta_corrente,
    });

    // Teste 1: Gerar token OAuth via Edge Function (mTLS)
    console.log('🔐 Testando geração de token OAuth via Edge Function...');
    const tokenResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/inter-auth`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          bar_id: bar_id,
          client_id: credenciais.client_id,
          client_secret: credenciais.client_secret,
        }),
      }
    );

    console.log(
      '📡 Resposta do OAuth:',
      tokenResponse.status,
      tokenResponse.statusText
    );

    if (!tokenResponse.ok) {
      let errorMessage = `Erro ${tokenResponse.status} ao gerar token`;
      try {
        const errorData = await tokenResponse.json();
        console.error('Erro detalhado do OAuth:', errorData);
        errorMessage =
          errorData.error_description ||
          errorData.message ||
          errorData.error ||
          errorMessage;
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError);
        errorMessage = `Erro ${tokenResponse.status}: ${tokenResponse.statusText}`;
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          status: tokenResponse.status,
          message: 'Falha na autenticação OAuth',
        },
        { status: 400 }
      );
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token OAuth gerado com sucesso:', {
      access_token: tokenData.access_token?.substring(0, 20) + '...',
      expires_in: tokenData.expires_in,
      token_type: tokenData.token_type,
      scope: tokenData.scope,
    });

    // Teste 2: Tentar acessar API de webhooks (se disponível)
    try {
      console.log('🔗 Testando acesso à API de webhooks...');
      const webhookResponse = await fetch(
        'https://cdpj.partners.bancointer.com.br/webhooks',
        {
          method: 'GET',
          headers: {
            accept: 'application/json',
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      console.log(
        '📡 Resposta da API de webhooks:',
        webhookResponse.status,
        webhookResponse.statusText
      );

      if (webhookResponse.ok) {
        const webhookData = await webhookResponse.json();
        console.log('✅ API de webhooks acessível:', webhookData);

        return NextResponse.json({
          success: true,
          message: 'OAuth funcionando e API de webhooks acessível!',
          data: {
            oauth: {
              access_token: tokenData.access_token?.substring(0, 20) + '...',
              expires_in: tokenData.expires_in,
              token_type: tokenData.token_type,
              scope: tokenData.scope,
            },
            webhooks: {
              status: webhookResponse.status,
              data: webhookData,
            },
          },
        });
      } else {
        console.log('⚠️ API de webhooks não acessível, mas OAuth funcionando');

        return NextResponse.json({
          success: true,
          message:
            'OAuth funcionando! API de webhooks pode não estar disponível.',
          data: {
            oauth: {
              access_token: tokenData.access_token?.substring(0, 20) + '...',
              expires_in: tokenData.expires_in,
              token_type: tokenData.token_type,
              scope: tokenData.scope,
            },
            webhooks: {
              status: webhookResponse.status,
              error: 'API de webhooks não acessível',
            },
          },
        });
      }
    } catch (webhookError) {
      console.log('⚠️ Erro ao testar API de webhooks:', webhookError);

      return NextResponse.json({
        success: true,
        message: 'OAuth funcionando! Erro ao testar API de webhooks.',
        data: {
          oauth: {
            access_token: tokenData.access_token?.substring(0, 20) + '...',
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type,
            scope: tokenData.scope,
          },
          webhooks: {
            error: 'Erro ao acessar API de webhooks',
          },
        },
      });
    }
  } catch (error) {
    console.error('❌ Erro no teste OAuth:', error);

    let errorMessage = 'Erro interno do servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
