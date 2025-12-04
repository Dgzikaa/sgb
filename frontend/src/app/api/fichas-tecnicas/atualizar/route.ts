import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { receita_id, insumo_id } = body;

    console.log('🔄 Acionando atualização de fichas técnicas:', { receita_id, insumo_id });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    // Usar SERVICE_ROLE_KEY para autenticação de Edge Functions (server-side apenas)
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const response = await fetch(
      `${supabaseUrl}/functions/v1/atualizar-fichas-tecnicas`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ receita_id, insumo_id }),
      }
    );

    const result = await response.json();

    if (result.success) {
      console.log(`✅ Fichas técnicas atualizadas:`, result);
      return NextResponse.json(result);
    } else {
      console.error('❌ Erro ao atualizar fichas:', result);
      return NextResponse.json(result, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Erro interno:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}

