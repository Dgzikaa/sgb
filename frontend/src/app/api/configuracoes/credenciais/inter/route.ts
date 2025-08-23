import { NextRequest, NextResponse } from 'next/server';
import { getInterCredentials } from '@/lib/api-credentials';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const bar_id = searchParams.get('bar_id');

    if (!bar_id) {
      return NextResponse.json(
        { success: false, error: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando credenciais do Inter para bar_id:', bar_id);

    const credenciais = await getInterCredentials(bar_id);

    if (!credenciais) {
      return NextResponse.json(
        { success: false, error: 'Credenciais do Inter não encontradas' },
        { status: 404 }
      );
    }

    console.log('✅ Credenciais encontradas:', {
      client_id: credenciais.client_id,
      client_secret: credenciais.client_secret ? '***' : 'não encontrado',
    });

    return NextResponse.json({
      success: true,
      data: credenciais,
    });
  } catch (error) {
    console.error('❌ Erro ao buscar credenciais:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
