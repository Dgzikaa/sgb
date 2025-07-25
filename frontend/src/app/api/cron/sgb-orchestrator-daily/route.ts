import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🌅 Cron diário SGB iniciado');

    // Verificar se é uma requisição de cron válida
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('❌ Acesso negado - token inválido');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      throw new Error('URL do Supabase não configurada');
    }

    // Disparar o orchestrator final que vai iniciar o ciclo de 15 minutos
    const response = await fetch(
      `${supabaseUrl}/functions/v1/sgb-orchestrator-final`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger_source: 'daily_cron',
          start_cycle: true,
          timestamp: new Date().toISOString(),
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Orchestrator diário disparado com sucesso');

      return NextResponse.json({
        success: true,
        message: 'Orchestrator diário executado e ciclo de 15 minutos iniciado',
        result,
        timestamp: new Date().toISOString(),
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Erro no cron diário:', response.status, errorText);

      return NextResponse.json(
        {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
          timestamp: new Date().toISOString(),
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Erro no cron diário:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
