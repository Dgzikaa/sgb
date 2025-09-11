import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Executando sincronização diária automática de stockout...');
    
    // Usar data de ontem (dados do dia anterior às 20h)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const targetDate = yesterday.toISOString().split('T')[0];
    
    console.log(`📅 Data alvo para stockout: ${targetDate}`);
    
    const response = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub-stockout-sync', {
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
    console.log('✅ Resultado da sincronização de stockout:', result);
    
    if (result.success) {
      console.log(`📦 Sincronização de stockout concluída: ${result.summary?.total_produtos || 0} produtos, ${result.summary?.percentual_stockout || '0%'} stockout`);
    }
    
    return NextResponse.json({
      success: true,
      message: `Sincronização de stockout executada para data: ${targetDate}`,
      result,
      timestamp: new Date().toISOString(),
      cron_job: true
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização de stockout:', error);
    
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
    console.log('📦 Executando sincronização manual de stockout via POST...');
    
    const body = await request.json();
    const { data_date } = body;
    
    // Se não especificado, usar data de ontem
    const targetDate = data_date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    console.log(`📅 Data alvo para stockout: ${targetDate}`);
    
    const response = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/contahub-stockout-sync', {
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
    console.log('✅ Resultado da sincronização manual de stockout:', result);
    
    return NextResponse.json({
      success: true,
      message: `Sincronização de stockout executada para data: ${targetDate}`,
      result,
      timestamp: new Date().toISOString(),
      cron_job: false
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização manual de stockout:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
      cron_job: false
    }, { status: 500 });
  }
}
