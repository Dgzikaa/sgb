import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Iniciando processamento de dados RAW...');
    
    const { bar_id, lote_size = 50 } = await request.json();
    
    if (!bar_id) {
      return NextResponse.json(
        { success: false, message: 'bar_id é obrigatório' },
        { status: 400 }
      );
    }

    console.log(`📋 Processando dados RAW para bar_id: ${bar_id}`);

    // Chamar Edge Function de processamento
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contaazul-processar-raw`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({
        bar_id: parseInt(bar_id),
        lote_size
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Edge Function error: ${response.status} - ${errorText}`);
    }

    const resultado = await response.json();

    console.log('🎯 Processamento concluído:', resultado);

    return NextResponse.json({
      success: true,
      message: '✅ Processamento de dados RAW concluído!',
      resultado,
      proximos_passos: resultado.lote_processado?.processadas > 0 ? [
        '🔄 Execute novamente para processar próximo lote',
        '📊 Verificar dados na tabela contaazul_visao_competencia',
        '🎨 Criar dashboard baseado nos dados processados'
      ] : [
        '✅ Todos os dados foram processados!',
        '📊 Verificar dados na tabela contaazul_visao_competencia',
        '🎨 Criar dashboard baseado nos dados processados'
      ]
    });

  } catch (error) {
    console.error('❌ Erro no processamento de dados RAW:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Erro no processamento de dados RAW',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
} 