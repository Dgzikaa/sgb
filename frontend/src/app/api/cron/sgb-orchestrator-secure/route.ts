import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('ðŸ”„ Cron SGB Orchestrator Secure iniciado');
    
    // Verificar se á© uma requisiá§á£o de cron vá¡lida
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.log('Œ Acesso negado - token invá¡lido');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Chamar a funá§á£o Supabase segura
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/sgb-orchestrator-realtime-secure`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trigger_source: 'vercel_cron_secure',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Œ Erro na funá§á£o Supabase:', errorText);
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase function failed',
        details: errorText
      }, { status: 500 });
    }

    const result = await response.json();
    console.log('œ… Cron executado com sucesso:', result);

    return NextResponse.json({
      success: true,
      message: 'Cron SGB Orchestrator Secure executado com sucesso',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Œ Erro no cron:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
} 
