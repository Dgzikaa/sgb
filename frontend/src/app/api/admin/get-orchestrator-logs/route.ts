import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Buscando logs do orchestrator...');
    
    // Buscar logs do Supabase Edge Functions
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Configuração do Supabase não encontrada');
    }
    
    // Buscar logs via API do Supabase
    const logsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_edge_function_logs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      },
      body: JSON.stringify({
        function_name: 'sgb-orchestrator-final',
        limit: 50
      })
    });
    
    let logs = [];
    let lastExecution = null;
    
    if (logsResponse.ok) {
      const logsData = await logsResponse.json();
      logs = logsData || [];
    }
    
    // Buscar última execução do banco de dados
    const lastExecutionResponse = await fetch(`${supabaseUrl}/rest/v1/orchestrator_executions?select=*&order=created_at.desc&limit=1`, {
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey
      }
    });
    
    if (lastExecutionResponse.ok) {
      const executions = await lastExecutionResponse.json();
      if (executions && executions.length > 0) {
        lastExecution = executions[0];
      }
    }
    
    console.log('✅ Logs buscados com sucesso');
    
    return NextResponse.json({
      success: true,
      logs,
      lastExecution,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao buscar logs:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      logs: [],
      lastExecution: null
    }, { status: 500 });
  }
} 