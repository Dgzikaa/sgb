import { NextResponse } from 'next/server';

/**
 * API Route para testar o processamento automático de CMV Semanal
 * Chama a Edge Function do Supabase
 */
export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Configuração do Supabase não encontrada' },
        { status: 500 }
      );
    }

    console.log('🚀 Chamando Edge Function cmv-semanal-cron...');

    const response = await fetch(`${supabaseUrl}/functions/v1/cmv-semanal-cron`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro na Edge Function:', data);
      return NextResponse.json(
        { 
          error: 'Erro ao processar CMV Semanal',
          details: data 
        },
        { status: response.status }
      );
    }

    console.log('✅ CMV Semanal processado com sucesso');

    return NextResponse.json({
      success: true,
      message: 'CMV Semanal processado com sucesso',
      data,
    });
  } catch (error: any) {
    console.error('❌ Erro ao processar CMV Semanal:', error);
    return NextResponse.json(
      { 
        error: 'Erro interno ao processar CMV Semanal',
        message: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * GET para testar se o endpoint está funcionando
 */
export async function GET() {
  return NextResponse.json({
    message: 'Endpoint de CMV Semanal Cron',
    info: 'Use POST para executar o processamento automático',
  });
}

