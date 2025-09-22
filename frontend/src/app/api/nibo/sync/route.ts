import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Executando sincronização manual do Nibo...');
    
    let body = {};
    try {
      const requestText = await request.text();
      console.log('📥 Request body recebido:', requestText);
      
      if (requestText.trim()) {
        body = JSON.parse(requestText);
      }
    } catch (parseError) {
      console.log('⚠️ Erro ao fazer parse do JSON, usando valores padrão:', parseError);
    }
    
    const { sync_mode = 'daily_complete', bar_id = '3' } = body as { sync_mode?: string; bar_id?: string };
    
    console.log(`📅 Modo de sincronização: ${sync_mode}`);
    console.log(`🏪 Bar ID: ${bar_id}`);
    
    const response = await fetch('https://uqtgsvujwcbymjmvkjhy.supabase.co/functions/v1/nibo-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        barId: bar_id,
        cronSecret: 'manual_test',
        sync_mode: sync_mode
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Resultado da sincronização do Nibo:', result);
    
    return NextResponse.json({
      success: true,
      message: `Sincronização do Nibo executada com sucesso (modo: ${sync_mode})`,
      result,
      timestamp: new Date().toISOString(),
      manual: true
    });
    
  } catch (error) {
    console.error('❌ Erro na sincronização manual do Nibo:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      timestamp: new Date().toISOString(),
      manual: true
    }, { status: 500 });
  }
}
