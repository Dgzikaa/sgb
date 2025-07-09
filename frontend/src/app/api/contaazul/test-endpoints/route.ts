import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barId = searchParams.get('barId') || '3';
    
    console.log('🧪 Testando endpoints da API ContaAzul v2...');
    
    // Buscar credenciais do ContaAzul
    const { data: credentials } = await supabase
      .from('api_credentials')
      .select('*')
      .eq('bar_id', parseInt(barId))
      .eq('sistema', 'contaazul')
      .single();

    if (!credentials || !credentials.access_token) {
      return NextResponse.json({ 
        error: 'ContaAzul não conectado ou token inválido' 
      }, { status: 400 });
    }

    const baseURL = 'https://api-v2.contaazul.com/v1';
    const headers = {
      'Authorization': `Bearer ${credentials.access_token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const endpointsToTest = [
      {
        name: 'Contas a Receber (GET)',
        endpoint: '/financeiro/eventos-financeiros/contas-a-receber',
        method: 'GET'
      },
      {
        name: 'Contas a Pagar (GET)', 
        endpoint: '/financeiro/eventos-financeiros/contas-a-pagar',
        method: 'GET'
      },
      {
        name: 'Categorias',
        endpoint: '/categorias',
        method: 'GET'
      },
      {
        name: 'Contas Financeiras',
        endpoint: '/conta-financeira',
        method: 'GET'
      },
      {
        name: 'Buscar Contas a Pagar',
        endpoint: '/financeiro/eventos-financeiros/contas-a-pagar/buscar',
        method: 'GET'
      },
      {
        name: 'Buscar Contas a Receber',
        endpoint: '/financeiro/eventos-financeiros/contas-a-receber/buscar', 
        method: 'GET'
      },
      {
        name: 'Servicos (já testado)',
        endpoint: '/servicos',
        method: 'GET'
      }
    ];

    const results = [];

    for (const test of endpointsToTest) {
      try {
        console.log(`🔍 Testando: ${test.name} - ${test.method} ${test.endpoint}`);
        
        const response = await fetch(`${baseURL}${test.endpoint}`, {
          method: test.method,
          headers: headers
        });

        const data = await response.json();
        
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          status: response.status,
          success: response.ok,
          data: response.ok ? data : null,
          error: !response.ok ? data : null,
          dataType: response.ok ? typeof data : null,
          hasData: response.ok ? (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0) : false
        });

        console.log(`✅ ${test.name}: ${response.status} ${response.ok ? 'OK' : 'ERRO'}`);
        
        // Pequeno delay entre requests
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error: any) {
        console.error(`❌ Erro ao testar ${test.name}:`, error);
        results.push({
          name: test.name,
          endpoint: test.endpoint,
          method: test.method,
          status: 0,
          success: false,
          data: null,
          error: error.message,
          dataType: null,
          hasData: false
        });
      }
    }

    // Resumo dos resultados
    const summary = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      withData: results.filter(r => r.hasData).length
    };

    console.log('📊 Resumo dos testes:', summary);

    return NextResponse.json({
      success: true,
      summary,
      results,
      recommendations: {
        forEntradas: results.filter(r => r.success && r.name.includes('Receber')),
        forSaidas: results.filter(r => r.success && r.name.includes('Pagar')),
        forCategorias: results.filter(r => r.success && r.name.includes('Categorias')),
        forContas: results.filter(r => r.success && r.name.includes('Conta'))
      }
    });

  } catch (error: any) {
    console.error('❌ Erro ao testar endpoints:', error);
    return NextResponse.json({ 
      error: 'Erro ao testar endpoints', 
      details: error.message 
    }, { status: 500 });
  }
} 