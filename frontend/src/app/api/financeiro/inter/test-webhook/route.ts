import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

// Configurações do Inter
const INTER_CONFIG = {
  BASE_URL: 'https://cdp.inter.co',
  API_TOKEN: '02D8F9B964E74ADAA1A595909A67BA46',
};

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testando token OAuth do Inter para webhooks...');

    // Teste 1: Listar webhooks existentes
    console.log('📋 Testando listagem de webhooks...');
    const response = await fetch(`${INTER_CONFIG.BASE_URL}/webhooks`, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${INTER_CONFIG.API_TOKEN}`,
      },
    });

    console.log('📡 Resposta do Inter:', response.status, response.statusText);

    if (!response.ok) {
      let errorMessage = `Erro ${response.status} ao testar token`;
      try {
        const errorData = await response.json();
        console.error('Erro detalhado do Inter:', errorData);
        errorMessage =
          errorData.error_description ||
          errorData.message ||
          errorData.error ||
          errorMessage;
      } catch (parseError) {
        const errorText = await response.text();
        console.error('Resposta de erro como texto:', errorText);
      }

      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          status: response.status,
          message: 'Token não tem permissões para webhooks ou está inválido',
        },
        { status: 400 }
      );
    }

    const data = await response.json();
    console.log('✅ Token funcionando! Webhooks encontrados:', data);

    return NextResponse.json({
      success: true,
      message: 'Token OAuth válido e com permissões para webhooks!',
      data: data,
      total_webhooks: Array.isArray(data) ? data.length : 0,
    });
  } catch (error) {
    console.error('❌ Erro ao testar token:', error);

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
