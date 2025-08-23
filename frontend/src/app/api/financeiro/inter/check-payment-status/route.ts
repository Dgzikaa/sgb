import { NextRequest, NextResponse } from 'next/server';
import { getInterCredentials } from '@/lib/api-credentials';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bar_id, codigo_solicitacao } = body;

    if (!bar_id || !codigo_solicitacao) {
      return NextResponse.json(
        {
          success: false,
          error: 'bar_id e codigo_solicitacao são obrigatórios',
        },
        { status: 400 }
      );
    }

    console.log('🔍 Verificando status do pagamento:', {
      bar_id,
      codigo_solicitacao,
    });

    // Buscar credenciais do Inter
    const credenciais = await getInterCredentials(bar_id);
    if (!credenciais) {
      return NextResponse.json(
        { success: false, error: 'Credenciais do Inter não encontradas' },
        { status: 400 }
      );
    }

    // Gerar token OAuth via Edge Function (mTLS)
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

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error || 'Erro ao gerar token OAuth');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.data.access_token;

    console.log('✅ Token OAuth gerado:', accessToken.substring(0, 20) + '...');

    // Verificar status do pagamento no Inter
    const statusResponse = await fetch(
      `https://cdpj.partners.bancointer.com.br/pix/v2/pagamentos/${codigo_solicitacao}`,
      {
        method: 'GET',
        headers: {
          accept: 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log(
      '📡 Resposta do status:',
      statusResponse.status,
      statusResponse.statusText
    );

    if (!statusResponse.ok) {
      let errorMessage = `Erro ${statusResponse.status} ao verificar status`;
      try {
        const errorData = await statusResponse.json();
        errorMessage =
          errorData.error_description ||
          errorData.message ||
          errorData.error ||
          errorMessage;
      } catch (parseError) {
        console.error('Erro ao fazer parse da resposta:', parseError);
        errorMessage = `Erro ${statusResponse.status}: ${statusResponse.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const statusData = await statusResponse.json();
    console.log('✅ Status do pagamento:', statusData);

    return NextResponse.json({
      success: true,
      data: statusData,
      message: 'Status do pagamento verificado com sucesso',
    });
  } catch (error) {
    console.error('❌ Erro ao verificar status do pagamento:', error);

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
