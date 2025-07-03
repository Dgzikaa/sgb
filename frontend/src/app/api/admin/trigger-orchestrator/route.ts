import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Disparando orchestrator manualmente...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    
    if (!supabaseUrl) {
      throw new Error('URL do Supabase não configurada');
    }
    
    // Disparar a função sgb-orchestrator-final
    const response = await fetch(`${supabaseUrl}/functions/v1/sgb-orchestrator-final`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        trigger_source: 'manual_mobile',
        timestamp: new Date().toISOString()
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Orchestrator disparado com sucesso');
      
      return NextResponse.json({
        success: true,
        message: 'Orchestrator disparado com sucesso',
        result,
        timestamp: new Date().toISOString()
      });
    } else {
      const errorText = await response.text();
      console.log('❌ Erro ao disparar orchestrator:', response.status, errorText);
      
      return NextResponse.json({
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        timestamp: new Date().toISOString()
      }, { status: response.status });
    }
    
  } catch (error) {
    console.error('❌ Erro ao disparar orchestrator:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 