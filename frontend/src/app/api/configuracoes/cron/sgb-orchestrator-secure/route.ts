import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Cron SGB Orchestrator Secure iniciado');

    // Verificar se é uma requisição de cron válida
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Acesso negado - token inválido');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chamar a função Supabase segura
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sgb-orchestrator-realtime-secure`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger_source: 'vercel_cron_secure',
          timestamp: new Date().toISOString(),
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro na função Supabase:', errorText);
      return NextResponse.json(
        {
          success: false,
          error: 'Supabase function failed',
          details: errorText,
        },
        { status: 500 }
      );
    }

    const result = await response.json();
    console.log('✅ Cron executado com sucesso:', result);

    return NextResponse.json({
      success: true,
      message: 'Cron SGB Orchestrator Secure executado com sucesso',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Erro no cron:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
