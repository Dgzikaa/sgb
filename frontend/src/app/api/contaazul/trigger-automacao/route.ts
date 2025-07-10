import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Executando automação ContaAzul...');
    
    const { tipo, bar_id, force } = await request.json();
    
    // Determinar qual Edge Function chamar
    let edgeFunctionName: string;
    let body: any = {};

    switch (tipo) {
      case 'cron':
        edgeFunctionName = 'contaazul-cron';
        // Cron job não precisa de parâmetros específicos
        break;
      
      case 'sync':
        edgeFunctionName = 'contaazul-sync';
        if (!bar_id) {
          return NextResponse.json(
            { success: false, message: 'bar_id é obrigatório para sincronização manual' },
            { status: 400 }
          );
        }
        body = { bar_id, force };
        break;
      
      default:
        return NextResponse.json(
          { success: false, message: 'Tipo de automação inválido. Use "cron" ou "sync"' },
          { status: 400 }
        );
    }

    console.log(`📡 Chamando Edge Function: ${edgeFunctionName}`);

    // Chamar Edge Function do Supabase
    const edgeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/${edgeFunctionName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const edgeData = await edgeResponse.json();

    if (!edgeResponse.ok) {
      throw new Error(edgeData.erro || `Erro na Edge Function: ${edgeResponse.status}`);
    }

    console.log('✅ Edge Function executada com sucesso');

    return NextResponse.json({
      success: true,
      message: `Automação ${tipo} executada com sucesso`,
      ...edgeData
    });

  } catch (error) {
    console.error('❌ Erro na automação:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro na automação',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 