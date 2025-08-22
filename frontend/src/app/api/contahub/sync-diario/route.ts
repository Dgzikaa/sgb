import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Executando sincronização diária automática do ContaHub...');

    // Usar ontem como data padrão (para cron diário)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const targetDate = yesterday.toISOString().split('T')[0];

    console.log(`📅 Data alvo: ${targetDate}`);

    // Chamar a Edge Function contahub_orchestrator
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

    console.log('✅ Resultado da sincronização diária:', result);

    // Enviar notificação de sucesso se configurado
    if (result.success) {
      console.log(`🎉 Sincronização diária concluída: ${result.summary?.total_records_collected || 0} registros coletados, ${result.summary?.total_records_processed || 0} processados`);
    }

    return NextResponse.json({
      success: true,
      message: `Sincronização diária ContaHub executada para data: ${targetDate}`,
      result,
      timestamp: new Date().toISOString(),
      cron_job: true
    });

  } catch (error) {
    console.error('❌ Erro na sincronização diária ContaHub:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
      cron_job: true
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Executando sincronização manual do ContaHub via POST...');

    const body = await request.json();
    const { data_date } = body;

    // Se não especificar data, usar ontem
    const targetDate = data_date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`📅 Data alvo: ${targetDate}`);

    // Chamar a Edge Function contahub_orchestrator
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

    console.log('✅ Resultado da sincronização manual:', result);

    return NextResponse.json({
      success: true,
      message: `Sincronização ContaHub executada para data: ${targetDate}`,
      result,
      timestamp: new Date().toISOString(),
      cron_job: false
    });

  } catch (error) {
    console.error('❌ Erro na sincronização ContaHub:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
      cron_job: false
    }, { status: 500 });
  }
}
