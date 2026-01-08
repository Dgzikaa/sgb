import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'analisar', barId = 3, enviarDiscord = false } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { success: false, error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/alertas-inteligentes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ action, barId, enviarDiscord })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na Edge Function alertas-inteligentes:', errorText);
      return NextResponse.json(
        { success: false, error: 'Erro ao processar alertas' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Erro na API alertas-inteligentes:', error);
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
