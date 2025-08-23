import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Executando sincronização manual do ContaHub...');

    const body = await request.json();
    const { data_date } = body;

    // Se não especificar data, usar ontem
    const targetDate = data_date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`📅 Data alvo: ${targetDate}`);

    // Chamar a Edge Function correta: contahub_orchestrator
    const response = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub_orchestrator', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        data_date: targetDate,
        bar_id: 3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    console.log('✅ Resultado da sincronização:', result);

    return NextResponse.json({
      success: true,
      message: `Sincronização ContaHub executada para data: ${targetDate}`,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erro na sincronização ContaHub:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Endpoint para sincronização manual do ContaHub',
    usage: 'POST com {"data_date": "2025-08-21"} ou sem body para usar ontem'
  });
}
