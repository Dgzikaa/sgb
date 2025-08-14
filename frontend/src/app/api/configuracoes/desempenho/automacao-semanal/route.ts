import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Trigger manual da automação semanal de desempenho...');

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

    console.log('🚀 Disparando Edge Function de automação semanal...');

    // Chamar a Edge Function de automação semanal
    const response = await fetch(
      `${supabaseUrl}/functions/v1/desempenho-semanal-auto`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger_source: 'vercel_cron_semanal',
          timestamp: new Date().toISOString(),
        }),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Automação semanal executada com sucesso:', result);

      return NextResponse.json({
        success: true,
        message: 'Automação semanal de desempenho executada com sucesso',
        result,
        timestamp: new Date().toISOString(),
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Erro na automação semanal:', response.status, errorText);

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
    console.error('❌ Erro no trigger da automação semanal:', error);
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

export async function POST(request: NextRequest) {
  return GET(request);
}

// Endpoint público para teste manual (sem autenticação)
export async function PUT(request: NextRequest) {
  try {
    console.log('🧪 Teste manual da automação semanal...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      throw new Error('URL do Supabase não configurada');
    }

    // Chamar a Edge Function sem autenticação para teste
    const response = await fetch(
      `${supabaseUrl}/functions/v1/desempenho-semanal-auto`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trigger_source: 'teste_manual',
          timestamp: new Date().toISOString(),
        }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Teste manual concluído:', result);
      return NextResponse.json({
        success: true,
        message: 'Teste manual da automação semanal concluído',
        result,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.error('❌ Erro no teste manual:', result);
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Erro desconhecido',
          result,
          timestamp: new Date().toISOString(),
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('❌ Erro no teste manual:', error);
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
